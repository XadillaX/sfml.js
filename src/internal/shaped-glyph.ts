import { native, type NativeShapedGlyphs } from './native';
import { LazyValue } from './lazy-value';
import type { ReadonlyValue as R } from './value-storage';
import type { TextIndices } from './text-indices';
import { glyphFromState, type Glyph } from '../graphics/glyph';
import { vector2FromState, type Vector2f } from '../system/vector2';
import type { ShapedGlyph, TextDirection } from '../graphics/text';

/** One set of typed views per native allocation, shared by all glyph wrappers. */
export class ShapedGlyphBuffer {
  readonly bytes: Uint8Array;
  readonly floats: Float32Array;
  readonly words: Uint32Array;
  readonly doubles: Float64Array;
  readonly length: number;

  constructor(readonly mapping: NativeShapedGlyphs) {
    this.bytes = new Uint8Array(mapping.buffer);
    this.floats = new Float32Array(mapping.buffer);
    this.words = new Uint32Array(mapping.buffer);
    this.doubles = new Float64Array(mapping.buffer);
    this.length = mapping.buffer.byteLength / 80;
  }
}

/** Scalar reads never enter Native; members alias their original allocation. */
export class ShapedGlyphView implements ShapedGlyph {
  private glyphView?: R<Glyph>;
  private positionView?: R<Vector2f>;

  constructor(
    private readonly storage: ShapedGlyphBuffer,
    private readonly index: number,
    private readonly indices: TextIndices,
  ) {}

  get glyph(): R<Glyph> {
    if (!this.glyphView) {
      const { storage, index } = this;
      this.glyphView = glyphFromState(new LazyValue(
        storage.bytes.subarray(index * 80, index * 80 + 44),
        () => native.shapedGlyphMember(storage.mapping.handle, index, 0),
      ));
    }
    return this.glyphView;
  }

  get position(): R<Vector2f> {
    if (!this.positionView) {
      const { storage, index } = this;
      this.positionView = vector2FromState('f32', new LazyValue(
        storage.floats.subarray(index * 20 + 11, index * 20 + 13),
        () => native.shapedGlyphMember(storage.mapping.handle, index, 1),
      ));
    }
    return this.positionView;
  }

  get cluster(): number {
    return this.indices.toUtf16(this.storage.words[this.index * 20 + 13]);
  }
  get textDirection(): TextDirection {
    return this.storage.words[this.index * 20 + 14];
  }
  get baseline(): number { return this.storage.floats[this.index * 20 + 15]; }
  get vertexOffset(): number { return this.storage.doubles[this.index * 10 + 8]; }
  get vertexCount(): number { return this.storage.doubles[this.index * 10 + 9]; }
}
