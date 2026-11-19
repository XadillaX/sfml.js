# 텍스트, 진행 표시와 탭

`Document.createTextNode(text)`는 `ElementText | null`을 반환합니다.
쿼리, 순회, 복제와 이벤트 대상은 네이티브 하위 타입과 래퍼 동일성을 유지합니다.
`ElementText`, `ElementProgress`, `ElementTabSet`은 `Element`를 상속합니다.

## 텍스트 레이아웃

`getText()` / `setText(text)`는 리터럴 원문에 접근합니다.
측정하거나 렌더링하기 전에 글꼴을 로드하고 소유 컨텍스트를 갱신하세요.

```js
const text = document.createTextNode('A🌙中 &amp; Z');

document.getElementById('content').appendChild(text);
context.update();
const line = text.generateLine(1, Infinity, 0, true, true, false);
// { line: '🌙中 & Z', lineLength: 15, lineWidth: ..., reachedEnd: true }
```

`generateLine(lineBegin, maximumLineWidth, rightSpacingWidth,
trimWhitespacePrefix, decodeEscapeCharacters, allowEmpty)`는 모든 네이티브 입력을
명시적으로 받으며 기본값이 없습니다. `lineBegin`과 반환된 `lineLength`는
**원문의 UTF-8 바이트**를 사용합니다. 시작점은 0부터 바이트 길이까지의 int32 문자
경계이며 끝 위치도 허용합니다. JavaScript UTF-16 인덱스는 직접 사용할 수 없습니다.
소비한 바이트 수는 서식 처리 후 줄의 바이트 길이와 다를 수 있습니다.

최대 너비는 음수가 아니어야 하며 `Infinity`는 무제한입니다. 오른쪽 간격은 마지막
토큰 뒤에 확보할 유한 픽셀 너비입니다. 네이티브 RCSS 공백, 단어 분리와 대소문자
변환 규칙을 따릅니다. `allowEmpty`는 토큰이 들어가지 않으면 소비량 0을 허용합니다.
강제 줄바꿈은 마지막 원문 바이트를 소비해도 false를 반환할 수 있습니다.
글꼴이 없으면
`{ line: '', lineLength: 0, lineWidth: 0, reachedEnd: true }`를 반환합니다.

`generateLine`은 측정만 합니다. `clearLines()`는 줄을 지우며,
`addLine({ x, y }, text)`는 첫 줄 기준 유한 베이스라인 오프셋에 서식 처리된 줄을
추가합니다. `suppressAutoLayout()`은 이후 텍스트 변경이 재배치를 요청하지 않게 하는
단방향 설정입니다. 다른 문서 변경으로 재배치될 수 있습니다.

`getLines()`는 `{ text, position: { x, y }, width }` 복사본을 반환합니다.
네이티브 정수 너비는 0에서 시작해 지오메트리를 생성할 때 갱신됩니다.
복사본은 재배치, 줄 제거와 요소 파괴 후에도 유효하며 수정해도 요소에 영향이 없습니다.

## 진행 표시

`getValue()`는 `[0, getMax()]`로 제한한 값을 반환하며 기본값은 0입니다.
`setValue(value)`는 유한 실수를 저장합니다. `getMax()`는 기본값이 1이고 저장 값이
양수가 아니어도 1입니다. `setMax(value)`는 유한 실수를 저장합니다.
`getIntrinsicDimensions()`는 네이티브 진행 요소 구현을 호출하며 너비는 밀도 독립
256 픽셀, 높이는 현재 줄 높이입니다. 지정하지 않은 종횡비는 0을 유지합니다.

## 탭

`setTab(index, rmlOrElement)`와 `setPanel(index, rmlOrElement)`는 두 네이티브
오버로드를 지원합니다. 존재하는 int32 인덱스는 교체하고 아니면 끝에 추가하며 중간
빈칸을 채우지 않습니다. 요소 인자는 분리 트리의 소유권을 이전합니다. 연결된 요소는
먼저 부모에서 제거하세요. 제목이나 패널을 교체 또는 제거하면 해당 요소를 파괴하고
보관한 래퍼를 무효화합니다.

`removeTab(index)`는 존재하는 제목과 패널을 제거합니다. `getNumTabs()`는 패널 수와
독립적인 제목 수이며 내부 tabs 컨테이너를 만들 수 있습니다. `getActiveTab()`은
비어 있어도 0으로 시작합니다. `setActiveTab(index)`는 제한하지 않는 int32 인덱스를
저장하고 변경할 때만 `parameters.tab_index`를 담은 `tabchange`를 발생시킵니다.
네이티브 클릭 기본 동작도 활성 탭을 바꿉니다.

텍스트 레이아웃과 변경, 진행 표시와 탭 변경, 트리를 수정할 수 있는 `getNumTabs()`는
이벤트 재진입을 거부합니다. 원문, 줄 복사본, 진행 값과 활성 탭 읽기는 허용합니다.
리스너 예외는 네이티브 작업이 반환한 후 전파됩니다.

상속한 `processDefaultAction(event)`는 콜백에서 사용할 수 있습니다.
[네이티브 유형과 기본 동작](./rtti-default-actions.ko.md),
[폼 컨트롤](./controls.ko.md)과 [문서 수명](./documents.ko.md)을 참고하세요.
