'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  describe, words, sentinelDescription,
} = require('./documentation.cjs');
const descriptions = Object.fromEntries(Object.entries({
  Mousedown: 'A pointer button is pressed.|指针按键按下。|' +
    'ポインターボタンが押されました。|포인터 버튼을 누릅니다.',
  Mousescroll: 'The pointer wheel scrolls.|指针滚轮滚动。|' +
    'ポインターのホイールが回転しました。|포인터 휠을 스크롤합니다.',
  Mouseover: 'The pointer enters the element.|指针进入元素。|' +
    'ポインターが要素に入りました。|포인터가 요소에 들어옵니다.',
  Mouseout: 'The pointer leaves the element.|指针离开元素。|' +
    'ポインターが要素から出ました。|포인터가 요소를 벗어납니다.',
  Focus: 'The element receives input focus.|元素获得输入焦点。|' +
    '要素が入力フォーカスを受け取りました。|요소가 입력 포커스를 받습니다.',
  Blur: 'The element loses input focus.|元素失去输入焦点。|' +
    '要素が入力フォーカスを失いました。|요소가 입력 포커스를 잃습니다.',
  Keydown: 'A keyboard key is pressed.|键盘按键按下。|' +
    'キーボードのキーが押されました。|키보드 키를 누릅니다.',
  Keyup: 'A keyboard key is released.|键盘按键释放。|' +
    'キーボードのキーが離されました。|키보드 키를 놓습니다.',
  Textinput: 'Text is committed to the focused element.|文本提交到焦点元素。|' +
    'フォーカス要素にテキストが入力されました。|포커스된 요소에 텍스트를 입력합니다.',
  Mouseup: 'A pointer button is released.|指针按键释放。|' +
    'ポインターボタンが離されました。|포인터 버튼을 놓습니다.',
  Click: 'The element is activated by a click.|元素被单击激活。|' +
    'クリックで要素が操作されました。|클릭으로 요소를 활성화합니다.',
  Dblclick: 'The element receives a double click.|元素收到双击。|' +
    '要素がダブルクリックされました。|요소를 두 번 클릭합니다.',
  Load: 'A document finishes loading.|文档完成加载。|' +
    '文書の読み込みが完了しました。|문서 로딩을 완료합니다.',
  Unload: 'A document is unloaded.|文档被卸载。|' +
    '文書がアンロードされました。|문서를 언로드합니다.',
  Show: 'A document becomes visible.|文档变为可见。|' +
    '文書が表示されました。|문서가 표시됩니다.',
  Hide: 'A document becomes hidden.|文档变为隐藏。|' +
    '文書が非表示になりました。|문서가 숨겨집니다.',
  Mousemove: 'The pointer moves over the element.|指针在元素上移动。|' +
    'ポインターが要素上を移動しました。|포인터가 요소 위에서 이동합니다.',
  Dragmove: 'The dragged element moves.|拖动中的元素移动。|' +
    'ドラッグ中の要素が移動しました。|드래그 중인 요소가 이동합니다.',
  Drag: 'The element is being dragged.|元素正在被拖动。|' +
    '要素がドラッグされています。|요소를 드래그 중입니다.',
  Dragstart: 'An element drag begins.|元素拖动开始。|' +
    '要素のドラッグが開始しました。|요소 드래그를 시작합니다.',
  Dragover: 'A dragged element enters a drop target.|拖动元素进入放置目标。|' +
    'ドラッグ要素がドロップ対象に入りました。|드래그 요소가 드롭 대상에 들어옵니다.',
  Dragdrop: 'A dragged element is dropped on a target.|拖动元素被放到目标上。|' +
    'ドラッグ要素が対象にドロップされました。|드래그 요소를 대상에 놓습니다.',
  Dragout: 'A dragged element leaves a drop target.|拖动元素离开放置目标。|' +
    'ドラッグ要素がドロップ対象から出ました。|드래그 요소가 드롭 대상을 벗어납니다.',
  Dragend: 'An element drag ends.|元素拖动结束。|' +
    '要素のドラッグが終了しました。|요소 드래그를 끝냅니다.',
  Handledrag: 'A handle control reports a drag.|拖动手柄控件报告拖动。|' +
    'ハンドルコントロールがドラッグを通知します。|핸들 컨트롤이 드래그를 알립니다.',
  Resize: 'The document dimensions change.|文档尺寸改变。|' +
    '文書のサイズが変わりました。|문서 크기가 변경됩니다.',
  Scroll: 'An element scroll offset changes.|元素滚动偏移改变。|' +
    '要素のスクロール位置が変わりました。|요소 스크롤 위치가 변경됩니다.',
  Animationend: 'A keyframe animation finishes.|关键帧动画结束。|' +
    'キーフレームアニメーションが終了しました。|키프레임 애니메이션을 완료합니다.',
  Transitionend: 'A property transition finishes.|属性过渡结束。|' +
    'プロパティ遷移が終了しました。|속성 전환을 완료합니다.',
  Change: 'A form control value changes.|表单控件值改变。|' +
    'フォームコントロールの値が変わりました。|폼 컨트롤 값이 변경됩니다.',
  Submit: 'A form is submitted.|表单被提交。|' +
    'フォームが送信されました。|폼을 제출합니다.',
  Tabchange: 'The selected tab changes.|选中的标签页改变。|' +
    '選択タブが変わりました。|선택한 탭이 변경됩니다.',
}).map(([ name, text ]) => [ name, words(text) ]));

const root = path.join(__dirname, '../..');
const header = fs.readFileSync(path.join(root,
  'vendor/rmlui/Include/RmlUi/Core/ID.h'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const body = header.match(/enum class EventId[^{}]+\{([^}]+)\}/)?.[1];
if (!body) {
  throw new Error('Missing RmlUi EventId declaration');
}
const entries = [ ...body.matchAll(
  /\b(\w+)\s*(?:=\s*(\w+))?\s*(?:,|$)/g
) ];
if (entries.length !== 36) {
  throw new Error(`Review EventId: expected 36, got ${entries.length}`);
}

const output = [
  '// Generated from RmlUi 6.3 Core/ID.h by tools/codegen/generate-events.cjs.',
  '',
  '/**',
  ' * Rml::EventId constants. Custom ids are returned by registerEventType.',
  ' *',
  ' * @zh Rml::EventId 常量；自定义编号由 registerEventType 返回。',
  ' * @ja Rml::EventId 定数。カスタム ID は registerEventType が返します。',
  ' * @ko Rml::EventId 상수입니다. 사용자 정의 ID는 registerEventType이 반환합니다.',
  ' */',
  'export enum EventId {',
];
const values = new Map();
let previous = -1;
for (const [ , name, expression ] of entries) {
  const value = expression === undefined
    ? previous + 1 : values.get(expression) ?? Number(expression);
  if (!Number.isInteger(value)) {
    throw new Error(`Unrecognized EventId expression: ${expression}`);
  }
  values.set(name, value);
  previous = value;
  output.push(...describe(
    sentinelDescription(name, value) ?? descriptions[name], '  '
  ), `  ${name} = ${values.has(expression) ? expression : value},`);
}
output.push('}', '');
const destination = path.join(root, 'src/generated/events.ts');
fs.mkdirSync(path.dirname(destination), { recursive: true });
const content = output.join('\n');
if (!fs.existsSync(destination) ||
    fs.readFileSync(destination, 'utf8') !== content) {
  fs.writeFileSync(destination, content);
}
