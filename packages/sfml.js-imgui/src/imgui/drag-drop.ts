import { native } from '../internal/native';
import type { ImGuiPayload } from '../types';

/**
 * Begin a drag-and-drop source.
 *
 * @zh 开始拖放源。
 * @ja ドラッグ＆ドロップのソースを開始します。
 * @ko 드래그 앤 드롭 소스를 시작합니다.
 *
 * @remarks
 * - On source items, call BeginDragDropSource(), if it returns true also call
 *   SetDragDropPayload() + EndDragDropSource().
 *
 * - On target candidates, call BeginDragDropTarget(), if it returns true also
 *   call AcceptDragDropPayload() + EndDragDropTarget().
 *
 * - If you stop calling BeginDragDropSource() the payload is preserved however
 *   it won't have a preview tooltip (we currently display a fallback "..."
 *   tooltip, see #1725)
 * - An item can be both drag source and drop target.
 *
 * call after submitting an item which may be dragged. when this return true,
 * you can call SetDragDropPayload() + EndDragDropSource()
 * @zh
 * 拖放。
 *
 * - 对源项目调用 BeginDragDropSource()；若返回 true，还应调用 SetDragDropPayload() +
 *   EndDragDropSource()。
 *
 * - 对候选目标调用 BeginDragDropTarget()；若返回 true，还应调用 AcceptDragDropPayload() +
 *   EndDragDropTarget()。
 *
 * - 停止调用 BeginDragDropSource() 后载荷仍被保留，但没有预览提示框（目前会显示备用的 "..." 提示框，见 #1725）。
 *
 * - 项目可以同时是拖动源和放置目标。在提交可拖动项目后调用；返回 true 时可调用 SetDragDropPayload() +
 *   EndDragDropSource()。
 * @ja
 * ドラッグ＆ドロップ。
 *
 * - 元の項目で BeginDragDropSource() を呼び、true を返したら SetDragDropPayload() +
 *   EndDragDropSource() も呼びます。
 *
 * - 候補の対象で BeginDragDropTarget() を呼び、true を返したら AcceptDragDropPayload() +
 *   EndDragDropTarget() も呼びます。
 *
 * - BeginDragDropSource() の呼び出しをやめてもペイロードは保持されますが、プレビューのツールチップはなくなります（現在は代わりに
 *   "..." のツールチップを表示します。#1725 参照）。
 *
 * - 項目はドラッグ元とドロップ先の両方になれます。ドラッグ可能な項目の送信後に呼びます。true を返した場合は SetDragDropPayload()
 *   + EndDragDropSource() を呼べます。
 * @ko
 * 드래그 앤 드롭.
 *
 * - 원본 항목에서 BeginDragDropSource()를 호출하고 true를 반환하면 SetDragDropPayload() +
 *   EndDragDropSource()도 호출합니다.
 *
 * - 대상 후보에서 BeginDragDropTarget()을 호출하고 true를 반환하면 AcceptDragDropPayload() +
 *   EndDragDropTarget()도 호출합니다.
 *
 * - BeginDragDropSource() 호출을 중단해도 페이로드는 유지되지만 미리보기 툴팁은 없어집니다(현재는 대체 "..." 툴팁을
 *   표시합니다. #1725 참조).
 *
 * - 항목은 드래그 원본이자 드롭 대상일 수 있습니다. 드래그 가능한 항목을 제출한 후 호출합니다. true를 반환하면
 *   SetDragDropPayload() + EndDragDropSource()를 호출할 수 있습니다.
 *
 * @param flags - ImGuiDragDropFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiDragDropFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiDragDropFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiDragDropFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True while this item is an active drag source and may submit its
 * payload/preview. Call EndDragDropSource() only when true.
 * @zh 此项为活动拖动源且可提交载荷及预览时为 true。仅为 true 时调用 EndDragDropSource()。
 * @ja 項目がドラッグ元としてアクティブでペイロードやプレビューを出せる場合は true です。true の場合だけ
 * EndDragDropSource() を呼びます。
 * @ko 항목이 활성 드래그 소스로 페이로드 또는 미리보기를 제출할 수 있으면 true입니다. true일 때만
 * EndDragDropSource()를 호출합니다.
 */
export function BeginDragDropSource(flags: number = 0): boolean {
  return native.BeginDragDropSource(flags);
}

/**
 * Set the drag-and-drop payload data.
 *
 * @zh 设置拖放载荷数据。
 * @ja ドラッグ＆ドロップのペイロードデータを設定します。
 * @ko 드래그 앤 드롭 페이로드 데이터를 설정합니다.
 *
 * @remarks
 * type is a user defined string of maximum 32 characters.
 *
 * Strings starting with '_' are reserved for dear imgui internal types.
 *
 * Data is copied and held by imgui.
 *
 * Return true when payload has been accepted.
 * @zh
 * type 是最长 32 个字符的用户定义字符串。
 *
 * 以 '_' 开头的字符串保留给 dear imgui 内部类型。
 *
 * 数据会被 imgui 复制并持有。
 *
 * 载荷被接受时返回 true。
 * @ja
 * type は最大 32 文字のユーザー定義文字列です。
 *
 * '_' で始まる文字列は dear imgui の内部型用に予約されています。
 *
 * データは imgui がコピーして保持します。
 *
 * ペイロードが受け入れられた場合に true を返します。
 * @ko
 * type은 최대 32자의 사용자 정의 문자열입니다.
 *
 * '_'로 시작하는 문자열은 dear imgui 내부 타입용으로 예약되어 있습니다.
 *
 * 데이터는 imgui가 복사하여 보관합니다.
 *
 * 페이로드가 수락되면 true를 반환합니다.
 *
 * @param type - Drag/drop payload type identifier (at most 32 characters);
 * names starting with _ are reserved.
 * @zh type - 拖放载荷类型标识符，最多 32 个字符；以下划线开头的名称为保留名称。
 * @ja type - ドラッグ＆ドロップの型識別子（最大 32 文字）です。_ で始まる名前は予約済みです。
 * @ko type - 드래그 앤 드롭 페이로드 형식 식별자(최대 32자)입니다. _로 시작하는 이름은 예약되어 있습니다.
 *
 * @param data - Address of payload bytes to copy into ImGui-owned storage; sz
 * specifies the byte count.
 * @zh data - 要复制到 ImGui 自有存储的载荷字节地址；sz 指定字节数。
 * @ja data - ImGui 管理領域へコピーするペイロードのアドレスです。sz がバイト数を指定します。
 * @ko data - ImGui 저장소로 복사할 페이로드 바이트 주소입니다. sz는 바이트 수입니다.
 *
 * @param sz - Number of payload bytes copied from data.
 * @zh sz - 从 data 复制的载荷字节数。
 * @ja sz - data からコピーするペイロードのバイト数です。
 * @ko sz - data에서 복사할 페이로드 바이트 수입니다.
 *
 * @param cond - Copy condition: ImGuiCond.Always (or 0) copies each call;
 * ImGuiCond.Once copies only when the payload is first created.
 * @zh cond - 复制条件：ImGuiCond.Always 或 0 每次复制；ImGuiCond.Once 仅在首次创建载荷时复制。
 * @ja cond - コピー条件です。ImGuiCond.Always または 0 は毎回、ImGuiCond.Once
 * はペイロードの初回作成時だけコピーします。
 * @ko cond - 복사 조건입니다. ImGuiCond.Always 또는 0은 매 호출, ImGuiCond.Once는 페이로드 최초 생성
 * 시에만 복사합니다.
 *
 * @returns True if a target accepted the payload in this frame or the previous
 * frame; not necessarily final delivery.
 * @zh 本帧或前一帧有目标接受载荷时为 true，不一定表示最终交付。
 * @ja このフレームまたは前のフレームで対象が受理した場合は true です。最終配送とは限りません。
 * @ko 이번 또는 이전 프레임에 대상이 페이로드를 수락하면 true입니다. 최종 전달을 뜻하지는 않습니다.
 */
export function SetDragDropPayload(
  type: string | Uint8Array,
  data: bigint | null,
  sz: number,
  cond: number = 0,
): boolean {
  return native.SetDragDropPayload(type, data, sz, cond);
}

/**
 * End the current drag-and-drop source.
 *
 * @zh 结束当前拖放源。
 * @ja 現在のドラッグ＆ドロップのソースを終了します。
 * @ko 현재 드래그 앤 드롭 소스를 종료합니다.
 *
 * @remarks
 * only call EndDragDropSource() if BeginDragDropSource() returns true!
 * @zh
 * 仅在 BeginDragDropSource() 返回 true 时调用 EndDragDropSource()！
 * @ja
 * BeginDragDropSource() が true を返した場合にのみ EndDragDropSource() を呼んでください！
 * @ko
 * BeginDragDropSource()가 true를 반환했을 때만 EndDragDropSource()를 호출하세요!
 */
export function EndDragDropSource(): void {
  native.EndDragDropSource();
}

/**
 * Begin a drag-and-drop target for the preceding item.
 *
 * @zh 为前一个条目开始拖放目标。
 * @ja 直前のアイテム用にドラッグ＆ドロップのターゲットを開始します。
 * @ko 이전 항목의 드래그 앤 드롭 대상을 시작합니다.
 *
 * @remarks
 * call after submitting an item that may receive a payload.
 *
 * If this returns true, you can call AcceptDragDropPayload() +
 * EndDragDropTarget()
 * @zh
 * 在提交可能接收载荷的项目后调用。
 *
 * 如果返回 true，可调用 AcceptDragDropPayload() + EndDragDropTarget()。
 * @ja
 * ペイロードを受け取る可能性のある項目を送信した後に呼びます。
 *
 * true を返したら AcceptDragDropPayload() + EndDragDropTarget() を呼べます。
 * @ko
 * 페이로드를 받을 수 있는 항목을 제출한 후 호출합니다.
 *
 * true를 반환하면 AcceptDragDropPayload() + EndDragDropTarget()을 호출할 수 있습니다.
 *
 * @returns True when the last item can act as a target for the current drag.
 * Inspect AcceptDragDropPayload() for payload matching/delivery, and call
 * EndDragDropTarget() only when true.
 * @zh 最后项可作为当前拖动目标时为 true。用 AcceptDragDropPayload() 检查载荷匹配及交付，仅为 true 时调用
 * EndDragDropTarget()。
 * @ja 直前の項目が現在のドラッグ対象になれる場合は true です。AcceptDragDropPayload() で型と配送を確認し、true
 * の場合だけ EndDragDropTarget() を呼びます。
 * @ko 마지막 항목이 현재 드래그의 대상이 될 수 있으면 true입니다. AcceptDragDropPayload()로 형식과 전달을
 * 확인하며 true일 때만 EndDragDropTarget()을 호출합니다.
 */
export function BeginDragDropTarget(): boolean {
  return native.BeginDragDropTarget();
}

/**
 * Accept contents of a given type.
 *
 * @zh 接受指定类型的内容。
 * @ja 指定した型の内容を受け入れます。
 * @ko 지정한 타입의 내용을 수락합니다.
 *
 * @remarks
 * If ImGuiDragDropFlags.AcceptBeforeDelivery is set you can peek into the
 * payload before the mouse button is released.
 * @zh
 * 设置 ImGuiDragDropFlags.AcceptBeforeDelivery 后，可在鼠标按钮松开之前查看载荷。
 * @ja
 * ImGuiDragDropFlags.AcceptBeforeDelivery を設定すると、マウスボタンが離される前にペイロードを確認できます。
 * @ko
 * ImGuiDragDropFlags.AcceptBeforeDelivery를 설정하면 마우스 버튼을 놓기 전에 페이로드를 확인할 수 있습니다.
 *
 * @param type - Drag/drop payload type identifier (at most 32 characters);
 * names starting with _ are reserved.
 * @zh type - 拖放载荷类型标识符，最多 32 个字符；以下划线开头的名称为保留名称。
 * @ja type - ドラッグ＆ドロップの型識別子（最大 32 文字）です。_ で始まる名前は予約済みです。
 * @ko type - 드래그 앤 드롭 페이로드 형식 식별자(최대 32자)입니다. _로 시작하는 이름은 예약되어 있습니다.
 *
 * @param flags - ImGuiDragDropFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiDragDropFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiDragDropFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiDragDropFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns Borrowed matching payload, or null when none is accepted. With
 * ImGuiDragDropFlags.AcceptBeforeDelivery, check Payload_IsDelivery(payload)
 * on a non-null result before committing the drop.
 * @zh 借用的匹配载荷，无被接受载荷时为 null。启用 ImGuiDragDropFlags.AcceptBeforeDelivery 时，
 * 应在结果非 null 时调用 Payload_IsDelivery(payload)，确认交付后再提交拖放。
 * @ja 一致して受理した借用ペイロードです。なければ null です。ImGuiDragDropFlags.AcceptBeforeDelivery
 * 使用時は、
 * null でない結果を Payload_IsDelivery(payload) で確認してからドロップを確定します。
 * @ko 수락한 일치 페이로드의 빌린 핸들입니다. 없으면 null입니다.
 * ImGuiDragDropFlags.AcceptBeforeDelivery 사용 시
 * null이 아닌 결과에 Payload_IsDelivery(payload)를 호출해 전달 여부를 확인한 뒤 드롭을 확정합니다.
 */
export function AcceptDragDropPayload(
  type: string | Uint8Array,
  flags: number = 0,
): ImGuiPayload | null {
  return native.AcceptDragDropPayload(type, flags);
}

/**
 * End the current drag-and-drop target.
 *
 * @zh 结束当前拖放目标。
 * @ja 現在のドラッグ＆ドロップのターゲットを終了します。
 * @ko 현재 드래그 앤 드롭 대상을 종료합니다.
 *
 * @remarks
 * only call EndDragDropTarget() if BeginDragDropTarget() returns true!
 * @zh
 * 仅在 BeginDragDropTarget() 返回 true 时调用 EndDragDropTarget()！
 * @ja
 * BeginDragDropTarget() が true を返した場合にのみ EndDragDropTarget() を呼んでください！
 * @ko
 * BeginDragDropTarget()이 true를 반환했을 때만 EndDragDropTarget()를 호출하세요!
 */
export function EndDragDropTarget(): void {
  native.EndDragDropTarget();
}

/**
 * Get the active drag-and-drop payload.
 *
 * @zh 获取当前活动的拖放载荷。
 * @ja 現在のドラッグ＆ドロップのペイロードを取得します。
 * @ko 현재 활성 드래그 앤 드롭 페이로드를 가져옵니다.
 *
 * @remarks
 * peek directly into the current payload from anywhere.
 *
 * returns null when drag and drop is finished or inactive.
 *
 * Use `ImGui.Payload_IsDataType(payload, type)` to test the payload type.
 * @zh
 * 在任意位置直接查看当前载荷。
 *
 * 拖放已结束或未激活时返回 null。
 *
 * 使用 `ImGui.Payload_IsDataType(payload, type)` 检查载荷类型。
 * @ja
 * どこからでも現在のペイロードを直接確認します。
 *
 * ドラッグ＆ドロップが終了しているか非アクティブなら null を返します。
 *
 * 型の確認には `ImGui.Payload_IsDataType(payload, type)` を使用します。
 * @ko
 * 어디서나 현재 페이로드를 직접 확인합니다.
 *
 * 드래그 앤 드롭이 끝났거나 비활성 상태이면 null을 반환합니다.
 *
 * 페이로드 타입은 `ImGui.Payload_IsDataType(payload, type)`으로 검사합니다.
 *
 * @returns Borrowed current drag/drop payload, or null when no drag/drop
 * payload is active.
 * @zh 当前拖放载荷的借用句柄；没有活动拖放载荷时为 null。
 * @ja 現在のドラッグ＆ドロップの借用ペイロードです。アクティブなものがなければ null です。
 * @ko 현재 드래그 앤 드롭 페이로드의 빌린 핸들입니다. 활성 페이로드가 없으면 null입니다.
 */
export function GetDragDropPayload(): ImGuiPayload | null {
  return native.GetDragDropPayload();
}

/**
 * Reset drag-and-drop payload metadata without freeing the referenced data.
 *
 * @zh 重置拖放载荷元数据，不释放所引用的数据。
 * @ja 参照先データを解放せず、ドラッグ＆ドロップのペイロード情報をリセットします。
 * @ko 참조된 데이터를 해제하지 않고 드래그 앤 드롭 페이로드 메타데이터를 재설정합니다.
 *
 * @param self - ImGuiPayload handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiPayload 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiPayload ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiPayload 핸들입니다.
 */
export function Payload_Clear(self: ImGuiPayload): void {
  native.Payload_Clear(self);
}

/**
 * Test whether a valid drag-and-drop payload has the specified type tag.
 *
 * @zh 检查有效的拖放载荷是否具有指定的类型标签。
 * @ja 有効なドラッグ＆ドロップのペイロードが指定の型タグを持つかを調べます。
 * @ko 유효한 드래그 앤 드롭 페이로드에 지정된 형식 태그가 있는지 확인합니다.
 *
 * @param self - ImGuiPayload handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiPayload 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiPayload ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiPayload 핸들입니다.
 *
 * @param type - Drag/drop payload type identifier (at most 32 characters);
 * names starting with _ are reserved.
 * @zh type - 拖放载荷类型标识符，最多 32 个字符；以下划线开头的名称为保留名称。
 * @ja type - ドラッグ＆ドロップの型識別子（最大 32 文字）です。_ で始まる名前は予約済みです。
 * @ko type - 드래그 앤 드롭 페이로드 형식 식별자(최대 32자)입니다. _로 시작하는 이름은 예약되어 있습니다.
 *
 * @returns True if the payload has data and its type identifier matches type.
 * @zh 载荷具有数据且类型标识符匹配 type 时为 true。
 * @ja ペイロードにデータがあり、型名が type と一致すれば true です。
 * @ko 페이로드에 데이터가 있고 형식 식별자가 type과 일치하면 true입니다.
 */
export function Payload_IsDataType(
  self: ImGuiPayload,
  type: string | Uint8Array,
): boolean {
  return native.Payload_IsDataType(self, type);
}

/**
 * Test whether the drag-and-drop payload is being previewed over an accepting
 * target.
 *
 * @zh 检查拖放载荷是否正在接受它的目标上预览。
 * @ja ドラッグ＆ドロップのペイロードが受け入れ先の上でプレビュー中かを調べます。
 * @ko 드래그 앤 드롭 페이로드가 수락 대상 위에서 미리보기 중인지 확인합니다.
 *
 * @param self - ImGuiPayload handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiPayload 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiPayload ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiPayload 핸들입니다.
 *
 * @returns True while this payload is previewed over an accepting target.
 * @zh 载荷正在接受目标上预览时为 true。
 * @ja 受理する対象上でペイロードをプレビューしている間は true です。
 * @ko 수락 대상 위에서 페이로드를 미리 보는 동안 true입니다.
 */
export function Payload_IsPreview(self: ImGuiPayload): boolean {
  return native.Payload_IsPreview(self);
}

/**
 * Test whether the drag-and-drop payload is being delivered to its target on
 * release.
 *
 * @zh 检查拖放载荷是否正因释放操作而交付给目标。
 * @ja ボタンを離したことでドラッグ＆ドロップのペイロードが対象に渡される状態かを調べます。
 * @ko 버튼을 놓아 드래그 앤 드롭 페이로드가 대상에 전달되는 상태인지 확인합니다.
 *
 * @param self - ImGuiPayload handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiPayload 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiPayload ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiPayload 핸들입니다.
 *
 * @returns True when the payload is being delivered to its target after the
 * drop.
 * @zh 拖放完成后载荷正交付给目标时为 true。
 * @ja ドロップ後に対象へペイロードを配送する場合は true です。
 * @ko 드롭 후 페이로드가 대상에 전달될 때 true입니다.
 */
export function Payload_IsDelivery(self: ImGuiPayload): boolean {
  return native.Payload_IsDelivery(self);
}
