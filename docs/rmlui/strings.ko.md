# RmlUi 문자열과 리소스 URL

`StringView`는 불변 네이티브 UTF-8 바이트를 유지하며 위치는 바이트 단위입니다.
`StringIteratorU8`은 JavaScript UTF-16 인덱스와 별개로 네이티브 코드포인트를
읽습니다. 이 자원과 `URL`은 런타임 초기화 전과 종료 후에도 사용할 수 있습니다.

```js
const { StringView, StringIteratorU8, StringUtilities, URL, formatString } =
  require('sfml.js-rmlui');

const text = new StringView('Aé中😀Z');
const slice = text.subview(1, 9);

console.log(slice.begin(), slice.end(), slice.toString()); // 0 9 é中😀

const input = new Int32Array([ 0, 1, 2, 3, 4, 5 ]);
const output = new Int32Array(input.length);

StringUtilities.convertCharacterOffsetsToByteOffsets(text, input, output);
console.log(Array.from(output)); // [0, 1, 3, 6, 10, 11]

const iterator = new StringIteratorU8(slice);

while (iterator.valid()) {
  console.log(iterator.offset(), iterator.value());
  iterator.increment();
}

const url = new URL('assets/panel.rml');

url.setParameter('name', 'é中😀');
console.log(url.getQueryString()); // name=%C3%A9%E4%B8%AD%F0%9F%98%80
console.log(formatString('%s:%d', 'é', 7)); // { value: 'é:7', length: 4 }
```

## 바이트, 반복과 배치

`new StringView(value = '', offset = 0, count?)`는 문자열을 네이티브로 복사하거나
기존 뷰의 소유자를 유지합니다. 오프셋은 원본 끝까지 허용됩니다. count를 생략하면
남은 전체 바이트를 사용하고 지정한 값도 끝에서 제한합니다. UTF-8 중간 슬라이스도
허용됩니다. `toBytes()`는 독립적으로 쓸 수 있는 복사본이며 수정은 원본과 인덱스에
영향을 주지 않습니다. `equals()`는 NUL 뒤의 바이트까지 비교합니다.

`new StringIteratorU8(value, offset = 0, count?)`는 입력을 유지합니다. 오프셋은
캐시한 인덱스 경계와 일치해야 합니다. 끝은 `offset + count`와 원본 끝 중 작은
값입니다. 뷰마다 네이티브 인덱스 복사본을 한 번 얻고 이후 이동과 읽기에는 네이티브
호출이 없습니다. 끝은 바이트 길이이고 시작 전은 `-1`입니다. 센티널 읽기, 끝에서
앞으로 이동, 시작 전에서 뒤로 이동은 예외입니다. 별칭 뷰는 네이티브 소유자와
절대 바이트 위치로 반복자 일치를 판단합니다.

배치 변환에는 `StringView`와 같은 길이의 고정된 비공유 `Int32Array` 입출력을
재사용합니다. 배치당 한 번 호출하고 출력을 생략하면 독립 복사본을 만듭니다.
겹치는 뷰도 원래 입력 값을 유지합니다. 음수 위치는 0, 너무 큰 위치는 끝,
문자 내부 바이트는 다음 코드포인트 경계로 제한합니다. 분리되거나 공유되거나
크기 변경 가능한 배열은 거부합니다.

## 네이티브 문자열 규칙

대소문자는 ASCII만 변환합니다. 공백은 CR, LF, 공백과 탭입니다. RML 엔티티는
한 번만 디코딩합니다. 빈 검색 문자열로 교체하면 입력을 유지합니다.
`expandString(value, delimiter = ',', quoteOrIgnore = false, unquote?,
ignoreRepeatedDelimiters = false)`는 기본 인용 부호를 제거하고 사용자 지정 부호는
유지합니다. `joinString(values, delimiter = ',', initial = '')`는 초기 내용에
추가하며 NUL이면 구분자를 넣지 않습니다.

`toUTF8`은 부호 없는 32비트 코드포인트 또는 고정된 비공유 `Uint32Array`를
받습니다. `lengthUTF8`은 불완전한 슬라이스에서도 비연속 바이트를 셉니다.
`trimTrailingDotZeros`는 소수점이 있는 십진수 텍스트를 요구하며 잘못된 입력은
예외를 발생시킵니다.

## 리소스 URL과 포맷

`new URL(value = '')`는 실제 RmlUi 리소스 URL 파서를 소유합니다. 구성 요소
설정은 네이티브 불리언을 반환합니다. `setURL`은 이전 요소와 매개변수를 지우며
잘못된 입력은 false와 일부 파싱 상태를 남길 수 있습니다. `setPort`는 부호 있는
32비트 정수를 받습니다. 매개변수 복사본은 독립적이며 `__proto__` 등의 자체 키도
보존합니다. 순서는 네이티브 비정렬 맵을 따르고 `clearParameters`는 쿼리 캐시도
무효화합니다.

`urlEncode`는 NUL을 포함한 모든 UTF-8 바이트를 인코딩합니다. 고정 버전의
디코더는 `+`를 공백, `%GG`를 `GG`, `%A`를 바이트 `0A`로 변환합니다.
JavaScript 문자열은 잘못된 UTF-8을 대체 문자로 처리합니다.

`createString`은 포맷된 텍스트를, `formatString`은 텍스트와 UTF-8 바이트 길이를
반환합니다. 형식이 있는 printf는 `diuoxXfFeEgGaAcs`, `%%`, 플래그, 너비,
정밀도와 동적 `*`를 지원합니다. 정수는 해당 변환의 32비트 범위, `%c`는 0–255,
실수는 유한한 값이어야 합니다. 포인터, 위치 지정, 길이 수정 형식과 형식 내 NUL은
거부합니다. 너비, 정밀도와 전체 출력은 각각 백만 바이트까지입니다. 256바이트
미만 출력은 NUL에서 텍스트를 자르지만 보고 길이를 유지하며 긴 출력은 NUL을
보존합니다.
