/** Immutable string snapshot with a lazily built code point → UTF-16 map. */
export class TextIndices {
  private offsets?: number[];

  constructor(private readonly string: string) {}

  toUtf16(codePointIndex: number): number {
    if (!this.offsets) {
      const offsets = [ 0 ];
      let position = 0;
      for (const character of this.string) {
        position += character.length;
        offsets.push(position);
      }
      this.offsets = offsets;
    }
    return this.offsets[codePointIndex];
  }
}
