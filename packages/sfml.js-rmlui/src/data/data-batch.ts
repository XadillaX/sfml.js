import { markAsUntransferable } from 'node:worker_threads';
import { native, type NativeDataBatch } from '../internal/native';
import {
  adoptElementCommands, type ElementCommandBuffer,
} from '../dom/elements/element-commands';
import type { DataModelHandle } from './data-model';
import type { Element } from '../dom/elements/element';

/**
 * Configuration for explicit native data-view groups.
 *
 * @zh 显式原生数据 view 组的配置。
 * @ja 明示的なネイティブデータビューグループの設定。
 * @ko 명시적인 네이티브 데이터 뷰 그룹 설정입니다.
 */
export interface DataBatchViewOptions {
  /**
   * Cached view ordering offset at each element's depth, from -1000 to 999.
   *
   * @zh 各元素深度上的缓存 view 排序偏移，范围 -1000 至 999。
   * @ja 各要素の深さでのキャッシュ済み順序オフセット。-1000～999。
   * @ko 요소 깊이별 캐시된 뷰 순서 오프셋이며 -1000부터 999까지입니다.
   * @default 0
   */
  sortOffset?: number;

  /**
   * Retained output command capacity.
   *
   * @zh 保留的输出命令容量。
   * @ja 保持する出力コマンド容量。
   * @ko 유지할 출력 명령 용량입니다.
   * @default elements.length
   */
  commandCapacity?: number;
}

/**
 * Compute one compact dirty interval and return its output command count.
 *
 * @zh 计算一个紧凑脏区间，返回输出命令数。
 * @ja コンパクトな変更区間を計算し、出力コマンド数を返します。
 * @ko 압축된 변경 구간을 계산하고 출력 명령 수를 반환합니다.
 */
export interface DataBatchViewUpdate {
  /**
   * Write ordered commands for the supplied dirty interval.
   *
   * @zh 为提供的脏区间写入有序命令。
   * @ja 指定した変更区間のコマンドを順に書き込みます。
   * @ko 제공된 변경 구간의 명령을 순서대로 기록합니다.
   * @param batch - Retained input and output mappings.
   * @zh batch - 保留的输入和输出映射。
   * @ja batch - 保持済みの入力・出力領域。
   * @ko batch - 유지된 입력·출력 매핑입니다.
   * @param count - Valid prefix length in slots and inputs.
   * @zh count - slots 和 inputs 的有效前缀长度。
   * @ja count - slots と inputs の有効な前方部分の長さ。
   * @ko count - slots와 inputs의 유효한 앞부분 길이입니다.
   * @returns Unsigned command count; Native consumes it after the callback.
   * @zh 无符号命令数；回调返回后由 Native 消费。
   * @ja 符号なしコマンド数。コールバック後にネイティブで処理します。
   * @ko 부호 없는 명령 수이며 콜백 뒤에 네이티브에서 처리합니다.
   */
  (batch: DataBatchView, count: number): number;
}

interface BatchMapping extends NativeDataBatch {
  commandBuffer: ElementCommandBuffer;
}

const batches = new WeakMap<DataBatchView, BatchMapping>();

/**
 * Resolve retained mappings without crossing into Native.
 *
 * @internal
 * @param batch - Group wrapper.
 * @returns Retained group mapping.
 */
function mapping(batch: DataBatchView): BatchMapping {
  const value = batches.get(batch);
  if (!value) {
    throw new TypeError('Expected a DataBatchView');
  }
  return value;
}

/**
 * Explicit numeric view group evaluated by the native model scheduler.
 *
 * @zh 由原生模型调度器求值的显式数值 view 组。
 * @ja ネイティブモデルスケジューラーで評価する明示的な数値ビューグループ。
 * @ko 네이티브 모델 스케줄러가 평가하는 명시적인 수치 뷰 그룹입니다.
 * @remarks
 * Each registered element has one native expression and a stable slot.
 * A callback receives only dirty views in a contiguous interval of the
 * scheduler's existing order, with the same group and cached sort order.
 * Legacy views and other groups break intervals. Inputs are finite doubles
 * evaluated before the callback. Expressions may use native storage/aliases
 * and transforms; JS getters/transforms still make their own callbacks.
 * Return a command count after writing commands. Native validates the entire
 * prefix, snapshots it and consumes in order; queries see earlier writes.
 * Throwing applies no returned commands; execution failures retain the
 * completed prefix in commands.consumed. The callback may add other groups
 * for the scheduler's existing same-frame rounds. An active group cannot
 * release or recursively update. Old mappings retain bytes after teardown.
 * @zh 每个元素对应一个原生表达式及稳定槽位。回调仅接收现有调度顺序中同组、
 * 同缓存排序值的连续脏 view；旧 view 和其他组会切断区间。输入先求值为有限
 * double。表达式可使用原生存储、别名和转换；JS getter 或转换仍各自回调。
 * 写入 commands 后返回命令数。Native 校验整个前缀，保存快照并顺序消费；
 * 查询可见之前的写入。回调抛错不应用返回命令；执行失败由 commands.consumed
 * 保留已完成前缀。回调可添加其他组，参与原有同帧轮次。禁止释放或递归更新
 * 正在运行的组。关闭后旧映射仅保留字节。
 * @ja 各要素はネイティブ式と固定スロットを持ちます。既存の順序で同じグループ・
 * 順序値の連続した変更ビューだけを通知します。他グループや旧ビューで区切ります。
 * 入力は通知前に有限 double に評価します。ネイティブデータ・別名・変換を使用でき、
 * JS getter・変換は個別のコールバックを保持します。commands に書いて数を返すと、
 * 全入力の検証とコピー後に順番に処理します。照会は先行書き込みを反映します。
 * 例外では返却コマンドを適用せず、実行失敗の完了分は commands.consumed に残ります。
 * 他グループの追加は既存の同フレーム反復に参加します。動作中の解放・再帰更新は
 * 禁止します。終了後の旧領域はバイトのみを保持します。
 * @ko 요소마다 네이티브 식과 고정 슬롯이 있습니다. 기존 순서에서 같은 그룹·순서값을
 * 가진 연속된 변경 뷰만 알립니다. 다른 그룹과 기존 뷰는 구간을 나눕니다.
 * 입력은 콜백 전에 유한한 double로 평가합니다. 네이티브 데이터·별칭·변환을 지원하며
 * JS getter·변환의 개별 콜백은 유지됩니다. commands를 쓰고 수를 반환하면 전체 검증과
 * 스냅샷 뒤에 순서대로 처리합니다. 조회는 이전 쓰기를 반영합니다.
 * 콜백 예외는 반환 명령을 적용하지 않고 실행 실패는 완료분을 commands.consumed에
 * 보존합니다. 새 그룹은 기존 같은 프레임 반복에 참여합니다. 실행 중 해제와 재귀
 * 업데이트를 거부합니다. 종료 후 이전 매핑은 바이트만 유지합니다.
 */
export class DataBatchView {
  /**
   * Register fixed element slots and native expressions in one Native entry.
   *
   * @zh 一次 Native 入口注册固定元素槽位和原生表达式。
   * @ja 1 回の呼び出しで固定要素スロットとネイティブ式を登録します。
   * @ko 한 번의 네이티브 진입으로 고정 요소 슬롯과 네이티브 식을 등록합니다.
   * @param model - Attached elements' model.
   * @zh model - 元素所属的模型。
   * @ja model - 要素が所属するモデル。
   * @ko model - 요소가 속한 모델입니다.
   * @param elements - Elements already attached to this model, in slot order.
   * @zh elements - 已挂接到该模型的元素，按槽位顺序。
   * @ja elements - このモデルに接続した要素。スロット順。
   * @ko elements - 이 모델에 연결된 요소이며 슬롯 순서입니다.
   * @param expressions - One native numeric expression per element.
   * @zh expressions - 每个元素对应一个原生数值表达式。
   * @ja expressions - 要素ごとのネイティブ数値式。
   * @ko expressions - 요소마다 하나의 네이티브 수치 식입니다.
   * @param update - Kernel invoked once for each stable dirty interval.
   * @zh update - 每个稳定脏区间调用一次的计算函数。
   * @ja update - 安定した変更区間ごとに呼び出す計算関数。
   * @ko update - 안정된 변경 구간마다 한 번 호출할 계산 함수입니다.
   * @param options - Ordering and command capacity.
   * @zh options - 排序和命令容量。
   * @ja options - 順序とコマンド容量。
   * @ko options - 순서와 명령 용량입니다.
   */
  constructor(
    model: DataModelHandle,
    elements: readonly Element[],
    expressions: readonly string[],
    update: DataBatchViewUpdate,
    options: DataBatchViewOptions = {},
  ) {
    if (typeof update !== 'function') {
      throw new TypeError('Expected a data batch update callback');
    }
    const value = native.createDataBatch(
      model.handle, elements.map(element => element.handle), expressions,
      count => update(this, count),
      options.sortOffset ?? 0, options.commandCapacity ?? elements.length,
    );
    markAsUntransferable(value.slots.buffer);
    markAsUntransferable(value.inputs.buffer);
    batches.set(this, {
      ...value, commandBuffer: adoptElementCommands(value.commands),
    });
  }

  /**
   * Stable element slots of the current dirty interval, valid up to count.
   *
   * @zh 当前脏区间的稳定元素槽位，前 count 项有效。
   * @ja 現在の変更区間の固定要素スロット。count 項まで有効。
   * @ko 현재 변경 구간의 고정 요소 슬롯이며 count개까지 유효합니다.
   * @returns Retained compact slot plane; treat as read-only in the callback.
   * @zh 保留的紧凑槽位平面；回调中应视为只读。
   * @ja 保持済みスロット領域。通知中は読み取り専用。
   * @ko 유지된 압축 슬롯 영역이며 콜백 중 읽기 전용으로 취급하세요.
   */
  get slots(): Uint32Array {
    return mapping(this).slots;
  }

  /**
   * Native numeric expression results corresponding to the compact slots.
   *
   * @zh 对应紧凑槽位的原生数值表达式结果。
   * @ja コンパクトなスロットに対応するネイティブ数値式の結果。
   * @ko 압축 슬롯에 대응하는 네이티브 수치 식 결과입니다.
   * @returns Retained double plane; treat as read-only in the callback.
   * @zh 保留的 double 平面；回调中应视为只读。
   * @ja 保持済み double 領域。通知中は読み取り専用。
   * @ko 유지된 double 영역이며 콜백 중 읽기 전용으로 취급하세요.
   */
  get inputs(): Float64Array {
    return mapping(this).inputs;
  }

  /**
   * Retained numeric command planes using the registered element slots.
   *
   * @zh 使用预注册元素槽位的保留命令平面。
   * @ja 登録済み要素スロットを使う保持済みコマンド領域。
   * @ko 등록된 요소 슬롯을 사용하는 유지된 명령 영역입니다.
   * @returns Output command buffer; return its prefix count to consume.
   * @zh 输出命令缓冲区；返回前缀长度进行消费。
   * @ja 出力コマンド領域。処理する前方部分の数を返します。
   * @ko 출력 명령 버퍼이며 처리할 앞부분 수를 반환합니다.
   */
  get commands(): ElementCommandBuffer {
    return mapping(this).commandBuffer;
  }

  /**
   * Unregister this group's views and clear its callback ownership edge.
   *
   * @zh 注销该组 view 并清除回调所有权边。
   * @ja グループのビュー登録とコールバック保持参照を解除します。
   * @ko 그룹의 뷰 등록과 콜백 소유 참조를 제거합니다.
   * @remarks
   * Rejects active, released or invalid groups. Retained planes stay readable.
   * @zh 拒绝正在运行、已释放或失效的组；保留平面仍可读取。
   * @ja 動作中・解放済み・無効なグループは拒否。領域は読み取れます。
   * @ko 실행 중·해제된·무효 그룹을 거부하며 유지된 영역은 읽을 수 있습니다.
   */
  release(): void {
    native.releaseDataBatch(mapping(this).handle);
  }
}
