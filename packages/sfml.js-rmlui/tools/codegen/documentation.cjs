'use strict';

// Source-level semantic documentation shared by the upstream-header generators.
// Every entry contains English, Chinese, Japanese and Korean, in that order.
// Missing entries are errors: a native symbol must never become the fallback.
const words = text => text.split('|');
const wrap = (text, width) => {
  const lines = [];
  let rest = text;
  while (rest.length > width) {
    const space = rest.lastIndexOf(' ', width);
    const end = space > 0 ? space : width;
    lines.push(rest.slice(0, end));
    rest = rest.slice(end).trimStart();
  }
  lines.push(rest);
  return lines;
};
const describe = (description, indent = '', extra = []) => {
  if (!Array.isArray(description) || description.length !== 4 ||
      description.some(value => !value.trim())) {
    throw new Error('Generated API documentation requires four descriptions');
  }
  const content = [
    description[0],
    '',
    ...[ 'zh', 'ja', 'ko' ].map((locale, i) =>
      `@${locale} ${description[i + 1]}`),
    ...extra,
  ];
  const prefix = `${indent} * `;
  return [
    `${indent}/**`,
    ...content.flatMap(line =>
      wrap(line, 80 - prefix.length).map(value =>
        (value ? prefix + value : `${indent} *`))),
    `${indent} */`,
  ];
};

const labels = Object.fromEntries(Object.entries({
  display: 'layout box generation|布局盒生成方式|レイアウトボックスの生成方式|레이아웃 상자 생성 방식',
  position: 'positioning scheme|定位方式|配置方式|배치 방식',
  float: 'float placement|浮动方向|フロート配置|플로트 배치',
  clear: 'float clearance|浮动避让|フロートの回り込み解除|플로트 회피',
  box_sizing: 'size calculation box|尺寸计算盒|サイズ計算の基準ボックス|크기 계산 기준 상자',
  z_index: 'stacking order|堆叠顺序|重なり順|쌓임 순서',
  width: 'width|宽度|幅|너비',
  height: 'height|高度|高さ|높이',
  line_height: 'line height|行高|行の高さ|줄 높이',
  vertical_align: 'inline vertical alignment|行内垂直对齐|インラインの垂直配置|인라인 수직 정렬',
  vertical_align_length: 'inline vertical pixel offset|行内垂直像素偏移|' +
    'インラインの垂直オフセット（px）|인라인 수직 오프셋（px）',
  overflow: 'overflow handling|溢出处理|はみ出しの処理|넘침 처리',
  clip: 'ancestor clipping control|祖先裁剪控制|祖先によるクリッピング制御|조상 클리핑 제어',
  visibility: 'visibility|可见性|表示状態|표시 상태',
  text_overflow: 'text overflow marker|文本溢出标记|テキストの省略表示|텍스트 넘침 표시',
  text_overflow_string: 'custom text overflow string|自定义文本溢出字符串|独自の省略文字列|' +
    '사용자 정의 생략 문자열',
  background_color: 'background RGBA colour|背景 RGBA 颜色|背景の RGBA 色|배경 RGBA 색상',
  color: 'text RGBA colour|文本 RGBA 颜色|文字の RGBA 色|텍스트 RGBA 색상',
  caret_color: 'text caret colour|文本插入光标颜色|入力カーソルの色|텍스트 입력 커서 색상',
  image_color: 'image RGBA tint|图像 RGBA 染色|画像の RGBA 色乗算|이미지 RGBA 색상 곱셈',
  font_family: 'font family selection|字体族选择|フォントファミリーの選択|글꼴 모음 선택',
  font_style: 'font slant|字体倾斜样式|フォントの傾斜|글꼴 기울기',
  font_weight: 'font weight|字重|フォントの太さ|글꼴 굵기',
  font_size: 'font size in pixels|像素字号|ピクセル単位の文字サイズ|픽셀 단위 글꼴 크기',
  font_kerning: 'font kerning|字体字偶距|カーニング|커닝',
  font_face_handle: 'resolved font face handle|已解析字体句柄|解決済みフォントハンドル|해결된 글꼴 핸들',
  letter_spacing: 'extra letter spacing in pixels|额外像素字距|追加の文字間隔（px）|추가 문자 ' +
    '간격（px）',
  text_align: 'text horizontal alignment|文本水平对齐|テキストの水平配置|텍스트 수평 정렬',
  text_decoration: 'text decoration line|文本装饰线|テキストの装飾線|텍스트 장식선',
  text_transform: 'text case conversion|文本大小写转换|大文字・小文字の変換|텍스트 대소문자 변환',
  white_space: 'whitespace and wrapping|空白与换行处理|空白と折り返しの処理|공백 및 줄바꿈 처리',
  word_break: 'word breaking|单词断行|単語の改行規則|단어 줄바꿈',
  cursor: 'cursor name|鼠标光标名称|カーソル名|커서 이름',
  drag: 'drag interaction|拖动交互|ドラッグ操作|드래그 동작',
  tab_index: 'sequential keyboard focus|键盘顺序焦点|キーボードの順次フォーカス|키보드 순차 포커스',
  focus: 'focus eligibility|焦点接收能力|フォーカスの可否|포커스 허용 여부',
  scrollbar_margin: 'scrollbar margin in pixels|滚动条像素边距|スクロールバーの余白（px）|' +
    '스크롤바 여백（px）',
  overscroll_behavior: 'scroll chaining|滚动链传递|スクロールの連鎖|스크롤 연쇄',
  perspective: 'perspective distance in pixels|透视距离（像素）|遠近法の距離（px）|원근 거리（px）',
  perspective_origin: 'perspective origin|透视原点|遠近法の原点|원근 원점',
  transform: 'transform|变换|変換|변환',
  transform_origin: 'transform origin|变换原点|変換の原点|변환 원점',
  transition: 'property transition list|属性过渡列表|プロパティ遷移の一覧|속성 전환 목록',
  animation: 'keyframe animation list|关键帧动画列表|キーフレームアニメーションの一覧|키프레임 애니메이션 목록',
  opacity: 'opacity multiplier|不透明度乘数|不透明度の乗数|불투명도 배율',
  pointer_events: 'pointer hit testing|指针命中检测|ポインターのヒット判定|포인터 적중 검사',
  decorator: 'decorator layers|装饰器图层|デコレーターのレイヤー|장식 레이어',
  mask_image: 'mask image layers|遮罩图层|マスク画像のレイヤー|마스크 이미지 레이어',
  font_effect: 'font effects|字体效果|フォント効果|글꼴 효과',
  filter: 'element filter list|元素滤镜列表|要素のフィルター一覧|요소 필터 목록',
  backdrop_filter: 'backdrop filter list|背景滤镜列表|背景のフィルター一覧|배경 필터 목록',
  box_shadow: 'box shadows|盒阴影|ボックスの影|상자 그림자',
  fill_image: 'image fill|图像填充|画像の塗りつぶし|이미지 채우기',
  align_content: 'flex line alignment|弹性行对齐|フレックス行の配置|플렉스 줄 정렬',
  align_items: 'default flex item alignment|弹性项默认对齐|フレックス項目の既定配置|플렉스 항목 기본 정렬',
  align_self: 'individual flex item alignment|单个弹性项对齐|個別フレックス項目の配置|개별 플렉스 ' +
    '항목 정렬',
  flex_basis: 'initial flex size|弹性项初始尺寸|フレックス項目の初期サイズ|플렉스 항목 초기 크기',
  flex_direction: 'flex main axis direction|弹性主轴方向|フレックス主軸の方向|플렉스 주축 방향',
  flex_grow: 'flex growth factor|弹性增长系数|フレックスの伸長係数|플렉스 확장 계수',
  flex_shrink: 'flex shrink factor|弹性收缩系数|フレックスの縮小係数|플렉스 축소 계수',
  flex_wrap: 'flex line wrapping|弹性换行方式|フレックスの折り返し|플렉스 줄바꿈',
  justify_content: 'flex main axis alignment|弹性主轴对齐|フレックス主軸の配置|플렉스 주축 정렬',
  nav: 'directional keyboard navigation|方向键导航|方向キーによる移動|방향키 탐색',
  language: 'text language tag|文本语言标签|テキストの言語タグ|텍스트 언어 태그',
  direction: 'text reading direction|文本阅读方向|テキストの読み方向|텍스트 읽기 방향',
  margin: 'outer spacing|外边距|外側の余白|바깥 여백',
  padding: 'inner spacing|内边距|内側の余白|안쪽 여백',
  border: 'border|边框|境界線|테두리',
  border_width: 'border width in pixels|边框宽度（像素）|境界線の幅（px）|테두리 너비（px）',
  border_color: 'border RGBA colour|边框 RGBA 颜色|境界線の RGBA 色|테두리 RGBA 색상',
  border_radius: 'corner radius in pixels|圆角半径（像素）|角の半径（px）|모서리 반지름（px）',
  inset: 'position offsets|定位偏移|配置のオフセット|배치 오프셋',
  background: 'background fill|背景填充|背景の塗りつぶし|배경 채우기',
  font: 'font selection and size|字体选择与字号|フォントの選択とサイズ|글꼴 선택 및 크기',
  gap: 'spacing between layout items|布局项间距|レイアウト項目間の間隔|레이아웃 항목 간격',
  row_gap: 'gap between rows|行间距|行間の間隔|행 간격',
  column_gap: 'gap between columns|列间距|列間の間隔|열 간격',
  flex: 'flex growth, shrink and basis|弹性增长、收缩与初始尺寸|フレックスの伸長・縮小・初期サイズ|플렉스 ' +
    '확장·축소·초기 크기',
  flex_flow: 'flex direction and wrapping|弹性方向与换行|フレックスの方向と折り返し|플렉스 방향 및 줄바꿈',
}).map(([ key, value ]) => [ key, words(value) ]));

const sides = {
  top: words('top|上|上|위'),
  up: words('up|上|上|위'),
  right: words('right|右|右|오른쪽'),
  bottom: words('bottom|下|下|아래'),
  down: words('down|下|下|아래'),
  left: words('left|左|左|왼쪽'),
  x: words('horizontal|水平|水平|수평'),
  y: words('vertical|垂直|垂直|수직'),
  z: words('depth|深度|奥行き|깊이'),
};
const snake = name => name.replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .toLowerCase()
  .replace(/^rml_ui_/, '')
  .replace(/_$/, '');

const fieldLabel = name => {
  const key = snake(name);
  if (labels[key]) {
    return labels[key];
  }
  if (key.startsWith('has_')) {
    const target = fieldLabel(key.slice(4));
    return target.map((value, i) => [
      `whether ${value} is present`, `是否存在${value}`,
      `${value}の有無`, `${value} 존재 여부`,
    ][i]);
  }
  for (const prefix of [ 'min_', 'max_', 'local_' ]) {
    if (key.startsWith(prefix)) {
      const target = fieldLabel(key.slice(prefix.length));
      const adjectives = {
        min_: words('minimum|最小|最小|최소'),
        max_: words('maximum|最大|最大|최대'),
        local_: words('local|局部|ローカル|로컬'),
      }[prefix];
      return target.map((value, i) =>
        `${adjectives[i]}${i === 1 || i === 2 ? '' : ' '}${value}`);
    }
  }
  if (key === 'line_height_inherit_type') {
    return words('line height inheritance unit|行高继承单位|' +
      '行の高さの継承単位|줄 높이 상속 단위');
  }
  if (/_(type|value)$/.test(key)) {
    const target = fieldLabel(key.replace(/_(type|value)$/, ''));
    const type = key.endsWith('_type');
    return target.map((value, i) => [
      `${value} ${type ? 'unit or keyword' : 'numeric component'}`,
      `${value}的${type ? '单位或关键字' : '数值分量'}`,
      `${value}の${type ? '単位またはキーワード' : '数値成分'}`,
      `${value}의 ${type ? '단위 또는 키워드' : '수치 성분'}`,
    ][i]);
  }
  if (key === 'line_height_inherit') {
    return words('inherited line height number or length|' +
      '继承的行高数值或长度|' +
      '継承する行の高さの数値または長さ|상속할 줄 높이 숫자 또는 길이');
  }
  const components = key.split('_');
  const directions = components.filter(value => sides[value]);
  const remaining = components.filter(value => !sides[value]).join('_');
  if (directions.length && labels[remaining]) {
    return labels[remaining].map((value, i) => {
      const separator = i === 1 || i === 2 ? '' : ' ';
      const order = separator === '' && directions.length === 2 &&
        remaining === 'border_radius'
        ? [ ...directions ].reverse() : directions;
      const prefix = order.map(direction => sides[direction][i])
        .join(separator);
      return `${prefix}${separator}${value}`;
    });
  }
  if (sides[key]) {
    return sides[key].map((value, i) => [
      `${value} position offset`, `${value}侧定位偏移`,
      `${value}側の配置オフセット`, `${value} 배치 오프셋`,
    ][i]);
  }
  throw new Error(`Missing semantic field documentation: ${name}`);
};

const fieldDescription = name => fieldLabel(name).map((label, i) => [
  `The computed ${label}.`, `计算后的${label}。`,
  `計算済みの${label}。`, `계산된 ${label}입니다.`,
][i]);

const scalarDescriptions = {
  LengthPercentageAuto: words('A length in pixels, a percentage, or ' +
    'automatic sizing.|像素长度、百分比或自动尺寸。|ピクセル長、百分率、または自動サイズ。|픽셀 길이, 백분율 또는 자동 ' +
    '크기입니다.'),
  LengthPercentage: words('A length in pixels or a percentage of a ' +
    'reference size.|像素长度或相对基准尺寸的百分比。|ピクセル長または基準サイズに対する百分率。|픽셀 길이 또는 기준 ' +
    '크기에 대한 백분율입니다.'),
  NumberAuto: words('A numeric value or the automatic keyword, used for ' +
    'stacking order.|数值或自动关键字，用于堆叠顺序。|重なり順に使用する数値または自動キーワード。|쌓임 순서에 사용하는 ' +
    '숫자 또는 자동 키워드입니다.'),
  VerticalAlign: words('An inline vertical alignment keyword or pixel ' +
    'offset.|行内垂直对齐关键字或像素偏移。|インラインの垂直配置キーワードまたはピクセルオフセット。|인라인 수직 정렬 키워드 또는 ' +
    '픽셀 오프셋입니다.'),
  LineHeight: words('Computed line height in pixels together with its ' +
    'inherited number or length.|计算后的像素行高及其继承数值或长度。|' +
    '計算済みの行の高さ（px）と継承する数値または長さ。|계산된 줄 높이（px）와 상속할 숫자 또는 길이입니다.'),
};
const scalarField = (name, field) => {
  if (field === 'type' || field === 'inheritType') {
    return words('The keyword or unit that determines how the numeric ' +
      'value is interpreted.|决定如何解释数值的关键字或单位。|数値の解釈を決めるキーワードまたは単位。|숫자의 해석을 ' +
      '결정하는 키워드 또는 단위입니다.');
  }
  if (name === 'LineHeight') {
    return field === 'value'
      ? words('The computed line height in pixels.|计算后的行高，单位为像素。|' +
        '計算済みの行の高さ（px）。|계산된 줄 높이（px）입니다.')
      : words('The inherited line height multiplier or pixel length, ' +
        'according to inheritType.|继承的行高倍数或像素长度，由 inheritType 决定。|' +
        'inheritType に応じた継承する行の高さの倍率またはピクセル長。|inheritType에 따른 상속 줄 높이 배율 ' +
        '또는 픽셀 길이입니다.');
  }
  if (name === 'VerticalAlign') {
    return words('The pixel offset used by Length; keywords ignore it.|' +
      'Length 类型使用的像素偏移；关键字忽略此值。|' +
      'Length 型で使用するピクセルオフセット。キーワードでは無視します。|' +
      'Length 형식의 픽셀 오프셋이며 키워드는 무시합니다.');
  }
  return name === 'NumberAuto'
    ? words('The number used when the type is Number; Auto ignores it.|' +
      'Number 类型使用的数值；Auto 忽略该值。|Number 型で使用する数値。Auto では無視します。|Number 형식에서 ' +
      '사용하는 숫자이며 Auto는 무시합니다.')
    : words('The pixel length or percentage selected by type; keyword ' +
      'modes ignore this component.|由 type 选择的像素长度或百分比；关键字模式忽略此分量。|type ' +
      'が選ぶピクセル長または百分率。キーワードでは無視します。|type이 선택한 픽셀 길이 또는 백분율이며 키워드 모드는 무시합니다.');
};

// Keyword meanings describe the actual layout operation, not the enum spelling.
const keywordMeanings = Object.fromEntries(Object.entries({
  None: 'Disable this behavior.|禁用该行为。|この動作を無効にします。|이 동작을 비활성화합니다.',
  Auto: 'Let the engine choose the behavior from the element and its ' +
    'context.|由引擎根据元素及上下文决定行为。|要素とコンテキストからエンジンが動作を選びます。|요소와 컨텍스트에 따라 엔진이 ' +
    '동작을 선택합니다.',
  Block: 'Generate a block-level box.|生成块级盒。|ブロックレベルのボックスを生成します。|블록 수준 상자를 ' +
    '생성합니다.',
  Inline: 'Generate an inline box in the current text line.|在当前文本行中生成行内盒。|' +
    '現在のテキスト行にインラインボックスを生成します。|현재 텍스트 줄에 인라인 상자를 생성합니다.',
  InlineBlock: 'Place a block container as one inline item.|将块容器作为一个行内项排列。|' +
    'ブロックコンテナーを一つのインライン項目として配置します。|블록 컨테이너를 하나의 인라인 항목으로 배치합니다.',
  FlowRoot: 'Establish an independent block formatting context.|' +
    '建立独立的块格式化上下文。|独立したブロック整形コンテキストを作ります。|독립된 블록 서식 컨텍스트를 만듭니다.',
  Flex: 'Lay out children in a block-level flex container.|在块级弹性容器中布局子项。|' +
    'ブロックレベルのフレックスコンテナーで子を配置します。|블록 수준 플렉스 컨테이너에 자식을 배치합니다.',
  InlineFlex: 'Lay out children in an inline-level flex container.|' +
    '在行内弹性容器中布局子项。|インラインレベルのフレックスコンテナーで子を配置します。|인라인 수준 플렉스 컨테이너에 자식을 배치합니다.',
  Table: 'Generate a table container.|生成表格容器。|テーブルコンテナーを生成します。|표 컨테이너를 생성합니다.',
  InlineTable: 'Place a table as an inline item.|将表格作为行内项排列。|' +
    'テーブルをインライン項目として配置します。|표를 인라인 항목으로 배치합니다.',
  TableRow: 'Generate a table row.|生成表格行。|テーブルの行を生成します。|표 행을 생성합니다.',
  TableRowGroup: 'Group table rows.|组合表格行。|テーブルの行をまとめます。|표 행을 그룹화합니다.',
  TableColumn: 'Generate a table column.|生成表格列。|テーブルの列を生成します。|표 열을 생성합니다.',
  TableColumnGroup: 'Group table columns.|组合表格列。|テーブルの列をまとめます。|표 열을 그룹화합니다.',
  TableCell: 'Generate a table cell.|生成表格单元格。|テーブルのセルを生成します。|표 셀을 생성합니다.',
  Static: 'Use normal flow without position offsets.|使用正常流，不应用定位偏移。|' +
    '配置オフセットを使わず通常フローに従います。|배치 오프셋 없이 일반 흐름을 따릅니다.',
  Relative: 'Offset the box while preserving its space in normal flow.|' +
    '偏移盒并保留其正常流空间。|通常フローの領域を保持してボックスをずらします。|일반 흐름 공간을 유지하면서 상자를 이동합니다.',
  Absolute: 'Remove the box from normal flow and position it in its ' +
    'containing block.|脱离正常流，相对包含块定位。|通常フローから外して包含ブロック内に配置します。|일반 흐름에서 ' +
    '제외하고 포함 블록 안에 배치합니다.',
  Fixed: 'Position the box relative to the viewport.|相对视口定位。|' +
    'ビューポートを基準に配置します。|뷰포트를 기준으로 배치합니다.',
  Left: 'Use the left side.|使用左侧。|左側を使用します。|왼쪽을 사용합니다.',
  Right: 'Use the right side.|使用右侧。|右側を使用します。|오른쪽을 사용합니다.',
  Top: 'Use the top edge.|使用上边缘。|上端を使用します。|위쪽 가장자리를 사용합니다.',
  Bottom: 'Use the bottom edge.|使用下边缘。|下端を使用します。|아래쪽 가장자리를 사용합니다.',
  Both: 'Clear floats on both sides.|避让两侧浮动。|両側のフロートを解除します。|양쪽 플로트를 피합니다.',
  Center: 'Align at the centre.|居中对齐。|中央に配置します。|중앙에 정렬합니다.',
  ContentBox: 'Width and height describe the content, excluding padding ' +
    'and borders.|宽高描述内容，不含内边距和边框。|幅と高さは余白と境界線を除く内容を表します。|너비와 높이는 안쪽 여백과 ' +
    '테두리를 제외한 내용 크기입니다.',
  BorderBox: 'Width and height include padding and borders.|宽高包含内边距和边框。|' +
    '幅と高さに余白と境界線を含めます。|너비와 높이에 안쪽 여백과 테두리를 포함합니다.',
  Visible: 'Allow rendering to remain visible.|允许内容可见。|内容の表示を許可します。|내용 표시를 ' +
    '허용합니다.',
  Hidden: 'Hide rendering while keeping the layout box.|隐藏绘制并保留布局盒。|' +
    'レイアウトボックスを保持して描画を隠します。|레이아웃 상자를 유지하고 렌더링을 숨깁니다.',
  Scroll: 'Clip overflow and always show scrollbars.|裁剪溢出并始终显示滚动条。|' +
    'はみ出しを切り取りスクロールバーを常に表示します。|넘침을 자르고 스크롤바를 항상 표시합니다.',
  Clip: 'Cut off overflowing text without a marker.|截断溢出文本，不添加标记。|' +
    '省略記号を付けずにはみ出す文字を切り取ります。|표시 없이 넘치는 텍스트를 자릅니다.',
  Ellipsis: 'Replace overflowing text with an ellipsis.|以省略号替换溢出文本。|' +
    'はみ出す文字を省略記号に置き換えます。|넘치는 텍스트를 줄임표로 바꿉니다.',
  String: 'Use the supplied string as the overflow marker.|使用指定字符串标记文本溢出。|' +
    '指定の文字列を省略表示に使用します。|지정한 문자열로 텍스트 넘침을 표시합니다.',
  Normal: 'Use the normal behavior for this property.|使用该属性的常规行为。|' +
    'このプロパティの通常の動作を使用します。|이 속성의 일반 동작을 사용합니다.',
  Italic: 'Select an italic font face.|选择斜体字体。|イタリック体のフォントを選びます。|기울임 글꼴을 ' +
    '선택합니다.',
  Bold: 'Select bold weight 700.|选择粗体字重 700。|太さ 700 の太字を選びます。|굵기 700인 굵은 ' +
    '글꼴을 선택합니다.',
  Justify: 'Expand spacing to fill the text line.|扩展间距以填满文本行。|' +
    '間隔を広げてテキスト行を満たします。|간격을 늘려 텍스트 줄을 채웁니다.',
  Underline: 'Draw a line below the text.|绘制下划线。|テキストの下に線を引きます。|텍스트 아래에 선을 ' +
    '그립니다.',
  Overline: 'Draw a line above the text.|绘制上划线。|テキストの上に線を引きます。|텍스트 위에 선을 ' +
    '그립니다.',
  LineThrough: 'Draw a line through the text.|绘制删除线。|テキストを横切る線を引きます。|텍스트 ' +
    '가운데에 선을 그립니다.',
  Capitalize: 'Uppercase the first letter of each word.|将各单词首字母转换为大写。|' +
    '各単語の先頭文字を大文字にします。|각 단어의 첫 글자를 대문자로 바꿉니다.',
  Uppercase: 'Convert text to uppercase.|将文本转换为大写。|テキストを大文字にします。|텍스트를 대문자로 ' +
    '바꿉니다.',
  Lowercase: 'Convert text to lowercase.|将文本转换为小写。|テキストを小文字にします。|텍스트를 소문자로 ' +
    '바꿉니다.',
  Pre: 'Preserve whitespace and explicit line breaks without wrapping.|' +
    '保留空白和显式换行，不自动折行。|空白と明示的改行を保持し折り返しません。|공백과 명시적 줄바꿈을 유지하고 자동 줄바꿈하지 않습니다.',
  Nowrap: 'Keep content on one line without wrapping.|保持单行，不自动换行。|' +
    '内容を一行に保ち折り返しません。|내용을 한 줄로 유지하고 줄바꿈하지 않습니다.',
  Prewrap: 'Preserve whitespace and also wrap long lines.|保留空白并自动折行。|' +
    '空白を保持し長い行を折り返します。|공백을 유지하고 긴 줄을 줄바꿈합니다.',
  Preline: 'Collapse spaces, preserve line breaks, and wrap.|' +
    '折叠空格，保留换行并自动折行。|空白をまとめ、改行を保持して折り返します。|공백을 합치고 줄바꿈을 유지하며 자동 줄바꿈합니다.',
  BreakAll: 'Allow breaks between any characters.|允许在任意字符之间断行。|' +
    '任意の文字間で改行できます。|모든 문자 사이에서 줄바꿈을 허용합니다.',
  BreakWord: 'Break an otherwise unbreakable word when necessary.|' +
    '必要时拆分无法正常断行的单词。|必要なら通常改行できない単語を分割します。|필요하면 나눌 수 없는 단어를 나눕니다.',
  Drag: 'Allow dragging the element.|允许拖动元素。|要素のドラッグを許可します。|요소 드래그를 허용합니다.',
  DragDrop: 'Allow dragging with drop target events.|允许拖动并产生放置目标事件。|' +
    'ドロップ対象イベントを伴うドラッグを許可します。|드롭 대상 이벤트를 포함하는 드래그를 허용합니다.',
  Clone: 'Drag a visual clone of the element.|拖动元素的可视副本。|要素の表示用複製をドラッグします。|' +
    '요소의 시각적 복제본을 드래그합니다.',
  Contain: 'Stop scroll propagation at this scroll container.|' +
    '在此滚动容器阻止滚动传递。|このスクロールコンテナーで連鎖を止めます。|이 스크롤 컨테이너에서 스크롤 연쇄를 멈춥니다.',
  Baseline: 'Align text baselines.|对齐文本基线。|テキストのベースラインを揃えます。|텍스트 기준선을 맞춥니다.',
  Middle: 'Align the box middle to the parent baseline plus half its ' +
    'x-height.|将盒中点对齐父基线加半个 x 字高。|ボックス中央を親のベースラインと x 高さの半分に合わせます。|상자 중앙을 ' +
    '부모 기준선에 x 높이의 절반을 더한 위치에 맞춥니다.',
  Sub: 'Lower the baseline for subscript.|降低基线用于下标。|下付き文字用にベースラインを下げます。|아래 ' +
    '첨자를 위해 기준선을 내립니다.',
  Super: 'Raise the baseline for superscript.|抬高基线用于上标。|' +
    '上付き文字用にベースラインを上げます。|위 첨자를 위해 기준선을 올립니다.',
  TextTop: 'Align to the top of the parent font.|对齐父字体顶部。|親フォントの上端に合わせます。|' +
    '부모 글꼴 위쪽에 맞춥니다.',
  TextBottom: 'Align to the bottom of the parent font.|对齐父字体底部。|' +
    '親フォントの下端に合わせます。|부모 글꼴 아래쪽에 맞춥니다.',
  Length: 'Interpret the numeric component as pixels.|将数值分量解释为像素。|' +
    '数値成分をピクセルとして解釈します。|수치 성분을 픽셀로 해석합니다.',
  Percentage: 'Interpret the numeric component as a percentage, with 100 ' +
    'meaning the full reference size.|将数值解释为百分比，100 表示完整基准尺寸。|' +
    '数値を百分率として解釈し、100 は基準サイズ全体です。|숫자를 백분율로 해석하며 100은 전체 기준 크기입니다.',
  Number: 'Interpret the numeric component as a unitless number.|' +
    '将数值分量解释为无单位数值。|数値成分を単位なしの数として解釈します。|수치 성분을 단위 없는 숫자로 해석합니다.',
  Always: 'Force clipping even when overflow is visible.|即使溢出可见也强制裁剪。|' +
    'はみ出しが表示される場合もクリッピングを強制します。|넘침이 표시되어도 클리핑을 강제합니다.',
  FlexStart: 'Pack items at the start of the alignment axis.|沿对齐轴起点排列。|' +
    '配置軸の始点にまとめます。|정렬 축 시작에 모읍니다.',
  FlexEnd: 'Pack items at the end of the alignment axis.|沿对齐轴终点排列。|' +
    '配置軸の終点にまとめます。|정렬 축 끝에 모읍니다.',
  SpaceBetween: 'Distribute free space between items, with no space at the ' +
    'outer edges.|将剩余空间分配到项之间，外侧不留空。|外端を空けず項目間に余白を配分します。|바깥 여백 없이 항목 사이에 ' +
    '남은 공간을 분배합니다.',
  SpaceAround: 'Distribute space around items, with half-sized outer gaps.|' +
    '在项周围分配空间，外侧间距减半。|項目の周囲に余白を配分し外端は半分にします。|항목 주위에 공간을 분배하고 바깥 간격은 절반으로 ' +
    '합니다.',
  SpaceEvenly: 'Use equal gaps between items and at the outer edges.|' +
    '项之间及外侧使用等距间隔。|項目間と外端の間隔を均等にします。|항목 사이와 바깥 간격을 같게 합니다.',
  Stretch: 'Stretch items or lines to fill available cross-axis space.|' +
    '拉伸项或行以填满交叉轴空间。|交差軸の空き領域を満たすよう項目または行を伸ばします。|교차 축 공간을 채우도록 항목 또는 줄을 ' +
    '늘립니다.',
  Row: 'Use a horizontal main axis.|使用水平主轴。|水平の主軸を使用します。|수평 주축을 사용합니다.',
  RowReverse: 'Use a reversed horizontal main axis.|使用反向水平主轴。|' +
    '逆向きの水平主軸を使用します。|역방향 수평 주축을 사용합니다.',
  Column: 'Use a vertical main axis.|使用垂直主轴。|垂直の主軸を使用します。|수직 주축을 사용합니다.',
  ColumnReverse: 'Use a reversed vertical main axis.|使用反向垂直主轴。|' +
    '逆向きの垂直主軸を使用します。|역방향 수직 주축을 사용합니다.',
  Wrap: 'Allow multiple flex lines.|允许弹性布局多行排列。|フレックスを複数行に折り返します。|플렉스 여러 ' +
    '줄을 허용합니다.',
  WrapReverse: 'Wrap flex lines with the cross-axis order reversed.|' +
    '允许换行并反转交叉轴行序。|交差軸の順序を逆にして折り返します。|교차 축 순서를 반대로 하여 줄바꿈합니다.',
  Horizontal: 'Search for navigation targets horizontally.|水平查找导航目标。|' +
    '水平方向に移動先を探します。|수평으로 탐색 대상을 찾습니다.',
  Vertical: 'Search for navigation targets vertically.|垂直查找导航目标。|' +
    '垂直方向に移動先を探します。|수직으로 탐색 대상을 찾습니다.',
  TreeOrder: 'Choose navigation targets in element tree order.|' +
    '按元素树顺序选择导航目标。|要素ツリーの順序で移動先を選びます。|요소 트리 순서로 탐색 대상을 선택합니다.',
  Ltr: 'Read text from left to right.|从左向右阅读文本。|テキストを左から右へ読みます。|텍스트를 왼쪽에서 ' +
    '오른쪽으로 읽습니다.',
  Rtl: 'Read text from right to left.|从右向左阅读文本。|テキストを右から左へ読みます。|텍스트를 오른쪽에서 ' +
    '왼쪽으로 읽습니다.',
}).map(([ key, value ]) => [ key, words(value) ]));

const enumDescription = name => {
  const scalar = name.replace(/(Inherit)?Type$/, '');
  if (scalarDescriptions[scalar]) {
    return scalarDescriptions[scalar];
  }
  if (name === 'ClipType') {
    return fieldDescription('clip');
  }
  if (name === 'OriginX' || name === 'OriginY') {
    return fieldDescription(name === 'OriginX'
      ? 'transform_origin_x' : 'transform_origin_y');
  }
  return fieldDescription(snake(name));
};
const enumMemberDescription = (name, member) => {
  const overrides = {
    'FontStyle.Normal': 'Select an upright font face.|选择正体字体。|' +
      '直立体のフォントを選びます。|기울지 않은 글꼴을 선택합니다.',
    'WordBreak.Normal': 'Use normal language-aware line breaks.|' +
      '按语言规则正常断行。|言語の通常の改行規則を使用します。|' +
      '언어의 일반 줄바꿈 규칙을 사용합니다.',
    'FlexWrap.Nowrap': 'Keep flex items on a single flex line.|' +
      '将弹性项保持在同一弹性行。|フレックス項目を一行に保ちます。|' +
      '플렉스 항목을 한 플렉스 줄에 유지합니다.',
    'Display.None': 'Do not generate a layout box or render the element.|' +
      '不生成布局盒，也不绘制元素。|レイアウトボックスを生成せず要素も描画しません。|레이아웃 상자를 생성하지 않고 요소를 렌더링하지 ' +
      '않습니다.',
    'Overflow.Visible': 'Render overflow outside the box without clipping.|' +
      '不裁剪盒外溢出内容。|ボックス外の内容を切り取らず描画します。|상자 밖 넘침을 자르지 않고 렌더링합니다.',
    'Overflow.Hidden': 'Clip overflow without scrollbars.|裁剪溢出，不显示滚动条。|' +
      'スクロールバーを付けずにはみ出しを切り取ります。|스크롤바 없이 넘침을 자릅니다.',
    'Overflow.Auto': 'Clip overflow and show scrollbars only when needed.|' +
      '裁剪溢出，仅在需要时显示滚动条。|はみ出しを切り取り必要な場合だけスクロールバーを表示します。|넘침을 자르고 필요할 때만 ' +
      '스크롤바를 표시합니다.',
    'FontWeight.Normal': 'Select normal font weight 400.|选择常规字重 400。|標準の太さ ' +
      '400 を選びます。|일반 글꼴 굵기 400을 선택합니다.',
    'FontWeight.Auto': 'Request automatic font weight selection; concrete ' +
      'weights range from 1 to 1000.|请求自动选择字重；具体字重范围为 1 至 1000。|' +
      '太さの自動選択を要求します。具体的な値は 1〜1000 です。|글꼴 굵기 자동 선택을 요청하며 구체적인 굵기는 ' +
      '1~1000입니다.',
    'FontKerning.Normal': 'Apply font kerning.|应用字体字偶距。|フォントのカーニングを適用します。|' +
      '글꼴 커닝을 적용합니다.',
    'WhiteSpace.Normal': 'Collapse whitespace and wrap lines.|折叠空白并自动换行。|' +
      '空白をまとめ行を折り返します。|공백을 합치고 자동 줄바꿈합니다.',
    'Drag.Block': 'Prevent an ancestor from starting a drag through this ' +
      'element.|阻止祖先通过此元素启动拖动。|この要素を通じて祖先がドラッグを開始するのを防ぎます。|이 요소를 통해 조상이 ' +
      '드래그를 시작하지 못하게 합니다.',
    'PointerEvents.Auto': 'Allow this element to participate in pointer ' +
      'hit testing.|允许此元素参与指针命中检测。|この要素をポインターのヒット判定に含めます。|이 요소를 포인터 적중 검사에 ' +
      '포함합니다.',
    'TabIndex.Auto': 'Include the element in sequential keyboard focus.|' +
      '将元素纳入键盘顺序焦点。|要素をキーボードの順次フォーカスに含めます。|요소를 키보드 순차 포커스에 포함합니다.',
    'Focus.Auto': 'Allow the element to receive focus.|允许元素接收焦点。|' +
      '要素がフォーカスを受け取れます。|요소가 포커스를 받을 수 있습니다.',
    'AlignSelf.Auto': 'Use the parent flex container’s align-items value.|' +
      '使用父弹性容器的 align-items 值。|親フレックスコンテナーの align-items を使用します。|부모 플렉스 ' +
      '컨테이너의 align-items 값을 사용합니다.',
    'ClipType.Number': 'Ignore the specified number of ancestor clipping ' +
      'regions.|忽略指定数量的祖先裁剪区域。|指定数の祖先クリッピング領域を無視します。|지정한 수의 조상 클리핑 영역을 ' +
      '무시합니다.',
    'ClipType.None': 'Ignore ancestor clipping regions.|忽略祖先裁剪区域。|' +
      '祖先のクリッピング領域を無視します。|조상 클리핑 영역을 무시합니다.',
    'ClipType.Auto': 'Respect ancestor clipping regions.|遵守祖先裁剪区域。|' +
      '祖先のクリッピング領域に従います。|조상 클리핑 영역을 따릅니다.',
  };
  const description = overrides[`${name}.${member}`]
    ? words(overrides[`${name}.${member}`]) : keywordMeanings[member];
  if (!description) {
    throw new Error(`Missing keyword documentation: ${name}.${member}`);
  }
  return description;
};

const sentinelDescription = (name, maximum) => {
  const descriptions = {
    Invalid: words('Invalid identifier; does not name a registered entry.|' +
      '无效标识，不表示已注册条目。|無効な識別子。登録済み項目を表しません。|유효하지 않은 식별자이며 등록된 항목이 아닙니다.'),
    NumDefinedIds: words('Boundary after the built-in identifiers; not an ' +
      'actual entry.|内置标识之后的边界，不是实际条目。|組み込み識別子の末尾の境界。実際の項目ではありません。|내장 식별자 ' +
      '뒤 경계이며 실제 항목이 아닙니다.'),
    FirstCustomId: words('First identifier available for custom ' +
      'registration.|可用于自定义注册的首个标识。|独自登録に使用できる最初の識別子。|사용자 정의 등록에 사용할 첫 ' +
      '식별자입니다.'),
    MaxNumIds: [
      `Exclusive identifier limit (${maximum}); not a registered entry.`,
      `标识上限（${maximum}，不含），不是已注册条目。`,
      `識別子の上限（${maximum}、含まない）。登録済み項目ではありません。`,
      `식별자 상한（${maximum}, 미포함）이며 등록된 항목이 아닙니다.`,
    ],
  };
  return descriptions[name];
};

module.exports = {
  words, describe, snake, fieldLabel, fieldDescription,
  scalarDescriptions, scalarField, enumDescription, enumMemberDescription,
  sentinelDescription,
};
