'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  describe, words, fieldDescription, scalarDescriptions, scalarField,
  enumDescription, enumMemberDescription,
} = require('./documentation.cjs');

const root = path.join(__dirname, '../..');
const headerRoot = path.join(root, 'vendor/rmlui/Include/RmlUi/Core');
const clean = name => fs.readFileSync(path.join(headerRoot, name), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const camel = name => name.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
  .replace(/_$/, '');
const pascal = name => {
  const value = camel(name);
  return value[0].toUpperCase() + value.slice(1);
};
const doc = (description, indent = '', extra = []) =>
  describe(description, indent, extra);
const write = (name, lines) => {
  const destination = path.join(root, name);
  const text = lines.join('\n').replace(/\n+$/, '') + '\n';
  if (!fs.existsSync(destination) ||
      fs.readFileSync(destination, 'utf8') !== text) {
    fs.writeFileSync(destination, text);
  }
};
const banner = '// Generated from RmlUi 6.3: generate-computed-values.cjs.';
const styleHeader = clean('StyleTypes.h');
const enums = [ ...styleHeader.matchAll(
  /enum class (\w+) : \w+ \{([^}]+)\}/g
) ].filter(match => match[1] !== 'Type');
const enumNames = new Set(enums.map(match => match[1]));
const styleEnums = [ banner, '' ];
const nativeEnums = [ banner ];
for (const [ , name, body ] of enums) {
  styleEnums.push(...doc(enumDescription(name)), `export enum ${name} {`);
  let index = -1;
  for (const item of body.split(',').map(s => s.trim()).filter(Boolean)) {
    const [ key, explicit ] = item.split('=').map(s => s.trim());
    index = explicit === undefined ? index + 1 : Number(explicit);
    if (!Number.isInteger(index)) {
      throw new Error(`Unexpected enum ${name}::${item}`);
    }
    styleEnums.push(...doc(enumMemberDescription(name, key), '  '),
      `  ${key} = ${index},`);
    nativeEnums.push(
      'static_assert(',
      `    static_cast<int>(Rml::Style::${name}::${key}) == ${index});`
    );
  }
  styleEnums.push('}', '');
  const maximum = name === 'FontWeight' ? 1000 : index;
  nativeEnums.push(`template <> struct StyleEnumLimit<Rml::Style::${name}> {`,
    `  static constexpr int kMaximum = ${maximum};`, '};');
}
for (const name of [
  'LengthPercentageAuto', 'LengthPercentage', 'NumberAuto',
  'VerticalAlign', 'LineHeight', 'Clip',
]) {
  const body = styleHeader.slice(styleHeader.indexOf(`struct ${name} {`));
  const match = body.match(/enum (?:class )?(\w+) : \w+ \{([^}]+)\}/);
  const enumName = `${name}${match[1]}`;
  styleEnums.push(...doc(enumDescription(enumName)),
    `export enum ${enumName} {`);
  const names = match[2].split(',').map(s => s.trim());
  names.forEach((key, index) => {
    styleEnums.push(...doc(enumMemberDescription(enumName, key), '  '),
      `  ${key} = ${index},`);
    nativeEnums.push(
      'static_assert(',
      `    static_cast<int>(Rml::Style::${name}::${match[1]}::${key})`,
      `    == ${index});`
    );
  });
  styleEnums.push('}', '');
  nativeEnums.push(
    `template <> struct StyleEnumLimit<Rml::Style::${name}::${match[1]}> {`,
    `  static constexpr int kMaximum = ${names.length - 1};`, '};');
}
write('src/generated/style-enums.ts', styleEnums);
write('native/generated/rmlui-style-enums.inc', nativeEnums);

const header = clean('ComputedValues.h').split('class ComputedValues')[1]
  .split('// clang-format on')[0].split('private:')[0];
const getters = [ ...header.matchAll(
  /^\s*(?:const\s+)?([\w]+)(?:\s*&)?\s*(\*)?\s+(\w+)\(\)\s+const/gm
) ];
const setters = [ ...header.matchAll(
  /^\s*void\s+(\w+)\s*\(\s*(?:const\s+)?(\w+)(?:&)?\s+value\)/gm
) ];
if (getters.length !== 98 || setters.length !== 83) {
  throw new Error(`Review computed declarations: ${getters.length} getters, ` +
    `${setters.length} setters`);
}
const setterTypes = new Map(setters.map(([ , name, type ]) => [ name, type ]));
const scalarTypes = new Set([
  'LengthPercentageAuto', 'LengthPercentage', 'NumberAuto', 'VerticalAlign',
  'LineHeight', 'MinWidth', 'MaxWidth', 'MinHeight', 'MaxHeight',
  'PerspectiveOrigin', 'TransformOrigin', 'FlexBasis', 'Clip',
]);
const types = {
  float: 'number', int16_t: 'number', bool: 'boolean', String: 'string',
  FontFaceHandle: 'FontFaceHandle | null',
  FontWeight: 'number',
  Colourb: 'VariantByteColour',
  CornerSizes: 'CornerSizes',
  AnimationList: 'AnimationList | null',
  TransitionList: 'TransitionList | null',
  TransformPtr: 'TransformSnapshot | null',
};
const tsType = type => types[type] ??
  (enumNames.has(type) || scalarTypes.has(type) ? `Style.${type}` : null);
const output = [
  banner,
  'import { native } from \'../internal/native\';',
  'import {',
  '  computedHandle, type FontFaceHandle,',
  '} from \'../internal/computed\';',
  'import * as Style from \'../style/values/style-values\';',
  'import {',
  '  styleValueHandle, styleValueFromNative,',
  '} from \'../internal/style-values\';',
  'import { variantFromNative } from \'../internal/animation-values\';',
  'import type { VariantByteColour } from \'../values/types\';',
  'import type { CornerSizes } from \'../rendering/render-box\';',
  'import type {',
  '  AnimationList, TransitionList,',
  '} from \'../animation/animation-values\';',
  'import type { TransformSnapshot } from \'../style/values/transform\';',
  'import type { ComputedValuesView } from \'./computed-values-view\';',
  '',
  '/** @internal */',
  'export class ComputedFields implements ComputedValuesView {',
];
const view = [
  banner,
  'import type * as Style from \'../style/values/style-values\';',
  'import type { FontFaceHandle } from \'../internal/computed\';',
  'import type { VariantByteColour } from \'../values/types\';',
  'import type { CornerSizes } from \'../rendering/render-box\';',
  'import type {',
  '  AnimationList, TransitionList,',
  '} from \'../animation/animation-values\';',
  'import type { TransformSnapshot } from \'../style/values/transform\';',
  '',
  '/**',
  ' * Read-only live view of an element’s computed style.',
  ' *',
  ' * @zh 元素计算样式的实时只读视图。',
  ' * @ja 要素の計算済みスタイルの読み取り専用ライブビュー。',
  ' * @ko 요소의 계산된 스타일에 대한 실시간 읽기 전용 뷰입니다.',
  ' * @remarks',
  ' * Refresh layout with Context.update before reading. Structured getters',
  ' * return independent copies. Access rejects after the element is destroyed',
  ' * or the runtime shuts down.',
  ' * @zh 查询前使用 Context.update 更新布局。结构化 getter 返回独立副本。',
  ' * 元素销毁或运行时关闭后，访问失效。',
  ' * @ja 取得前に Context.update でレイアウトを更新してください。構造値はコピーです。',
  ' * 要素の破棄またはランタイムの終了後はアクセスできません。',
  ' * @ko 읽기 전에 Context.update로 레이아웃을 갱신하세요. 구조 값은 독립 복사본입니다.',
  ' * 요소 파괴 또는 런타임 종료 후에는 접근할 수 없습니다.',
  ' */',
  'export interface ComputedValuesView {',
];
const binding = [
  banner,
  'import type * as Style from \'../style/values/style-values\';',
  'import type { NativeStyleValue } from \'../internal/style-values\';',
  'import type { FontFaceHandle } from \'../internal/computed\';',
  'import type { VariantByteColour } from \'../values/types\';',
  'import type { CornerSizes } from \'../rendering/render-box\';',
  '',
  '/** @internal */',
  'export interface ComputedBinding {',
];
const registration = [ banner ];
for (const [ , type, pointer, name ] of getters) {
  const field = camel(name);
  const suffix = pascal(name);
  const publicType = tsType(type);
  if (!publicType) {
    throw new Error(`Unmapped computed type: ${type}`);
  }
  const nativeType = scalarTypes.has(type) ? 'NativeStyleValue'
    : [ 'AnimationList', 'TransitionList', 'TransformPtr' ].includes(type)
      ? 'unknown' : publicType;
  const read = `native.computedGet${suffix}(computedHandle(this))`;
  const copied = scalarTypes.has(type) || nativeType === 'unknown';
  const result = scalarTypes.has(type)
    ? `styleValueFromNative(value) as ${publicType}`
    : nativeType === 'unknown'
      ? `variantFromNative(value) as ${publicType}` : read;
  const getterDocs = doc(fieldDescription(name), '  ', [
    '@returns Current native value; structured values are independent copies.',
    '@zh 返回当前原生值；结构化值为独立副本。',
    '@ja 現在のネイティブ値。構造化値は独立したコピーです。',
    '@ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.',
  ]);

  view.push(...getterDocs, `  readonly ${field}: ${publicType};`, '');
  output.push(...getterDocs,
    `  get ${field}(): ${publicType} {`,
    ...(copied ? [ `    const value = ${read};` ] : []),
    `    return ${result};`,
    '  }', '');
  binding.push(`  computedGet${suffix}(handle: object): ${nativeType};`);
  const cppType = enumNames.has(type) || scalarTypes.has(type)
    ? `Rml::Style::${type}` : [ 'bool', 'float' ].includes(type)
      ? type : `Rml::${type}`;
  const returnType = pointer ? `const ${cppType}*`
    : name === 'language' ? 'const Rml::String&' : cppType;
  registration.push(
    'SetRuntimeMethod<',
    `    ComputedGet<static_cast<${returnType}`,
    '        (Rml::ComputedValues::*)() const>(',
    `        &Rml::ComputedValues::${name})>, true>(`,
    `    target, "computedGet${suffix}");`
  );
  const setter = setterTypes.get(name);
  if (!setter) {
    continue;
  }
  setterTypes.delete(name);
  const input = scalarTypes.has(type) ? 'styleValueHandle(value)' : 'value';
  output.push(...doc(fieldDescription(name), '  ', [
    '@param value - Assignment to an owned value; element views reject writes.',
    '@zh value - 写入独立对象；元素只读视图拒绝写入。',
    '@ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。',
    '@ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.',
  ]),
  `  set ${field}(value: ${publicType}) {`,
  `    native.computedSet${suffix}(`,
  `      computedHandle(this), ${input},`,
  '    );',
  '  }', '');
  binding.push(`  computedSet${suffix}(`,
    `    handle: object, value: ${
      scalarTypes.has(type) ? 'object' : publicType},`,
    '  ): void;');
  const inputType = setter === 'int16_t' ? 'int16_t' : cppType;
  const memberType = setter === 'String' ? 'const Rml::String&' : inputType;
  const narrow = name.startsWith('border_') && name.endsWith('_radius')
    ? ', true' : '';
  registration.push(
    'SetRuntimeMethod<',
    `    ComputedSet<${inputType},`,
    '        static_cast<void (Rml::ComputedValues::*)(',
    `            ${memberType})>(`,
    `            &Rml::ComputedValues::${name})${narrow}>, true>(`,
    `    target, "computedSet${suffix}");`
  );
}
if (setterTypes.size !== 1 ||
    setterTypes.get('has_letter_spacing') !== 'bool') {
  throw new Error('Review write-only computed setters');
}
output.push('}');
view.push('}');
binding.push('}');
write('src/generated/computed-fields.ts', output);
write('src/generated/computed-values-view.ts', view);
write('src/generated/computed-binding.ts', binding);
write('native/generated/rmlui-computed-fields.inc', registration);

const scalars = [
  banner,
  'import { native } from \'../internal/native\';',
  'import {',
  '  styleValues, scalarMapping, lineHeightMapping, stylePrototypes,',
  '  checkedStyleEnum, checkedStyleFloat,',
  '} from \'../internal/style-values\';',
  'import * as Enums from \'./style-enums\';',
  '',
];
for (const [ name, max, defaultType ] of [
  [ 'LengthPercentageAuto', 2, 'Length' ],
  [ 'LengthPercentage', 1, 'Length' ],
  [ 'NumberAuto', 1, 'Number' ],
  [ 'VerticalAlign', 9, 'Baseline' ],
  [ 'LineHeight', 1, 'Number' ],
]) {
  const line = name === 'LineHeight';
  const enumType = `${name}${line ? 'InheritType' : 'Type'}`;
  scalars.push(...doc(scalarDescriptions[name], '', [
    '@remarks Numeric views retain only this scalar, independently of the DOM.',
    '@zh 数值视图仅保活此值，其生命周期独立于 DOM 和运行时。',
    '@ja 数値ビューは値のみを保持し、DOM とランタイムから独立しています。',
    '@ko 숫자 뷰는 이 값만 유지하며 DOM 및 런타임과 독립적입니다.',
  ]), `export class ${name} {`);
  if (line) {
    scalars.push(...doc(words(
      'Create a line height value with pixel and inheritance components.|' +
      '创建含像素和继承分量的行高值。|' +
      'ピクセルと継承成分を持つ行の高さを作ります。|' +
      '픽셀 및 상속 성분을 가진 줄 높이를 만듭니다.'
    ), '  ', [
      '@param value - Computed pixels; default is 12f * 1.2f.',
      '@zh value - 计算后的像素，默认为 12f * 1.2f。',
      '@ja value - 計算済みピクセル。既定は 12f * 1.2f。',
      '@ko value - 계산된 픽셀이며 기본값은 12f * 1.2f입니다.',
      '@param inheritType - Number or Length; defaults to Number.',
      '@zh inheritType - Number 或 Length，默认 Number。',
      '@ja inheritType - Number または Length。既定は Number。',
      '@ko inheritType - Number 또는 Length이며 기본값은 Number입니다.',
      '@param inheritValue - Inherited number or length; defaults to 1.2.',
      '@zh inheritValue - 继承的数值或长度，默认 1.2。',
      '@ja inheritValue - 継承する数値または長さ。既定は 1.2。',
      '@ko inheritValue - 상속할 숫자 또는 길이이며 기본값은 1.2입니다.',
    ]),
    '  constructor(',
    '    value = Math.fround(12 * Math.fround(1.2)),',
    '    inheritType = Enums.LineHeightInheritType.Number, inheritValue = 1.2,',
    '  ) {',
    '    styleValues.set(this,',
    '      native.createLineHeight(value, inheritType, inheritValue));',
    '  }', '');
  } else if (name === 'VerticalAlign') {
    scalars.push(...doc(words(
      'Create an inline alignment keyword or a pixel offset.|' +
      '创建行内对齐关键字或像素偏移。|' +
      'インライン配置キーワードまたはピクセルオフセットを作ります。|' +
      '인라인 정렬 키워드 또는 픽셀 오프셋을 만듭니다.'
    ), '  ', [
      '@param typeOrLength - One number means pixels; omitted means Baseline.',
      '@zh typeOrLength - 单参数表示像素长度，省略时为 Baseline。',
      '@ja typeOrLength - 単一の引数はピクセル。省略時は Baseline。',
      '@ko typeOrLength - 단일 인수는 픽셀이며 생략하면 Baseline입니다.',
      '@param value - With two arguments: type first, then pixel length.',
      '@zh value - 双参数时首个参数为类型，此参数为长度。',
      '@ja value - 引数が二つなら、最初は型、この値は長さです。',
      '@ko value - 두 인수인 경우 첫 번째는 형식이며 이 값은 길이입니다.',
    ]),
    '  constructor(typeOrLength?: number, value?: number) {',
    '    const type = value !== undefined ? typeOrLength!',
    '      : typeOrLength === undefined ? Enums.VerticalAlignType.Baseline',
    '        : Enums.VerticalAlignType.Length;',
    '    styleValues.set(this,',
    '      native.createVerticalAlign(type, value ?? typeOrLength ?? 0));',
    '  }', '');
  } else {
    scalars.push(...doc(scalarDescriptions[name], '  ', [
      `@param type - Native enum; defaults to ${defaultType}.`,
      `@zh type - 原生枚举，默认 ${defaultType}。`,
      `@ja type - ネイティブ列挙。既定は ${defaultType}。`,
      `@ko type - 네이티브 열거이며 기본값은 ${defaultType}입니다.`,
      '@param value - Native float; defaults to zero.',
      '@zh value - 原生浮点数，默认零。',
      '@ja value - ネイティブ実数。既定はゼロ。',
      '@ko value - 네이티브 실수이며 기본값은 0입니다.',
    ]),
    `  constructor(type = Enums.${enumType}.${defaultType}, value = 0) {`,
    `    styleValues.set(this, native.create${name}(type, value));`,
    '  }', '');
  }
  for (const [ field, view, type, check ] of [
    [ line ? 'inheritType' : 'type', 'typeView', `Enums.${enumType}`,
      `checkedStyleEnum(value, ${max})` ],
    [ 'value', 'valueView', 'number', 'checkedStyleFloat(value)' ],
    ...(line ? [
      [ 'inheritValue', 'inheritValueView', 'number',
        'checkedStyleFloat(value)' ],
    ] : []),
  ]) {
    const mapping = line ? 'lineHeightMapping(this)' : 'scalarMapping(this)';
    scalars.push(...doc(scalarField(name, field), '  ', [
      '@returns Native shared scalar field.',
      '@zh 原生共享标量字段。',
      '@ja ネイティブ共有スカラーフィールド。',
      '@ko 네이티브 공유 스칼라 필드입니다.',
    ]),
    `  get ${field}(): ${type} {`,
    `    return ${mapping}.${view}[0];`,
    '  }', '',
    ...doc(scalarField(name, field), '  ', [
      '@param value - Checked native scalar value.',
      '@zh value - 检查后的原生标量值。',
      '@ja value - 検証されたネイティブスカラー値。',
      '@ko value - 검증된 네이티브 스칼라 값입니다.',
    ]),
    `  set ${field}(value: ${type}) {`,
    `    ${mapping}.${view}[0] = ${check};`,
    '  }', '',
    ...doc(words(
      'Writable shared memory for this scalar component; writes update ' +
      'the owned value directly.|' +
      '此标量分量的可写共享内存；写入直接更新独立值。|' +
      'このスカラー成分の書き込み可能な共有メモリ。' +
      '書き込みは所有値を直接更新します。|' +
      '이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.'
    ), '  ', [
      '@returns Writable view; native consumers validate before use.',
      '@zh 可写视图；原生调用前会验证值。',
      '@ja 書き込み可能なビュー。ネイティブの使用前に検証します。',
      '@ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.',
    ]),
    `  get ${view}(): ${view === 'typeView' ? 'Uint8Array' : 'Float32Array'} {`,
    `    return ${mapping}.${view};`,
    '  }', '');
  }
  scalars.push('}', `stylePrototypes.set('${name}', ${name}.prototype);`, '');
}
write('src/generated/style-scalars.ts', scalars);

// Bitfields have no address. Generate typed accessors for them, and map only
// addressable numerical fields directly to the real native struct storage.
const structOutput = [
  banner,
  'import { native } from \'../internal/native\';',
  'import {',
  '  styleStructs, structMapping, checkedStructInteger,',
  '  structColour, checkedStructColour,',
  '} from \'../internal/style-structs\';',
  'import {',
  '  checkedStyleFloat, styleValueHandle, styleValueFromNative,',
  '} from \'../internal/style-values\';',
  'import type { FontFaceHandle } from \'../internal/computed\';',
  'import type { VariantByteColour } from \'../values/types\';',
  'import type { Clip } from \'../style/values/style-values\';',
  'import type * as Enums from \'./style-enums\';',
  '',
];
const structBinding = [
  banner,
  'import type { NativeStyleStruct } from \'../internal/style-structs\';',
  'import type { NativeStyleValue } from \'../internal/style-values\';',
  'import type { FontFaceHandle } from \'../internal/computed\';',
  'import type * as Enums from \'./style-enums\';',
  '',
  '/** @internal */',
  'export interface StyleStructBinding {',
];
const structNative = [ banner ];
const structRegistration = [ banner ];
let totalFields = 0;
for (const name of [ 'CommonValues', 'InheritedValues', 'RareValues' ]) {
  const match = clean('ComputedValues.h').match(new RegExp(
    `struct ${name} \\{([\\s\\S]*?)\\n\\s*\\};`));
  if (!match || !match[1].includes('{}')) {
    throw new Error(`Review struct ${name} constructor`);
  }
  const body = match[1].slice(match[1].indexOf('{}') + 2);
  const fields = [];
  const declarations = body.split(';').map(s => s.trim()).filter(Boolean);
  for (const declaration of declarations) {
    const parsed = declaration.match(/^([\w:]+)\s+([\s\S]+)$/);
    if (!parsed) {
      throw new Error(`Review struct declaration: ${declaration}`);
    }
    const type = parsed[1];
    const declarators = parsed[2].replace(/\{[^{}]*\}|\([^()]*\)/g, '');
    for (const item of declarators.split(',')) {
      const field = item.trim().match(/^(\w+)\s*(?::\s*(\d+))?(?:\s*=.*)?$/);
      if (!field) {
        throw new Error(`Review struct field: ${type} ${item}`);
      }
      fields.push({ type, name: field[1], bits: field[2] });
    }
  }
  totalFields += fields.length;
  const prefix = name[0].toLowerCase() + name.slice(1);
  const nativeOwner = `Rml::Style::${name}`;
  const structDescription = {
    CommonValues: words(
      'Owned storage for common layout and border properties.|' +
      '常用布局和边框属性的独立存储。|' +
      '基本的なレイアウトと境界線プロパティの所有ストレージ。|' +
      '일반 레이아웃 및 테두리 속성의 소유 저장소입니다.'
    ),
    InheritedValues: words(
      'Owned storage for inherited text, colour and input properties.|' +
      '继承的文本、颜色和输入属性的独立存储。|' +
      '継承されるテキスト・色・入力プロパティの所有ストレージ。|' +
      '상속되는 텍스트·색상·입력 속성의 소유 저장소입니다.'
    ),
    RareValues: words(
      'Owned storage for less common layout, transform and ' +
      'effect properties.|' +
      '较少使用的布局、变换和效果属性的独立存储。|' +
      '使用頻度の低いレイアウト・変換・効果プロパティの所有ストレージ。|' +
      '덜 자주 사용하는 레이아웃·변환·효과 속성의 소유 저장소입니다.'
    ),
  }[name];
  structOutput.push(...doc(structDescription, '', [
    '@remarks Uses upstream defaults independently of DOM and runtime.',
    'Numeric views retain this struct only; colour getters return copies.',
    'Non-null font handles require the active runtime generation.',
    '@zh 使用上游默认值，独立于 DOM 和运行时。数值视图仅保活此结构，',
    '颜色 getter 返回副本；非空字体句柄要求当前运行时世代有效。',
    '@ja DOM とランタイムから独立した既定値。数値ビューは構造体のみ保持し、',
    '色の取得はコピーです。非 null のフォントは有効なランタイム世代が必要です。',
    '@ko DOM 및 런타임과 독립된 기본값입니다. 숫자 뷰는 구조체만 유지하고',
    '색은 복사됩니다. null이 아닌 글꼴은 유효한 런타임 세대가 필요합니다.',
  ]), `export class ${name} {`,
  ...doc(words(
    'Create independent storage initialized to the RmlUi defaults.|' +
    '按 RmlUi 默认值创建独立存储。|' +
    'RmlUi の既定値で初期化した独立ストレージを作ります。|' +
    'RmlUi 기본값으로 초기화한 독립 저장소를 만듭니다.'
  ), '  '),
  '  constructor() {',
  `    styleStructs.set(this, native.create${name}());`,
  '  }', '');
  structBinding.push(`  create${name}(): NativeStyleStruct;`);
  structRegistration.push(
    `sfmljs::SetMethod<CreateStruct<${nativeOwner}>>(`,
    `    target, "create${name}");`);
  const mapped = [];
  for (const field of fields) {
    const key = camel(field.name);
    const suffix = pascal(field.name);
    const type = field.type;
    const isEnum = enumNames.has(type) || type.includes('::');
    const publicType = type === 'Clip' ? 'Clip'
      : type === 'uint16_t' || type === 'int16_t' ? 'number'
        : isEnum && type !== 'FontWeight'
          ? `Enums.${type.replace('::', '')}` : types[type];
    if (!publicType) {
      throw new Error(`Unmapped struct field ${name}.${field.name}: ${type}`);
    }
    const view = !field.bits && {
      float: 'Float32Array', uint16_t: 'Uint16Array',
      int16_t: 'Int16Array', Colourb: 'Uint8Array',
    }[type];
    const storage = `structMapping(this).views.${key}`;
    let read;
    let writeLines;
    if (view) {
      mapped.push(field);
      read = type === 'Colourb' ? `structColour(${storage})` : `${storage}[0]`;
      const check = type === 'float' ? 'checkedStyleFloat(value)'
        : type === 'Colourb' ? 'checkedStructColour(value)'
          : `checkedStructInteger(value, ${
            type === 'uint16_t' ? '0, 65535' : '-32768, 32767'})`;
      writeLines = type === 'Colourb'
        ? [ `    const components = ${check};`,
          `    ${storage}.set(components);` ]
        : [ `    const checked = ${check};`,
          `    ${storage}[0] = checked;` ];
    } else {
      const get = `${prefix}Get${suffix}`;
      const set = `${prefix}Set${suffix}`;
      const nativeType = type === 'Clip' ? 'NativeStyleValue' : publicType;
      read = type === 'Clip' ? 'styleValueFromNative(value) as Clip'
        : 'value';
      writeLines = [
        `    native.${set}(`,
        `      structMapping(this).handle, ${
          type === 'Clip' ? 'styleValueHandle(value)' : 'value'},`,
        '    );',
      ];
      structBinding.push(
        `  ${get}(`,
        '    handle: object,',
        `  ): ${nativeType};`,
        `  ${set}(`,
        '    handle: object,',
        `    value: ${type === 'Clip' ? 'object' : publicType},`,
        '  ): void;');
      if (type === 'FontFaceHandle') {
        structRegistration.push(
          `sfmljs::SetMethod<GetFontFace>(target, "${get}");`,
          `sfmljs::SetMethod<SetFontFace>(target, "${set}");`);
      } else {
        const trait = `${name}${suffix}`;
        const cppType = [ 'bool', 'uint16_t' ].includes(type) ? type
          : type === 'String' ? 'Rml::String' : `Rml::Style::${type}`;
        structNative.push(
          `struct ${trait} {`,
          `  using Owner = ${nativeOwner};`,
          `  using Value = ${cppType};`,
          ...(field.bits && !isEnum && type !== 'bool'
            ? [
              `  static constexpr int kMaximum = ${2 ** field.bits - 1};`,
            ]
            : []),
          '  static Value Get(const Owner& owner) {',
          `    return owner.${field.name};`,
          '  }',
          '  static void Set(Owner& owner, Value value) {',
          `    owner.${field.name} = value;`,
          '  }',
          '};', '');
        structRegistration.push(
          `sfmljs::SetMethod<GetField<${trait}>>(`,
          `    target, "${get}");`,
          `sfmljs::SetMethod<SetField<${trait}>>(`,
          `    target, "${set}");`);
      }
    }
    structOutput.push(...doc(fieldDescription(field.name), '  ', [
      '@returns Current native field value.',
      '@zh 当前原生字段值。',
      '@ja 現在のネイティブフィールド値。',
      '@ko 현재 네이티브 필드 값입니다.',
    ]),
    `  get ${key}(): ${publicType} {`,
    ...(!view ? [
      `    const value = native.${prefix}Get${suffix}(`,
      '      structMapping(this).handle);',
    ] : []),
    `    return ${read};`,
    '  }', '',
    ...doc(fieldDescription(field.name), '  ', [
      '@param value - Checked native field value.',
      '@zh value - 经检查的原生字段值。',
      '@ja value - 検証されたネイティブフィールド値。',
      '@ko value - 검증된 네이티브 필드 값입니다.',
    ]),
    `  set ${key}(value: ${publicType}) {`,
    ...writeLines, '  }', '');
    if (view) {
      structOutput.push(...doc(fieldDescription(field.name).map((text, i) => [
        `Writable shared memory: ${text}`, `可写共享内存：${text}`,
        `書き込み可能な共有メモリ：${text}`, `쓰기 가능한 공유 메모리: ${text}`,
      ][i]), '  ', [
        '@returns Writable native memory; views bypass setter validation.',
        '@zh 原生可写内存；直接写视图不执行 setter 校验。',
        '@ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。',
        '@ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.',
      ]),
      `  get ${key}View(): ${view} {`,
      `    return ${storage} as ${view};`,
      '  }', '');
    }
  }
  structNative.push('template <>',
    `void MapStruct<${nativeOwner}>(`,
    '    v8::Local<v8::Object> views,',
    `    const std::shared_ptr<StructStorage<${nativeOwner}>>& owner) {`);
  for (const field of mapped) {
    structNative.push(
      `  MapField(views, "${camel(field.name)}",`,
      `           owner, &owner->value.${field.name});`);
  }
  structNative.push('}', '');
  structOutput.push('}', '');
}
if (totalFields !== 112) {
  throw new Error(`Review style structs: ${totalFields} fields`);
}
structBinding.push('}');
write('src/generated/style-structs.ts', structOutput);
write('src/generated/style-struct-binding.ts', structBinding);
write('native/generated/rmlui-style-struct-fields.inc', structNative);
write('native/generated/rmlui-style-struct-bindings.inc', structRegistration);
