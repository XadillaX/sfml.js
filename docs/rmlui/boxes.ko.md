# 상자 값과 렌더 상자

`Box`는 독립적인 네이티브 `Rml::Box`를 소유하며 런타임 초기화 없이 생성할 수 있습니다.

```js
const { Box, BoxArea, BoxEdge } = require('sfml.js-rmlui');

const box = new Box({ x: 80, y: 50 });

box.setEdge(BoxArea.Padding, BoxEdge.Top, 7);
box.content[0] = 100;
box.edges[BoxArea.Margin * Box.numEdges + BoxEdge.Left] = -4;
```

`content`는 x/y 콘텐츠 크기를 직접 참조하는 쓰기 가능한 `Float32Array`입니다.
`edges`는 네이티브 실수 12개를 참조하며 Margin, Border, Padding 각 그룹은 위, 오른쪽, 아래, 왼쪽 순서입니다.
`Box.numAreas`는 콘텐츠를 제외한 3, `Box.numEdges`는 4입니다.
뷰는 독립적인 값만 유지하므로 래퍼 GC, 요소 파괴, 런타임 종료와 재초기화 후에도 사용할 수 있습니다.
Node worker에서도 독립 값을 생성할 수 있습니다.

`getSize()`는 콘텐츠 크기, `getSize(area)`는 지정 영역과 안쪽 영역 크기를 반환합니다.
`getPosition(area = BoxArea.Content)`는 테두리 왼쪽 위를 기준으로 하며 바깥 여백 위치는 음수일 수 있습니다.
`getEdge(area, edge)`와 `setEdge(area, edge, size)`는 Margin, Border, Padding만 허용합니다.
`getCumulativeEdge(area, edge)`는 Margin부터 안쪽으로 합산하며 Content는 Padding까지 포함합니다.

`getSizeAcross(direction, area, areaEnd = BoxArea.Content)`는 양 끝 영역을 포함합니다.
바깥 영역이 안쪽 영역보다 앞서야 하며 방향은 `BoxDirection.Vertical` 또는 `Horizontal`입니다.
`getFrameSize(area)`는 안쪽 영역을 제외하지만 Content에서는 콘텐츠 크기를 반환합니다. Auto는 사용할 수 없습니다.

`setContent(size)`와 `setEdge(...)`는 뷰와 같은 네이티브 필드를 갱신합니다.
위치와 크기 조회는 독립적인 `{ x, y }` 복사본을 반환합니다. `clone()`은 상자를 복사합니다.
`equals()`와 `notEquals()`는 네이티브 연산자를 사용합니다.
Box 가장자리는 바이트로 비교하므로 양의 0과 음의 0도 구별합니다.

## 요소 레이아웃 상자

`context.update()` 후 `element.getBox()`는 기본 상자의 복사본을 반환합니다.
`getBox(index)`는 `{ box, offset }`을 반환하며 오프셋은 기본 상자 기준입니다.
범위를 벗어난 인덱스는 기본 상자와 0 오프셋으로 처리합니다.
상위 구현이 범위 검사 전에 1을 빼므로 부호 있는 정수 오버플로가 발생하는 INT32_MIN은 거부합니다.

`setBox(box)`는 값을 복사하고 추가 상자를 제거합니다.
`addBox(box, offset)`는 추가 상자와 오프셋을 복사합니다.
이후 입력 값을 수정해도 요소는 변하지 않습니다. `getNumBoxes()`는 기본 상자와 추가 상자를 셉니다.
수동 설정은 이후 네이티브 레이아웃 갱신으로 덮어쓸 수 있습니다.

## 렌더 상자

`getRenderBox(fillArea = BoxArea.Padding, index = 0)`는 독립적인 `RenderBox`를 반환합니다.
영역은 Border, Padding, Content만 허용하며 범위 밖 인덱스 처리는 `getBox(index)`와 같습니다.
추가 상자의 위치와 기본 패딩 영역 크기에 네이티브 반올림 규칙을 유지합니다.

`new RenderBox(fillSize, borderOffset, borderWidths, borderRadius)`로 직접 생성할 수도 있습니다.
너비 `EdgeSizes`는 위·오른쪽·아래·왼쪽, 반지름 `CornerSizes`는 왼쪽 위·오른쪽 위·오른쪽 아래·왼쪽 아래 순서의 4개 값입니다.
`fillSize`, `borderOffset`, `borderWidths`, `borderRadius`는 쓰기 가능한 공유 `Float32Array`입니다.
`get...()`는 복사본을 반환하고 `set...()`는 같은 네이티브 필드를 갱신합니다.
`getFillOffset()`는 `{ x: 왼쪽 테두리 너비, y: 위쪽 테두리 너비 }`를 반환합니다.
`clone()`, `equals()`, `notEquals()`는 네이티브 값에 작용합니다.
RenderBox는 숫자 성분으로 비교하며 Box 가장자리의 바이트 비교와 다릅니다.

유한한 실수를 사용하세요. setter는 모든 입력을 검증한 뒤 씁니다.
뷰를 통해 입력한 유한하지 않은 값은 조회와 요소 적용 시 거부됩니다.
입력 getter가 예외를 던져도 setter의 일부만 적용되지 않습니다.
요소는 입력 getter 실행 후 검사하므로 getter에서 요소를 파괴하면 무효 핸들 예외가 발생합니다.

좌표와 투영은 [레이아웃](layout.ko.md)을 참고하세요.
