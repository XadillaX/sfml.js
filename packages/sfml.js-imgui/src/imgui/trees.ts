import { native } from '../internal/native';

/**
 * Display a tree node and begin its contents when open.
 *
 * @zh 显示树节点，并在展开时开始其内容区域。
 * @ja ツリーノードを表示し、開いていれば内容の領域を開始します。
 * @ko 트리 노드를 표시하고 펼쳐져 있으면 콘텐츠 영역을 시작합니다.
 *
 * @remarks
 * - TreeNode functions return true when the node is open, in which case you
 *   need to also call TreePop() when you are finished displaying the tree node
 *   contents.
 * @zh
 * 控件：树。
 *
 * - TreeNode 函数在节点打开时返回 true，此时显示完该节点的内容后，还必须调用 TreePop()。
 * @ja
 * ウィジェット：ツリー。
 *
 * - TreeNode 関数はノードが開いていると true を返します。その場合はノード内容の表示が終わったら TreePop() も呼ぶ必要があります。
 * @ko
 * 위젯: 트리.
 *
 * - TreeNode 함수는 노드가 열려 있으면 true를 반환합니다. 이 경우 노드 내용 표시를 마친 뒤 TreePop()도 호출해야
 *   합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @returns True if the node is open and children should be submitted. Call
 * TreePop() after submitting those children.
 * @zh 节点打开且应提交子项时为 true；提交子项后须调用 TreePop()。
 * @ja ノードが開き子を描く場合は true です。子を描いた後に TreePop() を呼びます。
 * @ko 노드가 열려 자식을 제출해야 하면 true입니다. 자식을 제출한 뒤 TreePop()을 호출합니다.
 */
export function TreeNode(label: string | Uint8Array): boolean {
  return native.TreeNode(label);
}

/**
 * Display a tree node with a separate identifier and label.
 *
 * @zh 显示标识符与标签分离的树节点。
 * @ja 識別子とラベルを別々に指定するツリーノードを表示します。
 * @ko 식별자와 레이블을 따로 지정한 트리 노드를 표시합니다.
 *
 * @remarks
 * helper variation to easily decorelate the id from the displayed string.
 *
 * Read the FAQ about why and how to use ID.
 *
 * to align arbitrary text at the same level as a TreeNode() you can use
 * Bullet().
 * @zh
 * 便于将 ID 与显示字符串分离的辅助变体。
 *
 * 关于使用 ID 的原因和方法，请阅读 FAQ。
 *
 * 要将任意文本与 TreeNode() 对齐到相同层级，可使用 Bullet()。
 * @ja
 * ID と表示文字列を簡単に分離できるヘルパー版です。
 *
 * ID を使う理由と方法は FAQ を参照してください。
 *
 * 任意のテキストを TreeNode() と同じレベルに揃えるには Bullet() を使えます。
 * @ko
 * ID와 표시 문자열을 쉽게 분리하는 헬퍼 변형입니다.
 *
 * ID를 사용하는 이유와 방법은 FAQ를 읽으세요.
 *
 * 임의의 텍스트를 TreeNode()와 같은 수준에 정렬하려면 Bullet()을 사용할 수 있습니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 *
 * @returns True if the node is open and children should be submitted. Call
 * TreePop() after submitting those children.
 * @zh 节点打开且应提交子项时为 true；提交子项后须调用 TreePop()。
 * @ja ノードが開き子を描く場合は true です。子を描いた後に TreePop() を呼びます。
 * @ko 노드가 열려 자식을 제출해야 하면 true입니다. 자식을 제출한 뒤 TreePop()을 호출합니다.
 */
export function TreeNodeStrUnformatted(
  str_id: string | Uint8Array,
  text: string | Uint8Array,
): boolean {
  return native.TreeNodeStrUnformatted(str_id, text);
}

/**
 * Display an expandable tree node with a pointer-based ID and unformatted
 * label.
 *
 * @zh 显示可展开树节点，使用基于指针的 ID 和未经格式化的标签。
 * @ja ポインター由来の ID と書式処理しないラベルで展開式ツリーノードを表示します。
 * @ko 포인터 기반 ID와 서식 처리하지 않은 레이블로 펼침형 트리 노드를 표시합니다.
 *
 * @remarks
 * The pointer value supplies an identity independently of the displayed label.
 *
 * `TreeNodePtr()` opens a tree scope only when the node is open;
 * `TreePushPtr()` explicitly pushes the scope. Close each scope that was opened
 * with `TreePop()`.
 * @zh
 * 指针值提供独立于显示标签的标识。
 *
 * `TreeNodePtr()` 仅在节点展开时开始树作用域，`TreePushPtr()` 则显式压入作用域。对每个已开始的作用域调用
 * `TreePop()` 结束。
 * @ja
 * ポインター値は表示ラベルとは独立した識別子になります。
 *
 * `TreeNodePtr()` はノードが開いている場合だけツリースコープを開始し、`TreePushPtr()`
 * は明示的にスコープを積みます。開始した各スコープは `TreePop()` で閉じてください。
 * @ko
 * 포인터 값은 표시 레이블과 독립된 식별자로 사용됩니다.
 *
 * `TreeNodePtr()`는 노드가 열려 있을 때만 트리 범위를 시작하며 `TreePushPtr()`는 명시적으로 범위를 스택에
 * 넣습니다. 열린 각 범위를 `TreePop()`으로 닫습니다.
 *
 * @param ptr_id - Pointer address used only as an ID seed, not dereferenced.
 * @zh ptr_id - 仅作为 ID 种子的指针地址，不会解引用。
 * @ja ptr_id - ID の種としてのみ使うポインターアドレスです。参照先は読みません。
 * @ko ptr_id - ID 시드로만 사용하는 포인터 주소이며 역참조하지 않습니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 *
 * @returns True if the node is open and children should be submitted. Call
 * TreePop() after submitting those children.
 * @zh 节点打开且应提交子项时为 true；提交子项后须调用 TreePop()。
 * @ja ノードが開き子を描く場合は true です。子を描いた後に TreePop() を呼びます。
 * @ko 노드가 열려 자식을 제출해야 하면 true입니다. 자식을 제출한 뒤 TreePop()을 호출합니다.
 */
export function TreeNodePtrUnformatted(
  ptr_id: bigint | null,
  text: string | Uint8Array,
): boolean {
  return native.TreeNodePtrUnformatted(ptr_id, text);
}

/**
 * Display a configurable expandable tree node identified by its label.
 *
 * @zh 显示由标签标识、行为可配置的可展开树节点。
 * @ja ラベルで識別される、動作を設定可能な展開式ツリーノードを表示します。
 * @ko 레이블로 식별되며 동작을 설정할 수 있는 펼침형 트리 노드를 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param flags - ImGuiTreeNodeFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTreeNodeFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTreeNodeFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTreeNodeFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the node is open and children should be submitted. Follow an
 * open node with TreePop(), unless ImGuiTreeNodeFlags.NoTreePushOnOpen is set.
 * @zh 节点打开且应提交子项时为 true；打开节点后须配对 TreePop()，除非设置
 * ImGuiTreeNodeFlags.NoTreePushOnOpen。
 * @ja ノードが開き子を描く場合は true です。ImGuiTreeNodeFlags.NoTreePushOnOpen がなければ、開いたノードを
 * TreePop() で閉じます。
 * @ko 노드가 열려 자식을 제출해야 하면 true입니다. ImGuiTreeNodeFlags.NoTreePushOnOpen이 없으면 열린
 * 노드 뒤에 TreePop()을 호출합니다.
 */
export function TreeNodeEx(
  label: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.TreeNodeEx(label, flags);
}

/**
 * Display an expandable tree node with a separate string ID and unformatted
 * label.
 *
 * @zh 显示可展开树节点，使用独立的字符串 ID 和未经格式化的标签。
 * @ja 独立した文字列 ID と書式処理しないラベルで展開式ツリーノードを表示します。
 * @ko 별도의 문자열 ID와 서식 처리하지 않은 레이블로 펼침형 트리 노드를 표시합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param flags - ImGuiTreeNodeFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTreeNodeFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTreeNodeFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTreeNodeFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 *
 * @returns True if the node is open and children should be submitted. Follow an
 * open node with TreePop(), unless ImGuiTreeNodeFlags.NoTreePushOnOpen is set.
 * @zh 节点打开且应提交子项时为 true；打开节点后须配对 TreePop()，除非设置
 * ImGuiTreeNodeFlags.NoTreePushOnOpen。
 * @ja ノードが開き子を描く場合は true です。ImGuiTreeNodeFlags.NoTreePushOnOpen がなければ、開いたノードを
 * TreePop() で閉じます。
 * @ko 노드가 열려 자식을 제출해야 하면 true입니다. ImGuiTreeNodeFlags.NoTreePushOnOpen이 없으면 열린
 * 노드 뒤에 TreePop()을 호출합니다.
 */
export function TreeNodeExStrUnformatted(
  str_id: string | Uint8Array,
  flags: number,
  text: string | Uint8Array,
): boolean {
  return native.TreeNodeExStrUnformatted(str_id, flags, text);
}

/**
 * Display an expandable tree node with a pointer-based ID and unformatted
 * label.
 *
 * @zh 显示可展开树节点，使用基于指针的 ID 和未经格式化的标签。
 * @ja ポインター由来の ID と書式処理しないラベルで展開式ツリーノードを表示します。
 * @ko 포인터 기반 ID와 서식 처리하지 않은 레이블로 펼침형 트리 노드를 표시합니다.
 *
 * @param ptr_id - Pointer address used only as an ID seed, not dereferenced.
 * @zh ptr_id - 仅作为 ID 种子的指针地址，不会解引用。
 * @ja ptr_id - ID の種としてのみ使うポインターアドレスです。参照先は読みません。
 * @ko ptr_id - ID 시드로만 사용하는 포인터 주소이며 역참조하지 않습니다.
 *
 * @param flags - ImGuiTreeNodeFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTreeNodeFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTreeNodeFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTreeNodeFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 *
 * @returns True if the node is open and children should be submitted. Follow an
 * open node with TreePop(), unless ImGuiTreeNodeFlags.NoTreePushOnOpen is set.
 * @zh 节点打开且应提交子项时为 true；打开节点后须配对 TreePop()，除非设置
 * ImGuiTreeNodeFlags.NoTreePushOnOpen。
 * @ja ノードが開き子を描く場合は true です。ImGuiTreeNodeFlags.NoTreePushOnOpen がなければ、開いたノードを
 * TreePop() で閉じます。
 * @ko 노드가 열려 자식을 제출해야 하면 true입니다. ImGuiTreeNodeFlags.NoTreePushOnOpen이 없으면 열린
 * 노드 뒤에 TreePop()을 호출합니다.
 */
export function TreeNodeExPtrUnformatted(
  ptr_id: bigint | null,
  flags: number,
  text: string | Uint8Array,
): boolean {
  return native.TreeNodeExPtrUnformatted(ptr_id, flags, text);
}

/**
 * Indent content and push an identifier for a tree scope.
 *
 * @zh 缩进内容并为树作用域压入标识符。
 * @ja ツリーのスコープ用にインデントし、識別子を積みます。
 * @ko 트리 범위를 위해 들여쓰고 식별자를 스택에 넣습니다.
 *
 * @remarks
 * ~ Indent()+PushID().
 *
 * Already called by TreeNode() when returning true, but you can call
 * TreePush/TreePop yourself if desired.
 * @zh
 * 约等于 Indent()+PushID()。
 *
 * TreeNode() 返回 true 时已调用此操作，也可按需自行调用 TreePush/TreePop。
 * @ja
 * ほぼ Indent()+PushID() です。
 *
 * TreeNode() が true を返すときはすでに呼ばれていますが、必要なら TreePush/TreePop を自分で呼べます。
 * @ko
 * 대략 Indent()+PushID()입니다.
 *
 * TreeNode()가 true를 반환할 때 이미 호출되지만 필요하면 TreePush/TreePop을 직접 호출할 수 있습니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 */
export function TreePush(str_id: string | Uint8Array): void {
  native.TreePush(str_id);
}

/**
 * Indent and push a pointer-based tree ID scope, to be closed by TreePop.
 *
 * @zh 缩进并压入基于指针的树 ID 作用域，由 TreePop 结束。
 * @ja インデントし、TreePop で閉じるポインター由来のツリー ID スコープをプッシュします。
 * @ko 들여쓰기를 적용하고 TreePop으로 닫을 포인터 기반 트리 ID 범위를 푸시합니다.
 *
 * @remarks
 * The pointer value supplies an identity independently of the displayed label.
 *
 * `TreeNodePtr()` opens a tree scope only when the node is open;
 * `TreePushPtr()` explicitly pushes the scope. Close each scope that was opened
 * with `TreePop()`.
 * @zh
 * 指针值提供独立于显示标签的标识。
 *
 * `TreeNodePtr()` 仅在节点展开时开始树作用域，`TreePushPtr()` 则显式压入作用域。对每个已开始的作用域调用
 * `TreePop()` 结束。
 * @ja
 * ポインター値は表示ラベルとは独立した識別子になります。
 *
 * `TreeNodePtr()` はノードが開いている場合だけツリースコープを開始し、`TreePushPtr()`
 * は明示的にスコープを積みます。開始した各スコープは `TreePop()` で閉じてください。
 * @ko
 * 포인터 값은 표시 레이블과 독립된 식별자로 사용됩니다.
 *
 * `TreeNodePtr()`는 노드가 열려 있을 때만 트리 범위를 시작하며 `TreePushPtr()`는 명시적으로 범위를 스택에
 * 넣습니다. 열린 각 범위를 `TreePop()`으로 닫습니다.
 *
 * @param ptr_id - Pointer address used only as an ID seed, not dereferenced.
 * @zh ptr_id - 仅作为 ID 种子的指针地址，不会解引用。
 * @ja ptr_id - ID の種としてのみ使うポインターアドレスです。参照先は読みません。
 * @ko ptr_id - ID 시드로만 사용하는 포인터 주소이며 역참조하지 않습니다.
 */
export function TreePushPtr(ptr_id: bigint | null): void {
  native.TreePushPtr(ptr_id);
}

/**
 * End a tree scope and restore indentation and the ID stack.
 *
 * @zh 结束树作用域并恢复缩进和 ID 栈。
 * @ja ツリーのスコープを終了し、インデントと ID スタックを戻します。
 * @ko 트리 범위를 종료하고 들여쓰기와 ID 스택을 복원합니다.
 *
 * @remarks
 * ~ Unindent()+PopID()
 * @zh
 * 约等于 Unindent()+PopID()。
 * @ja
 * ほぼ Unindent()+PopID() です。
 * @ko
 * 대략 Unindent()+PopID()입니다.
 */
export function TreePop(): void {
  native.TreePop();
}

/**
 * Get the horizontal spacing from a tree node to its label.
 *
 * @zh 获取树节点与标签之间的水平间距。
 * @ja ツリーノードからラベルまでの水平間隔を取得します。
 * @ko 트리 노드에서 레이블까지의 가로 간격을 가져옵니다.
 *
 * @remarks
 * Horizontal distance before the label when using tree nodes or Bullet().
 * For a regular unframed tree node, this is
 * `GetFontSize() + style.FramePaddingX * 2`,
 * where style is the mapped view from ImGui.viewImGuiStyle(styleHandle).
 * @zh
 * 使用树节点或 Bullet() 时标签前的水平距离。对于普通无框树节点，等于 GetFontSize() + style.FramePaddingX *
 * 2。
 * style 是 ImGui.viewImGuiStyle(styleHandle) 返回的映射视图。
 * @ja
 * ツリーノードや Bullet() 使用時のラベル前の水平距離です。
 * 通常の枠なしノードでは GetFontSize() + style.FramePaddingX * 2 です。
 * style は ImGui.viewImGuiStyle(styleHandle) が返すマッピング済みのビューです。
 * @ko
 * 트리 노드나 Bullet()을 사용할 때 레이블 앞의 수평 거리입니다.
 * 일반적인 프레임 없는 노드에서는 GetFontSize() + style.FramePaddingX * 2와 같습니다.
 * style은 ImGui.viewImGuiStyle(styleHandle)이 반환하는 매핑된 뷰입니다.
 *
 * @returns Horizontal pixel distance from a tree node start to its label,
 * including the arrow area and spacing.
 * @zh 从树节点起点到标签的水平像素距离，包含箭头区域和间距。
 * @ja 矢印と間隔を含むツリーノード先頭からラベルまでの水平ピクセル距離です。
 * @ko 화살표 영역과 간격을 포함한 트리 노드 시작점에서 레이블까지의 가로 픽셀 거리입니다.
 */
export function GetTreeNodeToLabelSpacing(): number {
  return native.GetTreeNodeToLabelSpacing();
}

/**
 * Display a collapsing header and report whether it is open.
 *
 * @zh 显示折叠标题并报告是否展开。
 * @ja 折りたたみ見出しを表示し、開いているかを返します。
 * @ko 접이식 헤더를 표시하고 펼쳐져 있는지 반환합니다.
 *
 * @remarks
 * if returning 'true' the header is open.
 *
 * doesn't indent nor push on ID stack.
 *
 * user doesn't have to call TreePop().
 * @zh
 * 返回 true 表示标题已展开。
 *
 * 不进行缩进，也不压入 ID 栈。
 *
 * 用户不必调用 TreePop()。
 * @ja
 * true を返す場合、ヘッダーは開いています。
 *
 * インデントも ID スタックへの追加も行いません。
 *
 * TreePop() を呼ぶ必要はありません。
 * @ko
 * true를 반환하면 헤더가 열린 상태입니다.
 *
 * 들여쓰기나 ID 스택 추가를 하지 않으므로 TreePop()을 호출할 필요가 없습니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param flags - ImGuiTreeNodeFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTreeNodeFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTreeNodeFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTreeNodeFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the header is open and its contents should be submitted.
 * Unlike TreeNode(), this never requires TreePop().
 * @zh 标题展开且应提交内容时为 true；与 TreeNode() 不同，不需要 TreePop()。
 * @ja ヘッダーが開いて内容を描く場合は true です。TreeNode() と異なり TreePop() は不要です。
 * @ko 헤더가 열려 내용을 제출해야 하면 true입니다. TreeNode()와 달리 TreePop()은 필요 없습니다.
 */
export function CollapsingHeader(
  label: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.CollapsingHeader(label, flags);
}

/**
 * Display a closable collapsing header.
 *
 * @zh 显示可关闭的折叠标题。
 * @ja 閉じるボタン付きの折りたたみ見出しを表示します。
 * @ko 닫을 수 있는 접이식 헤더를 표시합니다.
 *
 * @remarks
 * Returns whether the header is open without indenting or pushing an ID; do not
 * call `TreePop()` for it.
 *
 * When `p_visible` is a `Uint8Array`, its first element controls visibility. A
 * value of 1 displays the header and a close button; clicking the close
 * button writes `0` to `p_visible[0]`. A zero value hides the header.
 * @zh
 * 返回标题是否展开，不产生缩进也不压入 ID；无需为其调用 `TreePop()`。
 *
 * 当 `p_visible` 为 `Uint8Array` 时，首个元素控制可见性。1 显示标题和关闭按钮；点击关闭按钮会将 `p_visible[0]`
 * 写为 `0`。零值隐藏标题。
 * @ja
 * インデントや ID の追加をせず、見出しが開いているかを返します。`TreePop()` は呼びません。
 *
 * `p_visible` が `Uint8Array` の場合、先頭要素が表示を制御します。1 なら見出しと閉じるボタンを表示し、閉じるボタンを押すと
 * `p_visible[0]` に `0` を書き込みます。ゼロなら見出しを非表示にします。
 * @ko
 * 들여쓰거나 ID를 스택에 넣지 않고 헤더가 펼쳐져 있는지 반환합니다. `TreePop()`을 호출하지 않습니다.
 *
 * `p_visible`이 `Uint8Array`이면 첫 요소가 표시 여부를 제어합니다. 1이면 헤더와 닫기 버튼을 표시하며 닫기 버튼을
 * 누르면 `p_visible[0]`에 `0`을 기록합니다. 0이면 헤더를 숨깁니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param p_visible - Header visibility in Uint8Array[0]; write only 0 or 1. Its
 * close button
 * writes 0. Null omits the close button. Pass Uint8Array storage, not a JS
 * scalar; native access uses the supplied backing memory.
 * @zh p_visible - Uint8Array[0] 中的标题可见状态；只能写入 0 或 1。关闭按钮写入 0，null 不显示关闭按钮。 请传入
 * Uint8Array
 * 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja p_visible - ヘッダーの表示状態を Uint8Array[0] で渡し、0 または 1 のみを書き込みます。閉じるボタンは 0
 * を書き込み、null
 * ではボタンを省略します。 JS スカラーではなく Uint8Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko p_visible - Uint8Array[0]의 헤더 표시 상태이며 0 또는 1만 쓰세요. 닫기 버튼은 0을 쓰며 null이면
 * 버튼을 생략합니다. JS
 * 스칼라가 아닌 Uint8Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param flags - ImGuiTreeNodeFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTreeNodeFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTreeNodeFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTreeNodeFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the header is open and its contents should be submitted.
 * Unlike TreeNode(), this never requires TreePop().
 * @zh 标题展开且应提交内容时为 true；与 TreeNode() 不同，不需要 TreePop()。
 * @ja ヘッダーが開いて内容を描く場合は true です。TreeNode() と異なり TreePop() は不要です。
 * @ko 헤더가 열려 내용을 제출해야 하면 true입니다. TreeNode()와 달리 TreePop()은 필요 없습니다.
 */
export function CollapsingHeaderBoolPtr(
  label: string | Uint8Array,
  p_visible: Uint8Array,
  flags: number = 0,
): boolean {
  return native.CollapsingHeaderBoolPtr(label, p_visible, flags);
}

/**
 * Set next TreeNode/CollapsingHeader open state.
 *
 * @zh 设置下一个 TreeNode/CollapsingHeader 的展开状态。
 * @ja 次の TreeNode/CollapsingHeader の開閉状態を設定します。
 * @ko 다음 TreeNode/CollapsingHeader의 열림 상태를 설정합니다.
 *
 * @param is_open - Whether the next tree node or collapsing header should start
 * open.
 * @zh is_open - 下一个树节点或折叠标题是否应打开。
 * @ja is_open - 次のツリーノードや折りたたみヘッダーを開くかどうかです。
 * @ko is_open - 다음 트리 노드 또는 접이식 헤더를 열지 여부입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetNextItemOpen(is_open: boolean, cond: number = 0): void {
  native.SetNextItemOpen(is_open, cond);
}

/**
 * Set id to use for open/close storage (default to same as item id).
 *
 * @zh 设置用于存储展开/折叠状态的 ID（默认与项目 ID 相同）。
 * @ja 開閉状態の保存に使う ID を設定します（既定では項目 ID と同じです）。
 * @ko 열림/닫힘 상태 저장에 사용할 ID를 설정합니다(기본값은 항목 ID와 같습니다).
 *
 * @param storage_id - Integer identifier for the item, storage entry, or
 * column, rather than a display index.
 * @zh storage_id - 用于项、存储条目或列的整数标识符，不是显示索引。
 * @ja storage_id - 項目、保存エントリー、列を識別する整数です。表示インデックスではありません。
 * @ko storage_id - 항목, 저장 항목 또는 열의 정수 식별자이며 표시 인덱스가 아닙니다.
 */
export function SetNextItemStorageID(storage_id: number): void {
  native.SetNextItemStorageID(storage_id);
}
