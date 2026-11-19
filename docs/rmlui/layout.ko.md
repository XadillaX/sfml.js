# 요소 레이아웃, 스크롤, 투영

스타일이나 문서를 변경한 뒤 `context.update()`를 호출하고 레이아웃을 읽으세요.
RmlUi의 기본 `display`는 `div`도 `inline`입니다.
블록 배치에는 `display: block`을 명시해야 합니다.

`absoluteLeft`, `absoluteTop`은 컨텍스트의 테두리 왼쪽 위 좌표입니다.
`offsetLeft`, `offsetTop`은 `offsetParent` 기준이며 부모 래퍼의 동일성을 유지합니다.
`offsetWidth`, `offsetHeight`는 패딩과 테두리를 포함하고 마진은 제외합니다.
`clientLeft`, `clientTop`은 테두리 너비이며 `clientWidth`, `clientHeight`는
패딩을 포함하고 스크롤바를 제외한 크기입니다.

`getRelativeOffset(area = BoxArea.Content)`와
`getAbsoluteOffset(area = BoxArea.Content)`는 독립적인 `{ x, y }` 복사본을 반환합니다.
`BoxArea.Margin`, `Border`, `Padding`, `Content`로 영역을 선택합니다.
`Auto`는 `clipArea`에만 사용할 수 있고 오프셋 조회에는 사용할 수 없습니다.
`getContainingBlock()`은 컨테이닝 블록 크기를 복사합니다.

`getPosition()`, `getFloat()`, `getDisplay()`는 네이티브 계산 스타일의
`StylePosition`, `StyleFloat`, `StyleDisplay` 열거형을 반환합니다.
`getLineHeight()`의 단위는 픽셀입니다. `baseline`은 아래 마진 가장자리에서 위로 잰 거리,
`zIndex`는 네이티브 쌓임 순서입니다. `isReplaced()`는 자체 렌더링 요소를 확인합니다.

```js
const {
  BoxArea, ScrollAlignment, ScrollBehavior, ScrollParentage,
} = require('sfml.js-rmlui');

context.update();
const border = element.getAbsoluteOffset(BoxArea.Border);

element.scrollIntoView({
  vertical: ScrollAlignment.Center,
  horizontal: ScrollAlignment.Nearest,
  behavior: ScrollBehavior.Instant,
  parentage: ScrollParentage.Closest,
});
```

`scrollLeft`, `scrollTop`에 값을 쓸 수 있습니다. 네이티브 반올림과 범위 제한을 적용하고,
값이 바뀌면 `scroll` 이벤트를 동기적으로 발생시킵니다. `scrollWidth`, `scrollHeight`는
패딩을 포함하는 스크롤 가능 영역입니다.
`scrollTo(offset, behavior = ScrollBehavior.Instant)`는 두 축을 갱신합니다.
`Smooth`는 계속 호출하는 `context.update()`로 진행하며 `Auto`는
`context.setDefaultScrollBehavior(...)` 설정을 따릅니다.

`element.getElementScroll()`은 동일성을 유지하는 빌린 네이티브 구성 요소입니다.
`new ElementScroll(element)`은 사용자 정의 위젯용 독립 소유 구성 요소를 만듭니다.
`ScrollOrientation.VERTICAL`은 `0`, `HORIZONTAL`은 `1`입니다.
두 형태 모두 `update()`, `enableScrollbar(direction, elementWidth)`,
`disableScrollbar(direction)`, `updateScrollbar(direction)`,
`getScrollbar(direction)`, `getScrollbarSize(direction)`,
`formatScrollbars()`, `updateProperties()`를 제공합니다. 너비는 유한하고 음수가
아니어야 합니다. 생성되지 않은 바는 null이며 비활성화된 바의 크기는 0입니다.

소유 구성 요소는 `release()`로 리스너를 해제할 수 있고 빌린 뷰는 해제를 거부합니다.
원래 소멸자처럼 호스트의 비 DOM 자식 요소는 남습니다. 호스트 파괴 시 두 형태 모두
무효화됩니다. 소유 구성 요소는 분리 호스트와 콜백을 유지하며 해제, 네이티브 파괴,
종료 시 참조를 제거합니다. GC 정리는 최외곽 네이티브 작업이 끝난 뒤 수행됩니다.
화살표의 네이티브 입력은 overflow가 `auto` 또는 `scroll`인 축만 이동합니다.

`scrollIntoView(true)`는 위쪽, `false`는 아래쪽에 맞춥니다.
옵션 기본값은 vertical `Start`, horizontal `Nearest`, behavior `Instant`,
parentage `All`입니다. `Adaptive`는 이미 보이면 위치를 유지하고 아니면 가운데로 옮깁니다.
`Closest`는 가장 가까운 스크롤 컨테이너만 고려합니다.
`All`에서도 상위 컨테이너 하나만 부드럽게 이동하고 나머지는 즉시 이동합니다.

`setScrollableOverflowRectangle(size, clampScrollOffset)`는 넘치는 영역의 크기를 설정합니다.
최종 크기가 결정되면 clamp를 켜세요. 좌표는 네이티브 float 범위의 유한수이고
크기는 음수가 아니어야 합니다. 잘못된 값은 변경 전에 거부됩니다.

`isVisible(true)`는 상위 요소까지 검사하고 인수를 생략하면 요소만 검사합니다.
`isPointWithinElement(point)`는 요소 평면에서 테두리 영역을 검사합니다.
변환된 화면 좌표는 먼저 `project(point)`에 전달해 `{ success, point }`를 확인하세요.
입력은 변경하지 않으며 특이 변환은 실패합니다. 행렬은 `context.render()` 시 갱신되므로
변환 변경 후 렌더링한 다음 투영을 조회해야 합니다.

분리된 트리는 이전 문서를 가리키는 오프셋 부모 참조와 해당 기준점을 초기화합니다.
트리 내부 관계는 유지하고 다시 삽입한 뒤 갱신하면 새 레이아웃을 정합니다.
따라서 파괴된 문서를 참조하지 않습니다. 수치 복사본은 GC와 런타임 종료 뒤에도 읽을 수 있지만,
파괴된 요소의 작업은 예외를 던집니다. 스크롤 콜백에는 기존 실행 중인 하위 트리 보호가 적용됩니다.

상자 생성과 숫자 뷰는 [상자 값](boxes.ko.md)을 참고하세요.
형식화된 속성, 계산 스타일 및 애니메이션에는 각각 별도 가이드가 있습니다.

`setOffset(offset, offsetParent, offsetFixed = false)`는 네이티브 배치 기준을
씁니다. 부모는 자신을 제외한 조상 또는 null이어야 하며 소유 트리 참조와 순환 방지를
보장합니다. 좌표는 유한한 값입니다. 고정 오프셋은 조상 스크롤을 무시하며 네이티브
`position: fixed`도 이 동작을 포함합니다. position 규칙은 유지되고 이후 배치
갱신에서 수동 기준이 교체될 수 있습니다. 분리 시 트리 밖 오프셋 부모 참조를 해제해
파괴한 트리를 참조하지 않습니다.
