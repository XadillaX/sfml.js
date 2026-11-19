# 숫자와 단위

`NumericValue`는 독립적인 네이티브 `Rml::NumericValue`를 소유합니다.
기본값은 숫자 `0`과 단위 `Unit.UNKNOWN`입니다. `number`와 `unit`은 실제
네이티브 필드를 매핑합니다. `numberView`는 원소 하나의 `Float32Array`이며
`unitView`는 원소 하나의 `Int32Array`입니다. 유지한 뷰는 래퍼 수집, 요소 파괴,
런타임 종료 후에도 유효하며 DOM 객체를 유지하지 않습니다.

```js
const { NumericValue, Unit, anyUnit } = require('sfml.js-rmlui');
const distance = new NumericValue(12, Unit.DP);

distance.numberView[0] = 24;
const pixels = element.resolveLength(distance);
const quarter = element.resolveNumericValue(
  new NumericValue(25, Unit.PERCENT), 200
); // 50
const isLength = anyUnit(distance.unit & Unit.LENGTH);
```

`clone()`은 독립적인 네이티브 복사본을 만듭니다. `equals()`와 `notEquals()`는
상위 라이브러리 연산자로 숫자와 단위를 비교하며 양수 0과 음수 0은 같습니다.
숫자를 쓰면 float32로 반올림합니다. 스타일 변경 후 `context.update()`를
호출한 다음 현재 계산된 스타일을 사용하여 글꼴 상대 단위를 해석하세요.

| 단위 | 해석 규칙 |
| --- | --- |
| `PX` | 픽셀 수치 |
| `DP` | 수치에 컨텍스트 밀도 비율을 곱함 |
| `VW`, `VH` | 현재 컨텍스트 너비 또는 높이의 백분율 |
| `EM`, `REM` | 요소 또는 문서 글꼴 크기의 배수 |
| `INCH`, `CM`, `MM`, `PT`, `PC` | 인치당 96픽셀에 컨텍스트 밀도 비율을 곱함 |
| `NUMBER` | 수치에 `baseValue`를 곱함 |
| `PERCENT` | 수치에 `baseValue / 100`을 곱함 |
| `DEG`, `RAD` | 라디안 |
| `X` | 배율을 적용하지 않은 수치 |

`resolveLength()`는 `NUMBER`와 `PERCENT`를 포함한 길이 이외 단위에 0을
반환합니다. `resolveNumericValue()`는 비수치 단위에 0을 반환합니다.
두 메서드 모두 유효한 요소가 필요합니다. 수치 객체 자체는 런타임 초기화 전이나
Worker에서도 생성·편집·비교할 수 있습니다.

`Unit`은 상위 라이브러리의 기본·수치·유형별 속성·사용자 정의 속성·조합 플래그를
모두 포함합니다. `Units`는 집합 타입 별칭입니다. JavaScript의 `|`와 `&`는
네이티브 집합 연산자에, `anyUnit()`은 `Rml::Any`에 대응합니다. 단위 집합을
저장하고 비교할 수 있지만 여러 단위를 단일 길이나 수치로 해석할 수는 없습니다.

생성자와 setter는 유한하지 않은 값, float32 범위 초과 및 알 수 없는 단위 비트를
거부합니다. 네이티브 작업도 공유 뷰를 다시 검증하며 해석 결과가 넘치면 예외를
발생시킵니다. 뷰에 직접 쓰거나 해당 setter를 사용하여 잘못된 필드를 복구할 수 있습니다.

## 계산된 값

`element.getComputedValues()`는 네이티브 `GetComputedValues()`의 실시간 읽기 전용
뷰입니다. 스타일을 변경하면 `context.update()` 후에 조회하세요. getter 98개는
`fontFamily`, `marginTop`, `lineHeight`, `borderRadius`, `animation`,
`transform`과 같은 camelCase 이름을 사용합니다. 구조화된 결과는 독립 복사본이며
애니메이션, 전환, 변환 또는 글꼴 핸들이 없으면 `null`을 반환합니다.

`new ComputedValues(element)`는 상위 기본값으로 독립 네이티브 저장소를 생성합니다.
속성 setter 82개와 쓰기 전용 `setHasLetterSpacing(boolean)`으로 네이티브 대입
83개를 제공합니다. `copyInherited(source)`와 `copyNonInherited(source)`는 각
필드 그룹만 복사하며 연결 요소를 변경하지 않습니다. 대입은 소유 값만 변경합니다.
글꼴, 커서, 자간, 로컬 flex 속성, 애니메이션, 전환, 변환은 연결 요소에서 읽습니다.
요소 파괴나 런타임 종료 후에는 소유 값과 뷰 모두 무효입니다.
관찰 참조는 참조되지 않는 분리 요소를 유지하지 않습니다.

```js
const { ComputedValues, Style, resolveValueOr } = require('sfml.js-rmlui');

context.update();
const view = element.getComputedValues();
const value = new ComputedValues(element);

value.copyInherited(view);
value.copyNonInherited(view);
value.width = new Style.LengthPercentageAuto(
  Style.LengthPercentageAutoType.Percentage, 25
);
const pixels = resolveValueOr(value.width, 400, 0); // 100
```

`Style`은 네이티브 열거, 값 형식과 별칭을 내보냅니다. 글꼴 두께는 1–1000 및
Auto(0)를 지원합니다. `LengthPercentage`, `LengthPercentageAuto`, `NumberAuto`,
`VerticalAlign`, `LineHeight`는 독립 네이티브 값을 소유합니다. `valueView`와
`typeView`는 실수와 열거 필드를 공유하고 `LineHeight.inheritValueView`는 상속
값을 공유합니다. 뷰는 요소를 유지하지 않으며 래퍼 GC, DOM 파괴와 종료 후에도 유효합니다.
네이티브 소비 시에는 열거 범위와 유한한 값을 다시 검증합니다.

`new Style.VerticalAlign()`은 Baseline, 숫자 하나는 픽셀 길이,
두 인수는 `(VerticalAlignType, length)`를 뜻합니다. `Style.Clip(type, number)`는
int8 인코딩을 유지합니다. Number의 0, -1, -2는 Auto, None, Always가 됩니다.
`getType()`, `getNumber()`, `equals(type)`은 네이티브 작업입니다.
테두리 너비는 int16에서 uint16으로의 변환을 유지하며 모서리 반경은 범위 검증 후 int16으로 절삭합니다.

`resolveValue`와 `resolveValueOr`는 두 길이 형식을 지원합니다. 음수 백분율 기준은
미정을 뜻하며 자동 길이나 미정 백분율은 0 또는 지정한 기본값이 됩니다.
절대 길이는 음수 기준에서도 자체 값입니다. `fontFaceHandle`과
`element.getFontFaceHandle()`은 세대를 검사하는 불투명 토큰을 반환하며 숫자 주소를 노출하지 않습니다.

## 독립 스타일 필드 그룹

`Style.CommonValues`, `Style.InheritedValues`, `Style.RareValues`는 상위
기본값으로 네이티브 구조체 세 개를 생성하고 쓰기 가능한 필드 112개를 공개합니다.
이름은 camelCase이며 `float_`는 `float`입니다. 요소와 독립적이므로 대입해도
문서 스타일은 변경되지 않습니다. 초기화 전이나 Worker에서도 사용할 수 있습니다.

주소가 있는 수치 필드는 `필드명View`를 제공합니다. 실수는 `Float32Array`,
테두리 너비는 `Uint16Array`, 모서리 반경은 `Int16Array`, 색은 RGBA
`Uint8Array`입니다. 뷰는 래퍼 회수나 종료 후에도 구조체를 유지합니다.
색 getter는 복사본을 반환합니다. 비트 필드는 네이티브에서 검증하고
`hasLetterSpacing`은 숫자 0/1을 유지합니다. setter는 잘못된 열거, 정수,
실수, 색을 쓰기 전에 거부합니다. 뷰에 직접 쓰면 setter 검증을 거치지 않습니다.
`clip`은 `Style.Clip`을 복사하고 `language`는 0 문자를 포함한 UTF-8을 유지합니다.

```js
const values = new Style.CommonValues();

values.display = Style.Display.Flex;
values.widthType = Style.LengthPercentageAutoType.Percentage;
values.widthValueView[0] = 25;
values.backgroundColorView.set([20, 40, 60, 255]);
```

null이 아닌 `InheritedValues.fontFaceHandle`은 글꼴 엔진에 의존합니다.
`shutdown()`, `releaseFontResources()`, `releaseRenderManagers()`는 소유
`ComputedValues`의 복사본을 포함한 기존 토큰을 무효화합니다. 무효 핸들의 조회와
대입은 예외를 발생시키므로 유효한 요소에서 다시 가져오세요. 종료 후에도
`null` 대입과 다른 독립 필드 접근은 유효합니다.
해제 전에 분리된 요소를 다시 연결하거나 회수하세요. 상위 구현은 컨텍스트가
소유한 트리만 갱신합니다. 거부된 해제 호출은 기존 토큰을 무효화하지 않습니다.
