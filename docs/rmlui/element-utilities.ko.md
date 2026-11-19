# RmlUi 요소 유틸리티

`ElementUtilities`는 `Rml::ElementUtilities`의 모든 정적 연산을 노출합니다.
계산된 글꼴, 레이아웃, 클리핑을 조회하기 전에 컨텍스트를 업데이트하세요.
변환을 변경한 뒤 한 번 렌더링하여 누적 변환 상태를 업데이트합니다.

```js
const { ElementUtilities: utilities, BoxArea, PositionAnchor } =
  require('sfml.js-rmlui');
const panel = utilities.getElementById(document, 'panel');
const width = utilities.getStringWidth(panel, 'AV');
const bounds = utilities.getBoundingBox(panel, BoxArea.Auto);
const box = utilities.buildBox({ x: 640, y: 480 }, panel);

utilities.positionElement(panel, { x: 12, y: 12 }, PositionAnchor.BottomRight);
```

`getElementById(root, id)`는 루트를 포함하여 너비 우선으로 검색합니다.
태그와 클래스 검색은 루트를 제외하고 유효한 래퍼 배열을 반환합니다.
`getElementsByTagName(root, tag, stopTag)`의 선택적 `stopTag`는 해당 노드의
자손 검색을 중지합니다. 중지 노드 자체는 일치할 수 있습니다.
래퍼 동일성을 유지합니다. 배열은 사본이지만 포함된 래퍼는 네이티브 요소가
파괴되면 무효화됩니다.

`getDensityIndependentPixelRatio(element)`는 컨텍스트 밀도 비율을 반환하며
컨텍스트가 없으면 1입니다.
`getStringWidth(element, text, priorCharacter = 0)`는 네이티브 글꼴과 셰이핑
설정으로 UTF-8 텍스트를 측정합니다. 앞선 문자는 커닝을 위한 Unicode
스칼라 코드포인트입니다. 정수 픽셀 너비를 반환하고 글꼴이 없으면 0입니다.

`getBoundingBox(element, area)`에는 `BoxArea`가 필수이며
`{ p0: { x, y }, p1: { x, y } }`를 반환합니다.
네이티브 투영 실패 시 `null`입니다. `Auto`는 상위 구현처럼 테두리 상자와
바깥 box-shadow 넘침을 포함하며 필터 넘침은 포함하지 않습니다.

## 클리핑 사본

```js
const clipping = utilities.getClippingRegion(panel, true, false);

console.log(clipping.region, clipping.clipMask.length);

for (const mask of clipping.clipMask) {
  console.log(mask.operation, mask.absoluteOffset, mask.transform);
  const mesh = mask.geometry.getMesh();

  console.log(mesh.indices.length);
  mask.geometry.release();
}
```

`getClippingRegion(element, includeClipMask = false, forceClipSelf = false)`는
두 네이티브 출력을 반환합니다. `region`은 정수 시저 사각형 또는 `null`이며,
변환된 마스크는 `region`이 `null`이어도 존재할 수 있습니다.
`forceClipSelf`는 대상 테두리 영역을 포함합니다.
마스크 지오메트리를 요청하려면 요소가 컨텍스트에 연결되어 있어야 합니다.

각 마스크에는 `ClipMaskOperation`, 독립 소유 `Geometry`, 반올림된
`absoluteOffset`, 복사된 열 우선 `Float32Array(16)` 변환이 있습니다.
`null` 변환은 단위 변환입니다. 반환된 행렬이나 메시 변경은 원본 요소에
영향을 주지 않습니다. 지오메트리는 문서를 닫거나 래퍼를 회수해도 유효하며,
명시적 해제, 런타임 종료 또는 렌더 관리자 해제 시 무효화됩니다.
사용 후 사본을 해제하세요.

`setClippingRegion(element, forceClipSelf = false)`는 클리핑을 렌더 관리자에
제출하고 네이티브 가시성을 반환합니다.
`applyTransform(element)`는 누적 변환을 제출합니다.
컨텍스트가 없으면 두 연산 모두 `false`입니다.
지오메트리 마스크를 사용하려면 창에 `stencilBits: 8`을 설정하세요.

## 레이아웃과 데이터 뷰

`buildBox(containingBlock, element, inlineElement = false)`는 요소에 설정하지
않고 독립 `Box`를 반환합니다. 인라인 크기는 미해결 자동 크기를 포함하여
상위 구현의 규칙을 따릅니다.
`formatElement(element, containingBlock)`는 네이티브 레이아웃 엔진을 실행하며
사용자 지정 비 DOM 콘텐츠에 유용합니다. 요소를 분리하기 전에 DOM에서
스타일을 계산하세요. 배치는 미갱신 스타일을 계산하지 않습니다.
포함 블록 크기는 유한한 음이 아닌 값이어야 합니다.

`positionElement(element, offset, anchor)`는 상자를 구성하고 설정하며,
상위 콘텐츠 영역으로 상대 길이를 해석한 뒤 가장자리나 모서리에서 배치합니다.
CSS 위치 속성도 최종 오프셋에 영향을 줍니다.
8개 `PositionAnchor`는 네이티브 비트 값을 유지합니다.
상위 요소가 없으면 `false`이며 오프셋은 유한해야 합니다.

`applyDataViewsControllers(element)`는 네이티브 연산으로 `data-*` 속성에서
뷰와 컨트롤러를 구성합니다. 모델이나 적용할 바인딩이 없으면 `false`입니다.
뷰나 컨트롤러 초기화에 성공하면 `true`입니다. 연결한 요소에 속성을 설정한 뒤
이 메서드로 바인딩을 구성하고 모델이나 컨텍스트를 갱신하세요. 값 뷰와 컨트롤러는
입력 값을 동기화하고 모델 이벤트를 실행합니다. 모델 제거 시 컨트롤러 등록과
요소 연결이 해제됩니다. 재호출은 구성 작업이며 멱등 바인딩 갱신이 아닙니다.

모든 연산은 파괴된 요소를 거부합니다. 배치, 데이터 구성, 렌더 상태 제출은
상위 코드를 실행하기 전에 안전하지 않은 콜백 재진입을 거부합니다.
인자 getter가 완료된 뒤 네이티브 대상 유효성을 검사합니다.

[요소 검사기](../../packages/sfml.js-rmlui/examples/element-utilities.cjs)에서
위치, 투영 경계, 텍스트 너비와 클리핑 사본을 확인할 수 있습니다.
