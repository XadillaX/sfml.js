'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { describe, words } = require('./documentation.cjs');

const keyLabels = Object.fromEntries(Object.entries({
  UNKNOWN: 'unrecognized|无法识别|不明|알 수 없는',
  SPACE: 'Space|空格|スペース|스페이스',
  OEM_1: 'semicolon / colon|分号／冒号|セミコロン／コロン|세미콜론／콜론',
  OEM_PLUS: 'equals / plus|等号／加号|等号／プラス|등호／더하기',
  OEM_COMMA: 'comma / less-than|逗号／小于号|コンマ／小なり|쉼표／작음',
  OEM_MINUS: 'minus / underscore|减号／下划线|マイナス／下線|빼기／밑줄',
  OEM_PERIOD: 'period / greater-than|句号／大于号|ピリオド／大なり|마침표／큼',
  OEM_2: 'slash / question mark|斜线／问号|スラッシュ／疑問符|슬래시／물음표',
  OEM_3: 'grave accent / tilde|反引号／波浪号|バッククォート／チルダ|역따옴표／물결표',
  OEM_4: 'opening bracket / brace|左方括号／左花括号|開き角括弧／開き波括弧|여는 대괄호／중괄호',
  OEM_5: 'backslash / vertical bar|反斜线／竖线|バックスラッシュ／縦線|역슬래시／세로줄',
  OEM_6: 'closing bracket / brace|右方括号／右花括号|閉じ角括弧／閉じ波括弧|닫는 대괄호／중괄호',
  OEM_7: 'single / double quote|单引号／双引号|一重／二重引用符|작은／큰따옴표',
  OEM_8: 'layout-dependent OEM|布局相关 OEM|配列依存の OEM|배열에 따른 OEM',
  OEM_102: '102-key layout extra angle-bracket / backslash|102 ' +
    '键布局附加尖括号／反斜线|102 キー配列の追加山括弧／バックスラッシュ|102키 배열의 추가 꺾쇠／역슬래시',
  NUMPADENTER: 'numeric keypad Enter|数字小键盘回车|テンキー Enter|숫자 키패드 Enter',
  MULTIPLY: 'numeric keypad multiply|数字小键盘乘号|テンキー乗算|숫자 키패드 곱하기',
  ADD: 'numeric keypad add|数字小键盘加号|テンキー加算|숫자 키패드 더하기',
  SEPARATOR: 'numeric keypad separator|数字小键盘分隔符|テンキー区切り|숫자 키패드 구분',
  SUBTRACT: 'numeric keypad subtract|数字小键盘减号|テンキー減算|숫자 키패드 빼기',
  DECIMAL: 'numeric keypad decimal point|数字小键盘小数点|テンキー小数点|숫자 키패드 소수점',
  DIVIDE: 'numeric keypad divide|数字小键盘除号|テンキー除算|숫자 키패드 나누기',
  OEM_NEC_EQUAL: 'NEC numeric keypad equals|NEC 数字小键盘等号|NEC テンキー等号|NEC 숫자 ' +
    '키패드 등호',
  BACK: 'Backspace|退格|バックスペース|백스페이스',
  TAB: 'Tab|制表|タブ|탭',
  CLEAR: 'Clear|清除|クリア|지우기',
  RETURN: 'Enter|回车|エンター|엔터',
  PAUSE: 'Pause|暂停|一時停止|일시 정지',
  CAPITAL: 'Caps Lock|大写锁定|大文字ロック|대문자 잠금',
  KANA: 'IME Kana mode|输入法假名模式|IME かなモード|IME 가나 모드',
  HANGUL: 'IME Hangul mode|输入法韩文模式|IME ハングルモード|IME 한글 모드',
  JUNJA: 'IME Junja mode|输入法 Junja 模式|IME Junja モード|IME 전자 모드',
  FINAL: 'IME final mode|输入法最终模式|IME 最終モード|IME 최종 모드',
  HANJA: 'IME Hanja mode|输入法韩文汉字模式|IME 韓国漢字モード|IME 한자 모드',
  KANJI: 'IME Kanji mode|输入法日文汉字模式|IME 漢字モード|IME 일본 한자 모드',
  ESCAPE: 'Escape|退出|エスケープ|이스케이프',
  CONVERT: 'IME conversion|输入法转换|IME 変換|IME 변환',
  NONCONVERT: 'IME non-conversion|输入法不转换|IME 無変換|IME 무변환',
  ACCEPT: 'IME accept|输入法接受|IME 確定|IME 수락',
  MODECHANGE: 'IME mode change|输入法模式切换|IME モード変更|IME 모드 변경',
  PRIOR: 'Page Up|向上翻页|ページアップ|페이지 위로',
  NEXT: 'Page Down|向下翻页|ページダウン|페이지 아래로',
  END: 'End|末尾|エンド|끝',
  HOME: 'Home|起始|ホーム|처음',
  LEFT: 'left arrow|左方向|左矢印|왼쪽 화살표',
  UP: 'up arrow|上方向|上矢印|위쪽 화살표',
  RIGHT: 'right arrow|右方向|右矢印|오른쪽 화살표',
  DOWN: 'down arrow|下方向|下矢印|아래쪽 화살표',
  SELECT: 'Select|选择|選択|선택',
  PRINT: 'Print|打印|印刷|인쇄',
  EXECUTE: 'Execute|执行|実行|실행',
  SNAPSHOT: 'Print Screen|屏幕截图|プリントスクリーン|화면 캡처',
  INSERT: 'Insert|插入|挿入|삽입',
  DELETE: 'Delete|删除|削除|삭제',
  HELP: 'Help|帮助|ヘルプ|도움말',
  LWIN: 'left Windows|左 Windows|左 Windows|왼쪽 Windows',
  RWIN: 'right Windows|右 Windows|右 Windows|오른쪽 Windows',
  APPS: 'application menu|应用菜单|アプリケーションメニュー|앱 메뉴',
  POWER: 'Power|电源|電源|전원',
  SLEEP: 'Sleep|睡眠|スリープ|절전',
  WAKE: 'Wake|唤醒|復帰|깨우기',
  NUMLOCK: 'Num Lock|数字锁定|テンキーロック|숫자 잠금',
  SCROLL: 'Scroll Lock|滚动锁定|スクロールロック|스크롤 잠금',
  OEM_FJ_JISHO: 'Fujitsu dictionary|富士通词典|富士通辞書|후지쯔 사전',
  OEM_FJ_MASSHOU: 'Fujitsu unregister word|富士通删除词条|富士通単語抹消|후지쯔 단어 삭제',
  OEM_FJ_TOUROKU: 'Fujitsu register word|富士通注册词条|富士通単語登録|후지쯔 단어 등록',
  OEM_FJ_LOYA: 'Fujitsu left thumb|富士通左拇指|富士通左親指|후지쯔 왼쪽 엄지',
  OEM_FJ_ROYA: 'Fujitsu right thumb|富士通右拇指|富士通右親指|후지쯔 오른쪽 엄지',
  LSHIFT: 'left Shift|左 Shift|左 Shift|왼쪽 Shift',
  RSHIFT: 'right Shift|右 Shift|右 Shift|오른쪽 Shift',
  LCONTROL: 'left Control|左 Control|左 Control|왼쪽 Control',
  RCONTROL: 'right Control|右 Control|右 Control|오른쪽 Control',
  LMENU: 'left Alt|左 Alt|左 Alt|왼쪽 Alt',
  RMENU: 'right Alt|右 Alt|右 Alt|오른쪽 Alt',
  BROWSER_BACK: 'browser Back|浏览器后退|ブラウザー戻る|브라우저 뒤로',
  BROWSER_FORWARD: 'browser Forward|浏览器前进|ブラウザー進む|브라우저 앞으로',
  BROWSER_REFRESH: 'browser Refresh|浏览器刷新|ブラウザー更新|브라우저 새로 고침',
  BROWSER_STOP: 'browser Stop|浏览器停止|ブラウザー停止|브라우저 중지',
  BROWSER_SEARCH: 'browser Search|浏览器搜索|ブラウザー検索|브라우저 검색',
  BROWSER_FAVORITES: 'browser Favorites|浏览器收藏|ブラウザーお気に入り|브라우저 즐겨찾기',
  BROWSER_HOME: 'browser Home|浏览器主页|ブラウザーホーム|브라우저 홈',
  VOLUME_MUTE: 'volume mute|静音|消音|음소거',
  VOLUME_DOWN: 'volume down|音量降低|音量を下げる|음량 낮추기',
  VOLUME_UP: 'volume up|音量提高|音量を上げる|음량 높이기',
  MEDIA_NEXT_TRACK: 'next media track|下一媒体轨道|次のメディアトラック|다음 미디어 트랙',
  MEDIA_PREV_TRACK: 'previous media track|上一媒体轨道|前のメディアトラック|이전 미디어 트랙',
  MEDIA_STOP: 'media stop|媒体停止|メディア停止|미디어 중지',
  MEDIA_PLAY_PAUSE: 'media play / pause|媒体播放／暂停|メディア再生／一時停止|미디어 재생／일시 정지',
  LAUNCH_MAIL: 'launch mail|启动邮件|メール起動|메일 실행',
  LAUNCH_MEDIA_SELECT: 'launch media selector|启动媒体选择器|メディア選択の起動|미디어 선택 실행',
  LAUNCH_APP1: 'launch application 1|启动应用 1|アプリケーション 1 起動|앱 1 실행',
  LAUNCH_APP2: 'launch application 2|启动应用 2|アプリケーション 2 起動|앱 2 실행',
  OEM_AX: 'AX keyboard OEM|AX 键盘 OEM|AX キーボード OEM|AX 키보드 OEM',
  ICO_HELP: 'ICO Help|ICO 帮助|ICO ヘルプ|ICO 도움말',
  ICO_00: 'ICO double zero|ICO 双零|ICO 二重ゼロ|ICO 이중 영',
  PROCESSKEY: 'IME process|输入法处理|IME 処理|IME 처리',
  ICO_CLEAR: 'ICO Clear|ICO 清除|ICO クリア|ICO 지우기',
  ATTN: 'Attention|注意|アテンション|주의',
  CRSEL: 'cursor select|光标选择|カーソル選択|커서 선택',
  EXSEL: 'extend selection|扩展选择|選択拡張|선택 확장',
  EREOF: 'erase end of file|擦除文件末尾|ファイル末尾消去|파일 끝 지우기',
  PLAY: 'Play|播放|再生|재생',
  ZOOM: 'Zoom|缩放|ズーム|확대',
  PA1: 'program attention 1|程序注意 1|プログラムアテンション 1|프로그램 주의 1',
  OEM_CLEAR: 'OEM Clear|OEM 清除|OEM クリア|OEM 지우기',
  LMETA: 'left Meta / Command|左 Meta／Command|左 Meta／Command|왼쪽 Meta／Command',
  RMETA: 'right Meta / Command|右 Meta／Command|右 Meta／Command|오른쪽 Meta／Command',
}).map(([ key, text ]) => [ key, words(text) ]));

const keyDescription = member => {
  const key = member.slice(3);
  if (member.startsWith('KM_')) {
    const modifiers = {
      CTRL: 'Control', SHIFT: 'Shift', ALT: 'Alt', META: 'Meta / Command',
      CAPSLOCK: 'Caps Lock', NUMLOCK: 'Num Lock', SCROLLLOCK: 'Scroll Lock',
    };
    const label = modifiers[key];
    if (!label) {
      throw new Error(`Missing modifier documentation: ${member}`);
    }
    const locked = key.endsWith('LOCK');
    return [
      `Set when ${label} is ${locked ? 'enabled' : 'held down'}.`,
      `${label} ${locked ? '启用' : '按下'}时设置的标志。`,
      `${label} が${locked ? '有効' : '押されている'}ときのフラグ。`,
      `${label} ${locked ? '활성화' : '누름'} 상태 플래그입니다.`,
    ];
  }
  if (key === 'FIRST_CUSTOM_KEY' || key === 'LAST_CUSTOM_KEY') {
    const first = key.startsWith('FIRST');
    return [
      `${first ? 'First' : 'Last'} assignable custom key; ` +
        'range 177–250 inclusive.',
      `可分配的${first ? '首个' : '最后一个'}自定义按键；` +
        '范围为 177 至 250，含两端。',
      `割り当て可能な${first ? '最初' : '最後'}の独自キー。範囲は 177〜250（両端を含む）。`,
      `할당 가능한 ${first ? '첫' : '마지막'} 사용자 정의 키이며 범위는 177~250（양 끝 포함）입니다.`,
    ];
  }
  let label = keyLabels[key];
  if (/^[A-Z0-9]$/.test(key) || /^F\d+$/.test(key)) {
    label = [ key, key, key, key ];
  } else if (/^NUMPAD\d$/.test(key)) {
    const digit = key.slice(-1);
    label = [
      `numeric keypad ${digit}`, `数字小键盘 ${digit}`,
      `テンキー ${digit}`, `숫자 키패드 ${digit}`,
    ];
  }
  if (!label) {
    throw new Error(`Missing key documentation: ${member}`);
  }
  return label.map((text, i) => [
    `The ${text} key.`, `${text}键。`,
    `${text}キー。`, `${text} 키입니다.`,
  ][i]);
};

const root = path.join(__dirname, '../..');
const header = fs.readFileSync(path.join(root,
  'third_party/rmlui/Include/RmlUi/Core/Input.h'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const output = [
  '// Generated from RmlUi 6.3 Core/Input.h.',
  '// Generated by tools/codegen/generate-input.cjs.',
  '// Keep upstream names and values, including the custom-key range.',
  '',
];

for (const [ name, expected, description ] of [
  [ 'KeyIdentifier', 179, [
    'RmlUi key identifiers; custom keys occupy 177 through 250.',
    'RmlUi 按键标识；自定义按键占用 177 至 250。',
    'RmlUi キー識別子。カスタムキーは 177 から 250 です。',
    'RmlUi 키 식별자입니다. 사용자 정의 키 범위는 177부터 250입니다.',
  ]],
  [ 'KeyModifier', 7, [
    'RmlUi modifier flags; combine flags with bitwise OR.',
    'RmlUi 修饰键标志；使用按位或组合。',
    'RmlUi 修飾キーフラグ。ビット OR で組み合わせます。',
    'RmlUi 보조 키 플래그입니다. 비트 OR로 결합합니다.',
  ]],
]) {
  const declaration = new RegExp(`enum ${name}[^\\{]+\\{([^}]+)\\}`);
  const body = header.match(declaration)?.[1];
  if (!body) {
    throw new Error(`Missing RmlUi ${name} declaration`);
  }
  const entries = [ ...body.matchAll(
    /\b(K[IM]_[A-Z0-9_]+)\s*(?:=\s*(\d+(?:\s*<<\s*\d+)?))?\s*(?:,|$)/g
  ) ];
  if (entries.length !== expected) {
    throw new Error(
      `Review ${name}: expected ${expected}, got ${entries.length}`
    );
  }
  output.push(
    '/**', ` * ${description[0]}`, ' *',
    ` * @zh ${description[1]}`, ` * @ja ${description[2]}`,
    ` * @ko ${description[3]}`, ' */', `export enum ${name} {`
  );
  let previous = -1;
  for (const [ , member, expression ] of entries) {
    const expressionText = expression ?? `${previous + 1}`;
    const [ value, shift = '0' ] = expressionText.split('<<');
    previous = Number(value) * 2 ** Number(shift);
    output.push(...describe(keyDescription(member), '  '),
      `  ${member} = ${previous},`);
  }
  output.push('}', '');
}

const destination = path.join(root, 'src/generated/input.ts');
fs.mkdirSync(path.dirname(destination), { recursive: true });
const content = output.join('\n');
const existing = fs.existsSync(destination)
  ? fs.readFileSync(destination, 'utf8') : null;
if (existing !== content) {
  fs.writeFileSync(destination, content);
}
