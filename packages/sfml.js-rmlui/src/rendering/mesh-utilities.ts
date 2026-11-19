import { native } from '../internal/native';
import { meshHandle, type Mesh } from './mesh';
import { renderBoxHandle, type RenderBox } from './render-box';
import type { VariantVector2 } from '../values/types';
import type { VertexColour } from './vertex';

const commandStride = 40;

/**
 * Write RGBA without premultiplying the caller's values.
 *
 * @internal
 * @param command - Command record.
 * @param offset - First colour field.
 * @param colour - Premultiplied channels.
 */
function writeColour(
  command: Float32Array, offset: number, colour: VertexColour,
): void {
  const { red, green, blue, alpha } = colour;
  const bytes = [ red, green, blue, alpha ];
  if (bytes.some(value =>
    !Number.isInteger(value) || value < 0 || value > 255)) {
    throw new RangeError('Mesh colour must contain integer RGBA bytes');
  }
  command.set(bytes, offset);
}

/**
 * Validate coordinates before a float view can coerce their type.
 *
 * @internal
 * @param value - Input vector.
 * @returns Finite float32 coordinates.
 */
function coordinates(value: VariantVector2): [ number, number ] {
  const { x, y } = value;
  if (typeof x !== 'number' || typeof y !== 'number' ||
      !Number.isFinite(Math.fround(x)) || !Number.isFinite(Math.fround(y))) {
    throw new RangeError('Mesh coordinates must be finite float32 numbers');
  }
  return [ x, y ];
}

/**
 * Pack a rendering-box snapshot using its shared fields.
 *
 * @internal
 * @param operation - Background operation.
 * @param box - Owned rendering box.
 * @param colour - Background colour.
 * @returns One complete command.
 */
function boxCommand(
  operation: number, box: RenderBox, colour: VertexColour,
): Float32Array {
  renderBoxHandle(box);
  const command = new Float32Array(commandStride);
  command[0] = operation;
  command.set(box.fillSize, 1);
  command.set(box.borderOffset, 3);
  command.set(box.borderWidths, 5);
  command.set(box.borderRadius, 9);
  writeColour(command, 13, colour);
  return command;
}

/**
 * Rml::MeshUtilities with Native geometry generation and batch submission.
 *
 * @zh Rml::MeshUtilities，提供 Native 几何生成及批量提交。
 * @ja Native ジオメトリ生成と一括送信を提供する Rml::MeshUtilities。
 * @ko Native 지오메트리 생성 및 일괄 제출을 제공하는 Rml::MeshUtilities입니다.
 * @remarks
 * Operations append in order. Native reserves storage once per batch, retaining
 * previous exported views in old storage. Without retained views, append reuses
 * the mesh and grows capacity geometrically.
 * @zh 操作按顺序追加。Native 每批预留存储，已导出视图保留旧存储。没有保活视图时，
 * 追加复用网格并按几何倍数扩容。
 * @ja 操作は順に追加されます。既存ビューは古い領域を保持します。ビューがなければ
 * メッシュを再利用し、容量を幾何級数的に拡張します。
 * @ko 작업은 순서대로 추가됩니다. 기존 뷰는 이전 저장소를 유지합니다. 보유 뷰가 없으면
 * 메시를 재사용하고 용량을 기하급수적으로 늘립니다.
 */
export class MeshUtilities {
  /**
   * Number of float32 fields per command, including reserved fields.
   *
   * @zh 每条命令的 float32 字段数，含保留字段。
   * @ja 予約領域を含むコマンド当たりの float32 フィールド数。
   * @ko 예약 필드를 포함한 명령당 float32 필드 수입니다.
   */
  static readonly commandStride = commandStride;

  private constructor() {}

  /**
   * Allocate zeroed Native-owned records for direct shared writes.
   *
   * @zh 分配清零的 Native 持有记录，供直接共享写入。
   * @ja 直接共有書き込み用にゼロ初期化の Native 所有レコードを割り当てます。
   * @ko 직접 공유 쓰기용으로 0으로 초기화된 Native 소유 레코드를 할당합니다.
   * @param count - Command capacity.
   * @zh count - 命令容量。
   * @ja count - コマンド容量。
   * @ko count - 명령 용량입니다.
   * @returns Writable records, retained independently of runtime lifetime.
   * @zh 独立于运行时生命周期保活的可写记录。
   * @ja ランタイムの寿命とは独立して保持される書き込み可能なレコード。
   * @ko 런타임 수명과 독립적으로 유지되는 쓰기 가능한 레코드입니다.
   */
  static allocateCommands(count: number): Float32Array {
    return native.meshAllocateCommands(count);
  }

  /**
   * Submit command records once; validation precedes all geometry writes.
   *
   * @zh 一次提交命令记录；所有几何写入前先校验整批。
   * @ja コマンドを一度で送信し、書き込み前にバッチ全体を検証します。
   * @ko 명령을 한 번 제출하며 쓰기 전에 전체 배치를 검증합니다.
   * @remarks
   * Each record contains 40 floats. Field 0 selects quad=0, line=1,
   * background=2 or background-border=3. Quad/line fields 1–4 are x,y,width,
   * height; 5–8 are premultiplied RGBA. Quad fields 9–12 are u0,v0,u1,v1.
   * Background fields 1–12 are fill x/y, border offset x/y, four widths and
   * four radii in RenderBox order; 13–16 are background RGBA. Border fields
   * 17–32 contain four RGBA colours in top/right/bottom/left order.
   * Remaining fields are reserved and ignored. Buffers cannot be detached or
   * backed by concurrently shared memory.
   * @zh 每条记录 40 个浮点数。字段 0：quad=0、line=1、背景=2、背景边框=3。
   * quad/line 字段 1–4 为 x/y/宽/高，5–8 为预乘 RGBA；quad 的 9–12 为 UV 两角。
   * 背景的 1–12 按 RenderBox 顺序存储填充尺寸、边框偏移、四边宽和四角半径，
   * 13–16 为背景 RGBA；17–32 按上/右/下/左存储四个边框 RGBA。其余字段保留。
   * 缓冲区不得分离或使用并发共享后备。
   * @ja 40 個の float を使い、0 は操作、1–4 は矩形、5–8 は色、9–12 は UV です。
   * 背景は 1–12 に RenderBox、13–16 に背景色、17–32 に上右下左の境界色を置きます。
   * 残りは予約領域です。切り離されたバッファーや並行共有領域は拒否します。
   * @ko 40개 float에서 0은 작업, 1–4는 사각형, 5–8은 색, 9–12는 UV입니다.
   * 배경은 1–12에 RenderBox, 13–16에 배경색, 17–32에 위/오른쪽/아래/왼쪽 색을
   * 저장합니다. 나머지는 예약 필드이며 분리되거나 동시 공유된 버퍼는 거부합니다.
   * @param mesh - Owned mesh receiving appended geometry.
   * @zh mesh - 接收追加几何的自有网格。
   * @ja mesh - ジオメトリを追加する所有メッシュ。
   * @ko mesh - 추가 지오메트리를 받는 소유 메시입니다.
   * @param commands - Complete command records.
   * @zh commands - 完整命令记录。
   * @ja commands - 完全なコマンドレコード。
   * @ko commands - 완전한 명령 레코드입니다.
   * @param count - Prefix to execute; defaults to all records.
   * @zh count - 执行前缀数量，默认执行全部记录。
   * @ja count - 実行する先頭件数。既定は全レコードです。
   * @ko count - 실행할 접두부 수이며 기본값은 전체 레코드입니다.
   */
  static append(mesh: Mesh, commands: Float32Array, count?: number): void {
    native.meshAppendCommands(meshHandle(mesh), commands, count);
  }

  /**
   * Append a native quad with optional texture coordinates.
   *
   * @zh 追加原生四边形，可指定纹理坐标。
   * @ja オプションのテクスチャ座標でネイティブ四角形を追加します。
   * @ko 선택적 텍스처 좌표로 네이티브 사각형을 추가합니다.
   * @param mesh - Destination mesh.
   * @zh mesh - 目标网格。
   * @ja mesh - 出力メッシュ。
   * @ko mesh - 대상 메시입니다.
   * @param origin - Quad origin.
   * @zh origin - 四边形原点。
   * @ja origin - 四角形の原点。
   * @ko origin - 사각형 원점입니다.
   * @param dimensions - Quad size.
   * @zh dimensions - 四边形尺寸。
   * @ja dimensions - 四角形のサイズ。
   * @ko dimensions - 사각형 크기입니다.
   * @param colour - Premultiplied RGBA bytes.
   * @zh colour - 预乘 RGBA 字节。
   * @ja colour - 乗算済み RGBA バイト。
   * @ko colour - 미리 곱한 RGBA 바이트입니다.
   * @param topLeftTexcoord - Top-left UV, default (0,0).
   * @zh topLeftTexcoord - 左上 UV，默认 (0,0)。
   * @ja topLeftTexcoord - 左上 UV。既定は (0,0)。
   * @ko topLeftTexcoord - 왼쪽 위 UV이며 기본값은 (0,0)입니다.
   * @param bottomRightTexcoord - Bottom-right UV, default (1,1).
   * @zh bottomRightTexcoord - 右下 UV，默认 (1,1)。
   * @ja bottomRightTexcoord - 右下 UV。既定は (1,1)。
   * @ko bottomRightTexcoord - 오른쪽 아래 UV이며 기본값은 (1,1)입니다.
   */
  static generateQuad(
    mesh: Mesh, origin: VariantVector2, dimensions: VariantVector2,
    colour: VertexColour,
    topLeftTexcoord = {
      /**
       * U texture coordinate at the top-left corner.
       *
       * @zh 左上角的 U 纹理坐标。
       * @ja 左上隅の U テクスチャ座標。
       * @ko 왼쪽 위 모서리의 U 텍스처 좌표입니다.
       */
      x: 0,
      /**
       * V texture coordinate at the top-left corner.
       *
       * @zh 左上角的 V 纹理坐标。
       * @ja 左上隅の V テクスチャ座標。
       * @ko 왼쪽 위 모서리의 V 텍스처 좌표입니다.
       */
      y: 0,
    },
    bottomRightTexcoord = {
      /**
       * U texture coordinate at the bottom-right corner.
       *
       * @zh 右下角的 U 纹理坐标。
       * @ja 右下隅の U テクスチャ座標。
       * @ko 오른쪽 아래 모서리의 U 텍스처 좌표입니다.
       */
      x: 1,
      /**
       * V texture coordinate at the bottom-right corner.
       *
       * @zh 右下角的 V 纹理坐标。
       * @ja 右下隅の V テクスチャ座標。
       * @ko 오른쪽 아래 모서리의 V 텍스처 좌표입니다.
       */
      y: 1,
    },
  ): void {
    const command = new Float32Array(MeshUtilities.commandStride);
    command.set([ 0, ...coordinates(origin), ...coordinates(dimensions) ]);
    writeColour(command, 5, colour);
    command.set([
      ...coordinates(topLeftTexcoord), ...coordinates(bottomRightTexcoord),
    ], 9);
    MeshUtilities.append(mesh, command);
  }

  /**
   * Append a native line after snapping both edges to the pixel grid.
   *
   * @zh 将两条边吸附到像素网格后追加原生线条。
   * @ja 両端をピクセルグリッドに合わせてネイティブ線を追加します。
   * @ko 양쪽 경계를 픽셀 그리드에 맞춘 후 네이티브 선을 추가합니다.
   * @param mesh - Destination mesh.
   * @zh mesh - 目标网格。
   * @ja mesh - 出力メッシュ。
   * @ko mesh - 대상 메시입니다.
   * @param position - Line origin.
   * @zh position - 线条原点。
   * @ja position - 線の原点。
   * @ko position - 선 원점입니다.
   * @param size - Line size.
   * @zh size - 线条尺寸。
   * @ja size - 線のサイズ。
   * @ko size - 선 크기입니다.
   * @param colour - Premultiplied RGBA bytes.
   * @zh colour - 预乘 RGBA 字节。
   * @ja colour - 乗算済み RGBA バイト。
   * @ko colour - 미리 곱한 RGBA 바이트입니다.
   */
  static generateLine(
    mesh: Mesh, position: VariantVector2, size: VariantVector2,
    colour: VertexColour,
  ): void {
    const command = new Float32Array(MeshUtilities.commandStride);
    command.set([ 1, ...coordinates(position), ...coordinates(size) ]);
    writeColour(command, 5, colour);
    MeshUtilities.append(mesh, command);
  }

  /**
   * Append native background geometry, including rounded corners.
   *
   * @zh 追加包含圆角的原生背景几何。
   * @ja 角丸を含むネイティブ背景ジオメトリを追加します。
   * @ko 둥근 모서리를 포함한 네이티브 배경 지오메트리를 추가합니다.
   * @param mesh - Destination mesh.
   * @zh mesh - 目标网格。
   * @ja mesh - 出力メッシュ。
   * @ko mesh - 대상 메시입니다.
   * @param box - Rendering-box snapshot.
   * @zh box - 渲染盒快照。
   * @ja box - 描画ボックスのスナップショット。
   * @ko box - 렌더링 상자 스냅샷입니다.
   * @param colour - Premultiplied background RGBA.
   * @zh colour - 预乘背景 RGBA。
   * @ja colour - 乗算済み背景 RGBA。
   * @ko colour - 미리 곱한 배경 RGBA입니다.
   */
  static generateBackground(
    mesh: Mesh, box: RenderBox, colour: VertexColour,
  ): void {
    MeshUtilities.append(mesh, boxCommand(2, box, colour));
  }

  /**
   * Append native rounded background and per-edge border geometry.
   *
   * @zh 追加原生圆角背景和各边框几何。
   * @ja ネイティブの角丸背景と各辺のボーダージオメトリを追加します。
   * @ko 네이티브 둥근 배경 및 가장자리별 테두리 지오메트리를 추가합니다.
   * @param mesh - Destination mesh.
   * @zh mesh - 目标网格。
   * @ja mesh - 出力メッシュ。
   * @ko mesh - 대상 메시입니다.
   * @param box - Rendering-box snapshot.
   * @zh box - 渲染盒快照。
   * @ja box - 描画ボックスのスナップショット。
   * @ko box - 렌더링 상자 스냅샷입니다.
   * @param backgroundColour - Background RGBA; zero alpha omits the background.
   * @zh backgroundColour - 背景 RGBA，alpha 为零时不生成背景。
   * @ja backgroundColour - 背景 RGBA。アルファゼロで背景を省略します。
   * @ko backgroundColour - 배경 RGBA이며 알파가 0이면 배경을 생략합니다.
   * @param borderColours - Top, right, bottom, left premultiplied RGBA.
   * @zh borderColours - 上、右、下、左的预乘 RGBA。
   * @ja borderColours - 上、右、下、左の乗算済み RGBA。
   * @ko borderColours - 위, 오른쪽, 아래, 왼쪽의 미리 곱한 RGBA입니다.
   */
  static generateBackgroundBorder(
    mesh: Mesh, box: RenderBox, backgroundColour: VertexColour,
    borderColours: [ VertexColour, VertexColour, VertexColour, VertexColour ],
  ): void {
    if (!Array.isArray(borderColours) || borderColours.length !== 4) {
      throw new TypeError('Expected four border colours');
    }

    const command = boxCommand(3, box, backgroundColour);
    for (let i = 0; i < 4; ++i) {
      writeColour(command, 17 + i * 4, borderColours[i]);
    }
    MeshUtilities.append(mesh, command);
  }
}
