# RmlUi 문서와 이벤트

RML 문서는 지속되는 요소 트리입니다. 한 번 로드한 뒤 애플리케이션 상태에 따라 요소를 변경하고 매 프레임 `context.update()`를 호출합니다.

타입별 폼, 제출, 텍스트 선택 및 선택 항목 API는 [폼 컨트롤](./controls.ko.md)을 참고하세요.

메모리, 파일, 사용자 입력은 [바이트 스트림](./streams.ko.md)을 참고하세요.

자손 검색, 글꼴 측정, 클리핑 사본과 명시적 배치는
[요소 유틸리티](./element-utilities.ko.md)를 참고하세요.

## 소유 네이티브 요소 생성

구체 타입은 `new Constructor(tag, attributes = {})`로 생성합니다. 태그와
네이티브 타입은 독립됩니다. `new ElementFormControlInput('field',
{ value: 'ready' })`는 텍스트 입력 기본값을 초기화합니다. Element와 ElementText는
네이티브 풀을, 다른 구체 타입은 각각의 생성기를 사용합니다. JS 하위 타입은 가장
가까운 등록된 네이티브 타입을 사용하며 추상 ElementFormControl의 직접 생성은
거부합니다.

```js
const { ElementFormControlInput } = require('sfml.js-rmlui');
const field = new ElementFormControlInput('input', { value: 'ready' });

document.appendChild(field);
document.removeChild(field);
field.release();
```

속성을 복사하고 getter보다 먼저 런타임 세대를 저장합니다. 변환 중 재시작을 거부하며
Factory 등록 변경이나 플러그인 생성 알림은 없습니다. 내부 자식은 Factory를
사용합니다. ElementInstancer는 이 소유 분리 요소를 반환할 수 있으며 복제 및 해제는
원래 생성기를 유지합니다.

`release()`는 연결된, 빌린, 호출 중인 트리를 거부하고 동기 네이티브 파괴로 모든
자식 래퍼를 무효화합니다. 자식 래퍼는 명시적 해제나 모든 참조 회수까지 분리 소유
루트를 유지합니다. GC도 원래 생성기를 사용합니다. 소유 관계 갱신은 대상 트리만
방문합니다. 생성은 세대 조회와 복사 전송의 두 네이티브 호출, 해제는 한 호출을
사용하며 이들은 설정 작업입니다.

## 네이티브 XML 파싱 {#xml-parser}

`BaseXMLParser`는 원본 토크나이저를 소유합니다. `parseEvents(stream)`는 한 번의
네이티브 진입으로 순서가 있는 `start`, `end`, `data` 스냅샷을 수집하며 토큰마다
JavaScript를 호출하지 않습니다. 속성과 내용은 독립 사본입니다.
`XMLDataType.Text`, `CDATA`, `InnerXML`은 데이터 종류를 나타냅니다.
원본의 명시적 `<![CDATA[...]]>`는 일반 Text에 합쳐집니다. 등록된 원시 내용 태그는
CDATA, 지정 속성이 캡처한 내부 마크업은 InnerXML을 생성합니다.

```js
const { BaseXMLParser, StreamMemory } = require('sfml.js-rmlui');
const source = new StreamMemory(Buffer.from('<panel key="ready">text</panel>'));

source.setSourceURL('views/panel.rml');

const tokenizer = new BaseXMLParser();

tokenizer.registerCDATATag('script');
tokenizer.registerInnerXMLAttribute('capture');
const events = tokenizer.parseEvents(source);

console.log(events);
```

동기 JavaScript 처리에는 선택적 `handleElementStart(parser, name, attributes)`,
`handleElementEnd(parser, name)`, `handleData(parser, data, type)` 콜백을 생성자에
전달하세요. `parse(stream)`는 네이티브 순서대로 호출하며 반환값은 `undefined`여야
합니다. Base의 공개 `handleElementStart`, `handleElementEnd`, `handleData`도
콜백 밖에서 가상 메서드를 호출합니다. 콜백 파서 참조는 반환 시 만료됩니다.
파싱 전 행 번호는 0이고 파싱 중에는 1부터 시작합니다. `getSourceURL()`은 파싱
중에만 사용할 수 있으며 가상 메서드 직접 호출에는 소스 URL이 없습니다.

`XMLParser(root)`는 검사된 요소 또는 문서를 유지하고 `parse(stream)`로 네이티브
DOM을 구성합니다. `parseEvents`는 지원하지 않으며 보호된 시작 및 종료 태그 가상
메서드의 직접 호출도 거부합니다. `XMLNodeHandler`에는 세 가지 동기 구조 콜백이
필요합니다. 일반 요소 생성은 네이티브 기본 핸들러에 위임할 수 있습니다.

```js
const { XMLParser, XMLNodeHandler, StreamMemory } = require('sfml.js-rmlui');
const delegate = XMLNodeHandler.createDefault();

XMLParser.registerNodeHandler('panel', new XMLNodeHandler({
  elementStart(parser, name, attributes) {
    parser.pushDefaultHandler();

    return delegate.elementStart(parser, 'div', attributes);
  },
  elementEnd(parser, name) {
    return delegate.elementEnd(parser, name);
  },
  elementData(parser, data, type) {
    return delegate.elementData(parser, data, type);
  },
}));

const document = context.createDocument();
const parser = new XMLParser(document);

parser.parse(new StreamMemory(Buffer.from(
  '<body><panel id="panel">content</panel></body>')));
```

시작 콜백은 현재 파싱 하위 트리가 소유한 요소 또는 `null`, 종료 및 데이터 콜백은
불리언을 반환합니다. Promise는 거부합니다. `getParseFrame()`은 독립 필드와 검사된
요소 및 핸들러 참조를 반환합니다. `getDocumentHeader()`는 소유 사본입니다.
콜백 밖에서 편집을 준비한 뒤 파싱 중 `setDocumentHeader(copy)`로 기록하세요.
`pushHandler`, `pushDefaultHandler`, XML의 `handleData`는 활성 파싱이 필요합니다.
콜백은 현재 파서를 검사하거나 핸들러에 위임할 수 있지만 DOM, 스트림, 레지스트리,
런타임은 변경할 수 없습니다.

등록은 태그를 소문자로 바꾸며 `getNodeHandler`는 대소문자를 구분하여 조회합니다.
빈 등록은 기본 핸들러를 설정하고 빈 조회는 `null`을 반환합니다. 등록 교체는 기존
XMLParser와 빌린 핸들러를 무효화합니다. 소유 핸들러와 영구 CDATA 태그는 초기화
전에도 등록할 수 있으며 새 파서가 채택합니다. `shutdown()`은 등록과 채택되지 않은
초기 설정을 해제하고 모든 참조를 무효화합니다. 컨텍스트 제거는 소속 루트의 파서를
무효화합니다. 미등록 콜백 순환 참조는 회수할 수 있습니다.

## 네이티브 문서 헤더 {#document-header}

`DocumentHeader`는 실제 네이티브 `Rml::DocumentHeader`를 소유합니다.
`source`, `title`, `templateResources`, `rcss`, `scripts`의 기본값은 빈 문자열과
빈 목록입니다. 리소스는 `{ path, content, isInline, line }`이며 기본값은 각각
`""`, `""`, `false`, `0`입니다. 인라인 경로는 내용 출처이며 외부 RCSS 및 스크립트
경로는 해석된 리소스 경로입니다.

```js
const { DocumentHeader } = require('sfml.js-rmlui');
const header = new DocumentHeader({
  source: '/absolute/path/to/panel.rml',
  title: 'Panel',
  templateResources: [ 'base.rml' ],
  rcss: [{
    path: '/absolute/path/to/panel.rml',
    content: 'body { width: 320px; }',
    isInline: true,
    line: 4,
  }],
});

document.processHeader(header);
document.updateDocument();
document.show();
```

`processHeader`는 템플릿을 로드하고 소스 순서로 리소스를 병합합니다. 문서 규칙은
앞선 템플릿 규칙을 덮어씁니다. 문서 자체의 소스와 제목을 저장하고 스크립트 훅을
호출한 뒤 즉시 숨기며 `hide` 이벤트는 발생하지 않습니다. 빈 문서 제목에는 템플릿
제목을 사용하지 않습니다. RCSS가 로드되지 않으면 기존 시트를 유지합니다. 레이아웃
조회 전에 `updateDocument()`, 표시하려면 `show()`를 호출하세요.
컨텍스트가 없는 분리 문서는 해석한 RCSS를 유지하지만 미디어 블록을 컴파일하지
않습니다. 컨테이너를 컨텍스트 소유 문서에 설정하면 해당 규칙을 적용할 수 있습니다.

`replace(input)`는 검증 후 한 번의 네이티브 호출로 모든 필드를 교체하며 생략한
필드는 기본값으로 돌아갑니다. setter와 `snapshot()`의 입출력은 독립 사본입니다.
경로의 널 바이트는 거부하며 행 오프셋은 int32 범위입니다. getter 예외 시 기존
저장소를 유지하며 런타임 재시작은 이전 헤더와 문서를 무효화합니다.

`mergeHeader(other)`는 원본 병합을 실행합니다. 기존의 비어 있지 않은 소스와 제목을
유지하고 `other.source` 기준으로 템플릿을 해석하며 RCSS와 스크립트 경로는 바꾸지
않고 추가합니다. 자기 병합은 사본을 사용합니다. `mergePaths(target, source,
basePath)`와 `mergeResources(target, source)`는 병합 대상의 독립 배열을 반환하며
입력 배열은 바꾸지 않습니다. 저장하려면 결과를 헤더 필드에 대입하세요.

`document.title`은 네이티브 GetTitle/SetTitle를 호출하고 SFML 창 제목은 바꾸지
않습니다. `hide()`는 `hide` 이벤트와 표시 및 포커스 갱신을 수행하고 문서를 유지합니다.
`close()`는 `unload`를 발생시키고 다음 `context.update()`까지 파괴를 지연합니다.
실제 파괴 전에는 래퍼를 읽을 수 있습니다.

스크립트 레코드는 소스 순서와 인라인 행 오프셋을 유지합니다. Core 기본 훅은 비어
있습니다. 로드 전에 [NodeScriptHost 또는 LuaScriptHost](scripts.ko.md)를 선택하면
신뢰할 수 있는 JavaScript 또는 Lua를 실행할 수 있습니다.

## 문서 로드

```js
const document = context.loadDocument('/absolute/path/to/panel.rml');

document.show();
```

생성한 마크업에는 `loadDocumentFromMemory(rml, sourceUrl)`을 사용합니다. 상대 경로 스타일시트, 이미지, 템플릿에 기준 경로가 필요하면 소스 URL을 전달합니다. 두 로더 모두 실패 시 예외를 던지고 성공 시 숨겨진 문서를 반환합니다.

`sourceUrl`을 생략하면 `"[document from memory]"`를 사용하고 `""`는 유지합니다.
문자열이 아닌 값과 널 문자는 로드 전에 거부합니다. 네이티브 해석기는 `<head>`에서
`document.sourceURL`을 기록합니다. 소스 URL이나 외부 리소스가 필요한 문서에는
이 요소를 포함하세요.

`initialise(window, { fileRoot })`는 `/assets/...`를 포함해 지정 디렉터리를 먼저 찾고 원래 경로를 시도하게 합니다. 파일 시스템 접근을 제한하지 않습니다. 글꼴은 문서보다 먼저 별도로 로드해야 합니다.

## 요소 편집

[카운터](../../packages/sfml.js-rmlui/examples/demo.cjs)에서 문서를 로드한 뒤 넣는 예입니다.

```js
const button = document.getElementById('increment');
const counter = document.querySelector('#counter');

if (!button || !counter) {
  throw new Error('Counter elements are missing');
}

button.setClass('ready', true);
button.setAttribute('title', 'Increase the counter');
button.setProperty('width', '180dp');
```

쿼리는 일치하는 요소가 없으면 `null`을 반환합니다. `setProperty`는 RCSS가 값을 수락했는지 반환하며 `removeProperty`는 인라인 재정의를 제거합니다. `innerRML`은 마크업을 파싱해 자식 요소를 교체합니다. 파괴 시 리스너를 자동 해제하고 모든 별칭 래퍼를 무효화합니다. 교체 후 새 자식을 다시 찾으세요.

`getElementById`는 형제 요소를 포함한 소유 문서 전체를 검색합니다. `querySelector`는 하위 요소만 검색합니다. RmlUi는 특수 id인 `#self`, `#document`, `#parent`도 지원합니다.

## 리스너 등록과 제거

```js
let clicks = 0;

function increment(event) {
  clicks++;
  counter.innerRML = `Clicks: ${clicks}`;
  console.log(event.type, event.targetId);
}

button.addEventListener('click', increment);
// Optional: stop receiving clicks while keeping the button alive.
button.removeEventListener('click', increment);
```

제거할 때 같은 요소, 함수, 이벤트 유형, 캡처 플래그를 사용합니다. 캡처 기본값은 false입니다. 같은 함수를 여러 등록에서 공유할 수 있으며 동일 등록은 중복되지 않고 없는 등록 제거는 아무 효과가 없습니다. 제거, 요소 파괴, 런타임 종료 시 콜백을 자동 해제합니다. 실행 중 자신이나 다른 리스너도 제거할 수 있습니다.

리스너 안에서 클래스, 스타일, 제목, 대상 자체의 일반 속성, 무관한 하위 트리를 동기 변경할 수 있으며 위 카운터도 동작합니다. 활성 이벤트 대상이나 네이티브 호출 대상을 포함한 하위 트리 교체는 변경 전에 거부됩니다. 속성 설정과 제거에도 같은 보수적인 검사를 적용하므로 상위 요소의 일반 속성도 제한됩니다. 활성 입력 요소의 `type` 설정과 제거는 콜백을 실행 중인 네이티브 위젯을 파괴할 수 있어 거부됩니다. 종료, 문서 언로드, 재귀 갱신 및 입력도 거부되므로 이런 작업은 `queueMicrotask`로 처리 이후에 예약하세요. 리스너 예외는 해당 입력 처리 등 호출한 네이티브 작업에서 전파됩니다.

리스너는 동기 실행됩니다. `RmlEvent`는 `type`, `id`, `phase`, `targetId`, `target`, `currentTarget`, `isInterruptible`, `parameters`, `unprojectedMouseScreenPosition`의 스냅샷을 저장합니다. 대상은 검증된 요소 래퍼이며 id가 없거나 중복되어도 반복 조회와 이벤트 대상의 `===` 동일성을 보존합니다. `id`는 이벤트 **종류** 식별자이며 발송 순번이 아닙니다. 네이티브 요소 파괴 시 래퍼는 무효화됩니다.

`isPropagating`, `isImmediatePropagating`, `stopPropagation()`, `stopImmediatePropagation()`은 현재 리스너 콜백에서만 네이티브 이벤트에 접근합니다. 콜백 종료 후에는 예외를 던지며 저장한 필드는 읽을 수 있습니다. 전파 중단은 현재 DOM 단계의 리스너를 완료하고 즉시 중단은 나머지 리스너도 건너뜁니다. 중단 불가능한 이벤트에는 두 메서드가 영향을 주지 않습니다. 단계 값은 `EventPhase.Capture = 1`, `Target = 2`, `Bubble = 4`입니다. 대상 요소에서는 일반 리스너가 capture 리스너보다 먼저 실행되며 각 그룹 내부는 등록 순서입니다.

매개변수는 불리언, 숫자, 문자열, null을 보존합니다. 부호 있는 정수와 없는 64비트 정수는 정확한 BigInt로 변환되며 JS BigInt 입력 범위는 `-2^63`부터 `2^64 - 1`입니다. 벡터는 `{ x, y }`, `{ x, y, z }`, `{ x, y, z, w }`, 색상은 `{ type: 'colourb' | 'colourf', red, green, blue, alpha }` 형식입니다. 바이트 채널은 0~255 정수이며 실수 색상과 벡터는 네이티브 float 정밀도를 사용합니다. 타입이 있는 요소 값과 네이티브 `drag_element`는 검증된 요소가 됩니다. 지원하지 않는 소유자 타입과 임의 포인터는 문자열 변환 대신 예외를 던집니다.

매개변수 getter는 JavaScript를 실행할 수 있습니다. 모든 getter가 끝난 후 대상 요소와 요소 참조를 검증하고, 파괴된 객체가 있으면 예외를 던집니다. 요소 타입 매개변수는 이벤트 전달이 반환될 때까지 보호되며 하위 트리 교체로 파괴할 수 없습니다.

```js
button.addEventListener('counter-update', event => {
  console.log(event.target === button, event.parameters.total);
  event.stopPropagation();
});
button.dispatchEvent('counter-update', { total: 9007199254740993n });
button.click();
```

`dispatchEvent(type, parameters?, options?)`는 중첩 발송을 지원합니다. 옵션을 생략하면 상위 이벤트 정의를 사용하고 `{ interruptible, bubbles }`를 전달하면 지정하지 않은 항목은 true입니다. 반환값은 전파 계속 여부입니다. `click()`은 `Rml::Element::Click`을 호출합니다. 내부와 외부 콜백의 이벤트 수명은 독립적이며 내부 실행 중에도 외부 이벤트가 유효합니다. 첫 번째 미처리 리스너 예외는 가장 바깥 네이티브 진입점에서 다시 던지며 해당 진입점이 반환될 때까지 이후 JS 리스너를 건너뜁니다.

`context.processEvent(event)`는 키·텍스트·휠 이벤트에서 전파 상태를 반환합니다. 마우스·터치의 false는 요소와 상호작용 중임을 뜻하며 전파 제어와 무관합니다. 무시한 이벤트는 true입니다. 창 닫기 이벤트는 결과와 관계없이 처리하세요.

## 직접 입력 {#직접-입력}

SFML 이벤트를 만들지 않고 컨텍스트에 직접 입력할 수 있습니다. `KeyIdentifier`는 사용자 정의 범위 177–250을 포함한 모든 상위 `KI_*` 이름을 제공합니다. `KeyModifier`의 일곱 `KM_*` 플래그는 비트 OR로 결합합니다. 보조 키 인수의 기본값은 0입니다.

```js
context.processKeyDown(rmlui.KeyIdentifier.KI_A, rmlui.KeyModifier.KM_CTRL);
context.processKeyUp(rmlui.KeyIdentifier.KI_A);
context.processTextInput('水😀');
context.processTextInput(0x1f642);
context.processMouseMove(40, 80);
context.processMouseButtonDown(0);
context.processMouseButtonUp(0);
context.processMouseWheel({ x: 1, y: 0 });
context.processMouseLeave();
```

키·텍스트·휠 메서드는 전파가 계속되는지 반환합니다. 마우스 메서드는 요소와 상호작용하지 않는지 반환하며 `isMouseInteracting`은 반대 힌트입니다. 버튼은 마지막 입력 위치를 사용합니다. 왼쪽 0, 오른쪽 1, 가운데 2이며 좌표는 창의 물리 픽셀입니다. 휠 벡터의 양수는 오른쪽과 아래입니다. 숫자 인수는 사용 중단된 수직 전용 오버로드를 유지합니다. 문자열은 `textinput` 이벤트 하나를 생성하고 숫자는 Unicode 스칼라입니다. 잘못된 스칼라와 단독 UTF-16 서로게이트는 예외를 던집니다. 직접 텍스트 입력은 제어 문자를 유지합니다.

`processTouchStart`, `processTouchMove`, `processTouchEnd`, `processTouchCancel`은 `{ identifier, position: { x, y } }` 목록을 받습니다. 식별자는 정확한 음수 아닌 네이티브 `uintptr_t` 값이며 `Number.MAX_SAFE_INTEGER`를 넘으면 `bigint`를 사용합니다. 좌표는 네이티브 부동 소수점 값으로 변환합니다. 전체 검증 후 모든 항목을 처리하고 결과를 논리 AND로 결합합니다. 빈 목록은 true입니다. 알 수 없는 식별자의 move/end는 true, cancel은 false입니다. cancel에는 보조 키 인수가 없습니다. RmlUi 6.3은 터치를 마우스로 모방하므로 취소 시 왼쪽 버튼을 해제하며 클릭이 발생할 수 있습니다.

SFML 키 전달은 이벤트 보조 키 스냅샷을 사용합니다. 시스템 키는 macOS에서 `KI_LMETA/KI_RMETA`, 다른 플랫폼에서 `KI_LWIN/KI_RWIN`으로 매핑합니다. 포인터는 현재 보조 키 상태를 읽습니다. SFML은 잠금 토글 상태를 제공하지 않아 해당 플래그는 0이며 직접 입력으로 일곱 플래그를 모두 지정할 수 있습니다. SFML 터치는 항목 하나의 목록으로 전달합니다. `TextEntered`는 CR을 LF로 바꾸고 다른 제어 문자를 건너뜁니다. RmlUi 콜백 중 재입력은 거부하며 필요하면 `dispatchEvent`를 중첩할 수 있습니다. 예외는 가장 바깥 입력 호출에 전달됩니다. 저장한 이벤트 제어는 콜백 종료 후 만료되며 shutdown 후에도 복구되지 않습니다.

## 기본 생성 이벤트 {#default-events}

초기화 후 `new rmlui.RmlEvent()`는 소유 네이티브 `Rml::Event()`를 생성합니다.
대상과 현재 요소는 null이고 유형과 매개변수는 비어 있으며 ID는 `EventId.Invalid`,
단계는 `EventPhase.None`, 마우스 화면 좌표는 `{ x: 0, y: 0 }`입니다.
중단할 수 없으며 공개 `target` 타입은 `Element | null`입니다.

```js
const event = new rmlui.RmlEvent();
const listener = new rmlui.EventListener(value => {
  console.log(value.target, value.getParameter('count', 0));
});

listener.processEvent(event);
event.release();
listener.release();
```

소유 이벤트는 명시적 해제, GC 또는 종료까지 유효합니다. 수동 리스너는 별도 빌린
이벤트를 받으며 콜백 반환 시 무효화됩니다. `setCurrentElement(element)`는 대상과
독립적으로 현재 노드를 관찰하며 교체나 초기화 시 이전 노드 관찰을 종료합니다.
참조 노드가 파괴되면 네이티브 접근은 예외를 던지지만 `release()`는 가능합니다.
`isType(nameOrId)`는 해제 후에도 보관한 유형 또는 ID 스냅샷을 비교합니다.

## 이벤트 정의

요소와 컨텍스트 리스너는 이름 또는 숫자 `EventId`를 받습니다. 같은 이름과 ID는 리스너 등록 식별자를 공유하므로 중복 등록되지 않으며 어느 형식으로도 제거할 수 있습니다. `context.getRootElement()`는 고유 루트 래퍼를 반환하며 컨텍스트 리스너는 해당 루트에 등록됩니다.

`registerEventType(name, interruptible, bubbles, defaultActionPhase?)`는 네이티브 ID를 반환합니다. 사용자 정의 이름을 다시 등록하면 ID를 유지하면서 플래그를 교체합니다. 내장 유형의 플래그는 변경하지 않습니다. 사용자 정의 ID는 런타임 종료 시 만료됩니다. `DefaultActionPhase.None`, `Target`, `TargetAndBubble`은 리스너 종료 후 기본 동작을 제어하며 기본값은 `None`입니다. 발송 옵션은 중단과 버블 플래그만 재정의하고 등록된 기본 동작 단계를 유지합니다. 중단 가능한 click의 전파를 중단하면 체크박스 전환을 방지합니다.

## 컨텍스트 등록과 갱신 예약

`getContext(nameOrIndex)`는 래퍼 식별자를 유지하고 `getNumContexts()`는 활성 컨텍스트 수를 반환합니다. 이름이 없거나 인덱스가 범위를 벗어나면 `null`입니다. 이는 고정 버전 6.3 구현을 따르며 헤더의 인덱스 제한 주석과 다릅니다. 인덱스 순서는 네이티브 등록을 따릅니다. `removeContext(name)`은 이름이 없으면 false, 제거 성공과 `context.remove()`는 true를 반환하고 별칭을 무효화합니다. `context.name`은 네이티브 수명을 검증합니다.

`context.dimensions`는 getter만 있는 네이티브 공유 뷰입니다. `setDimensions()`와 전달된 크기 변경을 반영하며 resize 리스너에서도 새 크기를 읽습니다. 너비와 높이는 음이 아닌 int32입니다. 래퍼 GC 후에도 저장 공간은 유효하며 네이티브 파괴 후에는 0이 됩니다.

`setDensityIndependentPixelRatio(ratio)`는 양의 유한 수동 비율을 지정하며 갱신과 크기 변경 후에도 유지합니다. `null`은 창 동기화를 복원합니다. `requestNextUpdate(seconds)`는 다음 갱신 지연을 줄이며 0은 즉시 갱신입니다. 예약이 없으면 `getNextUpdateDelay()`는 `Infinity`를 반환합니다. `update()`가 지연을 재설정한 후 요소가 다음 갱신을 요청합니다. JS 타이머는 만들지 않습니다.

## 분리 요소와 DOM 소유권

`document.createElement(tag)`, `document.createTextNode(text)`, `element.clone()`은 네이티브가 소유하는 분리 요소를 반환하며 팩토리 실패 시 `null`입니다. 텍스트는 리터럴로 처리합니다. 복제는 속성, 스타일, 내용을 복사하며 JS 리스너는 복사하지 않습니다. 분리 요소에는 소유 문서가 없습니다.

```js
const panel = document.createElement('div');
const label = document.createTextNode('Hello <world> & 世界');

if (panel && label) {
  panel.appendChild(label);
  document.appendChild(panel);
  const detached = document.removeChild(panel);

  document.insertBefore(detached, null);
}
```

`appendChild(child, domElement = true)`와 `insertBefore(child, adjacent)`는 분리 요소 소유권을 한 번만 이전하고 동일한 래퍼를 반환합니다. 연결된 요소는 먼저 제거해야 하며 중첩 문서가 없는 분리 트리는 다른 컨텍스트로 옮길 수 있습니다. `removeChild`는 소유권이 있는 분리 요소를 반환하고 자식이 아니면 `null`입니다. `replaceChild(child, replaced)`는 제거된 요소를 반환하며 기준이 `null` 또는 자식이 아니면 끝에 추가하고 `null`을 반환합니다. `insertBefore`도 기준이 없으면 추가하고 있으면 DOM/비 DOM 상태를 상속합니다. 순환, 컨텍스트 루트 삽입, 활성 네이티브/이벤트 대상 트리 이전은 변경 전에 거부합니다. Debugger가 소유한 문서도 보호합니다.

실제 문서를 컨텍스트 루트에서 제거한 후 동일한 활성 컨텍스트의 다른 요소에 삽입할 수 있습니다. 원본 `basic/demo` 샌드박스도 이 경로를 사용합니다. 문서는 분리 후에도 자신을 소유 문서로 유지하고 빌린 컨텍스트를 유지합니다. 루트는 자신의 문서만 DOM 자식으로 허용합니다. `getNumDocuments()`는 루트 바로 아래 문서만 세며 중첩 문서는 별도의 `updateDocument()` 호출이 필요합니다. `close()`와 `unload()`는 루트 문서만 파괴 대기열에 넣습니다. 중첩 또는 분리 문서는 소유 트리가 파괴될 때까지 유지되고 바깥 문서를 닫으면 중첩 트리도 파괴됩니다. 컨텍스트 제거 시 해당 문서가 포함된 독립 소유 트리를 먼저 파괴합니다.

`dragdrop` 콜백에서는 검증된 `drag_element` 매개변수를 동기적으로 제거하고 삽입하여 원본 인벤토리 이동 알고리즘을 유지할 수 있습니다. 바깥쪽 네이티브 호출이 끝날 때까지 네이티브 소유권과 리스너를 유지합니다. 조상, 일반 매개변수 별칭, 이벤트 대상 및 실행 중인 메서드 수신 요소는 계속 보호합니다. 네이티브 제거는 드래그를 취소하므로 원본은 제거 후 `dragend`를 보내지 않습니다.

`getNumChildren()`은 DOM 자식 수를 세며 `true`를 전달하면 내부 요소도 포함합니다. `getChild(index)`는 두 종류 모두 접근하며 범위 밖이면 `null`입니다. 첫/마지막 자식, 형제, `hasChildNodes()`는 DOM 상태를 따릅니다. `querySelectorAll`, `getElementsByTagName`, `getElementsByClassName`은 유효한 래퍼의 스냅샷 배열을 반환합니다. 네이티브 구현에 따라 `contains`는 자신을 포함하고 `closest`는 자신을 제외한 조상을 검색합니다.

자손 참조는 분리된 네이티브 트리를 유지합니다. 리스너가 래퍼를 참조하는 순환을 포함한 도달 불가능 트리는 회수됩니다. 삽입 후에는 네이티브 부모가 소유하며 분리와 재삽입 후에도 리스너는 유지됩니다. 파괴 시 모든 빌린 별칭이 무효화됩니다.

네이티브 위젯의 내부 자식은 읽을 수 있지만 위젯이 원시 포인터를 보유하므로 제거나 교체는 거부합니다. JS 소유권 API로 삽입한 비 DOM 요소는 래퍼 회수 후 다시 가져와도 이전할 수 있습니다.

## 문서 순서, 포커스와 레이아웃

`context.createDocument(instancerName = 'body')`는 빈 문서를 만들며 실패하면
`null`을 반환합니다. `getDocument(idOrIndex)`는 고유 문서 래퍼 또는 `null`,
`getNumDocuments()`는 파괴 대기 문서를 제외한 수를 반환합니다. 인덱스는 스택 순서입니다.
`setDocumentsBaseTag(tag)` / `getDocumentsBaseTag()`는 이후 문서의 루트 태그
(초기값 `body`)를 설정하고 읽습니다. 인스턴서 이름은 바꾸지 않습니다.

`context.unloadDocument(document)` / `unloadAllDocuments()`는 unload를 동기 전달한 뒤
조회에서 제외하고 `context.update()`에서 파괴합니다. 파괴 전 반복 언로드는 무시합니다.
`document.getContext()`는 고유 소유 컨텍스트를 반환하며 팩토리로 만든 분리 문서에서는
`null`입니다. 실제 파괴 후 모든 핸들은 접근을 거부합니다.

```js
const { ModalFlag, FocusFlag, ScrollFlag, ScrollBehavior } = require('sfml.js-rmlui');

document.show(ModalFlag.Modal, FocusFlag.Auto, ScrollFlag.None);
document.show(ModalFlag.Keep, FocusFlag.Keep, ScrollFlag.Auto);
context.setDefaultScrollBehavior(ScrollBehavior.Instant, 1);
```

`show()`의 기본값은 `None / Auto / Auto`입니다. 첫 인수의 `false / true`는
`None / Modal`의 별칭입니다. `ModalFlag.Keep`은 현재 모달 상태를 유지합니다.
`FocusFlag.None`은 포커스를 요청하지 않고, `Document`는 문서, `Keep`은 이전 요소,
`Auto`는 첫 Tab 이동 가능한 `autofocus` 요소(없으면 문서)를 선택합니다.
`ScrollFlag.None`은 포커스에 따른 스크롤을 막고, `Auto`는 필요한 경우 새로 포커스된
자식 요소를 보이는 영역으로 스크롤합니다. `isModal()`은 모달 플래그가 설정되고
문서가 표시될 때만 true입니다. 숨기면 false를 반환하지만 내부 플래그는 유지되며
`ModalFlag.Keep`으로 다시 표시하면 모달 상태가 복원됩니다.

`findNextTabElement(current, forward, wrapAround = true)`는 포커스를 바꾸지 않고
검색합니다. 시작 요소는 해당 문서에 속해야 합니다.
`context.getFocusElement()` / `getHoverElement()`는 유효한 래퍼 또는 `null`을 반환합니다.
`unfocusDocument(document)`는 기록에서 제외하고 이전 포커스를 요청하지만 모달 상태가
유지되면 거부될 수 있습니다.

문서의 `pullToFront()` / `pushToBack()` 또는 컨텍스트의
`pullDocumentToFront(document)` / `pushDocumentToBack(document)`로 순서를 바꿉니다.
컨텍스트의 문서 작업은 다른 컨텍스트의 문서를 거부합니다.

변경 후 입력 및 렌더링 전에 `context.update()`를 호출합니다.
`document.updateDocument()`는 해당 문서의 스타일과 레이아웃을 갱신하지만 대기 중인
문서 파괴는 처리하지 않습니다.
`getElementAtPoint(point, ignoreElement = null, element = null)`는 물리 픽셀과 현재
레이아웃을 사용하며 변환, 클리핑, 모달 포커스를 고려합니다. 하위 트리를 무시하거나
검색 루트를 지정할 수 있습니다. 요소 인수는 같은 컨텍스트에 속해야 하며 소유 문서가
없는 컨텍스트 루트도 지정할 수 있습니다. 좌표는 float 반올림 후 int32 범위 안이어야 합니다.
변환 행렬은 `render()`에서 갱신되므로 변환 변경 후 히트 테스트 전에 렌더링해야 합니다.
RmlUi 6.3은 역투영 좌표와 조상의 클립 사각형을 비교하므로 평행 이동 시 판정 경계가
시각적 경계와 다를 수 있습니다. 이 바인딩은 네이티브 동작을 유지합니다.
`setDefaultScrollBehavior(behavior, speedFactor = 1)`의 속도는 양의 유한 float입니다.
기본 동작을 `Auto`로 설정하면 부드러운 스크롤을 사용합니다.

## 이벤트 매개변수 타입 변환

`event.getParameter(name, defaultValue)`는 RmlUi의 `GetParameter<T>` 규칙으로
실시간 매개변수를 읽으며 현재 리스너 콜백이 활성인 동안만 사용할 수 있습니다.
중첩 이벤트 발송은 외부 콜백을 무효화하지 않습니다. 콜백 종료 후에는
`event.parameters`에 보관된 값을 사용합니다. JS 스냅샷 수정은 원본에 영향을 주지 않습니다.

```js
element.addEventListener('change', event => {
  const value = event.getParameter('value', 0);
  const text = event.getParameter('value', '');

  console.log(value, text, event.isType('change'));
});
```

null이 아닌 기본값이 결과 유형을 선택합니다. number는 double, BigInt는 int64이며
기본값이 INT64_MAX를 초과하면 uint64입니다. 벡터와 색상은 복사본을 반환하고 없는
매개변수는 기본값을 반환합니다. 비숫자 문자열은 number 변환에서 0이 되고 BigInt
변환에서는 기본값을 유지합니다. 안전하지 않은 숫자·문자열 정수 범위 초과는 예외입니다.
소유 변환, 애니메이션, 전환, 장식 및 효과 기본값은 형식화된 네이티브 어댑터를
사용합니다. 일반 포인터의 숫자 및 문자열 변환은 거부합니다.

`event.getElementParameter(name, defaultValue = null)`는 검증된 요소 포인터의
동등 인터페이스입니다. 매개변수가 없거나 변환할 수 없으면 유효한 기본 요소를,
그 외에는 고유 네이티브 요소를 반환합니다. ScriptInterface 요소 값과 상위
`drag_element` 계약에 대응하며 임의 포인터는 거부합니다. 매번 이벤트와 소유 참조를
검증하고 빌린 이벤트는 콜백 반환 시 만료됩니다. 반환한 요소는 일반 수명을 유지하며
노드 파괴 시 무효화됩니다. 원시 요소 스냅샷은 `parameters`에서 읽을 수 있습니다.
영구 속성은 빌린 요소 포인터를 받지 않습니다.

`event.isType(nameOrId)`는 보관된 유형명·ID로 두 네이티브 동등 연산을 구현하며
콜백 종료 후에도 사용할 수 있습니다.

## 텍스트 바이트와 마우스 커서

`context.processTextInput(text)`는 Unicode 문자열 또는 스칼라 값을 받습니다.
`context.processTextInputChar(byte)`는 네이티브 `char` 오버로드를 사용합니다.
정수 바이트 0–127은 제어 문자를 포함한 ASCII를 전달하며, 128–255는 이벤트 없이
`false`를 반환합니다. 두 메서드 모두 이벤트 전파가 계속되는지 반환합니다.

`context.enableMouseCursor(enabled)`는 불리언을 요구합니다. 활성화하면 다음 마우스
갱신에서 커서를 동기화하고, 비활성화하면 RmlUi의 시스템 커서 변경을 중단합니다.
커서를 숨기지는 않습니다. 제거된 컨텍스트에서는 두 작업 모두 예외를 던집니다.

## 네이티브 수명 {#네이티브-수명}

| 작업 | 효과 |
| --- | --- |
| `document.hide()` | 숨기되 문서와 래퍼는 유지합니다. |
| `document.close()` / `unload()` | `unload`를 동기 실행하고 `context.update()`에서 파괴합니다. 실제 파괴 전까지 래퍼를 읽을 수 있습니다. |
| `context.remove()` | 컨텍스트와 모든 문서를 파괴합니다. |
| `shutdown()` | 모든 컨텍스트, 문서, 요소 래퍼가 무효화됩니다. |

래퍼는 네이티브 유효성을 공유합니다. JS 참조는 소유권이 있는 분리 트리를 유지하지만 연결된 요소의 부모나 컨텍스트에 의한 파괴를 막지는 못합니다. 파괴 후 접근하면 예외가 발생합니다. 같은 이름의 컨텍스트 재생성이나 런타임 재초기화는 이전 래퍼를 복구하지 않습니다. 컨텍스트 제거 후 보유한 크기 뷰는 0이 됩니다.

프로세스 런타임은 초기화한 Node.js 환경과 스레드에 속합니다. Worker는 가져오기와 버전 조회가 가능하지만 다른 환경에서 런타임에 접근하면 예외가 발생합니다. 소유 환경 종료 시 JS 리스너를 호출하지 않고 리소스를 해제합니다. 렌더 창을 닫기 전에 RmlUi를 종료하세요.
