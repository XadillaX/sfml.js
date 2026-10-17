/**
 * SFML 3 primitive types (quads are not supported).
 * @zh SFML 3 图元类型（不支持四边形）。
 * @ja SFML 3 のプリミティブ型（四角形は非対応）。
 * @ko SFML 3 프리미티브 형식입니다(사각형은 지원하지 않음).
 */
export enum PrimitiveType {
  /**
   * Draws one point per vertex.
   * @zh 每个顶点绘制一个点。
   * @ja 頂点ごとに一点を描画します。
   * @ko 꼭짓점마다 점 하나를 그립니다.
   */
  Points,
  /**
   * Draws an independent line segment for every pair of vertices.
   * @zh 每两个顶点绘制一条独立线段。
   * @ja 頂点二つごとに独立した線分を描画します。
   * @ko 꼭짓점 두 개마다 독립된 선분을 그립니다.
   */
  Lines,
  /**
   * Connects consecutive vertices into a line strip.
   * @zh 相邻顶点依次连接成折线。
   * @ja 隣接する頂点を順に結んで折れ線を描画します。
   * @ko 인접한 꼭짓점을 차례로 연결하여 꺾은선을 그립니다.
   */
  LineStrip,
  /**
   * Draws an independent triangle for every three vertices.
   * @zh 每三个顶点绘制一个独立三角形。
   * @ja 頂点三つごとに独立した三角形を描画します。
   * @ko 꼭짓점 세 개마다 독립된 삼각형을 그립니다.
   */
  Triangles,
  /**
   * Each new vertex forms a triangle with the previous two vertices.
   * @zh 每个新顶点与前两个顶点组成三角形。
   * @ja 新しい頂点ごとに直前の二頂点と三角形を構成します。
   * @ko 새 꼭짓점마다 이전 두 꼭짓점과 삼각형을 구성합니다.
   */
  TriangleStrip,
  /**
   * The first vertex and subsequent adjacent pairs form a triangle fan.
   * @zh 首顶点与后续相邻顶点组成扇形三角形。
   * @ja 最初の頂点と後続の隣接頂点の組で扇状に三角形を構成します。
   * @ko 첫 꼭짓점과 이후의 인접한 꼭짓점 쌍으로 부채꼴 삼각형을 구성합니다.
   */
  TriangleFan,
}

export function validatePrimitiveType(type: PrimitiveType): void {
  if (!Number.isInteger(type) || type < 0 || type > PrimitiveType.TriangleFan) {
    throw new RangeError('Expected a PrimitiveType');
  }
}
