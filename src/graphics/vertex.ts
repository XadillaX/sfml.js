import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue, memberValue } from '../internal/lazy-value';
import {
  vertexStorage, vertexNative, colorStorage, vector2Storage, mutableValue,
  type ReadonlyValue as R,
} from '../internal/value-storage';
import { Vector2, Vector2f, vector2FromState } from '../system/vector2';
import { Color, colorFromState } from './color';

type VertexArguments =
  | []
  | [ source: R<Vertex> ]
  | [ position: R<Vector2f>, color?: R<Color>, texCoords?: R<Vector2f> ];

/** Internal mapped member construction, without allocating or copying a value. */
export let vertexFromState: (state: LazyValue<'vertex', Uint8Array>) => Vertex;

/** sf::Vertex, sharing position, RGBA and texture coordinates in 20 bytes. */
export class Vertex {
  readonly [mutableValue] = true;
  private readonly state = new LazyValue<'vertex', Uint8Array>(
    new Uint8Array(20), buffer => native.wrapVertex(buffer),
  );
  private readonly coordinates: Float32Array;
  private positionView?: Vector2f;
  private colorView?: Color;
  private texCoordsView?: Vector2f;

  static {
    vertexFromState = state => {
      const vertex = Object.create(Vertex.prototype) as Vertex;
      Object.defineProperties(vertex, {
        [mutableValue]: { value: true },
        state: { value: state },
        coordinates: { value: new Float32Array(
          state.values.buffer, state.values.byteOffset, 5) },
      });
      return vertex;
    };
  }

  /** 创建原点处的白色顶点，纹理坐标为 (0, 0)。 */
  constructor();
  /** 复制顶点，副本拥有独立的分量存储。 */
  constructor(source: R<Vertex>);
  /**
   * 创建顶点并复制传入的分量。
   * @param position 局部坐标。
   * @param color 顶点颜色，默认不透明白色。
   * @param texCoords 纹理坐标，默认 (0, 0)，单位由 RenderStates.coordinateType 指定。
   */
  constructor(
    position: R<Vector2f>, color?: R<Color>, texCoords?: R<Vector2f>,
  );
  constructor(...args: VertexArguments) {
    this.coordinates = new Float32Array(this.state.values.buffer);
    this.state.values.fill(255, 8, 12);
    if (args.length === 0) return;
    const source = args[0];
    if (source instanceof Vertex && args.length === 1) {
      // Copy bytes so RGBA and floating-point bit patterns remain intact.
      this[vertexStorage].set(source[vertexStorage]);
      return;
    }
    if (!(source instanceof Vector2) || args.length > 3) {
      throw new TypeError('Vertex requires a Vertex or a Vector2f position');
    }
    this.position = source;
    if (args[1] !== undefined) this.color = args[1];
    if (args[2] !== undefined) this.texCoords = args[2];
  }

  get [vertexStorage](): Uint8Array {
    return this.state.values;
  }

  get [vertexNative](): NativeValueHandle<'vertex'> {
    return nativeValue(this, vertexNative, this.state);
  }

  /** 局部位置的共享视图，修改分量会直接修改顶点。 */
  get position(): Vector2f {
    if (!this.positionView) {
      const parent = this.state;
      this.positionView = vector2FromState('f32', memberValue(
        parent, this.coordinates.subarray(0, 2),
        handle => native.vertexMember(handle, 0),
      ));
    }
    return this.positionView;
  }

  /** 将 value 的分量复制到顶点位置。 */
  set position(value: R<Vector2f>) {
    this.checkVector(value);
    this.coordinates.set(value[vector2Storage], 0);
  }

  /** 顶点 RGBA 颜色的共享视图，与纹理采样颜色相乘。 */
  get color(): Color {
    if (!this.colorView) {
      const parent = this.state;
      this.colorView = colorFromState(memberValue(
        parent, parent.values.subarray(8, 12),
        handle => native.vertexMember(handle, 1),
      ));
    }
    return this.colorView;
  }

  /** 将 value 的 RGBA 通道复制到顶点颜色。 */
  set color(value: R<Color>) {
    if (!(value instanceof Color)) {
      throw new TypeError('Vertex.color requires a Color');
    }
    this[vertexStorage].set(value[colorStorage], 8);
  }

  /** 纹理坐标的共享视图；默认使用像素坐标。 */
  get texCoords(): Vector2f {
    if (!this.texCoordsView) {
      const parent = this.state;
      this.texCoordsView = vector2FromState('f32', memberValue(
        parent, this.coordinates.subarray(3, 5),
        handle => native.vertexMember(handle, 2),
      ));
    }
    return this.texCoordsView;
  }

  /** 将 value 的分量复制到纹理坐标。 */
  set texCoords(value: R<Vector2f>) {
    this.checkVector(value);
    this.coordinates.set(value[vector2Storage], 3);
  }

  private checkVector(value: R<Vector2f>): void {
    if (!(value instanceof Vector2) || value.scalarType !== 'f32') {
      throw new TypeError('Vertex requires floating-point Vector2 members');
    }
  }
}
