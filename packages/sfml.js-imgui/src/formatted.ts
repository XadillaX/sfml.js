// Printf-style calls pass a typed argument list to the native formatter.
import { native } from './internal/native';
import type { ImGuiTextBuffer, ImVec4Like } from './types';

/**
 * Arguments accepted by the formatted helpers.
 *
 * @zh 可传给格式化辅助函数的参数。
 * @ja 書式付きヘルパーが受け付ける引数。
 * @ko 형식화 도우미가 받는 인수입니다.
 */
export type FormatArgument = string | number | bigint | boolean;

/**
 * Draw formatted text.
 *
 * @zh 绘制格式化文本。
 * @ja 書式付きテキストを描画する。
 * @ko 형식화된 텍스트를 그립니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function Text(
  format: string | Uint8Array, ...args: FormatArgument[]
): void {
  native.Text(format, args);
}

/**
 * Draw formatted text in a color.
 *
 * @zh 绘制带颜色的格式化文本。
 * @ja 色付きの書式付きテキストを描画する。
 * @ko 색이 지정된 형식화 텍스트를 그립니다.
 * @param color - RGBA color.
 * @zh color - RGBA 颜色。
 * @ja color - RGBA 色。
 * @ko color - RGBA 색상입니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function TextColored(
  color: ImVec4Like, format: string | Uint8Array,
  ...args: FormatArgument[]
): void {
  native.TextColored(color, format, args);
}

/**
 * Draw formatted text in the disabled color.
 *
 * @zh 绘制使用禁用颜色的格式化文本。
 * @ja 無効色で書式付きテキストを描画する。
 * @ko 비활성 색상으로 형식화 텍스트를 그립니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function TextDisabled(
  format: string | Uint8Array, ...args: FormatArgument[]
): void {
  native.TextDisabled(format, args);
}

/**
 * Draw formatted text with wrapping.
 *
 * @zh 绘制自动换行的格式化文本。
 * @ja 折り返し付きで書式付きテキストを描画する。
 * @ko 자동 줄바꿈되는 형식화 텍스트를 그립니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function TextWrapped(
  format: string | Uint8Array, ...args: FormatArgument[]
): void {
  native.TextWrapped(format, args);
}

/**
 * Draw a label followed by formatted text.
 *
 * @zh 绘制标签与格式化文本。
 * @ja ラベルの後に書式付きテキストを描画する。
 * @ko 레이블 뒤에 형식화 텍스트를 그립니다.
 * @param label - Left-hand label.
 * @zh label - 左侧标签。
 * @ja label - 左側のラベル。
 * @ko label - 왼쪽 레이블입니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function LabelText(
  label: string | Uint8Array, format: string | Uint8Array,
  ...args: FormatArgument[]
): void {
  native.LabelText(label, format, args);
}

/**
 * Draw a bullet followed by formatted text.
 *
 * @zh 绘制项目符号与格式化文本。
 * @ja 箇条書き記号の後に書式付きテキストを描画する。
 * @ko 글머리 기호 뒤에 형식화 텍스트를 그립니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function BulletText(
  format: string | Uint8Array, ...args: FormatArgument[]
): void {
  native.BulletText(format, args);
}

/**
 * Draw a collapsible node whose ID is separate from its label.
 *
 * @zh 绘制可折叠节点，ID 与显示文本分离。
 * @ja ID と表示テキストが分かれた折り畳みノードを描画する。
 * @ko ID와 표시 텍스트가 분리된 접이식 노드를 그립니다.
 * @param id - Node ID.
 * @zh id - 节点 ID。
 * @ja id - ノード ID。
 * @ko id - 노드 ID입니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 * @returns Whether the node is open.
 * @zh 节点是否展开。
 * @ja ノードが展開されているかどうか。
 * @ko 노드가 펼쳐졌는지 여부입니다.
 */
export function TreeNodeStr(
  id: string | Uint8Array, format: string | Uint8Array,
  ...args: FormatArgument[]
): boolean {
  return native.TreeNodeStr(id, format, args);
}

/**
 * Draw a collapsible node addressed by a pointer ID.
 *
 * @zh 使用指针 ID 绘制可折叠节点。
 * @ja ポインタ ID で指定する折り畳みノードを描画する。
 * @ko 포인터 ID로 지정하는 접이식 노드를 그립니다.
 * @param id - Pointer ID.
 * @zh id - 指针 ID。
 * @ja id - ポインタ ID。
 * @ko id - 포인터 ID입니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 * @returns Whether the node is open.
 * @zh 节点是否展开。
 * @ja ノードが展開されているかどうか。
 * @ko 노드가 펼쳐졌는지 여부입니다.
 */
export function TreeNodePtr(
  id: bigint | null, format: string | Uint8Array,
  ...args: FormatArgument[]
): boolean {
  return native.TreeNodePtr(id, format, args);
}

/**
 * Draw a collapsible node with flags and a string ID.
 *
 * @zh 绘制带标志的字符串 ID 折叠节点。
 * @ja フラグと文字列 ID を持つ折り畳みノードを描画する。
 * @ko 플래그와 문자열 ID를 가진 접이식 노드를 그립니다.
 * @param id - Node ID.
 * @zh id - 节点 ID。
 * @ja id - ノード ID。
 * @ko id - 노드 ID입니다.
 * @param flags - Node flags.
 * @zh flags - 节点标志。
 * @ja flags - ノードフラグ。
 * @ko flags - 노드 플래그입니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 * @returns Whether the node is open.
 * @zh 节点是否展开。
 * @ja ノードが展開されているかどうか。
 * @ko 노드가 펼쳐졌는지 여부입니다.
 */
export function TreeNodeExStr(
  id: string | Uint8Array, flags: number, format: string | Uint8Array,
  ...args: FormatArgument[]
): boolean {
  return native.TreeNodeExStr(id, flags, format, args);
}

/**
 * Draw a collapsible node with flags and a pointer ID.
 *
 * @zh 绘制带标志的指针 ID 折叠节点。
 * @ja フラグとポインタ ID を持つ折り畳みノードを描画する。
 * @ko 플래그와 포인터 ID를 가진 접이식 노드를 그립니다.
 * @param id - Pointer ID.
 * @zh id - 指针 ID。
 * @ja id - ポインタ ID。
 * @ko id - 포인터 ID입니다.
 * @param flags - Node flags.
 * @zh flags - 节点标志。
 * @ja flags - ノードフラグ。
 * @ko flags - 노드 플래그입니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 * @returns Whether the node is open.
 * @zh 节点是否展开。
 * @ja ノードが展開されているかどうか。
 * @ko 노드가 펼쳐졌는지 여부입니다.
 */
export function TreeNodeExPtr(
  id: bigint | null, flags: number, format: string | Uint8Array,
  ...args: FormatArgument[]
): boolean {
  return native.TreeNodeExPtr(id, flags, format, args);
}

/**
 * Set a formatted tooltip.
 *
 * @zh 设置格式化工具提示。
 * @ja 書式付きツールチップを設定する。
 * @ko 형식화 툴팁을 설정합니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function SetTooltip(
  format: string | Uint8Array, ...args: FormatArgument[]
): void {
  native.SetTooltip(format, args);
}

/**
 * Set a formatted tooltip for the previous item.
 *
 * @zh 为上一个项目设置格式化工具提示。
 * @ja 直前の項目に書式付きツールチップを設定する。
 * @ko 이전 항목에 형식화 툴팁을 설정합니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function SetItemTooltip(
  format: string | Uint8Array, ...args: FormatArgument[]
): void {
  native.SetItemTooltip(format, args);
}

/**
 * Append formatted text to the log.
 *
 * @zh 向日志写入格式化文本。
 * @ja ログに書式付きテキストを追加する。
 * @ko 로그에 형식화 텍스트를 추가합니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function LogText(
  format: string | Uint8Array, ...args: FormatArgument[]
): void {
  native.LogText(format, args);
}

/**
 * Append formatted text to the debug log.
 *
 * @zh 向调试日志写入格式化文本。
 * @ja デバッグログに書式付きテキストを追加する。
 * @ko 디버그 로그에 형식화 텍스트를 추가합니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function DebugLog(
  format: string | Uint8Array, ...args: FormatArgument[]
): void {
  native.DebugLog(format, args);
}

/**
 * Append formatted text to an ImGuiTextBuffer.
 *
 * @zh 向 ImGuiTextBuffer 追加格式化文本。
 * @ja ImGuiTextBuffer に書式付きテキストを追加する。
 * @ko ImGuiTextBuffer에 형식화 텍스트를 추가합니다.
 * @param buffer - Target buffer handle.
 * @zh buffer - 目标缓冲区句柄。
 * @ja buffer - 対象のバッファハンドル。
 * @ko buffer - 대상 버퍼 핸들입니다.
 * @param format - printf-style format string.
 * @zh format - printf 风格的格式串。
 * @ja format - printf 形式の書式文字列。
 * @ko format - printf 스타일 형식 문자열입니다.
 * @param args - Format arguments.
 * @zh args - 格式参数。
 * @ja args - 書式引数。
 * @ko args - 형식 인수입니다.
 */
export function TextBuffer_appendf(
  buffer: ImGuiTextBuffer, format: string | Uint8Array,
  ...args: FormatArgument[]
): void {
  native.TextBuffer_appendf(buffer, format, args);
}
