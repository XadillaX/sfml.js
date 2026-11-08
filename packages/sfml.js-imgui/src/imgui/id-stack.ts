import { native } from '../internal/native';

/**
 * Push a string identifier onto the ID stack.
 *
 * @zh 将字符串标识符压入 ID 栈。
 * @ja 文字列の識別子を ID スタックに積みます。
 * @ko 문자열 식별자를 ID 스택에 넣습니다.
 *
 * @remarks
 * Read the FAQ (docs/FAQ.md or http://dearimgui.com/faq) for more details about
 * how ID are handled in dear imgui.
 *
 * - Those questions are answered and impacted by understanding of the ID stack
 *   system:
 *
 * - "Q: Why is my widget not reacting when I click on it?"
 * - "Q: How can I have widgets with an empty label?"
 * - "Q: How can I have multiple widgets with the same label?"
 * - Short version: ID are hashes of the entire ID stack. If you are creating
 *   widgets in a loop you most likely want to push a unique identifier (e.g.
 *   object pointer, loop index) to uniquely differentiate them.
 *
 * - You can also use the "Label##foobar" syntax within widget label to
 *   distinguish them from each others.
 *
 * - In this header file we use the "label"/"name" terminology to denote a
 *   string that will be displayed + used as an ID, whereas "str_id" denote a
 *   string that is only used as an ID and not normally displayed.
 *
 * push string into the ID stack (will hash string).
 * @zh
 * ID 栈与作用域：关于 Dear ImGui 如何处理 ID 的更多细节，请阅读 FAQ（docs/FAQ.md 或
 * http://dearimgui.com/faq）。
 *
 * - 理解 ID 栈系统有助于回答以下问题：
 *
 * - “为什么点击控件时没有反应？”- “如何创建标签为空的控件？”- “如何创建多个标签相同的控件？”- 简而言之，ID 是整个 ID
 *   栈的哈希值。如果在循环中创建控件，通常需要压入唯一标识符（如对象指针、循环索引），以便唯一地区分它们。
 *
 * - 也可在控件标签中使用 "Label##foobar" 语法进行区分。
 *
 * - 在此头文件中，"label"/"name" 指既会显示又用作 ID 的字符串；"str_id" 则指仅用作 ID、通常不显示的字符串。将字符串压入
 *   ID 栈（会对字符串进行哈希）。
 * @ja
 * ID スタックとスコープ：Dear ImGui の ID 処理の詳細は FAQ（docs/FAQ.md または
 * http://dearimgui.com/faq）を参照してください。
 *
 * - ID スタックの仕組みを理解すると、次の疑問への答えが分かります：
 *
 * - 「クリックしてもウィジェットが反応しないのはなぜ？」- 「ラベルが空のウィジェットを作るには？」- 「同じラベルのウィジェットを複数作るには？」-
 *   要点：ID は ID
 *   スタック全体のハッシュです。ループでウィジェットを作る場合、一意に区別するために一意な識別子（オブジェクトのポインター、ループの添字など）を積む必要が
 *   あることが多いです。
 *
 * - ラベル内の "Label##foobar" 構文でも区別できます。
 *
 * - このヘッダーでは "label"/"name" は表示と ID の両方に使う文字列、"str_id" は ID
 *   にのみ使い通常は表示しない文字列を表します。文字列を ID スタックに積みます（文字列をハッシュ化します）。
 * @ko
 * ID 스택과 범위: Dear ImGui의 ID 처리에 관한 자세한 내용은 FAQ(docs/FAQ.md 또는
 * http://dearimgui.com/faq)를 읽으세요.
 *
 * - ID 스택 시스템을 이해하면 다음 질문을 해결할 수 있습니다:
 *
 * - '클릭해도 위젯이 반응하지 않는 이유는 무엇인가요?'
 *
 * - '레이블이 빈 위젯은 어떻게 만드나요?'
 *
 * - '같은 레이블을 가진 위젯을 여러 개 만들려면 어떻게 하나요?' - 요약하면 ID는 전체 ID 스택의 해시입니다. 루프에서 위젯을 만들
 *   때는 고유하게 구별하기 위해 고유 식별자(예: 객체 포인터, 루프 인덱스)를 스택에 넣어야 하는 경우가 많습니다.
 *
 * - 위젯 레이블에 "Label##foobar" 구문을 사용해 구별할 수도 있습니다.
 *
 * - 이 헤더에서 "label"/"name"은 표시되면서 ID로도 쓰이는 문자열이고, "str_id"는 ID로만 쓰이며 일반적으로 표시하지
 *   않는 문자열입니다. 문자열을 ID 스택에 넣습니다(문자열을 해시합니다).
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 */
export function PushID(str_id: string | Uint8Array): void {
  native.PushID(str_id);
}

/**
 * Push string into the ID stack (will hash string).
 *
 * @zh 将字符串压入 ID 栈（会对字符串进行哈希）。
 * @ja 文字列を ID スタックに積みます（文字列をハッシュ化します）。
 * @ko 문자열을 ID 스택에 넣습니다(문자열을 해시합니다).
 *
 * @param str_id_begin - UTF-8 text. With omitted/null str_id_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str_id_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str_id_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL
 * 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str_id_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료
 * 뷰는 직접 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_id_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_id_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_id_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_id_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 */
export function PushIDStr(
  str_id_begin: string | Uint8Array,
  str_id_end?: null,
): void;

/**
 * Push string into the ID stack (will hash string).
 *
 * @zh 将字符串压入 ID 栈（会对字符串进行哈希）。
 * @ja 文字列を ID スタックに積みます（文字列をハッシュ化します）。
 * @ko 문자열을 ID 스택에 넣습니다(문자열을 해시합니다).
 *
 * @param str_id_begin - UTF-8 text. With omitted/null str_id_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str_id_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str_id_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL
 * 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str_id_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료
 * 뷰는 직접 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_id_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_id_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_id_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_id_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 */
export function PushIDStr(
  str_id_begin: Uint8Array,
  str_id_end: Uint8Array,
): void;
/**
 * Push string into the ID stack (will hash string).
 *
 * @zh 将字符串压入 ID 栈（会对字符串进行哈希）。
 * @ja 文字列を ID スタックに積みます（文字列をハッシュ化します）。
 * @ko 문자열을 ID 스택에 넣습니다(문자열을 해시합니다).
 *
 * @param str_id_begin - UTF-8 text. With omitted/null str_id_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str_id_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str_id_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL
 * 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str_id_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료
 * 뷰는 직접 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_id_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_id_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_id_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_id_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 */
export function PushIDStr(
  str_id_begin: string | Uint8Array,
  str_id_end: Uint8Array | null = null,
): void {
  native.PushIDStr(str_id_begin, str_id_end);
}

/**
 * Push pointer into the ID stack (will hash pointer).
 *
 * @zh 将指针压入 ID 栈（会对指针进行哈希）。
 * @ja ポインターを ID スタックに積みます（ポインターをハッシュ化します）。
 * @ko 포인터를 ID 스택에 넣습니다(포인터를 해시합니다).
 *
 * @param ptr_id - Pointer address used only as an ID seed, not dereferenced.
 * @zh ptr_id - 仅作为 ID 种子的指针地址，不会解引用。
 * @ja ptr_id - ID の種としてのみ使うポインターアドレスです。参照先は読みません。
 * @ko ptr_id - ID 시드로만 사용하는 포인터 주소이며 역참조하지 않습니다.
 */
export function PushIDPtr(ptr_id: bigint | null): void {
  native.PushIDPtr(ptr_id);
}

/**
 * Push integer into the ID stack (will hash integer).
 *
 * @zh 将整数压入 ID 栈（会对整数进行哈希）。
 * @ja 整数を ID スタックに積みます（整数をハッシュ化します）。
 * @ko 정수를 ID 스택에 넣습니다(정수를 해시합니다).
 *
 * @param int_id - Integer identifier for the item, storage entry, or column,
 * rather than a display index.
 * @zh int_id - 用于项、存储条目或列的整数标识符，不是显示索引。
 * @ja int_id - 項目、保存エントリー、列を識別する整数です。表示インデックスではありません。
 * @ko int_id - 항목, 저장 항목 또는 열의 정수 식별자이며 표시 인덱스가 아닙니다.
 */
export function PushIDInt(int_id: number): void {
  native.PushIDInt(int_id);
}

/**
 * Pop from the ID stack.
 *
 * @zh 从 ID 栈弹出一项。
 * @ja ID スタックから取り出します。
 * @ko ID 스택에서 항목을 꺼냅니다.
 */
export function PopID(): void {
  native.PopID();
}

/**
 * Calculate an identifier from the ID stack and the supplied value.
 *
 * @zh 根据 ID 栈和传入值计算标识符。
 * @ja ID スタックと指定した値から識別子を計算します。
 * @ko ID 스택과 전달한 값으로 식별자를 계산합니다.
 *
 * @remarks
 * calculate unique ID (hash of whole ID stack + given parameter).
 *
 * e.g. if you want to query into ImGuiStorage yourself
 * @zh
 * 计算唯一 ID（整个 ID 栈加上给定参数的哈希），例如用于自行查询 ImGuiStorage。
 * @ja
 * 一意な ID（ID スタック全体と指定パラメーターのハッシュ）を計算します。
 *
 * 例えば ImGuiStorage を自分で照会したい場合に使います。
 * @ko
 * 고유 ID(전체 ID 스택과 주어진 매개변수의 해시)를 계산합니다.
 *
 * 예를 들어 ImGuiStorage를 직접 조회할 때 사용합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @returns ImGuiID hash of the supplied identifier combined with the current ID
 * stack.
 * @zh 所提供标识符与当前 ID 栈组合后的 ImGuiID 散列。
 * @ja 渡した識別子と現在の ID スタックを組み合わせた ImGuiID ハッシュです。
 * @ko 전달된 식별자와 현재 ID 스택을 결합한 ImGuiID 해시입니다.
 */
export function GetID(str_id: string | Uint8Array): number {
  return native.GetID(str_id);
}

/**
 * Hash a string range together with the current ID stack to form a widget
 * identifier.
 *
 * @zh 将字符串区间与当前 ID 栈一起哈希，生成控件标识符。
 * @ja 文字列範囲と現在の ID スタックをハッシュし、ウィジェット識別子を生成します。
 * @ko 문자열 범위와 현재 ID 스택을 함께 해시하여 위젯 식별자를 만듭니다.
 *
 * @param str_id_begin - UTF-8 text. With omitted/null str_id_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str_id_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str_id_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL
 * 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str_id_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료
 * 뷰는 직접 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_id_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_id_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_id_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_id_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 *
 * @returns ImGuiID hash of the supplied identifier combined with the current ID
 * stack.
 * @zh 所提供标识符与当前 ID 栈组合后的 ImGuiID 散列。
 * @ja 渡した識別子と現在の ID スタックを組み合わせた ImGuiID ハッシュです。
 * @ko 전달된 식별자와 현재 ID 스택을 결합한 ImGuiID 해시입니다.
 */
export function GetIDStr(
  str_id_begin: string | Uint8Array,
  str_id_end?: null,
): number;

/**
 * Hash a string range together with the current ID stack to form a widget
 * identifier.
 *
 * @zh 将字符串区间与当前 ID 栈一起哈希，生成控件标识符。
 * @ja 文字列範囲と現在の ID スタックをハッシュし、ウィジェット識別子を生成します。
 * @ko 문자열 범위와 현재 ID 스택을 함께 해시하여 위젯 식별자를 만듭니다.
 *
 * @param str_id_begin - UTF-8 text. With omitted/null str_id_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str_id_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str_id_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL
 * 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str_id_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료
 * 뷰는 직접 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_id_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_id_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_id_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_id_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 *
 * @returns ImGuiID hash of the supplied identifier combined with the current ID
 * stack.
 * @zh 所提供标识符与当前 ID 栈组合后的 ImGuiID 散列。
 * @ja 渡した識別子と現在の ID スタックを組み合わせた ImGuiID ハッシュです。
 * @ko 전달된 식별자와 현재 ID 스택을 결합한 ImGuiID 해시입니다.
 */
export function GetIDStr(
  str_id_begin: Uint8Array,
  str_id_end: Uint8Array,
): number;
/**
 * Hash a string range together with the current ID stack to form a widget
 * identifier.
 *
 * @zh 将字符串区间与当前 ID 栈一起哈希，生成控件标识符。
 * @ja 文字列範囲と現在の ID スタックをハッシュし、ウィジェット識別子を生成します。
 * @ko 문자열 범위와 현재 ID 스택을 함께 해시하여 위젯 식별자를 만듭니다.
 *
 * @param str_id_begin - UTF-8 text. With omitted/null str_id_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str_id_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str_id_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL
 * 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str_id_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료
 * 뷰는 직접 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_id_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_id_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_id_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_id_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 *
 * @returns ImGuiID hash of the supplied identifier combined with the current ID
 * stack.
 * @zh 所提供标识符与当前 ID 栈组合后的 ImGuiID 散列。
 * @ja 渡した識別子と現在の ID スタックを組み合わせた ImGuiID ハッシュです。
 * @ko 전달된 식별자와 현재 ID 스택을 결합한 ImGuiID 해시입니다.
 */
export function GetIDStr(
  str_id_begin: string | Uint8Array,
  str_id_end: Uint8Array | null = null,
): number {
  return native.GetIDStr(str_id_begin, str_id_end);
}

/**
 * Hash a pointer value together with the current ID stack to form a widget
 * identifier.
 *
 * @zh 将指针值与当前 ID 栈一起哈希，生成控件标识符。
 * @ja ポインター値と現在の ID スタックをハッシュし、ウィジェット識別子を生成します。
 * @ko 포인터 값과 현재 ID 스택을 함께 해시하여 위젯 식별자를 만듭니다.
 *
 * @param ptr_id - Pointer address used only as an ID seed, not dereferenced.
 * @zh ptr_id - 仅作为 ID 种子的指针地址，不会解引用。
 * @ja ptr_id - ID の種としてのみ使うポインターアドレスです。参照先は読みません。
 * @ko ptr_id - ID 시드로만 사용하는 포인터 주소이며 역참조하지 않습니다.
 *
 * @returns ImGuiID hash of the supplied identifier combined with the current ID
 * stack.
 * @zh 所提供标识符与当前 ID 栈组合后的 ImGuiID 散列。
 * @ja 渡した識別子と現在の ID スタックを組み合わせた ImGuiID ハッシュです。
 * @ko 전달된 식별자와 현재 ID 스택을 결합한 ImGuiID 해시입니다.
 */
export function GetIDPtr(ptr_id: bigint | null): number {
  return native.GetIDPtr(ptr_id);
}

/**
 * Hash an integer together with the current ID stack to form a widget
 * identifier.
 *
 * @zh 将整数与当前 ID 栈一起哈希，生成控件标识符。
 * @ja 整数と現在の ID スタックをハッシュし、ウィジェット識別子を生成します。
 * @ko 정수와 현재 ID 스택을 함께 해시하여 위젯 식별자를 만듭니다.
 *
 * @param int_id - Integer identifier for the item, storage entry, or column,
 * rather than a display index.
 * @zh int_id - 用于项、存储条目或列的整数标识符，不是显示索引。
 * @ja int_id - 項目、保存エントリー、列を識別する整数です。表示インデックスではありません。
 * @ko int_id - 항목, 저장 항목 또는 열의 정수 식별자이며 표시 인덱스가 아닙니다.
 *
 * @returns ImGuiID hash of the supplied identifier combined with the current ID
 * stack.
 * @zh 所提供标识符与当前 ID 栈组合后的 ImGuiID 散列。
 * @ja 渡した識別子と現在の ID スタックを組み合わせた ImGuiID ハッシュです。
 * @ko 전달된 식별자와 현재 ID 스택을 결합한 ImGuiID 해시입니다.
 */
export function GetIDInt(int_id: number): number {
  return native.GetIDInt(int_id);
}
