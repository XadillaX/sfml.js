import { native } from '../internal/native';
import type { ImGuiStorage } from '../types';

/**
 * Replace the current window state storage.
 *
 * @zh 替换当前窗口的状态存储。
 * @ja 現在のウィンドウの状態ストレージを置き換えます。
 * @ko 현재 창 상태 저장소를 교체합니다.
 *
 * @remarks
 * replace current window storage with our own (if you want to manipulate it
 * yourself, typically clear subsection of it)
 * @zh
 * 将当前窗口的存储替换为自己的存储（用于自行操作，通常是清空其中一部分）。
 * @ja
 * 現在のウィンドウのストレージを独自のものに置き換えます（自分で操作したい場合。通常は一部分の消去など）。
 * @ko
 * 현재 창의 저장소를 자체 저장소로 교체합니다(직접 조작하려는 경우, 주로 일부 영역을 비우는 용도).
 *
 * @param storage - State-storage handle for the current window; null restores
 * the window-owned storage.
 * @zh storage - 当前窗口的状态存储句柄；null 恢复窗口自有存储。
 * @ja storage - 現在のウィンドウの状態ストレージです。null はウィンドウ自身のストレージへ戻します。
 * @ko storage - 현재 창 상태 저장소 핸들입니다. null은 창 자체 저장소로 복원합니다.
 */
export function SetStateStorage(storage: ImGuiStorage | null): void {
  native.SetStateStorage(storage);
}

/**
 * Access the key-value state storage currently used by the current window.
 *
 * @zh 访问当前窗口正在使用的键值状态存储。
 * @ja 現在のウィンドウが使用しているキーと値の状態ストレージにアクセスします。
 * @ko 현재 창에서 사용 중인 키-값 상태 저장소에 접근합니다.
 *
 * @returns Borrowed state-storage handle currently assigned to the window.
 * @zh 当前分配给窗口的状态存储借用句柄。
 * @ja 現在ウィンドウに割り当てられた状態ストレージの借用ハンドルです。
 * @ko 현재 창에 할당된 상태 저장소의 빌린 핸들입니다.
 */
export function GetStateStorage(): ImGuiStorage | null {
  return native.GetStateStorage();
}

/**
 * Clear all key-value pairs from storage.
 *
 * @zh 清空存储中的全部键值对。
 * @ja ストレージ内のすべてのキーと値の組を削除します。
 * @ko 저장소의 모든 키-값 쌍을 지웁니다.
 *
 * @remarks
 * - Get***() functions find pair, never add/allocate. Pairs are sorted so a
 *   query is O(log N)
 * - Set***() functions find pair, insertion on demand if missing.
 *
 * - Sorted insertion is costly, paid once. A typical frame shouldn't need to
 *   insert any new pair.
 * @zh
 * - Get***() 函数查找键值对，不会添加或分配。键值对有序，因此查询复杂度为 O(log N)。
 *
 * - Set***() 函数查找键值对，缺失时按需插入。
 *
 * - 有序插入成本较高，但只需支付一次；典型帧不应需要插入新键值对。
 * @ja
 * - Get***() 関数はペアを検索し、追加/割り当てはしません。ペアはソート済みなので検索は O(log N) です。
 *
 * - Set***() 関数はペアを検索し、なければ必要に応じて挿入します。
 *
 * - ソート順を保つ挿入は高コストですが一度だけです。通常のフレームでは新しいペアを挿入する必要はないはずです。
 * @ko
 * - Get***() 함수는 쌍을 찾으며 추가/할당하지 않습니다. 쌍이 정렬되어 있어 조회는 O(log N)입니다.
 *
 * - Set***() 함수는 쌍을 찾고 없으면 필요에 따라 삽입합니다.
 *
 * - 정렬 상태를 유지하는 삽입은 비용이 크지만 한 번만 발생합니다. 일반적인 프레임에서는 새 쌍을 삽입할 필요가 없어야 합니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 */
export function Storage_Clear(self: ImGuiStorage): void {
  native.Storage_Clear(self);
}

/**
 * Look up a stored integer value by key without inserting missing entries.
 *
 * @zh 按键查找存储的整数值，不插入缺失的条目。
 * @ja キーに対応する保存済みの整数値を検索し、未登録の項目は追加しません。
 * @ko 키로 저장된 정수 값을 조회하며 누락된 항목을 추가하지 않습니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param key - ImGuiID key identifying the entry in this storage.
 * @zh key - 在此存储中标识条目的 ImGuiID 键。
 * @ja key - このストレージ内のエントリーを識別する ImGuiID キーです。
 * @ko key - 이 저장소의 항목을 식별하는 ImGuiID 키입니다。
 *
 * @param default_val - Value returned if the storage key does not exist; the
 * lookup does not insert it.
 * @zh default_val - 存储键不存在时返回的值；查询不会插入该值。
 * @ja default_val - キーが存在しない場合の戻り値です。検索では挿入しません。
 * @ko default_val - 저장 키가 없을 때 반환하는 값입니다. 조회 시 삽입하지 않습니다.
 *
 * @returns Stored value for the key, or default_val when the key is absent;
 * this lookup does not insert an entry.
 * @zh 键对应的存储值，键不存在时为 default_val；查询不会插入条目。
 * @ja キーの保存値です。存在しなければ default_val を返し、エントリーは挿入しません。
 * @ko 키의 저장 값이며 키가 없으면 default_val입니다. 이 조회는 항목을 삽입하지 않습니다.
 */
export function Storage_GetInt(
  self: ImGuiStorage,
  key: number,
  default_val: number = 0,
): number {
  return native.Storage_GetInt(self, key, default_val);
}

/**
 * Store an integer value by key, inserting an entry if needed.
 *
 * @zh 按键存储整数值，必要时插入条目。
 * @ja キーに対応する整数値を保存し、必要なら項目を追加します。
 * @ko 키로 정수 값을 저장하고 필요하면 항목을 추가합니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param key - ImGuiID key identifying the entry in this storage.
 * @zh key - 在此存储中标识条目的 ImGuiID 键。
 * @ja key - このストレージ内のエントリーを識別する ImGuiID キーです。
 * @ko key - 이 저장소의 항목을 식별하는 ImGuiID 키입니다。
 *
 * @param val - Value stored under the key.
 * @zh val - 存储到指定键的值。
 * @ja val - キーに保存する値です。
 * @ko val - 키에 저장할 값입니다.
 */
export function Storage_SetInt(
  self: ImGuiStorage,
  key: number,
  val: number,
): void {
  native.Storage_SetInt(self, key, val);
}

/**
 * Look up a stored Boolean value by key without inserting missing entries.
 *
 * @zh 按键查找存储的布尔值，不插入缺失的条目。
 * @ja キーに対応する保存済みの真偽値を検索し、未登録の項目は追加しません。
 * @ko 키로 저장된 불리언 값을 조회하며 누락된 항목을 추가하지 않습니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param key - ImGuiID key identifying the entry in this storage.
 * @zh key - 在此存储中标识条目的 ImGuiID 键。
 * @ja key - このストレージ内のエントリーを識別する ImGuiID キーです。
 * @ko key - 이 저장소의 항목을 식별하는 ImGuiID 키입니다。
 *
 * @param default_val - Value returned if the storage key does not exist; the
 * lookup does not insert it.
 * @zh default_val - 存储键不存在时返回的值；查询不会插入该值。
 * @ja default_val - キーが存在しない場合の戻り値です。検索では挿入しません。
 * @ko default_val - 저장 키가 없을 때 반환하는 값입니다. 조회 시 삽입하지 않습니다.
 *
 * @returns Stored value for the key, or default_val when the key is absent;
 * this lookup does not insert an entry.
 * @zh 键对应的存储值，键不存在时为 default_val；查询不会插入条目。
 * @ja キーの保存値です。存在しなければ default_val を返し、エントリーは挿入しません。
 * @ko 키의 저장 값이며 키가 없으면 default_val입니다. 이 조회는 항목을 삽입하지 않습니다.
 */
export function Storage_GetBool(
  self: ImGuiStorage,
  key: number,
  default_val: boolean = false,
): boolean {
  return native.Storage_GetBool(self, key, default_val);
}

/**
 * Store a Boolean value by key, inserting an entry if needed.
 *
 * @zh 按键存储布尔值，必要时插入条目。
 * @ja キーに対応する真偽値を保存し、必要なら項目を追加します。
 * @ko 키로 불리언 값을 저장하고 필요하면 항목을 추가합니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param key - ImGuiID key identifying the entry in this storage.
 * @zh key - 在此存储中标识条目的 ImGuiID 键。
 * @ja key - このストレージ内のエントリーを識別する ImGuiID キーです。
 * @ko key - 이 저장소의 항목을 식별하는 ImGuiID 키입니다。
 *
 * @param val - Value stored under the key.
 * @zh val - 存储到指定键的值。
 * @ja val - キーに保存する値です。
 * @ko val - 키에 저장할 값입니다.
 */
export function Storage_SetBool(
  self: ImGuiStorage,
  key: number,
  val: boolean,
): void {
  native.Storage_SetBool(self, key, val);
}

/**
 * Look up a stored floating-point value by key without inserting missing
 * entries.
 *
 * @zh 按键查找存储的浮点值，不插入缺失的条目。
 * @ja キーに対応する保存済みの浮動小数点値を検索し、未登録の項目は追加しません。
 * @ko 키로 저장된 부동소수점 값을 조회하며 누락된 항목을 추가하지 않습니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param key - ImGuiID key identifying the entry in this storage.
 * @zh key - 在此存储中标识条目的 ImGuiID 键。
 * @ja key - このストレージ内のエントリーを識別する ImGuiID キーです。
 * @ko key - 이 저장소의 항목을 식별하는 ImGuiID 키입니다。
 *
 * @param default_val - Value returned if the storage key does not exist; the
 * lookup does not insert it.
 * @zh default_val - 存储键不存在时返回的值；查询不会插入该值。
 * @ja default_val - キーが存在しない場合の戻り値です。検索では挿入しません。
 * @ko default_val - 저장 키가 없을 때 반환하는 값입니다. 조회 시 삽입하지 않습니다.
 *
 * @returns Stored value for the key, or default_val when the key is absent;
 * this lookup does not insert an entry.
 * @zh 键对应的存储值，键不存在时为 default_val；查询不会插入条目。
 * @ja キーの保存値です。存在しなければ default_val を返し、エントリーは挿入しません。
 * @ko 키의 저장 값이며 키가 없으면 default_val입니다. 이 조회는 항목을 삽입하지 않습니다.
 */
export function Storage_GetFloat(
  self: ImGuiStorage,
  key: number,
  default_val: number = 0.0,
): number {
  return native.Storage_GetFloat(self, key, default_val);
}

/**
 * Store a floating-point value by key, inserting an entry if needed.
 *
 * @zh 按键存储浮点值，必要时插入条目。
 * @ja キーに対応する浮動小数点値を保存し、必要なら項目を追加します。
 * @ko 키로 부동소수점 값을 저장하고 필요하면 항목을 추가합니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param key - ImGuiID key identifying the entry in this storage.
 * @zh key - 在此存储中标识条目的 ImGuiID 键。
 * @ja key - このストレージ内のエントリーを識別する ImGuiID キーです。
 * @ko key - 이 저장소의 항목을 식별하는 ImGuiID 키입니다。
 *
 * @param val - Value stored under the key.
 * @zh val - 存储到指定键的值。
 * @ja val - キーに保存する値です。
 * @ko val - 키에 저장할 값입니다.
 */
export function Storage_SetFloat(
  self: ImGuiStorage,
  key: number,
  val: number,
): void {
  native.Storage_SetFloat(self, key, val);
}

/**
 * Get the stored pointer for a key.
 *
 * @zh 获取指定键对应的已存储指针。
 * @ja キーに対応する保存済みポインターを取得します。
 * @ko 키에 해당하는 저장된 포인터를 가져옵니다.
 *
 * @remarks
 * default_val is null
 * @zh
 * default_val 为 null。
 * @ja
 * default_val は null です。
 * @ko
 * default_val은 null입니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param key - ImGuiID key identifying the entry in this storage.
 * @zh key - 在此存储中标识条目的 ImGuiID 键。
 * @ja key - このストレージ内のエントリーを識別する ImGuiID キーです。
 * @ko key - 이 저장소의 항목을 식별하는 ImGuiID 키입니다。
 *
 * @returns Stored address as bigint, or 0n if the key is not found or stores a
 * null pointer.
 * @zh 存储地址 bigint；未找到键或存储为空指针时为 0n。
 * @ja 保存アドレスの bigint です。キーがないか null ポインターなら 0n です。
 * @ko 저장된 주소 bigint입니다. 키가 없거나 null 포인터를 저장했으면 0n입니다.
 */
export function Storage_GetVoidPtr(
  self: ImGuiStorage,
  key: number,
): bigint {
  return native.Storage_GetVoidPtr(self, key);
}

/**
 * Store a pointer value by key, inserting an entry if needed.
 *
 * @zh 按键存储指针值，必要时插入条目。
 * @ja キーに対応するポインター値を保存し、必要なら項目を追加します。
 * @ko 키로 포인터 값을 저장하고 필요하면 항목을 추가합니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param key - ImGuiID key identifying the entry in this storage.
 * @zh key - 在此存储中标识条目的 ImGuiID 键。
 * @ja key - このストレージ内のエントリーを識別する ImGuiID キーです。
 * @ko key - 이 저장소의 항목을 식별하는 ImGuiID 키입니다。
 *
 * @param val - Value stored under the key.
 * @zh val - 存储到指定键的值。
 * @ja val - キーに保存する値です。
 * @ko val - 키에 저장할 값입니다.
 */
export function Storage_SetVoidPtr(
  self: ImGuiStorage,
  key: number,
  val: bigint | null,
): void {
  native.Storage_SetVoidPtr(self, key, val);
}

/**
 * Sort storage entries by key after a bulk rebuild.
 *
 * @zh 批量重建后按键排序存储条目。
 * @ja 一括再構築後にストレージの項目をキー順に並べます。
 * @ko 일괄 재구성 후 저장소 항목을 키순으로 정렬합니다.
 *
 * @remarks
 * Advanced: for quicker full rebuild of a storage (instead of an incremental
 * one), you may add all your contents and then sort once.
 * @zh
 * 高级：为更快地完整重建存储（而非增量重建），可先添加全部内容，再一次性排序。
 * @ja
 * 高度な機能：ストレージ全体を高速に再構築する場合（増分ではなく）、すべての内容を追加してから一度だけソートできます。
 * @ko
 * 고급: 저장소를 더 빠르게 전체 재구축하려면(증분 방식 대신) 모든 내용을 추가한 뒤 한 번만 정렬할 수 있습니다.
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 */
export function Storage_BuildSortByKey(self: ImGuiStorage): void {
  native.Storage_BuildSortByKey(self);
}

/**
 * Set all stored integer values.
 *
 * @zh 设置全部已存储的整数值。
 * @ja 保存されているすべての整数値を設定します。
 * @ko 저장된 모든 정수 값을 설정합니다.
 *
 * @remarks
 * Obsolete: use on your own storage if you know only integer are being stored
 * (open/close all tree nodes)
 * @zh
 * 已废弃：确认只存储整数时，可在自己的存储上使用（展开/折叠所有树节点）。
 * @ja
 * 廃止済み：整数のみを格納していると分かっている場合に独自のストレージで使います（すべてのツリーノードを開く/閉じる）。
 * @ko
 * 폐기됨: 정수만 저장되어 있음을 아는 경우 자체 저장소에서 사용합니다(모든 트리 노드 열기/닫기).
 *
 * @param self - ImGuiStorage handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStorage 핸들입니다.
 *
 * @param val - Value stored in all integer entries.
 * @zh val - 存储到所有整数条目的值。
 * @ja val - 全整数エントリーに保存する値です。
 * @ko val - 모든 정수 항목에 저장할 값입니다.
 */
export function Storage_SetAllInt(self: ImGuiStorage, val: number): void {
  native.Storage_SetAllInt(self, val);
}
