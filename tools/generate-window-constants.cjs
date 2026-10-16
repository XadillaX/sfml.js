'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const headers = path.join(root, 'third_party/sfml/include/SFML/Window');
const definitions = [
  [ 'WindowEnums', '', 'Style' ],
  [ 'WindowEnums', 'State', 'State' ],
  [ 'Cursor', 'Type', 'CursorType' ],
  [ 'Keyboard', 'Key', 'KeyboardKey' ],
  [ 'Keyboard', 'Scan', 'KeyboardScancode' ],
  [ 'Mouse', 'Button', 'MouseButton' ],
  [ 'Mouse', 'Wheel', 'MouseWheel' ],
  [ 'Joystick', 'Axis', 'JoystickAxis' ],
  [ 'Sensor', 'Type', 'SensorType' ],
];
const counts = [
  [ 'Keyboard', 'KeyCount', 'KeyboardKeyCount' ],
  [ 'Keyboard', 'ScancodeCount', 'KeyboardScancodeCount' ],
  [ 'Mouse', 'ButtonCount', 'MouseButtonCount' ],
  [ 'Joystick', 'Count', 'JoystickCount' ],
  [ 'Joystick', 'ButtonCount', 'JoystickButtonCount' ],
  [ 'Joystick', 'AxisCount', 'JoystickAxisCount' ],
  [ 'Sensor', 'Count', 'SensorCount' ],
];
const sources = new Map();
const descriptions = {
  Style: '窗口样式位标志，可按位组合。',
  State: '窗口初始显示状态。',
  CursorType: '系统光标形状，具体支持情况取决于平台。',
  KeyboardKey: '随系统键盘布局变化的逻辑按键。',
  KeyboardScancode: '与键盘布局无关的物理按键。',
  MouseButton: '鼠标按钮。',
  MouseWheel: '鼠标滚轮方向。',
  JoystickAxis: '游戏手柄坐标轴。',
  SensorType: '传感器类型。',
};
function memberDocs(file, pattern) {
  const raw = fs.readFileSync(path.join(headers, `${file}.hpp`), 'utf8')
    .replace(/\/\/(?!\!<)[^\n]*/g, '');
  const body = raw.match(new RegExp(
    `${pattern}\\{([\\s\\S]*?)\\n\\s*\\}`))?.[1] || '';
  const docs = new Map();
  for (const line of body.split('\n')) {
    const match = line.match(/^\s*(\w+)\b.*?\/\/!<\s*(.+)$/);
    if (match) docs.set(match[1], match[2].replace(/\*\//g, '* /'));
  }
  return docs;
}
function source(file) {
  if (!sources.has(file)) {
    sources.set(file, fs.readFileSync(path.join(headers, `${file}.hpp`), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''));
  }
  return sources.get(file);
}

// Parse the expressions used by SFML enums without executing source text.
function evaluate(expression, symbols) {
  const text = expression
    .replace(/static_cast<unsigned int>\(([^)]+)\)/g, '$1');
  const tokens = text
    .match(/0x[\da-f]+|\d+|[A-Za-z_]\w*(?:::\w+)*|<<|[-+|()]/gi);
  if (!tokens || tokens.join('') !== text.replace(/\s/g, '')) {
    throw new Error(`Unsupported constant expression: ${expression}`);
  }
  let index = 0;
  function atom() {
    const token = tokens[index++];
    if (token === '-') return -atom();
    if (token === '(') {
      const value = or();
      if (tokens[index++] !== ')') throw new Error('Unclosed expression');
      return value;
    }
    if (/^(0x[\da-f]+|\d+)$/i.test(token)) return Number(token);
    if (!symbols.has(token)) throw new Error(`Unknown constant: ${token}`);
    return symbols.get(token);
  }
  function sum() {
    let value = atom();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operation = tokens[index++];
      value += (operation === '+' ? 1 : -1) * atom();
    }
    return value;
  }
  function shift() {
    let value = sum();
    while (tokens[index] === '<<') {
      index++;
      value *= 2 ** sum();
    }
    return value;
  }
  function or() {
    let value = shift();
    while (tokens[index] === '|') {
      index++;
      // eslint-disable-next-line no-bitwise
      value |= shift();
    }
    return value;
  }
  const value = or();
  if (index !== tokens.length) throw new Error(`Unparsed: ${expression}`);
  return value;
}

const ts = [
  '// Generated from SFML headers; do not edit.',
  '// Regenerate with npm run generate:window.',
];
const scopes = new Map();
for (const [ file, name, output ] of definitions) {
  const pattern = name ? `enum\\s+class\\s+${name}\\s*`
    : 'namespace\\s+Style\\s*\\{\\s*enum\\s*';
  const match = source(file).match(new RegExp(`${pattern}\\{([^}]+)\\}`));
  if (!match) throw new Error(`Missing enum ${file}/${name}`);
  const docs = memberDocs(file, pattern);
  const symbols = scopes.get(file) || new Map();
  scopes.set(file, symbols);
  let previous = -1;
  ts.push('', `/** ${descriptions[output]} */`, `export enum ${output} {`);
  for (const item of match[1].split(',').map(s => s.trim()).filter(Boolean)) {
    const member = item.match(/^(\w+)(?:\s*=\s*(.+))?$/);
    if (!member) throw new Error(`Unsupported enumerator: ${item}`);
    const [ , key, expression ] = member;
    const value = expression ? evaluate(expression, symbols) : previous + 1;
    symbols.set(key, value);
    symbols.set(`${name}::${key}`, value);
    previous = value;
    const description = docs.get(key);
    if (!description) {
      throw new Error(`Missing enum documentation: ${output}.${key}`);
    }
    ts.push(`  /** ${description} */`, `  ${key} = ${value},`);
  }
  ts.push('}');
}
for (const [ file, name, output ] of counts) {
  const match = source(file).match(new RegExp(`${name}\\s*\\{([^}]+)\\}`));
  if (!match) throw new Error(`Missing count ${file}/${name}`);
  const value = evaluate(match[1], scopes.get(file));
  ts.push('', `/** SFML ${file} 的 ${name} 数量上限。 */`,
    `export const ${output} = ${value};`);
}
for (const [ file, lines ] of [
  [ 'src/window/gen/constants.ts', ts ],
]) {
  const output = path.join(root, file);
  const content = lines.join('\n') + '\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) {
      throw new Error(`Generated constants are stale: ${file}`);
    }
  } else if (!fs.existsSync(output) ||
      fs.readFileSync(output, 'utf8') !== content) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, content);
  }
}
