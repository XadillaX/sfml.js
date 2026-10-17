import {
  mutableValue, rectStorage, transformStorage, type ReadonlyValue as R,
} from '../internal/value-storage';
import { Angle, radians } from '../system/angle';
import { Vector2, Vector2f } from '../system/vector2';
import { FloatRect } from './rect';
import { Transform } from './transform';

const f = Math.fround;

function vector(value: R<Vector2f>): void {
  if (!(value instanceof Vector2) || value.scalarType !== 'f32') {
    throw new TypeError('Expected a Vector2f');
  }
}

function rectangle(value: R<FloatRect>): void {
  if (!(value instanceof FloatRect)) throw new TypeError('Expected a FloatRect');
}

function constantRectangle(): R<FloatRect> {
  const result = new FloatRect(new Vector2f(), new Vector2f(1, 1));
  const data = result[rectStorage];
  const position = result.position;
  const size = result.size;
  Object.defineProperties(position, {
    x: { get: () => data[0] }, y: { get: () => data[1] },
  });
  Object.defineProperties(size, {
    x: { get: () => data[2] }, y: { get: () => data[3] },
  });
  Object.freeze(position);
  Object.freeze(size);
  Object.defineProperties(result, {
    position: { value: position }, size: { value: size },
  });
  return Object.freeze(result);
}

/**
 * Internal value assignment keeps const references and cached members alive.
 * @zh 保留 const 引用和缓存成员的内部值赋值。
 * @ja const 参照とキャッシュ済みメンバーを維持する内部値代入。
 * @ko const 참조와 캐시된 멤버를 유지하는 내부 값 대입입니다.
 */
export let copyView: (destination: R<View>, source: R<View>) => void;
/**
 * Internal command encoding: center, size, radians, viewport, scissor.
 * @zh 内部命令编码：中心、尺寸、弧度、视口、裁剪区域。
 * @ja 内部コマンドのエンコード順序は中心、サイズ、ラジアン、ビューポート、シザーです。
 * @ko 내부 명령 인코딩 순서는 중심, 크기, 라디안, 뷰포트, 시저입니다.
 */
export let writeView: (
  source: R<View>, destination: Float32Array, offset: number,
) => void;

/**
 * A value camera; mutation and projection math stay on the JS side.
 * @zh 值语义相机；修改和投影计算在 JS 侧完成。
 * @ja 値として扱うカメラ。変更と投影計算は JS 側で行います。
 * @ko 값으로 다루는 카메라입니다. 수정 및 투영 계산은 JS 측에서 수행합니다.
 */
export class View {
  readonly [mutableValue] = true;
  private readonly state = {
    data: new Float32Array([ 500, 500, 1000, 1000, 0 ]),
    viewport: constantRectangle(),
    scissor: constantRectangle(),
    transform: Object.freeze(new Transform()) as R<Transform>,
    inverse: Object.freeze(new Transform()) as R<Transform>,
    transformDirty: true,
    inverseDirty: true,
  };

  static {
    copyView = (destination, source) => {
      if (!(source instanceof View) || !(destination instanceof View)) {
        throw new TypeError('Expected a View');
      }
      destination.state.data.set(source.state.data);
      destination.state.viewport[rectStorage].set(
        source.state.viewport[rectStorage]);
      destination.state.scissor[rectStorage].set(source.state.scissor[rectStorage]);
      destination.state.transformDirty = destination.state.inverseDirty = true;
    };
    writeView = (source, destination, offset) => {
      if (!(source instanceof View)) throw new TypeError('Expected a View');
      destination.set(source.state.data, offset);
      destination.set(source.state.viewport[rectStorage], offset + 5);
      destination.set(source.state.scissor[rectStorage], offset + 9);
    };
  }

  /**
   * Creates a view centered at (500, 500), sized (1000, 1000), covering the
   * entire target.
   * @zh 创建中心为 (500, 500)、尺寸为 (1000, 1000)、覆盖整个目标的视图。
   * @ja 中心 (500, 500)、サイズ (1000, 1000) で、ターゲット全体を覆うビューを作成します。
   * @ko 중심이 (500, 500), 크기가 (1000, 1000)이며 전체 대상을 덮는 뷰를 만듭니다.
   */
  constructor();
  /**
   * Deep-copies view parameters.
   * @zh 深复制视图参数。
   * @ja ビューパラメーターをディープコピーします。
   * @ko 뷰 매개변수를 깊은 복사합니다.
   */
  constructor(source: R<View>);
  /**
   * Creates a view covering the specified world-coordinate rectangle.
   * @zh 创建覆盖指定世界坐标矩形的视图。
   * @ja 指定したワールド座標の矩形を覆うビューを作成します。
   * @ko 지정한 월드 좌표 사각형을 덮는 뷰를 만듭니다.
   */
  constructor(rectangle: R<FloatRect>);
  /**
   * Creates a view from a center and size in world coordinates.
   * @zh 从世界坐标中的中心和尺寸创建视图。
   * @ja ワールド座標の中心とサイズからビューを作成します。
   * @ko 월드 좌표의 중심과 크기로 뷰를 만듭니다.
   */
  constructor(center: R<Vector2f>, size: R<Vector2f>);
  constructor(source?: R<View> | R<FloatRect> | R<Vector2f>, size?: R<Vector2f>) {
    if (source instanceof View && size === undefined) copyView(this, source);
    else if (source instanceof FloatRect && size === undefined) {
      this.setCenter(source.getCenter());
      this.setSize(source.size);
    } else if (source !== undefined && size !== undefined) {
      this.setCenter(source as R<Vector2f>);
      this.setSize(size);
    } else if (source !== undefined || size !== undefined) {
      throw new TypeError('Expected a View, FloatRect, or center and size');
    }
  }

  /**
   * Sets the view center in world coordinates, copying center's values.
   * @zh 设置视图中心的世界坐标，复制 center 的值。
   * @ja center の値をコピーして、ビュー中心のワールド座標を設定します。
   * @ko center의 값을 복사하여 뷰 중심의 월드 좌표를 설정합니다.
   */
  setCenter(this: View, center: R<Vector2f>): void {
    this.checkWritable();
    vector(center);
    this.state.data[0] = center.x;
    this.state.data[1] = center.y;
    this.invalidate();
  }

  /**
   * Returns an independent copy of the view center.
   * @zh 返回视图中心的独立副本。
   * @ja ビュー中心の独立したコピーを返します。
   * @ko 뷰 중심의 독립적인 복사본을 반환합니다.
   */
  getCenter(): Vector2f {
    return new Vector2f(this.state.data[0], this.state.data[1]);
  }

  /**
   * Sets the width and height covered by the view in world coordinates.
   * @zh 设置视图覆盖的世界坐标宽度和高度。
   * @ja ビューが覆う幅と高さをワールド座標で設定します。
   * @ko 뷰가 덮는 너비와 높이를 월드 좌표로 설정합니다.
   */
  setSize(this: View, size: R<Vector2f>): void {
    this.checkWritable();
    vector(size);
    this.state.data[2] = size.x;
    this.state.data[3] = size.y;
    this.invalidate();
  }

  /**
   * Returns an independent copy of the view's coverage size.
   * @zh 返回视图覆盖尺寸的独立副本。
   * @ja ビューが覆うサイズの独立したコピーを返します。
   * @ko 뷰가 덮는 크기의 독립적인 복사본을 반환합니다.
   */
  getSize(): Vector2f {
    return new Vector2f(this.state.data[2], this.state.data[3]);
  }

  /**
   * Sets the view rotation angle, normalized to [0 degrees, 360 degrees).
   * @zh 设置视图旋转角度，归一化到 [0°, 360°)。
   * @ja ビューの回転角を設定し、[0°, 360°) に正規化します。
   * @ko 뷰 회전 각도를 설정하며 [0°, 360°)로 정규화합니다.
   */
  setRotation(this: View, angle: R<Angle>): void {
    this.checkWritable();
    if (!(angle instanceof Angle)) throw new TypeError('Expected an Angle');
    this.state.data[4] = angle.wrapUnsigned().asRadians();
    this.invalidate();
  }

  /**
   * Returns a copy of the rotation angle.
   * @zh 返回旋转角度副本。
   * @ja 回転角のコピーを返します。
   * @ko 회전 각도의 복사본을 반환합니다.
   */
  getRotation(): Angle {
    return radians(this.state.data[4]);
  }

  /**
   * Sets the viewport rectangle with coordinates and size as fractions of the
   * render target's width and height.
   * @zh 设置视口矩形，坐标和尺寸以渲染目标宽高的比例表示。
   * @ja レンダーターゲットの幅と高さに対する比率で座標とサイズを指定し、ビューポート矩形を設定します。
   * @ko 좌표와 크기를 렌더 대상 너비와 높이의 비율로 지정하여 뷰포트 사각형을 설정합니다.
   */
  setViewport(this: View, viewport: R<FloatRect>): void {
    this.checkWritable();
    rectangle(viewport);
    this.state.viewport[rectStorage].set(viewport[rectStorage]);
  }

  /**
   * Returns a read-only reference to the normalized viewport rectangle, updated
   * by setViewport.
   * @zh 返回归一化视口矩形的只读引用，随 setViewport 更新。
   * @ja setViewport に応じて更新される、正規化ビューポート矩形への読み取り専用参照を返します。
   * @ko setViewport에 따라 갱신되는 정규화된 뷰포트 사각형의 읽기 전용 참조를 반환합니다.
   */
  getViewport(): R<FloatRect> {
    return this.state.viewport;
  }

  /**
   * Sets the normalized scissor rectangle; the entire rectangle must lie within
   * [0, 1].
   * @zh 设置归一化裁剪矩形；整个矩形必须位于 [0, 1] 范围。
   * @ja 正規化シザー矩形を設定します。矩形全体が [0, 1] の範囲内にある必要があります。
   * @ko 정규화된 시저 사각형을 설정합니다. 전체 사각형이 [0, 1] 범위 안에 있어야 합니다.
   */
  setScissor(this: View, scissor: R<FloatRect>): void {
    this.checkWritable();
    rectangle(scissor);
    const [ x, y, width, height ] = scissor[rectStorage];
    if (!(x >= 0 && y >= 0 && x <= 1 && y <= 1 &&
        width >= 0 && height >= 0 &&
        f(x + width) <= 1 && f(y + height) <= 1)) {
      throw new RangeError('Scissor rectangle must lie within [0, 1]');
    }
    this.state.scissor[rectStorage].set(scissor[rectStorage]);
  }

  /**
   * Returns a read-only reference to the normalized scissor rectangle, updated
   * by setScissor.
   * @zh 返回归一化裁剪矩形的只读引用，随 setScissor 更新。
   * @ja setScissor に応じて更新される、正規化シザー矩形への読み取り専用参照を返します。
   * @ko setScissor에 따라 갱신되는 정규화된 시저 사각형의 읽기 전용 참조를 반환합니다.
   */
  getScissor(): R<FloatRect> {
    return this.state.scissor;
  }

  /**
   * Adds a world-coordinate offset to the view center.
   * @zh 将世界坐标偏移量累加到视图中心。
   * @ja ワールド座標のオフセットをビュー中心に加算します。
   * @ko 월드 좌표 오프셋을 뷰 중심에 더합니다.
   */
  move(this: View, offset: R<Vector2f>): void {
    this.checkWritable();
    vector(offset);
    this.state.data[0] += offset.x;
    this.state.data[1] += offset.y;
    this.invalidate();
  }

  /**
   * Adds angle to the current view angle.
   * @zh 在当前视图角度上累加 angle。
   * @ja 現在のビュー角度に angle を加算します。
   * @ko 현재 뷰 각도에 angle을 더합니다.
   */
  rotate(this: View, angle: R<Angle>): void {
    if (!(angle instanceof Angle)) throw new TypeError('Expected an Angle');
    this.setRotation(radians(f(this.state.data[4] + angle.asRadians())));
  }

  /**
   * Multiplies the view's coverage size by factor; values below 1 zoom in and
   * values above 1 zoom out.
   * @zh 将视图覆盖尺寸乘以 factor；小于 1 时放大画面，大于 1 时缩小。
   * @ja ビューが覆うサイズに factor を乗算します。1 未満で拡大し、1 より大きいと縮小します。
   * @ko 뷰가 덮는 크기에 factor를 곱합니다. 1보다 작으면 확대하고 1보다 크면 축소합니다.
   */
  zoom(this: View, factor: number): void {
    this.checkWritable();
    if (typeof factor !== 'number') throw new TypeError('Expected a number');
    const value = f(factor);
    this.state.data[2] *= value;
    this.state.data[3] *= value;
    this.invalidate();
  }

  /**
   * Returns a read-only cached transform from world coordinates to normalized
   * device coordinates.
   * @zh 返回世界坐标到标准化设备坐标的只读变换缓存。
   * @ja ワールド座標から正規化デバイス座標への読み取り専用変換キャッシュを返します。
   * @ko 월드 좌표에서 정규화 장치 좌표로의 읽기 전용 변환 캐시를 반환합니다.
   */
  getTransform(): R<Transform> {
    const state = this.state;
    if (state.transformDirty) {
      const [ x, y, width, height, angle ] = state.data;
      const cosine = f(Math.cos(angle));
      const sine = f(Math.sin(angle));
      const tx = f(f(f(-x * cosine) - f(y * sine)) + x);
      const ty = f(f(f(x * sine) - f(y * cosine)) + y);
      const a = f(2 / width);
      const b = f(-2 / height);
      const matrix = state.transform[transformStorage];
      matrix[0] = f(a * cosine);
      matrix[4] = f(a * sine);
      matrix[12] = f(f(a * tx) + f(-a * x));
      matrix[1] = f(-b * sine);
      matrix[5] = f(b * cosine);
      matrix[13] = f(f(b * ty) + f(-b * y));
      state.transformDirty = false;
    }
    return state.transform;
  }

  /**
   * Returns a read-only cached inverse transform from normalized device
   * coordinates to world coordinates.
   * @zh 返回标准化设备坐标到世界坐标的只读逆变换缓存。
   * @ja 正規化デバイス座標からワールド座標への読み取り専用逆変換キャッシュを返します。
   * @ko 정규화 장치 좌표에서 월드 좌표로의 읽기 전용 역변환 캐시를 반환합니다.
   */
  getInverseTransform(): R<Transform> {
    const state = this.state;
    if (state.inverseDirty) {
      state.inverse[transformStorage].set(
        this.getTransform().getInverse()[transformStorage]);
      state.inverseDirty = false;
    }
    return state.inverse;
  }

  private invalidate(): void {
    this.state.transformDirty = this.state.inverseDirty = true;
  }

  private checkWritable(): void {
    if (Object.isFrozen(this)) throw new TypeError('Cannot modify a const View');
  }
}
