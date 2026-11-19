# RmlUi 렌더 상태

## 콜백 텍스처 {#callback-textures}

`manager.makeCallbackTexture(callback)`은 고유 `CallbackTexture`를 반환합니다.
`toTexture()`의 뷰는 크기 조회나 렌더링에서 GPU 데이터가 처음 필요할 때 동기 생성합니다.
`isValid`는 로딩 없이 리소스 존재를 확인하며 `new CallbackTexture()`는 비어 있고
`invalidHandle()`은 `4294967295`입니다. `release()`는 반복 호출할 수 있으며 기존의
비어 있지 않은 뷰를 무효화합니다. 뷰는 원래 JS 소유자가 회수된 뒤에도 네이티브 리소스를
유지하며 해제된 캐시 인덱스가 재사용되어도 다시 유효해지지 않습니다.
`Decorator.addTexture(view)`도 뷰와 생성 콜백을 유지하며
`getTexture(index)`는 유효성 검사와 소유권을 보존합니다.

```js
const generated = manager.makeCallbackTexture(api =>
  api.generateTexture(
    new Uint8Array([ 128, 0, 0, 128 ]), { x: 1, y: 1 }));

geometry.render({ x: 20, y: 20 }, generated.toTexture());
generated.release();
```

`CallbackTextureInterface`는 생성 콜백 동안만 유효합니다.
`generateTexture(bytes, dimensions)`는 비공유 사전 곱셈 RGBA `Uint8Array`나 `Buffer`,
양의 정수 크기를 받으며 길이는 정확히 너비 × 높이 × 4 바이트입니다.
네이티브 생성 결과를 반환합니다. `saveLayerAsTexture()`는 유효한 비어 있지 않은
시저 영역에서 현재 레이어를 저장합니다. `getRenderManager()`는 원본 관리자를 반환합니다.
`setTextureHandle(handle, dimensions)`는
`manager.generateTextureHandle(bytes, dimensions)`가 만든 소유 `TextureHandle`을
받아 관리자와 원본 크기를 확인하고 소유권을 이전합니다. 이전 후 토큰은 비어 있습니다.
`handle.isValid`는 소유 상태를 확인하며 `handle.release()`는 이전하지 않은 리소스를
해제합니다. 원시 포인터 숫자는 허용하지 않습니다.

성공 시 정확히 한 번 제출하고 동기 불리언을 반환합니다. 제출 없이 true를 반환하거나
Promise 또는 다른 형식을 반환하면 예외입니다. false 또는 예외 시 생성하거나 이전한
텍스처를 해제하고 실패를 캐시하며 재시도하지 않습니다. 생성 중에는 이 인터페이스만
네이티브에 진입할 수 있습니다. 리소스 해제, DOM과 런타임 변경, 재렌더링 및 중첩 로딩은
거부됩니다. 미리 계산한 바이트와 제공된 인터페이스를 사용하세요.

`new CallbackTextureSource(callback)`는 관리자별 고유 리소스를 캐시합니다.
`getTexture(manager)`는 지연 뷰를 반환하며 콜백이 없으면 빈 뷰입니다. 소스가 회수되어도
뷰는 리소스를 유지합니다. 미사용 관리자를 해제하면 해당 항목을 삭제하며 종료 시 리소스,
소스 및 토큰을 무효화합니다. 네이티브 이동 생성과 대입은 JS 참조 대입으로 표현합니다.

[콜백 텍스처](../../packages/sfml.js-rmlui/examples/callback-textures.cjs)는 바이트 생성,
소유 핸들 이전 및 시저 영역 레이어 저장을 검증합니다.

`context.getRenderManager()`는 공유 네이티브 `RenderManager`를 반환합니다.
`new RenderManager(getRenderInterface())`는 독립 관리자를 소유합니다.
종료하면 두 종류 모두 무효화됩니다. 리소스는 생성한 관리자에 속합니다.

`prepareRender({ x, y })`는 기본 상태와 균형 잡힌 레이어 스택에서 패스를 시작합니다.
`setViewport({ x, y })`는 캐시된 뷰포트를 바꾸고 `getViewport()`는 정수 크기를
반환합니다. 크기는 음이 아닌 부호 있는 32비트 정수여야 합니다.

`setScissorRegion({ p0, p1 })`는 유효한 정수 사각형을 뷰포트와 교차합니다.
`null`이나 무효 사각형은 시저를 끕니다. `getScissorRegion()`는 사각형 사본이나
`null`을 반환하고 `disableScissorRegion()`는 시저를 명시적으로 끕니다.

## 저장과 복원

```js
const manager = context.getRenderManager();
const saved = manager.getState();

try {
  manager.setScissorRegion({
    p0: { x: 20, y: 20 }, p1: { x: 200, y: 100 },
  });
  const matrix = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 12, 8, 0, 1,
  ]);

  manager.setTransform(matrix);
  geometry.render({ x: 0, y: 0 });
} finally {
  manager.setState(saved);

  for (const mask of saved.clipMaskList) {
    mask.geometry.release();
  }
}
```

`RenderState`에는 `scissorRegion`, `clipMaskList`, `transform`이 있습니다.
행렬은 유한 값을 가진 열 우선 `Float32Array(16)`입니다.
일반 지오메트리와 마스크는 이동 후 전체 동차 4×4 행렬을 적용하며 원근 보정
텍스처 보간과 −10000~10000의 Z 클리핑을 사용합니다. 사용자 지정 정점
프로그램은 SFML 아핀 변환 규약을 유지합니다.
버퍼는 고정이며 비공유여야 합니다. 부분 뷰도 지원합니다. `setTransform(null)`은
단위 행렬을 선택합니다. `resetState()`는 뷰포트를 유지하며 시저와 마스크를 끄고
단위 행렬로 돌아갑니다.

`getState()`는 네이티브 메시와 행렬을 복사합니다. 원본 요소가 닫혀도 지오메트리는
유효하며 원래 관리자에 속합니다. 해제나 종료 시 무효화됩니다. `setState()`는
모든 필드를 검증한 뒤 독립 네이티브 사본을 유지합니다. 제출한 스냅샷을 변경하거나
해제해도 활성 상태는 유지됩니다. 사용 후 스냅샷 지오메트리를 해제하세요.
잘못된 입력은 캐시 상태를 바꾸지 않습니다. 인수 접근자 실행 후 관리자를 검증합니다.

## 지오메트리 마스크

SFML 창을 `{ settings: { stencilBits: 8 } }`로 생성하세요.

마스크는 제출 당시의 쓰기 시저 영역과 변환을 유지합니다. 현재 시저를 바꿔도
기존 마스크는 넓어지지 않습니다. 겹친 삼각형과 255회를 넘는 교차도 논리적
영역을 유지합니다. 네이티브 토글은 정의를 보존하지만 JS의 `disableClipMask()`는
Core 마스크 목록도 지웁니다.

```js
const { ElementUtilities, ClipMaskOperation } = require('sfml.js-rmlui');
const clipping = ElementUtilities.getClippingRegion(element, true);

manager.setScissorRegion(clipping.region);
manager.setClipMask(clipping.clipMask);

for (const mask of clipping.clipMask) {
  mask.geometry.release();
}

geometry.render({ x: 0, y: 0 });
manager.disableClipMask();

manager.setClipMask(ClipMaskOperation.Set, geometry, { x: 10, y: 20 });
manager.disableClipMask();
```

`setClipMask(masks)`와 `setClipMask(operation, geometry, translation)`는
각 네이티브 오버로드를 호출합니다. 지오메트리는 비어 있지 않고 같은 관리자에 속해야
합니다. 제출 시 메시와 행렬을 복사하고 비활성화, 교체 또는 초기화 시 해제합니다.

`clipMaskGeometryEquals(a, b)`는 네이티브 동등성을 비교합니다. 연산과 오프셋은 값,
지오메트리와 행렬은 참조로 비교하며 `null` 행렬끼리는 같습니다. 같은 내용이라도
별도 행렬 배열은 같지 않습니다. 별도 스냅샷은 독립 리소스입니다. 부정은 `!`입니다.

## 레이어와 필터 목록 {#render-layers}

```js
const { BlendMode, FilterHandleList } = require('sfml.js-rmlui');
const destination = manager.getTopLayer();
const layer = manager.pushLayer();

try {
  geometry.render({ x: 20, y: 20 });
  const blur = manager.compileFilter('blur', { sigma: 3 });
  const filters = new FilterHandleList();

  blur.addHandleTo(filters);

  try {
    manager.compositeLayers(layer, destination, BlendMode.Blend, filters);
  } finally {
    filters.clear();
    blur.release();
  }
} finally {
  manager.popLayer();
}
```

`pushLayer()`는 투명한 오프스크린 타깃을 선택합니다. 호출마다 `popLayer()`가
필요하며 다음 `context.render()`나 `prepareRender()` 전에 스택을 균형 있게
유지하세요. `getTopLayer()`는 정규 불투명 토큰이며 최초 푸시 전에는 레이어 0입니다.
프레임 안에서는 투명한 UI 내용을 포함하고 프레임 밖에서는 호스트 창을 나타냅니다.
`getNextLayer()`는 바로 아래 층을 반환하고 빈 스택에서는 예외를 던집니다.
이 API로 추가한 층만 팝할 수 있습니다. 같은 렌더러에서 서로 다른 관리자의
활성 타깃을 번갈아 사용할 수 없습니다.

`compositeLayers(source, destination, blendMode, filters?)`는 같은 관리자의
활성 토큰을 받습니다. 소스와 대상 모두 레이어 0을 사용할 수 있습니다.
`BlendMode.Blend`는 미리 곱한 알파로 대상 위에 합성하며 `BlendMode.Replace`는
활성 클리핑 영역의 픽셀을 교체합니다. 자기 합성은 입력을 복사합니다.
타깃 풀 재사용 후에도 팝한 토큰은 무효입니다. 목록은 삽입 순서대로 적용하며
래퍼 회수 후에도 네이티브 리소스를 유지합니다. 해제했거나 다른 관리자에 속한
필터는 합성 전에 예외를 던집니다. `clear()`는 목록의 소유권을 해제합니다.

`saveLayerAsMaskImage()`는 활성 시저 영역의 알파를 `CompiledFilter`로 저장합니다.
`FilterHandleList`에 추가하면 원래 뷰포트 위치에서 이후 픽셀에 마스크 알파를
곱합니다. 레이어 0도 마스크를 제공할 수 있습니다. 소스 층을 팝해도 스냅샷은 유효합니다. 영역이 무효이면
무효 필터를 반환합니다. 사용 후 해제하세요.

데코레이터 렌더 콜백에서 상태와 레이어 조회 및 제출을 지원합니다. 이벤트 콜백에서는
조회만 지원합니다. 셰이더와 플랫폼 렌더 검증은 별도로 필요합니다.
호출자가 소유한 층은 팝할 수 없습니다. 불균형한 층을 남겨 반환하면 오류를 보고하고
네이티브 렌더링을 계속하기 전에 그 층을 해제하며 기존 콜백 예외는 보존합니다.
[요소 검사기](../../packages/sfml.js-rmlui/examples/element-utilities.cjs)에서
네이티브 지오메트리 클리핑, 행렬 제출과 상태 복원을 확인할 수 있습니다.
[레이어 합성](../../packages/sfml.js-rmlui/examples/render-layers.cjs)은
중첩 합성, 자기 합성 블러와 알파 마스크를 표시합니다. Space로 이동하고
Escape로 종료하세요.
