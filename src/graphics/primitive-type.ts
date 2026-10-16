/** SFML 3 primitive types (quads are not supported). */
export enum PrimitiveType {
  /** 每个顶点绘制一个点。 */
  Points,
  /** 每两个顶点绘制一条独立线段。 */
  Lines,
  /** 相邻顶点依次连接成折线。 */
  LineStrip,
  /** 每三个顶点绘制一个独立三角形。 */
  Triangles,
  /** 每个新顶点与前两个顶点组成三角形。 */
  TriangleStrip,
  /** 首顶点与后续相邻顶点组成扇形三角形。 */
  TriangleFan,
}

export function validatePrimitiveType(type: PrimitiveType): void {
  if (!Number.isInteger(type) || type < 0 || type > PrimitiveType.TriangleFan) {
    throw new RangeError('Expected a PrimitiveType');
  }
}
