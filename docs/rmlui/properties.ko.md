# 형식 속성과 정의

## 속성 ID 명세

`PropertyId`와 `ShorthandId`는 기본 스타일시트 명세에 속합니다.
`MediaQueryId`는 14개 미디어 조건을, `FontFaceId`는 `@font-face` 필드를
식별합니다. 네 열거형은 RmlUi 6.3의 `Core/ID.h`에서 생성합니다.
각 값은 별도 명세에 속하므로 미디어 또는 폰트 ID를 Element 속성 메서드에
`PropertyId`로 전달하면 안 됩니다.

미디어 조건은 Native에서 해석하고 크기, 픽셀 밀도, 테마가 바뀔 때 평가합니다.
해상도는 `x` 단위를 사용하며 예는 `@media (resolution: 2x)`입니다.
폰트 소스는 선언 순서대로 로드합니다. 스타일, 굵기, 폴백, 페이스 번호를
생략하면 기본값은 Normal, Auto, false, 0입니다.

```js
const { MediaQueryId, FontFaceId } = require('sfml.js-rmlui');
const feature = MediaQueryId.AspectRatio;
const fontField = FontFaceId.FaceIndex;
```

## 소유 Variant와 변환 대상

`new Variant(value)`는 Native가 소유하는 `Rml::Variant`를 생성합니다.
인수를 생략하면 `NONE`이며 다른 Variant는 정확한 저장 형식을 복사합니다.
`getType()`은 공유 메타데이터를 읽습니다. `clone()`, `assign(value)`,
`move()`, `moveAssign(source)`, `clear()`는 네이티브 연산을 사용합니다.
이동 후에도 원본 형식은 유지되며 문자열과 컨테이너는 이동 후 상태가 되고
숫자는 원래 값을 유지합니다. 종료 후 형식은 `NONE`이며 값 연산은 무효화됩니다.

`get(defaultValue)`는 `Rml::Variant::Get<T>` 기본값을 유지합니다.
`getInto(defaultValue)`는 네이티브 성공 여부와 값을 `{ success, value }`로 반환합니다.
`getReference(VariantType.X)`는 정확한 저장 형식을 확인하고 참조를 읽으며
복합 출력은 독립 스냅샷입니다. Element 복사본은 수명 슬롯을 공유합니다.
`getElementValue()`는 동일성을 유지하는 요소를 반환하고 파괴 후 `null`이 됩니다.
속성, 속성 사전, 이벤트 매개변수에도 소유 Variant의 복사본을 전달할 수 있습니다.

```js
const { Variant, VariantType } = require('sfml.js-rmlui');
const value = new Variant('17, bad, 3');
const result = value.getInto({ type: 'vector3i', x: 91, y: 92, z: 93 });

// { success: false, value: { x: 17, y: 92, z: 93 } }
value.assign({ type: 'character', value: 0x1f600 });
value.getType() === VariantType.INT64;
value.get({ type: 'character', value: 0 }); // 128512
```

`vector2i`, `vector3i`, `vector4i`는 int32 성분의 정수 벡터 변환 대상입니다.
해당 Variant 저장 형식이 없으므로 선택기를 값으로 저장할 수 없습니다.
문자열 변환은 네이티브 쉼표 구분을 사용합니다. 성분이 부족하면 전체 기본값을 유지하고
중간에 실패하면 변환된 앞부분을 유지합니다. 네이티브가 읽는 성분만 범위를 확인합니다.
`character`는 `Rml::Character` 열거형이며 `INT64`로 저장합니다.
읽기는 int64 변환 후 uint32를 반환하며 유니코드 스칼라로 추가 제한하지 않습니다.
Property와 스타일 조회는 0 기본값을 사용하고 속성, 이벤트 매개변수, Variant는
호출자의 기본값을 사용합니다. 형식별 어댑터 없는 네이티브 포인터는 저장할 수 없습니다.

문자열 변환, `Property.toString()`, `PropertyDefinition.getValue()`,
`PropertySpecification.propertiesToString()`은 출력이 포인터를 직렬화하면
`TypeError`를 발생시킵니다. 중첩된 데코레이터와 필터 속성도 포함합니다.
효과에 캐시된 문자열이 있으면 숨겨진 속성을 읽지 않고 반환하며,
일반 스칼라 변환에서는 네이티브 소유자를 순회하지 않습니다.

문자열에서 불리언으로 변환할 때 `1`, `true`, `0`, `false`를 대소문자 구분 없이
허용하지만 공백은 제거하지 않습니다. float/double은 네이티브 `atof`를 따르며
숫자가 아닌 텍스트와 빈 문자열도 성공적으로 0으로 변환됩니다. 바이트 색상은
빈 문자열에서 실패하면 초기 색상을 유지합니다. 비어 있지 않은 잘못된 색상은
불투명한 검정으로 변경한 후 실패합니다. 부동소수점 색상의 각 성분도 같은 해석기를
사용하므로 숫자가 아닌 성분은 0이 됩니다.

문자열 변환 대상은 출력의 초기값이기도 합니다. 전환 및 애니메이션 목록은 여기에
추가하고 비어 있지 않은 효과 목록의 캐시 텍스트도 추가합니다. 변환, 색상 정지점,
그림자 목록은 문자열을 대체하고 빈 효과 목록 또는 null은 `none`이 됩니다.
부동소수점 텍스트는 소수 세 자리로 만든 후 끝의 0을 제거합니다. 네이티브
`ToString`, `FromString`, 변환기 특수화는 이러한 진입점을 지원하는 C++ 기능이며
JS는 값과 형식별 기본값으로 변환을 선택합니다.

## 전역 RCSS 등록과 사용자 해석기

`StyleSheetSpecification`은 전역 속성과 해석기 레지스트리입니다.
수명은 `initialise` / `shutdown`을 따르며 문서를 로드하기 전에 사용자 속성을 등록합니다.
`registerProperty(name, defaultValue, inherited, forcesLayout = false)`는
수정 가능한 정의를 반환합니다. 내장 이름은 예약되어 있고 중복된 사용자 이름은 기존 정의를 유지합니다.
용량 초과는 네이티브 맵을 수정하기 전에 예외를 발생시킵니다.
`registerShorthand(name, properties, type)`는 로컬 명세와 같은 검증 및 여섯 방식을 사용합니다.

`getProperty(nameOrId)`, `getShorthand(nameOrId)`와 세 `getRegistered…` 메서드는
조회 결과와 ID 집합 사본을 제공합니다. `getPropertyId`, `getPropertyName`,
`getShorthandId`, `getShorthandName`은 이름과 ID를 변환합니다.
`getShorthandUnderlyingProperties(id)`는 중복 없는 속성 ID를 재귀적으로 수집합니다.
`parsePropertyDeclaration(dictionary, name, value)`는 선언을 기록합니다.
`getPropertySpecification()`은 대여된 읽기 전용 명세를 반환하며 종료 시
해석기 및 정의 핸들과 함께 무효화됩니다.

```js
const { StyleSheetSpecification: styles, PropertyParser, Unit } =
  require('sfml.js-rmlui');
const parser = new PropertyParser((property, value, parameters) => {
  if (!/^count:\d+$/.test(value)) {
    return false;
  }

  property.value = Number(value.slice(6)) * parameters.factor;
  property.unit = Unit.NUMBER;

  return true;
});

styles.registerParser('count-parser', parser);
styles.registerProperty('item-count', 'count:2', true)
  .addParser('count-parser', 'factor=3');
```

RCSS의 `item-count: count:4`는 상속되는 숫자 12가 됩니다.
`getParser(name)`은 검사된 내장/사용자 해석기 또는 `null`을 반환합니다.
`parser.parseValue(property, text, parameters = {})`로 직접 해석할 수 있으며 매개변수는 int32입니다.
매개변수 맵과 출력 속성은 복사본이므로 반환 후 수정은 해석된 스타일에 영향을 주지 않습니다.
false는 일반적인 네이티브 부분 기록을 유지합니다. 예외와 잘못된 출력 형식은 출력을 반영하지 않으며
예외는 네이티브 호출 종료 후 전달됩니다. 콜백은 동기 불리언을 반환해야 합니다.
Property 읽기와 쓰기는 허용되지만 중첩 해석, 등록 변경, DOM/런타임 작업은 예외를 발생시킵니다.
등록된 해석기는 종료까지 클로저를 유지하며 미등록 해석기의 순환 참조는 회수할 수 있습니다.
해석기가 생성한 애니메이션 콜백은 네이티브 기본값이나 스타일이 보유하는 동안 유지됩니다.
독립 Property나 사전의 복사본은 회수 가능한 JS 참조로 유지됩니다.

## 속성 명세

`new PropertySpecification(reserveProperties, reserveShorthands)`는 로컬 명세를
소유합니다. 예약 용량은 속성 0–127개, 단축 속성 0–254개이며 ID는 할당하지 않습니다.
`registerProperty(name, defaultValue, inherited, forcesLayout,
id = PropertyId.Invalid)`는 `addParser`로 설정할 수 있는 수정 가능한 정의를 반환합니다.
자동 ID는 1부터 시작하고 할당된 최대 ID 다음으로 진행하며 명시적인 희소 ID도 지원합니다.
같은 이름의 등록은 기존 정의를 유지합니다. ID 충돌과 용량 소진은 등록 전에 예외를 발생시킵니다.
빈 이름과 `invalid`는 예약 값입니다.

`getProperty(nameOrId)`는 검사된 정의 또는 `null`을 반환합니다.
`getRegisteredProperties()`, `getRegisteredInheritedProperties()`,
`getRegisteredPropertiesForcingLayout()`는 독립적인 오름차순 ID 배열입니다.
명세 래퍼가 회수되어도 등록 정의는 종료까지 네이티브 저장소를 유지하며 종료 시 무효화됩니다.

```js
const {
  PropertySpecification, PropertyDictionary, ShorthandType,
} = require('sfml.js-rmlui');
const specification = new PropertySpecification(2, 1);

specification.registerProperty('x', '0px', false, false).addParser('length');
specification.registerProperty('y', '0px', false, false).addParser('length');
const pair = specification.registerShorthand('pair', 'x,y',
  ShorthandType.Replicate);
const values = new PropertyDictionary();

specification.parseShorthandDeclaration(values, pair, '4px');
console.log(specification.propertiesToString(values, true, ';'));
```

`registerShorthand(name, properties, type, id = ShorthandId.Invalid)`는 여섯 가지
`ShorthandType`을 지원합니다. 구성 이름은 쉼표로 구분하며 `?`, `#` 접미사를 지원합니다.
구성 누락 또는 중복은 `Invalid`를 반환하고 잘못된 선언은 이름이나 ID를 예약하지 않습니다.
Box는 네 속성, Flex는 세 속성이 필요하며 잘못된 항목 수는 예외를 발생시킵니다.
`getShorthand(nameOrId)`는 속성과 중첩 단축 속성을 구분하는 구조 스냅샷을 반환합니다.
속성 정의 참조는 실행 세대를 검사합니다.

`parsePropertyDeclaration(dictionary, nameOrId, value)`는 속성 ID 또는 속성,
단축 속성, 사용자 변수 이름을 받으며 `parseShorthandDeclaration`는 단축 속성 ID를 받습니다.
두 메서드는 네이티브 성공 결과를 반환하며 실패 시 일부 기록을 유지합니다.
`setPropertyDefaults(dictionary)`는 누락된 속성만 채웁니다.
`propertiesToString(dictionary, includeName, delimiter)`는 일반 속성을 ID 순서로
직렬화하고 끝 구분자를 붙이지 않습니다. 구분자는 네이티브 `char`와 같은 UTF-8 한 바이트입니다.

## 속성 사전

`PropertyDictionary`는 현재 런타임에서 네이티브 사전을 소유합니다.
일반 속성은 `PropertyId`, 사용자 속성은 문자열, 변수 약식은 `ShorthandId`를 사용하며
세 맵은 독립적입니다. 기본 스타일시트 식별자를 장식이나 글꼴 효과의 로컬 명세에
재사용하면 안 됩니다.

`setProperty(id, property)`, `setCustomProperty(name, property)`,
`setVarShorthand(id, property)`는 입력을 복사합니다. 변수 약식은
`Unit.VAR_EXPRESSION` 단위의 문자열 Property가 필요합니다. 식별자는 0이 아니며
해당 `MaxNumIds` 미만이어야 합니다. `getProperty`, `getCustomProperty`,
`getVarShorthand`는 독립 복사본 또는 `null`을 반환합니다.
`getProperties()`, `getCustomProperties()`, `getVarShorthands()`는 복사본의 새 Map입니다.

`removeProperty(id)`는 반환 값이 없습니다. `removeCustomProperty(name)`과
`removeVarShorthand(id)`는 항목의 존재 여부를 반환합니다.
`getNumProperties()`는 일반 속성만 계산하고, `empty()`와 `clear()`는 세 맵 모두에 적용합니다.

`import(source, specificity = -1)`는 입력 우선순위가 기존 값 이상이면 덮어씁니다.
RmlUi 6.3은 양수일 때만 우선순위를 강제하며 0과 음수는 입력 우선순위를 유지합니다.
`merge(source, specificityOffset = 0)`는 오프셋을 더한 후 비교하며 int32 오버플로이면
어떤 항목도 변경하기 전에 예외를 발생시킵니다. 자기 가져오기와 병합은 스냅샷을 읽습니다.
`setSourceOfAllProperties(sourceOrNull)`는 출처를 한 번 복사하여 모든 맵의 항목에 설정합니다.

저장된 콜백은 네이티브 복사본과 JS에 보이는 참조로 유지합니다.
지우기나 GC는 참조를 해제하며 사전을 캡처한 콜백의 순환도 수집됩니다.
종료 시 RmlUi 해제 전에 리소스를 해제하고 이전 사전 핸들을 무효화합니다.

## 요소 속성

`Element.getProperty(nameOrId)`는 상속, 기본값, 정의, 원본 정보를 포함한 네이티브 속성을
즉시 복사합니다. 계단식 변수는 `context.update()` 후 읽습니다. 누락은 `null`입니다.
`getLocalProperty(nameOrId)`는 인라인 재정의와 일치하는 RCSS 규칙을 읽고 상속·기본값은
제외하며 변수를 해석하지 않습니다.
`getLocalStyleProperties()`는 클래스 규칙과 사용자 변수를 제외한
`Map<PropertyId, Property>` 복사본을 반환합니다.

```js
const { Property, PropertyId, Unit } = require('sfml.js-rmlui');
const width = element.getProperty('width');

element.setProperty(PropertyId.Width, new Property(120, Unit.PX));
element.setProperty('height', '30px');
console.log(width.toString()); // 읽었을 때의 값을 유지합니다.
element.removeProperty(PropertyId.Width);
```

`new Property()` 기본값은 null/NONE, UNKNOWN, 명시도와 파서 인덱스 -1,
정의와 원본 null입니다. 정수 인수 하나는 KEYWORD 열거형 생성자를 선택합니다.
단위를 지정한 JavaScript 숫자는 DOUBLE, 열거형 형식은 INT로 저장합니다.

`{ type, value }`로 숫자 저장 형식 또는 변환 템플릿을 명시적으로 선택합니다.
`byte`, `char`, `float`, `double`, `int`, `uint`는 유한한 JavaScript 숫자를 받으며
정수 형식에는 네이티브 범위의 정수가 필요합니다. `byte`는 0–255, `int`는 부호 있는
32비트, `uint`는 부호 없는 32비트입니다. `char` 범위는 플랫폼을 따르며 `float`는
단정밀도로 반올림합니다. `int64`, `uint64`는 해당 부호 있는 또는 없는 64비트 범위의
정확한 BigInt가 필요하며 작은 양수도 부호 없는 형식을 선택할 수 있습니다.
원시 값 읽기는 number 또는 BigInt를 반환합니다.

```js
const count = new Property({ type: 'uint', value: 12 }, Unit.NUMBER);
const narrow = count.get({ type: 'int', value: 0 });

element.setAttribute('total', { type: 'uint64', value: 12n });
const total = element.getAttribute('total', { type: 'uint64', value: 0n });
```

같은 예제를 Property, 속성, 이벤트 템플릿에 사용할 수 있습니다. 네이티브 Variant 동등
비교는 저장 형식을 구분합니다. RmlUi 6.3에는 byte-to-byte, double-to-byte,
string-to-char 변환기가 없습니다. 원시 byte 읽기는 값을 유지하지만 이러한 템플릿 변환은
속성/이벤트의 대체 값 또는 Property의 `T{}`를 반환합니다.
안전하지 않은 실수 및 문자열의 정수 변환은 네이티브 캐스트나 스캔 전에 예외를 발생시킵니다.
유효한 십진 접두사와 부호 없는 문자열 변환의 부호 접두사는 유지합니다.
입력 접근자를 실행한 다음 수신 객체의 유효성을 검사합니다.

`value`는 스칼라, 벡터, 색상, 색상 정지점 및 그림자 목록, 변환,
[전환/애니메이션 목록](animation.ko.md#typed-css-motion-values)을 복사합니다.
Element 참조는 속성과 특성 복사 후에도 같은 래퍼를 반환합니다.
`property.getElementValue()`와
`element.getElementAttribute(name, fallback = null)`은 네이티브
`ScriptInterface*` 변환을 선택합니다. 키 누락 또는 변환 실패는 대체 값을 반환하며,
파괴된 저장 대상은 null로 정상 변환됩니다. 도달 가능한 소유자가 독립 요소를 유지하며
값 삭제·교체는 참조를 해제합니다. 자기 참조와 요소 간 순환은 수집할 수 있습니다.
명시적 해제와 DOM 파괴는 모든 복사본 참조를 null로 만들고 종료는 실행 세대를 무효화합니다.

Element, Context, RmlEvent 입력은 보호된 네이티브 ScriptInterface 포인터를 저장합니다.
`get({ type: 'scriptinterface', value: null })`은 네이티브 기본 포인터 변환을 선택합니다.
속성과 이벤트 읽기는 지정한 기본값을 보존하며 Property의 초기 대상은 null입니다.
Context 제거, 이벤트 해제, 각 콜백 종료는 모든 저장 복사본을 null로 만듭니다.
원시 읽기는 원래 Context 또는 이벤트 래퍼를 반환합니다.
복사본은 수집 가능한 JS 참조로 대상을 유지하며 변경 없는 프레임은 소유자를 스캔하지 않습니다.

포인터 템플릿 읽기는 요소 API 또는 scriptinterface를 사용합니다.
`getAttribute(name)`, 문자열 기본값 읽기,
`Property.toString()`, `PropertyDefinition.getValue(property)`는 포인터 값을 거부합니다.
RML 직렬화는 포인터 주소를 출력하지 않습니다. 원시 `value`, `getAttributeValue()`,
`getAttributes()`는 Element, Context, RmlEvent 또는 null을 반환합니다.

장식, 필터, 글꼴 효과는 `DecoratorList`, `FilterList`,
`FontEffectList` 리소스 객체를 반환하며 속성과 이벤트 입력으로도 사용할 수 있습니다.

```js
const { FilterList } = require('sfml.js-rmlui');
const filters = new FilterList('blur(2px) brightness(75%)');

element.setProperty(PropertyId.Filter, new Property(filters, Unit.FILTER));
console.log(filters.value, filters.list);
```

생성자는 네이티브 명세로 RCSS를 해석합니다. `value`는 원래 문자열, `isNull`은 공유
포인터의 null 여부, `list`는 선언 복사본 또는 `FontEffect` 래퍼입니다. 장식 선언은 `type`, `isNamed`,
`paintArea`, `properties`를, 필터 선언은 `type`, `properties`를 제공합니다.
속성 항목은 생성기 내부 `id`, `name`, 소유 `Property`를 포함합니다.
명명된 장식은 스타일시트가 나중에 해석합니다. 글꼴 효과 정보는 `hasUniqueTexture`,
비선곱 `colour`, `layer`(`FontEffectLayer.Back`/`Front`),
정확한 BigInt `fingerprint`를 포함합니다.

메타데이터 수정은 네이티브 선언을 바꾸지 않습니다. 목록을 다른 속성에 대입하면 공유
리소스 동일성을 유지하며, 같은 텍스트를 별도로 해석하면 다른 포인터를 만듭니다.
빈 입력이나 `"none"`은 형식이 있는 null 목록이며 `value`는 `''`, `list`는 빈 배열입니다.
속성 형식 변환 실패는 형식이 있는 null을, 속성/이벤트 기본값 API는 지정한 대체 값을
반환합니다. CSS `font-effect: none`은 여전히 Variant NONE(`null`)입니다.
DOM 종료나 래퍼 GC 후에도 소유자가 있으면 사용할 수 있지만 원래 실행 세대가 필요합니다.
실행 종료는 리소스를 해제하고 목록을 무효화합니다. 복사된 글꼴 정보와 수치 기록은
읽을 수 있습니다. FontEffect 래퍼 자체는 종료 시 무효화됩니다.

`FontEffectList`는 `(effects, text?)` 생성과 수정 가능한 `value`, `list`도 제공합니다.
텍스트 대입은 RCSS를 해석하지 않습니다. 목록 대입은 입력 순서로 불변 효과를 저장합니다.
대입마다 새 영역을 만들어 기존 Property와 DOM 스냅샷을 유지합니다. `[]`와 null 대입은
null이 아닌 영역을 만듭니다. RCSS 해석 결과는 뒤/앞 레이어 순서를 유지합니다.

`new FontEffect()`는 흰색, Back, 지문 `0n`인 기본 효과입니다. 자체 텍스처가 없고
글리프 메트릭을 지원하지 않으며 텍스처를 생성하지 않습니다. 해석한 효과는 파생 구현을
유지합니다. `colour`, `layer`, `fingerprint` 수정은 메타데이터를 복사하며 다른 소유자의
효과를 변경하지 않습니다. 수정한 효과는 목록에 다시 대입해야 합니다.
`colour`는 독립 복사본이므로 변경하려면 전체 값을 대입합니다.

`FontGlyph`의 `bearing`, `advance`, `bitmapDimensions`, `colorFormat`은
각 `Int32Array` 뷰로 네이티브 영역에 매핑됩니다. 비트맵 대입은 입력 뷰 범위를
네이티브 전용 영역에 복사합니다. `bitmapData`와 `bitmapOwnedData`는 영역을 유지하는
쓰기 가능한 뷰입니다. 어느 필드든 대입하면 데이터 포인터를 설정하며 null은 지웁니다.
`weakCopy()`는 메트릭을 복사하고 현재 영역을 공유하며 `bitmapOwnedData`는 null입니다.
원본 교체·수집 후에도 약한 복사와 뷰는 유효합니다. 이 독립 값은 종료 후에도 사용 가능합니다.

`effect.getGlyphMetrics(glyph, origin?, dimensions?)`는
`{ supported, origin, dimensions }`를 반환하며 기본값은 원점 0과 비트맵 크기입니다.
`effect.generateGlyphTexture(bytes, dimensions, stride, glyph)`는 네이티브에서
선곱 RGBA를 씁니다. stride는 바이트 단위이며 행 패딩은 유지합니다.
범위, 형식, 분리/공유 버퍼와 입력·출력 중복을 검증합니다.

`new FontEffect(callbacks)`는 선택적인 동기 콜백 `hasUniqueTexture()`,
`getGlyphMetrics(glyph, origin, dimensions)`,
`generateGlyphTexture(destination, dimensions, stride, glyph)`를 받습니다.
생략 시 기본 클래스 동작을 유지합니다. 메트릭은 실제 입력 원점을 사용하며
`{ supported, origin, dimensions }`를 반환합니다. 글리프는 보관 가능한
독립 네이티브 소유 복사본입니다. 비트맵이 있으면 선언된 크기만큼 저장소가 필요하며,
메트릭 호출에서는 null 비트맵도 허용합니다.

텍스처 작업 공간은 네이티브 소유이며 원래 행 간격을 유지합니다.
행의 초기 픽셀은 대상과 같고 패딩은 0입니다. 동기 호출 성공 시 행 픽셀만 반영합니다.
보관된 뷰는 대상을 참조하지 않습니다. 예외, Promise, 작업 버퍼 분리,
대상 전송·축소 시 쓰기를 취소합니다. 재귀 및 런타임·DOM 변경은 거부하고
메타데이터 수정은 허용합니다.

목록, 속성 복사본, 사전과 중첩 선언 속성은 속성 정의의 기본값을 포함하여
사용자 효과 콜백을 유지합니다. 스타일시트는 비활성 규칙과 키프레임도 유지합니다.
문서는 `close()`부터 다음 컨텍스트 갱신까지를 포함하여 네이티브 파괴 전까지
스타일을 보유합니다. 분리된 요소 트리와 독립 정의는 GC가 추적하는 참조를 사용하므로
콜백과 소유자 사이의 순환을 수집할 수 있습니다. 등록된 기본값과 전역 스타일시트
캐시는 네이티브 루트입니다. 컨텍스트 루트에는 커서 프록시와 드래그 클론, 그리고
다음 업데이트 전까지 파괴되지 않는 언로드 문서도 포함됩니다. 요소 속성은 요소
트리의 소유 관계를 따릅니다.

기본 글꼴 엔진의 레이어는 문서를 닫은 후에도 효과를 보유합니다.
`releaseFontResources()`는 캐시 참조를 해제하지만 다른 값이나 스타일이 소유한
콜백은 유지됩니다. 소유권 추적은 네이티브 효과의 동일성과 아틀라스 재사용을 보존합니다.
종료 시 이전 래퍼가 남아 있어도 모든 콜백을 해제합니다. 사용자 속성 해석기에서
효과 생성과 목록 복사는 가능하며 중첩 RCSS 해석은 계속 거부됩니다.

`FontEffect.fillColorValuesFromAlpha(bytes, dimensions, stride)`는 네이티브
protected 보조 함수입니다. 각 RGBA 픽셀의 알파를 세 색상 채널에 복사하고 알파와
행 패딩은 유지합니다. 비공유 `Uint8Array` 부분 뷰를 받으며 크기, 행 간격, 저장 범위를
검증합니다. 초기화 전, 종료 후, 워커에서도 사용할 수 있습니다.

`DecoratorDeclaration`과 `FilterDeclaration`은 수정 가능한 레코드입니다.
`instancer`에는 `DecoratorInstancer.get(name)` 또는 `FilterInstancer.get(name)`의
형식이 있는 참조를 저장합니다. 없는 이름은 `null`을 반환합니다. 장식의 null은 명명된
참조이며 필터는 null이 아닌 생성기가 필요합니다. 빈 생성자는 `type: ''`,
`properties: []`, `instancer: null`과 장식의 `paintArea: BoxArea.Auto`를 설정합니다.
`isNamed`는 현재 생성기 필드에서 계산됩니다.

`new DecoratorList(records, text?)`와 `new FilterList(records, text?)`는 레코드를
네이티브 저장소로 복사합니다. 두 목록의 `value`와 `list`는 수정 가능합니다.
`value` 변경은 메타데이터 문자열만 바꾸며 RCSS를 해석하지 않습니다.
`list` 변경은 선언을 복사하며 `value`를 유지합니다. 대입마다 새 공유 목록을 만들므로
기존 속성과 이벤트가 보유한 스냅샷은 유지됩니다. null 목록에 대입하거나 `[]`로
생성하면 null이 아닌 저장소를 만듭니다. 입력 배열, 선언, 속성은 독립적입니다.

```js
const records = filters.list;
const sigma = records[0].properties.find(entry => entry.name === 'sigma');

sigma.property.value = 6;
filters.list = records;
element.setProperty(PropertyId.Filter, new Property(filters, Unit.FILTER));
```

해석된 선언에서 생성기에 필요한 전체 속성 사전을 얻으세요. 필수 속성 누락, 알 수 없는
로컬 ID, 잘못된 생성기 형식, 만료된 참조와 잘못된 그리기 영역은 대입 전에 거부됩니다.
속성의 `name`은 표시용이며 `id`가 필드를 지정합니다.

`DecoratorInstancer`, `FilterInstancer`, `FontEffectInstancer`는
`get(name)`, `register(name, instancer)`, `getPropertySpecification()`을 제공합니다.
등록 시 이름을 소문자로 바꾸며 조회 시에는 입력 이름 그대로 일치시킵니다.
교체 후에도 기존 참조를 위해 이전 인스턴서를 종료까지 유지합니다.
명세는 로컬 ID를 사용하는 읽기 전용 뷰입니다.

`new FontEffectInstancer(callback)`은 네이티브 효과 생성을 구현합니다.
`registerProperty(name, defaultValue, affectsGeneration = true)`와
`addParser(...)`로 속성을 등록하고 `registerShorthand(...)`로
`font-effect` 단축 속성을 등록하면 익명 RCSS 인수를 해석합니다.
동일 이름은 최초 정의를 유지합니다. 잘못된 단축 속성은 ID를 소비하지 않으며 용량을 미리 검사합니다.

```js
const source = new FontEffect();
const custom = new FontEffectInstancer((name, properties) => {
  source.colour = properties.getProperty(tint.id).get({
    type: 'colourb', red: 255, green: 255, blue: 255, alpha: 255,
  });

  return source;
});
const tint = custom.registerProperty('tint', 'white', false)
  .addParser('color');

custom.registerShorthand('font-effect', 'tint', ShorthandType.FallThrough);
FontEffectInstancer.register('tint', custom);
const effects = new FontEffectList('tint(red)');
```

콜백은 소유 사전 사본을 받고 `FontEffect` 또는 `null`을 동기 반환합니다.
RCSS 해석기가 지문을 설정하기 전에 메타데이터를 복사하므로 반환된 래퍼의 스냅샷과
글리프 가상 구현을 보존합니다. RmlUi 6.3은 `affectsGeneration`을 저장하지만
해석 지문에는 모든 속성을 사용하며 바인딩은 이 동작을 유지합니다.
직접 `instanceFontEffect(name, properties)`를 호출하려면 전체 속성이 필요합니다.
먼저 `specification.setPropertyDefaults(properties)`로 기본값을 채울 수 있습니다.
직접 호출은 RCSS 지문을 계산하지 않습니다. 사본 조작과 다른 인스턴서로의 위임은 허용하지만
재귀 생성, 해석, 등록, DOM 변경은 예외입니다. 예외는 최외곽 경계에서 전달됩니다.
등록된 콜백은 종료까지 유지하며 미등록 순환 참조는 GC로 회수됩니다.
종료 시 모든 뷰가 무효화됩니다.

`new FilterInstancer(callback)`은 필터 팩터리를 제공합니다.
`registerProperty(name, defaultValue).addParser(...)`와 `filter` 단축 속성을
사용하며 이 등록에는 `affectsGeneration` 인수가 없습니다.
콜백은 사전 사본을 받고 소유 `Filter` 또는 `null`을 동기 반환합니다.
`FilterInstancer.get(name).instanceFilter(name, properties)`로 위임할 수 있습니다.
직접 호출에는 기본값을 포함한 전체 로컬 속성이 필요합니다.
사전을 나중에 변경해도 생성된 필터의 네이티브 매개변수는 바뀌지 않습니다.

```js
const blur = FilterInstancer.get('blur');
const parameters = new PropertyDictionary();

blur.getPropertySpecification().setPropertyDefaults(parameters);
const filter = blur.instanceFilter('blur', parameters);
const overflow = filter.extendInkOverflow(element, {
  p0: { x: 0, y: 0 },
  p1: { x: 40, y: 30 },
});
```

`extendInkOverflow`는 네이티브 가상 함수를 호출하고 입력을 변경하지 않은
`Rectanglef` 모서리 사본을 반환합니다. 상대 길이는 전달한 유효한 요소로 해석합니다.
콜백 제한, 교체와 종료 동작은 위 설명과 같습니다.
`compileFilter(element)`는 고유한 컴파일 리소스를 반환합니다.
[렌더 리소스](resources.ko.md)를 참조하세요.
`new Filter({ compileFilter, extendInkOverflow? })`는 가상 함수를 동기 구현합니다.
컴파일 콜백은 요소를 받고 해당 요소의 렌더 관리자로 만든 `CompiledFilter`를
반환합니다. 소유권은 네이티브로 이전되고 원래 래퍼의 `isValid`는 false가 됩니다.
같은 리소스를 다시 반환하면 예외가 발생합니다. 다른 관리자의 리소스는 원래
소유권을 유지한 채 거부합니다. 실패 시 새 빈 `CompiledFilter`를 반환합니다.
선택적 넘침 콜백은 사각형 복사본을 받고 유한값 모서리를 반환해야 합니다.

```js
const custom = new Filter({
  compileFilter(element) {
    return element.getRenderManager().compileFilter('blur', { sigma: 2 });
  },
  extendInkOverflow(element, overflow) {
    overflow.p0.x -= 6;
    overflow.p1.x += 6;

    return overflow;
  },
});

FilterInstancer.register('custom', new FilterInstancer(() => custom));
```

효과 콜백은 속성과 상자 복사본 조회, 수치 길이 해석, 리소스 컴파일을 지원합니다.
DOM/스타일 변경, 종료, 재귀 렌더링은 거부합니다. 네이티브 요소 효과는 콜백을
유지합니다. 분리된 트리와 독립 필터는 GC가 추적하는 참조를 사용하므로 자신을
캡처한 클로저도 회수할 수 있습니다. 종료 시 콜백을 해제하고 필터를 무효화합니다.
사용자 정의 장식 생성과 글리프 가상 함수 재정의는 모두 구현되었습니다.
네이티브 소유권이 콜백을 유지하고 분리되거나 독립된 객체의 순환은 회수할 수 있으며
종료 시 해제됩니다.

`ColorStopList`는 `{ type: 'colorstoplist', values: ColorStop[] }`,
`BoxShadowList`는 `{ type: 'boxshadowlist', values: BoxShadow[] }` 형식입니다.
색상은 `{ type: 'colourb-premultiplied', red, green, blue, alpha }`이며
채널은 0부터 255까지의 정수입니다. RGB에는 이미 알파가 곱해져 있으며 읽거나
대입할 때 다시 곱하거나 나누지 않습니다. 수치는 `{ number, unit }` 형식입니다.
순서, 음수 오프셋, 상대 단위와 생략된 위치(`Unit.UNKNOWN`)를 유지합니다.
독립 복사본이므로 GC 또는 종료 후에도 읽을 수 있습니다.

```js
/** @type {import('sfml.js-rmlui').BoxShadowList} */
const emptyShadows = {
  type: 'boxshadowlist', values: [],
};
const shadows = element.getProperty('box-shadow', emptyShadows);

if (shadows.values.length) {
  shadows.values[0].offsetX = { number: 8, unit: Unit.PX };
  element.setProperty(PropertyId.BoxShadow,
    new Property(shadows, Unit.BOXSHADOWLIST));
}
```

같은 목록을 속성과 이벤트에도 사용할 수 있습니다. `getAttributeValue(name)`는
원시 목록을 읽고 `getAttribute(name)`는 기존 문자열 변환을 유지합니다.
형식이 지정된 속성·이벤트 읽기는 제공된 기본값을 사용하며 스타일 속성 변환 실패는
빈 목록을 반환합니다. 잘못된 항목, 유한하지 않은 수치와 범위를 벗어난 색상은
대상을 변경하지 않고 예외를 던집니다. 수치 입력에 NumericValue 객체를 사용할 수
있으며 출력은 공유 뷰가 없는 일반 레코드입니다.
`Property.equals`와 `notEquals`는 모든 항목 필드를 포함해 목록을 값으로 비교합니다.
항목 하나인 목록의 비교는 네이티브 ColorStop/BoxShadow 연산자와 같은 의미입니다.

`get(typeExemplar)`는 `0`으로 double, `0n`으로 부호 있는 64비트 정수,
`''`로 문자열 또는 벡터·색상 구조로 변환 형식을 선택합니다.
실패 시 예제의 값이 아닌 `T{}`를 반환합니다.
`element.getProperty(name, typeExemplar)`는 누락된 속성에도 `T{}`를 반환합니다.
`getNumericValue()`는 독립 `NumericValue`, `toString()`은 정의를 사용하는 문자열을
반환합니다. 동등 비교는 단위와 값만 비교합니다.

`unit`, `specificity`, `parserIndex`는 각각 단일 요소 `Int32Array`로 네이티브 메타데이터를
매핑하고 호출 경계에서 속성에 동기화합니다. 뷰는 정수만 유지하므로 GC 스레드에서
스타일 자원을 해제하지 않습니다. 버퍼는 이전 불가로 표시하며 구조화 복제는 복사합니다.
`source`는 `{ path, lineNumber, ruleName }` 복사본입니다.
요소에 적용하려면 `setProperty`를 호출합니다.

`PropertyDefinition`은 식별자, 상속, 레이아웃, 상대 대상과 기본 속성 복사본을 제공합니다.
`parseValue(property, text)`는 실패 시 UNKNOWN 단위를 포함하여 출력을 변경합니다.
`getValue(property)`는 `{ success, value }`를 반환합니다.
RmlUi 6.3 키워드 변환은 유효한 문자열에도 `success: false`를 반환합니다.

`PropertyDefinition(id, defaultValue, inherited, forcesLayout)`는 수정 가능한 독립 정의를
생성합니다. `addParser(name, parameters = '')`와 `setRelativeTarget(target)`은
연결 호출할 수 있습니다. 기본 정의는 읽기 전용입니다. 빌린 참조 보호를 위해
독립 정의를 종료까지 유지합니다.

속성과 정의에는 소유 환경의 초기화된 런타임이 필요합니다. DOM 삭제 후에도 복사본은
유효하지만 종료 시 무효화합니다. 종료할 때 풀과 파서보다 먼저 참조를 해제하고 공유
메타데이터를 기본값으로 초기화합니다. 이전 핸들은 재초기화 후에도 사용할 수 없습니다.
남긴 뷰는 독립 저장소로 쓰기 가능하며 새 세대에 영향을 주지 않습니다.
네이티브 경계는 위조 핸들, 잘못된 단위, 유한하지 않은 숫자와 단위에 맞지 않는
복합 값 저장소를 거부합니다.

`Transform`은 네이티브 기본 변환 목록을 소유하며 정규 `TransformPrimitive` 레코드로
생성합니다. `TransformPrimitiveType`은 22개 형식을 모두 포함합니다.
`getPrimitive(index)`와 `primitives`는 복사본을 반환합니다. `primitives` 대입으로 전체
목록을 교체하고 `addPrimitive`, `clearPrimitives`, `getNumPrimitives`도 사용할 수 있습니다.
잘못된 인덱스나 성분은 예외를 발생시킵니다.

```js
const { Transform, TransformPrimitiveType: T, makeTransformPrimitive } =
  require('sfml.js-rmlui');
const rotate = makeTransformPrimitive(T.ROTATE2D,
  [{ number: 90, unit: Unit.DEG }]);
const transform = new Transform([rotate]);

element.setProperty(PropertyId.Transform,
  Transform.makeProperty(transform.primitives));
```

해석된 성분은 숫자이며 정규 레코드의 각도는 라디안입니다. 이동과 원근은 `{ number, unit }`으로
상대 단위를 유지합니다. `makeTransformPrimitive(type, numericValues)`는 네이티브
NumericValue 배열 생성자를 호출합니다. 각도는 RAD/DEG/PERCENT, Rotate3D 축은 NUMBER입니다.
행렬과 배율은 숫자를 복사합니다. 스칼라 형식은 성분을 명시하며 이동의 기본 단위는 PX,
각도는 DEG, 균일 배율은 모든 축에 같은 값을 지정합니다. Matrix3D는 열 우선 계수 16개입니다.
DecomposedMatrix4는 `perspective`, `quaternion`(x/y/z/w), `translation`, `scale`,
`skew` 벡터 5개입니다.

원시 값은 `{ type: 'transform', primitives: [...] }`입니다. `primitives: null`은 널
TransformPtr이고 빈 배열은 항등 변환입니다. Property `Get<T>` 변환 실패는 널 포인터 레코드를
반환하며 속성과 이벤트는 지정한 기본값을 사용합니다. 대입 시 새 네이티브 소유자로 복사합니다.
Property 비교는 포인터 동일성입니다. `property.clone()`은 유지하지만 스냅샷 재구성은
새 포인터를 만듭니다. 순수 Transform과 스냅샷은 종료 후에도 사용 가능하며 `makeProperty`에는
활성 런타임이 필요합니다. 전체 목록 대입이 쓰기 가능한 `GetPrimitives`를 제공하며 크기가
변하는 벡터의 참조를 빌려주지 않습니다.

`element.iterateLocalProperties(filterInheritedBy = null)`는 한 번의 Native
호출로 네이티브 순서의 `[name, Property]` 배열을 반환합니다. 인라인 재정의,
시트와 클래스 규칙, 변수 및 변수 약식을 포함하며 중복과 약식 자리 표시는
네이티브 규칙을 따릅니다. 필터 요소가 실제로 상속하는 속성만 남기고 자체 재정의는
제외합니다. 값은 반복자 해제와 래핑 전에 모두 복사하므로 이후 속성이나 클래스
변경 및 요소 파괴에도 복사본은 유지됩니다. 실시간 네이티브 반복자는 보유하지 않습니다.
