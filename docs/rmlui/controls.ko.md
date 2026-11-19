# 폼 컨트롤

요소를 반환하는 모든 API는 네이티브 런타임 타입을 사용합니다. 조회, 순회, 생성,
복제와 이벤트 대상은 래퍼 동일성을 유지합니다. `ElementFormControlInput`,
`ElementFormControlTextArea`, `ElementFormControlSelect`는
`ElementFormControl`을, `ElementForm`은 `Element`를 상속합니다.
태그 이름만으로 래퍼 타입을 결정하지 않습니다.

```js
const { ElementFormControlInput } = require('sfml.js-rmlui');

const input = document.querySelector('input');

if (input instanceof ElementFormControlInput) {
  input.setName('message');
  input.setValue('A🌙中');
  input.setDisabled(false);

  input.focus();
  input.setSelectionRange(1, 3);

  console.log(input.getSelection()); // { start: 1, end: 3, text: '🌙中' }
}
```

`getName` / `setName`, `getValue` / `setValue`,
`isDisabled` / `setDisabled`, `isSubmitted`는 네이티브 동작을 호출합니다.
`setDisabled(false)`는 속성을 제거합니다. `isSubmitted()`는 타입별 제출 상태를
검사하며 비활성 여부는 별도입니다.

`form.submit(name = '', value = '')`는 네이티브 `submit` 이벤트를 전달합니다.
이름이 비어 있으면 `submit` 키를 사용합니다. 비활성, 무명, 제출 제외 컨트롤은
생략하고 같은 이름의 값은 `, `로 연결합니다. HTTP 요청은 하지 않습니다.

## 속성에 값을 저장하는 네이티브 컨트롤

`ElementFormControl.createInstancer(valueAttribute = 'value')`는 추상 기반
클래스를 위한 JS 콜백 없는 소유 네이티브 생성기를 만듭니다. `GetValue`는 지정한
속성을 네이티브 문자열로 읽고 기본값은 빈 문자열입니다. `SetValue`는 같은 속성에
씁니다. 이름, 비활성화, 포커스와 기본 `IsSubmitted = true`는 실제 기반 클래스를
사용합니다. 비활성 상태 변경 후 계산된 스타일에 의존하는 포커스 동작 전에는
컨텍스트를 갱신합니다.

```js
const { ElementFormControl, Factory } = require('sfml.js-rmlui');

const allocator = ElementFormControl.createInstancer('payload');

Factory.registerElementInstancer('value-field', allocator);

const field = Factory.instanceElement(null, 'value-field', 'input', {
  name: 'answer', payload: 'Native value',
});

if (!(field instanceof ElementFormControl)) {
  throw new Error('Expected a native form control');
}

field.setValue('Updated');
console.log(field.getAttribute('payload')); // Updated

allocator.releaseElement(field);
```

네이티브 `data-attr-payload` 바인딩은 공유 데이터로 같은 값을 갱신하며 컨트롤별 JS
값 콜백을 호출하지 않습니다. JS 하위 클래스 메서드는 네이티브 가상 함수를 재정의하지
않습니다. 직접 `new ElementFormControl(tag)`는 거부합니다. Factory는 생성 속성을
적용하고 직접 `allocator.instanceElement`는 적용하지 않습니다. 등록 교체 후에도
컨트롤 직접 복제는 원래 생성기와 속성 이름을 유지하고 해제 관찰자를 복사하며 JS 생성
콜백을 다시 실행하지 않습니다. 조상 복제는 현재 Factory 등록으로 자손을 다시
파싱합니다. 종료 시 생성기와 요소가 무효화됩니다.

`Form::Submit`는 `input`, `textarea`, `select` 태그만 선택합니다. 생성기를 해당
태그로 등록하거나 Factory 호출의 실제 태그로 지정해야 합니다. 임의의 사용자 정의
태그는 제출 대상으로 선택하지 않습니다. 연결된 컨트롤을 명시적으로 해제하기 전에는
부모에서 분리해야 합니다.

## 텍스트 입력과 텍스트 영역

`select()`, `setSelectionRange(start, end)`, `getSelection()`은 유니코드 코드
포인트 단위입니다. JavaScript UTF-16 인덱스나 UTF-8 바이트 위치가 아닙니다.
선택 변경에는 포커스가 필요합니다. 일반 입력 전에 `context.update()`를 호출합니다.
`element.focus(focusVisible = false)`는 네이티브 성공 여부를 반환하고
`element.blur()`는 포커스를 해제합니다. text/password 이외의 입력 타입은 선택을
무시하며 `{ start: 0, end: 0, text: '' }`를 반환합니다.

암호 선택의 `text`는 `*` 마스크이며 인덱스는 원래 Unicode 코드 포인트를 셉니다.
`getValue()`와 폼 제출은 실제 값을 유지합니다. `密🌙` 전체 선택은
`{ start: 0, end: 2, text: '**' }`를 반환합니다.

`setCompositionRange(start, end)`는 네이티브 IME 조합 표시를 설정합니다.
end가 start 이하이면 표시를 지웁니다. 텍스트 변경이나 확정은 하지 않으며
플랫폼 IME 지원을 검증한 것도 아닙니다.

텍스트 영역에는 `setNumColumns` / `getNumColumns`(기본값 20),
`setNumRows` / `getNumRows`(2), `setMaxLength` / `getMaxLength`
(-1, 무제한), `setWordWrap` / `getWordWrap`(true)도 있습니다.
행과 열의 최솟값은 1입니다. 제한 변경 시 기존 텍스트를 코드 포인트 단위로 자릅니다.
이후 네이티브 `setValue`는 제한을 초과할 수 있으며 사용자 편집에는 제한을 적용합니다.

`element.getIntrinsicDimensions()`는 네이티브 가상 메서드의
`{ valid, dimensions: { x, y }, ratio }`를 반환합니다. 설정하지 않은 출력 초깃값은
0입니다. 입력과 텍스트 영역의 재정의도 포함합니다. 폰트에 의존하는 결과에는
로드된 폰트와 최신 스타일 및 레이아웃이 필요합니다.

## 네이티브 입력 수명 주기

`new TextInputHandler()`는 위젯마다 JS를 호출하지 않고 Native에 알림을 기록합니다.
`createContext(name, width, height, renderer, handler)`의 다섯 번째 인수나
`setTextInputHandler(handler)`로 설정합니다. 기존 컨텍스트는 원래 설정을 유지하고
전역 설정은 shutdown까지 유지됩니다.

```js
const { TextInputHandler, createContext } = require('sfml.js-rmlui');
const handler = new TextInputHandler();
const context = createContext('editor', 800, 600, null, handler);

// 문서 표시와 레이아웃 갱신 후 입력에 포커스를 설정합니다.
const events = handler.drainEvents();

for (let i = 0; i < events.kinds.length; ++i) {
  const input = events.contexts[i];

  if (events.kinds[i] === 0 && input?.isValid) {
    input.setCursorPosition(0);
  }
}
```

`drainEvents()`는 Addon을 한 번 호출합니다. Native 소유의 `Uint32Array`
스냅샷은 0 활성화, 1 비활성화, 2 파괴이며 `contexts`는 대응하는 고유한
`TextInputContext`입니다. 기록 저장 공간을 해제하도록 정기적으로 가져오세요.
숫자 스냅샷은 처리기 해제와 shutdown 후에도 유효합니다.

`TextInputContext`는 `getBoundingBox()`(투영 실패 시 null),
`getSelectionRange()`, `setSelectionRange()`, `setCursorPosition()`,
`setText()`, `setCompositionRange()`, `commitComposition()`을 제공합니다.
편집은 Native에서 수행합니다. 범위는 음이 아닌 int32 Unicode 코드 포인트이며
끝을 포함하지 않고 순서대로 지정합니다. `setText()`는 maxlength를 무시합니다.
`commitComposition()`은 교체 범위 밖의 문자 수에 따라 길이를 제한합니다.
고정된 소스에서 업스트림 조합 길이 계산을 수정합니다. 빈 범위는 교체하지 않습니다.

명시적인 `onActivate` / `onDeactivate`는 동기이며 검사된
`TextInputContext` 메서드만 재진입할 수 있습니다. `onDestroy`는 만료 후 안전한
네이티브 경계에서 실행하며 소멸자나 V8 finalizer 안에서 실행하지 않습니다.
파괴된 위젯은 조회하거나 편집할 수 없습니다. 포커스 해제 후에도 참조는 유지되지만
위젯 파괴, 입력 유형 변경, shutdown 시 만료됩니다. 종료 후에도 `isValid`를
읽을 수 있습니다. 이 계약은 플랫폼 IME나 후보 창의 지원을 검증하지 않습니다.

초기화 전에도 처리기를 생성·설정할 수 있으며 다음 성공한 초기화에 채택됩니다.
초기화 거부 시 설정을 유지합니다. 초기화 전 shutdown도 처리기를 만료시키며,
Node 환경 정리는 JS를 호출하지 않고 해제합니다. 생성한 환경이 설정을 소유하므로
다른 worker는 접근할 수 없습니다. 초기화 전 null은 초기화 시 기본 처리기를
선택하고, 초기화 후 null은 새 컨텍스트의 전역 처리기를 비활성화합니다.

## 선택 항목

`setSelection(index)`는 항목을 선택하며 고정된 6.3 구현에서 범위 밖이면 선택을
해제합니다. `getSelection()`은 인덱스 또는 -1을 반환합니다.
`getOption(index)`는 고유 래퍼 또는 null, `getNumOptions()`는 개수를 반환합니다.
뒤의 두 메서드는 대기 자식을 이동하고 option이 아닌 자식을 파괴할 수 있으므로
네이티브 이벤트 콜백 중에는 호출할 수 없습니다.

`add(rml, value, before = -1, selectable = true)`는 내용을 추가합니다.
`add(element, before = -1)`는 소유권이 있는 분리 `option`을 이전합니다.
연결된 요소는 먼저 `removeChild`로 분리합니다. 동일성은 유지되며 범위 밖 인덱스는
끝에 추가합니다. 잘못된 소유권, 문서 삽입, 순환은 소유권 소비 전에 거부합니다.

`remove(index)`는 항목을 파괴하며 범위 밖이면 아무 작업도 하지 않습니다.
`removeAll()`은 모두 파괴하고 보관한 래퍼는 무효화됩니다.
`showSelectBox()`는 열고, `hideSelectBox()`는 현재 값을 유지하며 닫고,
`cancelSelectBox()`는 열 때의 값을 복원하고 닫습니다.
`isSelectBoxVisible()`은 네이티브 열림 상태를 반환합니다.

새 컨트롤 변경 API는 콜백 재진입을 거부하며 값과 선택 범위 읽기는 허용합니다.
리스너 예외는 네이티브 작업 반환 후 전파합니다. 파괴와 종료는 모든 별칭을 무효화합니다.
[문서 수명](./documents.ko.md)을 참고하세요.

폼 이외의 요소는 [텍스트, 진행 표시와 탭](./text-panels.ko.md)을 참고하세요.
