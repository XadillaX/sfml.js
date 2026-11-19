# RmlUi API 가이드

[RmlUi API 레퍼런스](/reference/rmlui/)는 패키지 TypeScript 선언과 4개 언어의 TSDoc에서 생성합니다. 개요에는 짧은 설명을, 멤버 상세에는 시그니처, 기본값, 매개변수, 반환값, 수명을 표시합니다.

[문자열과 리소스 URL](strings.ko.md)은 유지된 바이트 뷰, UTF-8 반복,
배치 오프셋 변환과 형식이 있는 네이티브 포맷을 설명합니다.

## 계약 찾기

| 작업 | API |
| --- | --- |
| 렌더 창 연결 | [initialise](/reference/rmlui/functions/initialise.html), [InitialiseOptions](/reference/rmlui/interfaces/InitialiseOptions.html) |
| 글꼴 로드 및 캐시 해제 | [loadFontFace](/reference/rmlui/functions/loadFontFace.html), [글꼴 가이드](fonts.ko.md) |
| Native 생명 주기 알림 | [Plugin](/reference/rmlui/classes/Plugin.html), [플러그인 가이드](plugins.ko.md) |
| 렌더 리소스 조회 및 해제 | [렌더 리소스](resources.ko.md), [RenderInterface](/reference/rmlui/interfaces/RenderInterface.html) |
| 레이아웃, 스크롤 및 좌표 투영 | [요소 레이아웃](layout.ko.md), [Element](/reference/rmlui/classes/Element.html) |
| 네이티브 스크롤 및 변환 구성 요소 | [ElementScroll](/reference/rmlui/classes/ElementScroll.html), [TransformState](/reference/rmlui/classes/TransformState.html), [ElementTransformBuffer](/reference/rmlui/classes/ElementTransformBuffer.html) |
| 이벤트 등록, 재귀 해제 및 명시 발송 | [EventDispatcher](/reference/rmlui/classes/EventDispatcher.html), [요소 상태](element-state.ko.md) |
| 상자 값 생성과 조회 | [상자 값](boxes.ko.md), [Box](/reference/rmlui/classes/Box.html), [RenderBox](/reference/rmlui/classes/RenderBox.html) |
| 숫자와 단위 해석 | [숫자와 단위](numeric-values.ko.md), [NumericValue](/reference/rmlui/classes/NumericValue.html) |
| 형식 속성 읽기와 설정 | [속성](properties.ko.md), [Property](/reference/rmlui/classes/Property.html) |
| 속성 애니메이션과 이징 평가 | [애니메이션](animation.ko.md), [Tween](/reference/rmlui/classes/Tween.html) |
| 컨텍스트 생성, 갱신, 렌더링 | [createContext](/reference/rmlui/functions/createContext.html), [Context](/reference/rmlui/classes/Context.html) |
| 물리 크기 읽기 | [ContextDimensions](/reference/rmlui/interfaces/ContextDimensions.html) |
| 데이터와 사용자 정의 뷰 및 컨트롤러 | [데이터 모델](data-models.ko.md), [DataView](/reference/rmlui/classes/DataView.html), [DataController](/reference/rmlui/classes/DataController.html), [Factory](/reference/rmlui/classes/Factory.html) |
| 문서 표시와 언로드 | [Document](/reference/rmlui/classes/Document.html) |
| 요소 쿼리, 스타일, 리스너 | [Element](/reference/rmlui/classes/Element.html) |
| 활성 이벤트와 복사된 매개변수 | [RmlEvent](/reference/rmlui/classes/RmlEvent.html), [RmlEventListener](/reference/rmlui/types/RmlEventListener.html) |
| 런타임 해제 | [shutdown](/reference/rmlui/functions/shutdown.html) |

## 네이티브 요소 구성 요소

`element.getStyle()`은 실제 검증된
[`ElementStyle`](/reference/rmlui/classes/ElementStyle.html)을 제공합니다.
캐스케이드, 변경 집합, 명시적 정의 갱신, 소유 값 계산, 사본 반복 및 재사용 키프레임
해석을 포함합니다. 수명, 배치 적용, 공유 수치 명령은
[요소 상태](element-state.ko.md#native-style-component)를 참고하세요.

`element.getElementBackgroundBorder()`는 동일성을 유지하는 요소 소유
[`ElementBackgroundBorder`](/reference/rmlui/classes/ElementBackgroundBorder.html)를
반환합니다. `dirtyBackground()`와 `dirtyBorder()`는 다음 네이티브 `render()`에서
지오메트리를 갱신합니다. 현재 계산 스타일, 배치 및 관리자 상태를 사용하므로
먼저 뷰포트를 준비하세요. 관리자 없는 분리 요소는 그리지 않고 다른 관리자의
활성 레이어 및 효과 콜백 재진입은 거부합니다.

`getClipGeometry(area)`는 BoxArea.Border, Padding 또는 Content를 받고
독립 네이티브 `Geometry` 사본을 반환합니다. Margin과 Auto는 예외이며 관리자
없으면 빈 지오메트리입니다. 구성 요소 재생성, 요소 파괴, 사본 수정 및 해제는
다른 사본이나 구성 요소 메시에 영향을 주지 않습니다. 관리자가 GPU 자원 수명을
제어하지만 `getMesh()` 사본은 관리자 해제나 종료 후에도 사용합니다.

```js
const background = element.getElementBackgroundBorder();

context.getRenderManager().prepareRender({
  x: context.dimensions.width, y: context.dimensions.height,
});
background.render();
const clip = background.getClipGeometry(BoxArea.Padding);
const mesh = clip.getMesh();

clip.release();
```

`element.getElementScroll()`은 요소가 소유하는 `ElementScroll`을 반환합니다.
`ScrollOrientation.VERTICAL`은 0, `HORIZONTAL`은 1입니다.
`update()`, `enableScrollbar(orientation, elementWidth)`,
`disableScrollbar(orientation)`, `updateScrollbar(orientation)`,
`formatScrollbars()`, `updateProperties()`는 네이티브 작업을 실행합니다.
`getScrollbar(orientation)`는 실시간 요소를 반환하고 미생성 상태면 `null`입니다.
`getScrollbarSize(orientation)`는 수직 바 너비 또는 수평 바 높이를 픽셀로
반환하며 비활성 상태면 0입니다. 비활성화는 속성을 변경하므로 가시성 조회 전에
`updateProperties()`로 다시 계산하세요. 요소가 파괴되면 구성 요소도 무효화됩니다.
토큰은 분리 요소를 유지합니다.

`element.getTransformState()`는 현재 상태의 읽기 전용 뷰 또는 `null`입니다.
변환은 `context.render()` 중 갱신됩니다.
`getTransform()`, `getLocalPerspective()`, `getInverseTransform()`은
열 우선 값 16개의 독립적인 네이티브 `Float32Array` 복사본을 반환합니다.
미설정 행렬은 `null`이며 특이 변환에도 역행렬이 없습니다. 복사본은 요소 파괴와
런타임 종료 후에도 사용됩니다. `new TransformState()`는 독립 상태를 소유하며
`setTransform(matrix)`와 `setLocalPerspective(matrix)`는 유한 값 16개를 복사합니다.
`null`은 해제하고 반환값은 네이티브 값의 변경 여부입니다.

여러 요소를 반복해서 읽을 때 `ElementTransformBuffer`를 한 번 할당하세요.
`refresh()`는 네이티브 호출 한 번으로 실행되고 JS 콜백이나 출력 재할당이 없습니다.
요소마다 값 48개로 변환 오프셋은 0, 원근은 16, 역행렬은 32입니다.
`flags[i]`의 존재 비트는 1, 2, 4이며 미설정 행렬은 0입니다.
쓰기는 복사본만 바꿉니다. 출력 변경 전에 모든 요소를 검증하고 무효하면 예외를
던집니다. 숫자 뷰는 저장소만 유지하므로 래퍼 수거 후에도 사용됩니다.

```js
const { ElementTransformBuffer } = require('sfml.js-rmlui');
const transforms = new ElementTransformBuffer(elements);

context.update();
context.render();
transforms.refresh();
const firstTransform = transforms.matrices.subarray(0, 16);
const firstPresence = transforms.flags[0];
```

## 주요 반환값

`initialise`는 성공 여부를 반환하며 재호출은 프로세스 전체 창이나 옵션을 교체하지 않습니다. `loadFontFace`는 글꼴 로드 성공 여부를 반환합니다. 요소 쿼리는 일치하는 요소가 없으면 `null`, `setProperty`는 RCSS 수락 여부를 반환합니다.

`processEvent`는 키·텍스트·휠에서 전파 상태, 마우스·터치에서 요소와 상호작용하지 않는지를 반환합니다. 직접 입력과 반환 규칙은 [문서와 이벤트](./documents.ko.md#직접-입력)를 참조하세요. `update`와 `render`는 RmlUi 6.3 결과를 전달하며 현재는 항상 true입니다. 변경 플래그나 가시성 검사로 사용하지 마세요.

## 기본값과 소유권

`highDpi` 기본값은 true이며 대체 글꼴 등록, 모달 표시, 리스너 캡처는 false입니다. 해당 API 상세에도 표시합니다.

컨텍스트와 요소 래퍼는 런타임 생성, 로더 또는 요소 쿼리로 얻습니다. 내부 핸들은 공개 API가 아닙니다. 빌린 객체의 무효화와 리스너 제거는 [문서와 이벤트](documents.ko.md)를 참고하세요.

`Box`와 `RenderBox`는 공개 생성자를 제공하고 독립적인 네이티브 값과 숫자 뷰를 소유합니다. 수명과 복사 규칙은 [상자 값](boxes.ko.md)을 참고하세요.

[소스 진입점](../../packages/sfml.js-rmlui/src/index.ts)과 내보낸 선언이 계약의 기준입니다. 이 바인딩은 문서에 기재된 범위를 다루며 모든 C++ RmlUi API를 제공하지는 않습니다.
