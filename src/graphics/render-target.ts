import {
  dispatchDrawable, graphicsFlush, recordSprite, registerTarget, spriteState,
  recordVertices, textureId, graphicsReads, validateTextureRead, type SpriteData,
  recordVertexBuffer, vertexBufferId, shaderId, shaderTextures,
  recordShape, shapeState, graphicsShapeReads, type ShapeData,
} from '../internal/graphics-state';
import {
  transformableState, type TransformableState,
} from '../internal/transformable';
import {
  defaultRenderStates, validateRenderStates,
} from '../internal/render-states';
import {
  transformStorage, vertexStorage, type ReadonlyValue,
} from '../internal/value-storage';
import { Vector2, Vector2u, Vector2i, Vector2f } from '../system/vector2';
import { Color } from './color';
import { Drawable } from './drawable';
import {
  RenderStates, type RenderStatesInput,
} from './render-states';
import { StencilValue } from './stencil-mode';
import { PrimitiveType, validatePrimitiveType } from './primitive-type';
import { Vertex } from './vertex';
import { VertexBuffer } from './vertex-buffer';
import type { ReadonlyTexture } from './texture';
import type { ReadonlyShader } from './shader';
import { View, copyView, writeView } from './view';
import { FloatRect, IntRect } from './rect';
import { Transform } from './transform';

type SpriteCommandSource = Drawable & {
  readonly [spriteState]: SpriteData;
  readonly [transformableState]: TransformableState;
};

type ShapeCommandSource = Drawable & {
  readonly [shapeState]: ShapeData;
  getTransform(): ReadonlyValue<Transform>;
};

const commandWords = 43;
const f = Math.fround;
const roundAway = (value: number) =>
  (value < 0 ? -Math.round(-value) : Math.round(value));

/** Shared draw dispatch and command recording for render targets. */
export abstract class RenderTarget {
  private readonly words: Uint32Array;
  private readonly floats: Float32Array;
  private readonly pendingSprites = new Set<SpriteCommandSource>();
  private readonly pendingShapes = new Set<ShapeCommandSource>();
  private readonly pendingTextures = new Set<ReadonlyTexture>();
  private readonly pendingBuffers = new Set<VertexBuffer>();
  private readonly pendingShaders = new Set<ReadonlyShader>();
  private vertexBytes = new Uint8Array(0);
  private vertexCount = 0;
  private count = 0;
  private readonly currentView = Object.freeze(new View());
  private readonly defaultView = Object.freeze(new View());

  protected constructor(buffer: ArrayBuffer) {
    this.words = new Uint32Array(buffer);
    this.floats = new Float32Array(buffer);
    registerTarget(this);
  }

  /** 返回渲染目标的像素宽度和高度。 */
  abstract getSize(): Vector2u;

  /** 返回目标是否启用 sRGB 颜色转换。 */
  isSrgb(): boolean {
    return false;
  }

  /** 提交排队绘制并激活或停用 OpenGL 上下文，返回是否成功。 */
  setActive(active = true): boolean {
    if (typeof active !== 'boolean') throw new TypeError('Expected a boolean');
    this.flush();
    return this.activate(active);
  }

  /** 复制并设置后续绘制使用的视图，已录制的绘制保持原视图。 */
  setView(view: ReadonlyValue<View>): void {
    if (!(view instanceof View)) throw new TypeError('Expected a View');
    const offset = this.nextCommand();
    this.words[offset] = 5;
    writeView(view, this.floats, offset + 9);
    copyView(this.currentView, view);
  }

  /** 返回当前视图的只读引用，随 setView 更新。 */
  getView(): ReadonlyValue<View> {
    return this.currentView;
  }

  /** 返回覆盖目标像素区域的默认视图只读引用。 */
  getDefaultView(): ReadonlyValue<View> {
    return this.defaultView;
  }

  /** 将 view 的归一化视口换算为目标中的像素矩形。 */
  getViewport(view: ReadonlyValue<View>): IntRect {
    if (!(view instanceof View)) throw new TypeError('Expected a View');
    return this.pixelRectangle(view.getViewport());
  }

  /** 将 view 的归一化裁剪区域换算为像素矩形。 */
  getScissor(view: ReadonlyValue<View>): IntRect {
    if (!(view instanceof View)) throw new TypeError('Expected a View');
    return this.pixelRectangle(view.getScissor());
  }

  /** 将目标像素坐标转换为世界坐标；省略 view 时使用当前视图。 */
  mapPixelToCoords(
    point: ReadonlyValue<Vector2i>, view: ReadonlyValue<View> = this.currentView,
  ): Vector2f {
    if (!(point instanceof Vector2) || point.scalarType !== 'i32') {
      throw new TypeError('Expected a Vector2i');
    }
    const viewport = this.getViewport(view);
    const x = f(f(point.x) - f(viewport.position.x));
    const y = f(f(point.y) - f(viewport.position.y));
    return view.getInverseTransform().transformPoint(new Vector2f(
      f(-1 + f(f(2 * x) / f(viewport.size.x))),
      f(1 + f(f(-2 * y) / f(viewport.size.y))),
    ));
  }

  /** 将世界坐标转换为目标整数像素坐标；省略 view 时使用当前视图。 */
  mapCoordsToPixel(
    point: ReadonlyValue<Vector2f>, view: ReadonlyValue<View> = this.currentView,
  ): Vector2i {
    if (!(point instanceof Vector2) || point.scalarType !== 'f32') {
      throw new TypeError('Expected a Vector2f');
    }
    const viewport = this.getViewport(view);
    const normalized = view.getTransform().transformPoint(point);
    return new Vector2i(
      f(f(f(f(normalized.x + 1) / 2) * f(viewport.size.x)) +
        f(viewport.position.x)),
      f(f(f(f(-normalized.y + 1) / 2) * f(viewport.size.y)) +
        f(viewport.position.y)),
    );
  }

  /** 提交排队绘制并保存当前 OpenGL 状态，便于混用原生 OpenGL。 */
  pushGLStates(): void {
    this.flush();
    this.changeGLStates(0);
  }

  /** 提交排队绘制并恢复 pushGLStates 保存的 OpenGL 状态。 */
  popGLStates(): void {
    this.flush();
    this.changeGLStates(1);
  }

  /** 提交排队绘制并恢复 SFML 绘制所需的 OpenGL 状态。 */
  resetGLStates(): void {
    this.flush();
    this.changeGLStates(2);
  }

  /** Called only after native construction or resize succeeds. */
  protected initializeViews(size: Readonly<Vector2u>): void {
    const view = new View(new FloatRect(
      new Vector2f(), new Vector2f(size.x, size.y)));
    copyView(this.defaultView, view);
    copyView(this.currentView, view);
  }

  private pixelRectangle(rectangle: ReadonlyValue<FloatRect>): IntRect {
    const size = this.getSize();
    return new IntRect(new Vector2i(
      roundAway(f(f(size.x) * rectangle.position.x)),
      roundAway(f(f(size.y) * rectangle.position.y)),
    ), new Vector2i(
      roundAway(f(f(size.x) * rectangle.size.x)),
      roundAway(f(f(size.y) * rectangle.size.y)),
    ));
  }

  /** 录制颜色清除命令，默认黑色；提供 stencil 时同时清除模板缓冲区。 */
  clear(
    color: ReadonlyValue<Color> = Color.Black,
    stencil?: number | Readonly<StencilValue>,
  ): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    const rgba = color.toInteger();
    const value = stencil === undefined ? 0 : new StencilValue(stencil).value;
    const offset = this.nextCommand();
    this.words[offset] = stencil === undefined ? 0 : 2;
    this.words[offset + 1] = rgba;
    this.words[offset + 33] = value;
  }

  /** 仅录制模板缓冲区清除命令，默认模板值为 0。 */
  clearStencil(stencil: number | Readonly<StencilValue> = 0): void {
    const value = new StencilValue(stencil).value;
    const offset = this.nextCommand();
    this.words[offset] = 3;
    this.words[offset + 1] = value;
  }

  /** 同步录制对象绘制快照，后续修改不影响本次绘制；在 flush/display 时提交。 */
  draw(drawable: Drawable, states?: RenderStatesInput): void;
  /** 录制整个 GPU 顶点缓冲区的绘制，保留调用时的渲染状态。 */
  draw(buffer: VertexBuffer, states?: RenderStatesInput): void;
  /** 从 firstVertex 开始绘制 vertexCount 个顶点，超出尾部的数量自动截断。 */
  draw(buffer: VertexBuffer, firstVertex: number, vertexCount: number,
    states?: RenderStatesInput): void;
  /** 复制顶点快照并按 type 录制绘制；states 默认使用 RenderStates.Default。 */
  draw(vertices: readonly ReadonlyValue<Vertex>[], type: PrimitiveType,
    states?: RenderStatesInput): void;
  draw(drawable: Drawable | readonly ReadonlyValue<Vertex>[],
    statesOrType: RenderStatesInput | number = defaultRenderStates,
    statesOrCount: RenderStatesInput | number = defaultRenderStates,
    rangeStates: RenderStatesInput = defaultRenderStates): void {
    if (drawable instanceof VertexBuffer && typeof statesOrType === 'number') {
      const value = rangeStates instanceof RenderStates
        ? rangeStates : new RenderStates(rangeStates);
      this[recordVertexBuffer](drawable, statesOrType,
        statesOrCount as number, value);
      return;
    }
    if (drawable instanceof Drawable) {
      const value = statesOrType instanceof RenderStates
        ? statesOrType : new RenderStates(statesOrType as RenderStatesInput);
      drawable[dispatchDrawable](this, value);
      return;
    }
    if (!Array.isArray(drawable)) throw new TypeError('Expected a Drawable');
    validatePrimitiveType(statesOrType as PrimitiveType);
    const value = statesOrCount instanceof RenderStates
      ? statesOrCount : new RenderStates(statesOrCount as RenderStatesInput);
    validateRenderStates(value);
    // Validate and capture every view before touching the command queue.
    const vertices = drawable.map(vertex => {
      if (!(vertex instanceof Vertex)) throw new TypeError('Expected a Vertex');
      return vertex[vertexStorage];
    });
    // Array holes must not turn into partially initialized draw commands.
    for (const vertex of vertices) {
      if (!vertex || vertex.byteLength !== 20) {
        throw new TypeError('Expected attached Vertex values');
      }
    }
    this.writeVertices(vertices.length, statesOrType as PrimitiveType, value,
      offset => {
        for (const vertex of vertices) {
          this.vertexBytes.set(vertex, offset);
          offset += 20;
        }
      });
  }

  /** Submit pending draws before an external graphics operation. */
  flush(): void {
    if (this.count !== 0) this.submit(false);
  }

  [graphicsFlush](): void {
    this.flush();
  }

  [graphicsReads](): ReadonlySet<ReadonlyTexture> {
    return this.pendingTextures;
  }

  [graphicsShapeReads](): ReadonlySet<object> {
    return this.pendingShapes;
  }

  [recordShape](shape: ShapeCommandSource, states: RenderStates): void {
    validateRenderStates(states);
    const appearance = shape[shapeState];
    validateTextureRead(this, appearance.texture);
    this.validateShaderReads(states);
    const matrix = new Transform(states.transform).combine(shape.getTransform());
    const offset = this.nextCommand();
    this.words[offset] = 7;
    this.words[offset + 1] = appearance.id;
    this.words.set(appearance.words, offset + 2);
    this.floats.set(matrix[transformStorage], offset + 9);
    this.writeModes(offset, states);
    this.pendingShapes.add(shape);
    if (appearance.texture) this.pendingTextures.add(appearance.texture);
  }

  [recordSprite](sprite: SpriteCommandSource, states: RenderStates): void {
    // Validation precedes reservation so a rejected call leaves no command.
    validateRenderStates(states);
    const matrix = states.transform[transformStorage];
    const values = sprite[transformableState].values;
    const appearance = sprite[spriteState];
    validateTextureRead(this, appearance.texture);
    this.validateShaderReads(states);
    const offset = this.nextCommand();
    this.words[offset] = 1;
    this.words[offset + 1] = appearance.id;
    this.floats.set(values, offset + 2);
    this.floats.set(matrix, offset + 9);
    this.writeModes(offset, states);
    this.words.set(appearance.words, offset + 36);
    // Sprite overrides texture and coordinateType in SFML; only its own
    // retained texture is relevant to this leaf command.
    this.pendingSprites.add(sprite);
    this.pendingTextures.add(appearance.texture);
  }

  [recordVertices](bytes: Uint8Array, type: PrimitiveType,
    states: RenderStates): void {
    validateRenderStates(states);
    validatePrimitiveType(type);
    this.writeVertices(bytes.byteLength / 20, type, states,
      offset => this.vertexBytes.set(bytes, offset));
  }

  [recordVertexBuffer](buffer: VertexBuffer, first: number, count: number,
    states: RenderStates): void {
    validateRenderStates(states);
    if (!Number.isInteger(first) || first < 0 || first > 0xffffffff ||
        !Number.isInteger(count) || count < 0 || count > 0xffffffff) {
      throw new RangeError('Vertex range is out of bounds');
    }
    const available = buffer.getVertexCount();
    if (first >= available || count === 0) return;
    count = Math.min(count, available - first);
    validateTextureRead(this, states.texture);
    this.validateShaderReads(states);
    const offset = this.nextCommand();
    this.words[offset] = 6;
    this.words[offset + 1] = count;
    this.words[offset + 2] = first;
    this.words[offset + 3] = buffer.getPrimitiveType();
    this.words[offset + 4] = states.texture?.[textureId] ?? 0;
    this.words[offset + 5] = states.coordinateType;
    this.words[offset + 6] = buffer[vertexBufferId];
    this.floats.set(states.transform[transformStorage], offset + 9);
    this.writeModes(offset, states);
    this.pendingBuffers.add(buffer);
    if (states.texture) this.pendingTextures.add(states.texture);
  }

  private writeModes(offset: number, states: RenderStates): void {
    const b = states.blendMode;
    const s = states.stencilMode;
    this.words[offset + 25] = b.colorSrcFactor;
    this.words[offset + 26] = b.colorDstFactor;
    this.words[offset + 27] = b.colorEquation;
    this.words[offset + 28] = b.alphaSrcFactor;
    this.words[offset + 29] = b.alphaDstFactor;
    this.words[offset + 30] = b.alphaEquation;
    this.words[offset + 31] = s.stencilComparison;
    this.words[offset + 32] = s.stencilUpdateOperation;
    this.words[offset + 33] = s.stencilReference.value;
    this.words[offset + 34] = s.stencilMask.value;
    this.words[offset + 35] = s.stencilOnly ? 1 : 0;
    this.words[offset + 42] = states.shader?.[shaderId] ?? 0;
    if (states.shader) {
      this.pendingShaders.add(states.shader);
      for (const texture of states.shader[shaderTextures].values()) {
        this.pendingTextures.add(texture);
      }
    }
  }

  private validateShaderReads(states: RenderStates): void {
    if (!states.shader) return;
    for (const texture of states.shader[shaderTextures].values()) {
      validateTextureRead(this, texture);
    }
  }

  private writeVertices(count: number, type: PrimitiveType,
    states: RenderStates, copy: (offset: number) => void): void {
    if (!Number.isInteger(count) || count < 0 ||
        count > Math.floor(0x7fffffff / 20)) {
      throw new RangeError('Vertex count exceeds the buffer limit');
    }
    if (count === 0) return;
    validateTextureRead(this, states.texture);
    this.validateShaderReads(states);
    const matrix = states.transform[transformStorage];
    if (this.count === this.words.length / commandWords ||
        (this.vertexCount !== 0 &&
        (this.vertexCount + count) * 20 > this.vertexBytes.byteLength)) {
      this.flush();
    }
    if (count * 20 > this.vertexBytes.byteLength) {
      const capacity = Math.min(Math.floor(0x7fffffff / 20),
        Math.max(4096, count, this.vertexBytes.byteLength / 10));
      this.vertexBytes = new Uint8Array(this.allocateVertexBuffer(capacity));
    }
    // Copy before reserving: a failed copy cannot leave a partial command.
    copy(this.vertexCount * 20);
    const offset = this.nextCommand();
    this.words[offset] = 4;
    this.words[offset + 1] = count;
    this.words[offset + 2] = this.vertexCount;
    this.words[offset + 3] = type;
    this.words[offset + 4] = states.texture?.[textureId] ?? 0;
    this.words[offset + 5] = states.coordinateType;
    this.floats.set(matrix, offset + 9);
    this.writeModes(offset, states);
    this.vertexCount += count;
    if (states.texture) this.pendingTextures.add(states.texture);
  }

  protected abstract submitCommands(count: number, display: boolean): void;
  protected abstract allocateVertexBuffer(capacity: number): ArrayBuffer;
  protected abstract changeGLStates(operation: 0 | 1 | 2): void;
  protected abstract activate(active: boolean): boolean;

  protected submit(display: boolean): void {
    this.submitCommands(this.count, display);
    this.count = 0;
    this.vertexCount = 0;
    this.pendingSprites.clear();
    this.pendingShapes.clear();
    this.pendingTextures.clear();
    this.pendingBuffers.clear();
    this.pendingShaders.clear();
  }

  private nextCommand(): number {
    if (this.count === this.words.length / commandWords) this.submit(false);
    return this.count++ * commandWords;
  }
}
