# 문서 스크립트

`NodeScriptHost`는 `Context`가 읽는 문서의 JavaScript 실행 호스트입니다.
`initialise` 이후 생성하고 문서를 읽기 전에 `setScriptHost`로 선택하세요.
Context 선택을 바꾸거나 해제해도 기존 문서는 자신의 호스트를 유지합니다.

```js
const { NodeScriptHost } = require('sfml.js-rmlui');
const host = new NodeScriptHost({
  handlers: {
    save(event, document, context) {
      document.title = context.name;
      event.stopPropagation();
    },
  },
});

context.setScriptHost(host);
const document = context.loadDocumentFromMemory(`
<rml><head/><body>
  <button id="save" onclick="save">Save</button>
</body></rml>`, 'forms/panel.rml');

document.getElementById('save').click();
```

이름 있는 처리기를 한 번 캡처합니다. 원래 options를 바꿔도 등록은 변경되지 않습니다.
인라인 식이 비활성화된 경우 알 수 없는 처리기 이름은 문서 로드를 실패시킵니다.

## 신뢰할 수 있는 소스

두 소스 옵션의 기본값은 false입니다. `allowInline: true`는 `<script>` 내용과
`on*` JavaScript 식을, `allowExternal: true`는 `<script src="...">`를
활성화합니다. 외부 스크립트는 현재 RmlUi `FileInterface`로 읽고 사용자 파일
루트도 지원합니다. 외부 실행이 비활성화되어 있으면 파일을 읽지 않습니다.
Node VM은 보안 경계가 아닙니다. 신뢰할 수 있는 소스만 활성화하세요.

각 문서에 독립 VM이 있습니다. `globals`는 추가 값을 캡처하며
`document`, `context`, `event`, `element`는 예약어입니다. 앞의 두 값은 수명을
검증하는 RmlUi 래퍼입니다. `on*` 안에서 `event`는 활성 이벤트이고 `element`는
현재 대상입니다. 중첩 이벤트가 끝나면 외부 값을 복원합니다.

RmlUi는 `</head>`에서 리소스 순서대로 실행하며 본문은 아직 파싱되지 않았습니다.
본문 요소 조회는 이후 이벤트에서 수행하세요. 인라인 스택은 RML 소스 URL과 원래
행 위치를, 외부 스택은 해석한 파일 경로와 소스 행을 사용합니다.

## 오류와 수명

예외는 시작한 API에 그대로 전달되며 실패한 문서는 Context에 연결하지 않습니다.
스크립트와 처리기는 동기로 반환해야 합니다. Promise 결과는 거부하고 거부 상태를
처리합니다.

`document.loadInlineScript(content, sourcePath, sourceLine = 1)`과
`document.loadExternalScript(sourcePath)`는 네이티브 가상 훅을 호출합니다.
일반 문서는 상위의 빈 구현을 유지합니다. `context.setScriptHost(null)`은 이후
로드에 일반 문서를 선택하며 전역 body 및 리스너 생성기를 유지합니다.

네이티브 문서 파괴 시 VM 상태를 해제하며 만료된 Document 래퍼가 남아도 유지하지
않습니다. 문서 및 Context 수명을 검증하고 이벤트 조작은 전달 후 만료됩니다.
콜백 중 파괴적인 재진입은 거부합니다. Factory 스크립트 리스너는 일반
`EventListener`를 사용하며 원래 문서가 만료되면 전달을 거부합니다.

## 네이티브 스크립트 객체 {#native-script-objects}

`Context`, `Element`, `RmlEvent`는 `ScriptInterface`를 구현합니다.
`setScriptObject(object)`는 실제 네이티브 인스턴스에 호스트 객체를 등록하고
`getScriptObject()`는 가상 메서드를 호출하여 같은 객체를 반환합니다.
null은 연결을 제거합니다. 미등록 인스턴스와 복제 요소는 null을 반환합니다.

```js
const state = { count: 0 };

element.setScriptObject(state);

if (element.getScriptObject() === state) {
  state.count++;
}

element.setScriptObject(null);
```

연결된 네이티브 트리는 스크립트 객체를 유지하고 분리된 요소는 JS 소유자를 통해
유지합니다. Element를 다시 참조하는 순환은 수집 가능합니다. 부모 변경은 연결을
유지하며 네이티브 파괴와 shutdown은 연결을 해제합니다. 재초기화해도 기존 래퍼는
만료됩니다. 변경 없는 프레임에서는 스크립트 등록 기록을 스캔하지 않습니다.

연속 리스너는 같은 네이티브 이벤트의 연결을 읽으며 각 빌린 래퍼는 자신의 콜백 후
만료됩니다. 소유 이벤트는 JS handle을 통해 객체를 유지하며 순환은 수집 가능합니다.
Factory로 전달하면 네이티브 유지로 승격하고 이벤트 해제까지 유지합니다.
네이티브 RTTI는 변경되지 않습니다. 외부 `GetScriptObject` 구현은 자체 등록
어댑터가 필요하며 이 API로 덮어쓸 수 없습니다.

Native 확장은 `native/scripting/rmlui-script-object.h`의
`sfmlrmlui::RegisterNativeScriptObject`로 실제 반환 포인터와 JS 소유자를
등록합니다. 같은 포인터를 반환하는 인터페이스도 각각 독립된 연결을 유지하며,
등록 후에도 네이티브 구현이 우선합니다. `native/values/rmlui-variant-objects.h`의
`RegisterNativeObjectVariant`는 실제 `void*` 할당을 별도로 등록합니다.
소유자는 할당을 해제하기 전에 공유 슬롯을 만료시키며 Variant와 Lua 복사본은
이후 null을 반환합니다. JS 소유자는 기존 값 소유 연결로 유지됩니다.
이 진입점은 C++ 전용이며 JS에 주소나 등록 API를 노출하지 않습니다.

임의의 Native `ScriptInterface`를 Variant로 저장하려면
`native/values/rmlui-variant-pointers.h`의 `RegisterNativeScriptVariant`를 사용합니다.
확장은 실제 인터페이스와 등록을 함께 소유하며 인터페이스 파괴 전에 등록을
만료시킵니다. JS 출력은 등록한 원래 객체이며 타입은 `VariantScriptObject`입니다.
`{ type: 'scriptinterface', value: object }`가 포인터 변환 대상을 선택합니다.
복사, 이동, DOM 값과 Lua 스냅샷은 만료 슬롯을 공유하며 네이티브 할당의 수명을
늘리지 않습니다. 등록되지 않은 포인터와 공유 슬롯은 역참조 전에 거부합니다.
이 등록은 `GetScriptObject` 연결과 독립적이며 해당 조회는 가상 getter를 한 번만
호출합니다. Native는 `SetScriptObjectForBinding(nullptr, {})`로 연결을 해제하여
객체 소유 연결을 정리할 수 있습니다.

등록된 Context는 제거까지 객체를 유지합니다. 독립 소유 Context는 JS 루트 연결을
사용하며 객체와의 순환을 수집할 수 있습니다. Context는 실제 네이티브 기본 타입의
식별자를 상속합니다. `release()`는 독립 소유만 해제하고 등록은 `remove()`를 씁니다.

## Lua 스크립트

`LuaScriptHost`는 실제 Lua 5.4.8 VM을 소유합니다. `initialise` 이후 생성하고
`context.setScriptHost`로 선택하세요. 같은 Lua 호스트의 문서는 전역 값을 공유하며
다른 호스트는 독립 VM을 사용합니다. Context 선택을 바꿔도 기존 문서의 인터프리터는
유지됩니다.

```js
const { LuaScriptHost } = require('sfml.js-rmlui');
const lua = new LuaScriptHost({ allowInline: true });

lua.execute(`
function save(event, element, document)
  document.title = element.id
  event:StopPropagation()
end
function sum(a, b) return a + b end
`, 'handlers.lua');
context.setScriptHost(lua);
const document = context.loadDocumentFromMemory(`
<rml><head/><body>
  <button id="save" onclick="save">Save</button>
</body></rml>`, 'forms/lua-panel.rml');

document.getElementById('save').click();
lua.call('sum', 1n, 2n); // 3n
```

두 소스 옵션의 기본값은 false입니다. 이름 있는 Lua 함수는 소스 실행을 활성화하지
않아도 처리기로 사용할 수 있습니다. `allowInline`은 헤드 스크립트와 인라인 처리기를,
`allowExternal`은 외부 파일을 활성화합니다. 현재 RmlUi 파일 인터페이스를 사용하며
소스 경로와 행 위치를 유지합니다.

`execute(source, path = '', line = 1)`, `call(name, ...args)`,
`getGlobal(name)`, `setGlobal(name, value)`는 스칼라 값을 교환합니다.
null, boolean, 유한 number, string, 부호 있는 64비트 bigint를 지원하며 Lua 정수는
bigint로 반환합니다. 문자열 내부 null 바이트도 유지합니다. 테이블, 함수, 네이티브
포인터는 스칼라 브리지 값에 포함되지 않습니다.

Native/Lua 안에서 `document:GetAttribute(name)`, 속성 순회 및 이벤트 매개변수는
RmlUi Variant를 사용합니다. `Vector2f`, `Colourb`, `Colourf` userdata를 네이티브
값으로 다시 전달할 수 있습니다. 검사한 Element, Context, Event userdata는
보호된 ScriptInterface 포인터가 되며 복사본은 원본 파괴 또는 이벤트 종료 시의
만료 상태를 공유합니다. 네이티브 주소는 노출하지 않습니다.

등록한 불투명 포인터, Vector3/4 및 집계 Variant는 소유 Lua userdata를 사용합니다.
이벤트로 복사해도 네이티브 값과 포인터의 동일성을 유지합니다. byte와 char는 실제
저장 값을 읽습니다. Lua 부호 있는 정수 상한을 넘는 부호 없는 64비트 값은 소유
userdata로 보관하여 음수로 넘치지 않게 합니다. 외부 불투명 userdata는 거부합니다.
Node 스칼라 메서드는 계속 스칼라 값만 교환합니다.

Lua 복사본은 Lua GC 또는 VM 종료까지 유지됩니다. 문서, 리스너, 모델, 할당기
등록, 생성한 요소 및 캡처한 Lua 함수가 실제 소유자로서 VM의 포인터 값을 유지합니다.
독립 Context와 호스트 및 객체의 순환 참조는 회수할 수 있습니다. 종료와 명시적 요소
파괴는 만료된 파사드가 남아 있어도 이전 유지 관계를 제거합니다.
변경이 없는 프레임에서는 이러한 소유자를 순회하지 않습니다.

`compile(source, path = '', line = 1)`은 소스를 실행하지 않고 `LuaFunction`을
반환합니다. `getFunction(name)`은 현재 이름 있는 함수를 캡처하며 이후 전역 함수를
교체해도 캡처된 참조는 변하지 않습니다.

```javascript
const chunk = lua.compile('local a, b = ...; return a + b, "ready"');
const results = chunk.callResults(2, 9007199254740993n, 2n);

// [9007199254740995n, "ready"]
chunk.release();
```

`LuaFunction.call(...args)`는 첫 스칼라 결과를 복사합니다.
`callResults(resultCount = 0, ...args)`는 한 번 실행하고 지정한 수의 결과를 반환합니다.
부족한 값은 null로 채우고 초과 값은 버립니다. 오류 후에도 외부 Lua 스택을 복원합니다.
Node에서 호출하면 실행 중인 외부 Lua 이벤트와 문서 전역 값을 유지하며 Node 이벤트는
새 Lua 스코프를 선택하지 않습니다. 네이티브 참조는 호스트 GC 후에도 VM을 유지합니다.
`release()`는 참조와 VM 유지를 해제하며 다시 호출하거나 해제하면 거부합니다.
shutdown은 모든 함수를 무효화합니다. `executeFile(path)`는 현재 RmlUi
FileInterface로 파일을 명시적으로 읽고 실행합니다. 문서의 `allowExternal` 정책은
적용하지 않으며 오류에 파일 경로를 유지합니다.

DOM 리스너와 데이터 이벤트는 Native/Lua에서 직접 실행됩니다. 중첩 전달 후
`document`, `context`, `event`, `element`의 외부 값을 복원합니다. 만료된 이벤트와
파괴된 DOM 프록시는 접근을 거부합니다. Lua 표준 라이브러리를 제공하며 소스 정책은
신뢰하는 스크립트에 적용합니다.
코루틴은 호스트의 레지스트리와 전역 값을 공유하며 독립 호출 스택을 유지합니다.
리스너, 모델, 생성기를 만들고 yield 이후 resume할 수 있습니다. 같은 데이터 이벤트
콜백의 재귀 호출은 거부됩니다.

문서 스크립트의 `context:OpenDataModel(name, table)`은 관리 모델을 반환합니다.
같은 호스트에서 다시 열면 기존 래퍼를 반환합니다. 이름은 Context에 속하므로 여러
Context가 같은 이름을 독립적으로 사용할 수 있습니다. 중첩 테이블 쓰기는 루트
변수를 dirty로 표시하며 테이블이나 배열을 교체해도 네이티브 데이터 주소는 현재 값을
읽습니다. Lua 배열은 1부터, RML 데이터 식은 0부터 시작합니다. Lua, Node 또는
Context 파괴를 통해 모델을 제거하면 보관한 모델 및 테이블 프록시가 만료됩니다.
네이티브 모델은 호스트 GC 이후에도 VM을 유지하고 컨트롤러 및 뷰 파괴 후 변수
정의를 해제합니다.

`ElementInstancer.new(function(tag) ... end)`는 관리 Lua 할당기를 만듭니다.
콜백 밖에서 `rmlui:RegisterTag(tag, instancer)`로 등록하세요. 부모가 없는 소유
`Element.new(tag)`, 소유 `ElementPtr` 또는 nil을 반환합니다. 등록 기록, 생성한
요소와 Node Factory 래퍼는 할당기 및 VM을 유지합니다. tag를 교체해도 기존 요소의
해제 경로와 원래 할당기가 유지됩니다. `rmlui:CreateContext`는 현재 Lua 호스트를
상속합니다.

`shutdown`은 DOM 및 모델 파괴 후 VM을 닫습니다. VM finalizer는 Context를 만들거나
파괴된 RmlUi 객체에 재진입할 수 없습니다.

## Native Lua 타입 확장

Native 확장은 관리 VM에서 `Rml::Lua::LuaType<T>`와 메서드, getter, setter
기술 테이블을 등록합니다. `ExtraInit<T>`는 생성자를 등록하고 Element 테이블을
상속한 뒤 사용자 테이블로 같은 이름을 덮어쓸 수 있습니다. Element 하위 클래스는
RmlUi RTTI를 정의해야 합니다. Element의 `As` 테이블은 RTTI를 확인하고 호환되지
않는 하위 타입에는 nil을 반환합니다.

`push(..., true)`는 할당된 객체의 소유권을 Lua GC에 이전합니다. 빌린 Element,
Context, Event는 기존 네이티브 만료 검사를 유지합니다. 사용자 정의 빌린 값은
확장 소유자가 관리하며 Lua에서 사용하는 동안 원래 할당을 유지해야 합니다.
메서드는 GC 중 수신자를 유지하고 오류가 발생해도 원래 참조를 복원합니다.
nil 수신자는 nil을 반환합니다. 알 수 없는 속성 대입은 상위 구현처럼 무시합니다.
`Element:SetAttribute`는 입력을 문자열로 변환합니다.

Native `PushIndex`와 `GetIndex`는 0부터 시작하는 `int`와 1부터 시작하는 Lua
정수를 변환합니다. 네이티브 `[-2147483648, 2147483647]`은
`[-2147483647, 2147483648]`에 대응하며 Lua의 0은 네이티브 `-1`을 반환합니다.
범위를 벗어난 입력은 축소 변환 전에 오류가 됩니다. 네이티브 통합은 검증한 관리
호스트를 사용하며 임의 외부 VM 포인터를 받는 JS 진입점은 없습니다.
