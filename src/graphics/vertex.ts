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

/**
 * Internal mapped member construction, without allocating or copying a value.
 * @zh 内部映射成员构造，不分配或复制值。
 * @ja 値の割り当てやコピーを行わない、内部のマップ済みメンバー構築。
 * @ko 값을 할당하거나 복사하지 않는 내부 매핑 멤버 생성입니다.
 */
export let vertexFromState: (state: LazyValue<'vertex', Uint8Array>) => Vertex;

/**
 * sf::Vertex, sharing position, RGBA and texture coordinates in 20 bytes.
 * @zh sf::Vertex，在 20 字节中共享位置、RGBA 和纹理坐标。
 * @ja 位置、RGBA、テクスチャ座標を 20 バイトで共有する sf::Vertex。
 * @ko 위치, RGBA 및 텍스처 좌표를 20바이트에 공유하는 sf::Vertex입니다.
 */
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

  /**
   * Creates a white vertex at the origin with texture coordinates (0, 0).
   * @zh 创建原点处的白色顶点，纹理坐标为 (0, 0)。
   * @ja 原点にテクスチャ座標 (0, 0) の白い頂点を作成します。
   * @ko 원점에 텍스처 좌표가 (0, 0)인 흰색 꼭짓점을 만듭니다.
   */
  constructor();
  /**
   * Copies a vertex into independent component storage.
   * @zh 复制顶点，副本拥有独立的分量存储。
   * @ja 独立した成分ストレージを持つ頂点のコピーを作成します。
   * @ko 독립적인 성분 저장 공간을 갖도록 꼭짓점을 복사합니다.
   */
  constructor(source: R<Vertex>);
  /**
   * Creates a vertex and copies the supplied components.
   * @zh 创建顶点并复制传入的分量。
   * @ja 頂点を作成し、渡された成分をコピーします。
   * @ko 꼭짓점을 만들고 전달된 성분을 복사합니다.
   *
   * @param position Local coordinates.
   * @zh position - 局部坐标。
   * @ja position - ローカル座標。
   * @ko position - 로컬 좌표입니다.
   *
   * @param color Vertex color, defaulting to opaque white.
   * @zh color - 顶点颜色，默认不透明白色。
   * @ja color - 頂点色。既定は不透明な白です。
   * @ko color - 꼭짓점 색상이며 기본값은 불투명한 흰색입니다.
   *
   * @param texCoords Texture coordinates, defaulting to (0, 0), in units
   * specified by RenderStates.coordinateType.
   * @zh texCoords - 纹理坐标，默认 (0, 0)，单位由 RenderStates.coordinateType 指定。
   * @ja texCoords - テクスチャ座標。既定値は (0, 0) で、単位は RenderStates.coordinateType が指定しま
   * す。
   * @ko texCoords - 텍스처 좌표이며 기본값은 (0, 0)이고 단위는 RenderStates.coordinateType이
   * 지정합니다.
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

  /**
   * Shared view of local position; changing components directly changes the
   * vertex.
   * @zh 局部位置的共享视图，修改分量会直接修改顶点。
   * @ja ローカル位置の共有ビュー。成分の変更は頂点を直接変更します。
   * @ko 로컬 위치의 공유 뷰입니다. 성분을 수정하면 꼭짓점이 직접 변경됩니다.
   */
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

  /**
   * Copies value's components into the vertex position.
   * @zh 将 value 的分量复制到顶点位置。
   * @ja value の成分を頂点位置にコピーします。
   * @ko value의 성분을 꼭짓점 위치에 복사합니다.
   */
  set position(value: R<Vector2f>) {
    this.checkVector(value);
    this.coordinates.set(value[vector2Storage], 0);
  }

  /**
   * Shared view of vertex RGBA color, multiplied by the sampled texture color.
   * @zh 顶点 RGBA 颜色的共享视图，与纹理采样颜色相乘。
   * @ja テクスチャのサンプリング色と乗算される、頂点 RGBA 色の共有ビュー。
   * @ko 샘플링한 텍스처 색상과 곱해지는 꼭짓점 RGBA 색상의 공유 뷰입니다.
   */
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

  /**
   * Copies value's RGBA channels into the vertex color.
   * @zh 将 value 的 RGBA 通道复制到顶点颜色。
   * @ja value の RGBA チャンネルを頂点色にコピーします。
   * @ko value의 RGBA 채널을 꼭짓점 색상에 복사합니다.
   */
  set color(value: R<Color>) {
    if (!(value instanceof Color)) {
      throw new TypeError('Vertex.color requires a Color');
    }
    this[vertexStorage].set(value[colorStorage], 8);
  }

  /**
   * Shared view of texture coordinates; uses pixel coordinates by default.
   * @zh 纹理坐标的共享视图；默认使用像素坐标。
   * @ja テクスチャ座標の共有ビュー。既定ではピクセル座標を使用します。
   * @ko 텍스처 좌표의 공유 뷰입니다. 기본적으로 픽셀 좌표를 사용합니다.
   */
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

  /**
   * Copies value's components into the texture coordinates.
   * @zh 将 value 的分量复制到纹理坐标。
   * @ja value の成分をテクスチャ座標にコピーします。
   * @ko value의 성분을 텍스처 좌표에 복사합니다.
   */
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
