# 플러그인

`Plugin`은 Native가 소유하는 `Rml::Plugin` 어댑터입니다. 생성 시 콜백을 캡처한 후
등록합니다.

```js
const rmlui = require('sfml.js-rmlui');
const plugin = new rmlui.Plugin({
  getEventClasses() {
    return rmlui.PluginEventClasses.Basic;
  },
  onContextCreate(context) {
    console.log(context.name, context.dimensions.width);
  },
});

rmlui.registerPlugin(plugin);
// 런타임을 종료하기 전에 해제합니다.
rmlui.unregisterPlugin(plugin);
```

초기화 전에 등록할 수 있습니다. 구독 비트는 `Basic`(1), `Document`(2),
`Element`(4), `DataModel`(8)이며 기본값 `All`은 15입니다.
서로 다른 분류는 비트 OR로 결합합니다. `getEventClasses`는 등록마다 한 번 실행하고
해제까지 마스크를 고정합니다. 원래 콜백 객체의 속성을 변경해도 캡처한 함수는 유지됩니다.

| 콜백 | 네이티브 알림 시점 |
| --- | --- |
| `onInitialise()` | 최초 시작 시 Basic 구독자, 초기화 후 등록은 삽입 전에 항상 알림 |
| `onShutdown()` | 초기화 후 명시적 해제는 모든 마스크, 전체 종료는 Basic을 등록 역순으로 알림 |
| `onContextCreate(context)` | 크기 설정과 컨텍스트 등록 후 |
| `onContextDestroy(context)` | 문서와 모델 파괴 전 |
| `onDocumentOpen(context, documentPath)` | 스트림 로드와 파싱 전. 경로 오버로드는 이미 파일을 열었습니다 |
| `onDocumentLoad(document)` | 생성과 삽입 후, `load` 이벤트 전 |
| `onDocumentUnload(document)` | `unload` 이벤트 후 |
| `onElementCreate(element)` | Factory가 속성을 적용한 후 |
| `onElementDestroy(element)` | 기본 Element 소멸 중, 메타데이터와 자식 파괴 전 |
| `onDataModelCreate(context, name)` | 네이티브 모델 삽입 후 |
| `onDataModelDestroy(context, name)` | 제거 전, `context.getDataModel(name)`으로 조회 가능 |

인수는 실제 객체를 빌린 별도 래퍼입니다. 컨텍스트 이름과 크기 및 모델 조회,
요소 id와 태그 및 속성, 문서 제목과 URL을 읽을 수 있습니다. 반환 후 빌린 핸들의
네이티브 호출은 무효화됩니다. 보관한 크기 뷰의 메모리는 안전하며 만료 시 0으로
초기화합니다. 필요한 값은 알림 중 복사하세요. 조회한 모델은 실제 수명을 따르며 모델
제거나 컨텍스트 파괴 후 무효화됩니다. 기본 Element 소멸 중에는 살아 있는 기본 필드만
노출합니다.

알림 중 등록을 변경할 수 있습니다. 자체 해제는 다음 구독자를 건너뛰지 않고 이후
알림을 중지합니다. 추가 등록은 다음 알림부터 적용되지만 초기화 상태라면
`onInitialise`는 즉시 호출합니다. 늦은 `onInitialise` 중 자체 해제는 삽입을 취소하고
반환 후 `onShutdown`을 호출합니다. 중복 등록은 오류이며 반복 해제는 false입니다.

업스트림 헤더는 파일 열기 전 알림으로 설명하지만 RmlUi 6.3 경로 오버로드는 실제로
StreamFile을 먼저 열고 실패하면 알리지 않습니다. 메모리와 스트림은 문서 파싱 전에
알립니다. 이 어댑터는 실측한 Core 순서를 유지합니다.

모든 알림은 동기적으로 undefined를 반환해야 합니다. 예외는 바깥 네이티브 호출이
안전하게 반환할 때까지 보관하고 파괴와 빌린 인수의 무효화는 완료합니다.
Promise는 거부하며 거부 결과를 처리합니다. DOM 변경, 레이아웃, 렌더링, 입력과 런타임
종료는 허용하지 않습니다. 파서, 생성기, 효과 및 값 콜백은 등록을 수정할 수 없고 전체
종료 중 새 등록도 거부합니다.

등록 중에는 JS 래퍼가 수집되어도 Native가 어댑터와 콜백을 유지합니다.
해제 시 바깥 Native 경계에서 루트 참조를 해제하여 미등록 순환 참조를 수집할 수
있습니다. 런타임 종료는 모든 어댑터를 무효화합니다. 구독 알림이 발생하지 않는 정적
프레임에는 플러그인 콜백이나 등록 테이블 탐색을 추가하지 않습니다.
