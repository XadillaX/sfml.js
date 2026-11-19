# RmlUi 빠른 시작

완전한 [카운터 소스](../../packages/sfml.js-rmlui/examples/demo.cjs)와 [RML](../../packages/sfml.js-rmlui/examples/assets/tutorial.rml) / [RCSS](../../packages/sfml.js-rmlui/examples/assets/tutorial.rcss) 리소스를 실행합니다. 창에는 카운터, Increment 버튼, 블러, 둥근 모서리 클리핑이 표시됩니다.

## 작업 공간 준비

[플랫폼 요구 사항](../sfml/getting-started.ko.md#requirements)에 따라 C++20 네이티브 도구, Python, 디스플레이, OpenGL을 준비합니다. macOS는 패치된 SFML Window 라이브러리를 위해 Xcode Command Line Tools와 CMake도 필요합니다.

```sh
# From the monorepo root.
node tools/bootstrap.cjs
cd packages/sfml.js-rmlui
npm run demo
```

Bootstrap은 의존성 순서대로 설치하고 빌드하는 최초 설정 작업입니다. 패키지 변경 후에는 `npm run build`, TypeScript만 변경한 경우 `npm run build:ts`를 실행합니다. 이 절차는 npm 출시 여부에 의존하지 않고 로컬 소스를 사용합니다.

소스 패키지는 네이티브 빌드 스크립트를 포함합니다. 명시적인 npm `install` 훅은 의존성과
네이티브 선언을 준비한 다음 바인딩 및 두 원본 Invaders 모듈을 구성하고 빌드합니다.
기존 `build/`를 재사용하며 저장소 LSP 병합은 해당 Rush 작업 공간에서만 실행합니다.
포함된 JavaScript／타입을 사용하므로 설치에 TypeScript 컴파일러가 필요하지 않습니다.
`npm run test:package`는 실제 npm 파일 목록과 빌드 스크립트의 의존성을 확인합니다.

[VS Code 확장](../../packages/sfmljs-rmlui-vscode/README.ko.md)은 언어 서버를 포함하며
RML／RCSS 자동 완성, 진단, 호버 설명 및 색상 미리보기를 제공합니다.

## 초기화와 리소스

카운터는 `settings.stencilBits: 8`로 `RenderWindow`를 생성하고 `initialise(window)`를 확인한 뒤, 포함된 LatoLatin 보통／굵은 글꼴을 로드합니다. 이후 `window.getSize()`로 컨텍스트를 만듭니다. 글꼴 로드는 동기식이므로 문서 로드 전에 끝내야 합니다. RCSS `font-family`는 글꼴 내부 이름과 일치해야 합니다.

```js
if (!rmlui.initialise(window)) {
  throw new Error('RmlUi initialisation failed');
}

const size = window.getSize();
const context = rmlui.createContext('main', size.x, size.y);
```

이 코드는 카운터의 창 생성 뒤에 놓습니다. macOS에서 Retina 표면이 활성화될 수 있으므로 크기는 초기화 **후** 읽습니다. `loadDocument`는 처음에는 숨겨진 문서를 반환하므로 `document.show()`를 호출합니다.

## 시스템 인터페이스와 애플리케이션 시간

`getSystemInterface()`는 선택한 네이티브 인터페이스를 반환합니다.
선택 전이나 종료 후에는 `null`입니다. 사용자 동작은 `initialise` 전에
`SystemInterface(window, callbacks)`를 만들고 `setSystemInterface(system)`로
설정합니다. 생략한 콜백은 SFML／상위 구현을 사용합니다.
여덟 가지 선택적 메서드는 번역, 리소스 경로, 로그, 커서, 클립보드와 키보드를
처리합니다.

```js
const system = new rmlui.SystemInterface(window, {
  translateString(input) {
    return { value: input, translations: 0 };
  },
});

rmlui.setSystemInterface(system);
rmlui.initialise(window);

// Before each update, optionally drive native animations with application time.
system.clock[0] = elapsedSeconds;
context.update();
// Restore the native SFML clock.
system.clock[0] = NaN;
```

`clock`은 네이티브 소유의 단일 요소 `Float64Array`입니다. 네이티브 시간 조회에
JS 콜백이나 Addon 호출이 필요하지 않습니다. 입력 초는 유한하고 음수가 아니어야
하며 초기 `NaN`은 SFML 시계를 사용합니다. 콜백은 동기로 실행하며 `this`는 콜백
객체입니다. RmlUi API 재진입과 초기화 후 설정 변경은 거부됩니다. 종료 시 네이티브
인터페이스와 콜백을 해제하고 사용하지 않은 설정도 만료시킵니다.
기존 시간 버퍼는 계속 읽을 수 있습니다.

## 애플리케이션 로그

`Log.message(type, format, ...values)`와
`Log.parseError(filename, line, format, ...values)`는 한 번의 Addon 호출에서
서식 적용과 네이티브 `Rml::Log` 전달을 수행합니다. 선택한
`SystemInterface.logMessage`는 최종 수준과 텍스트를 받으며 초기화 전에도
사용할 수 있습니다.

```js
rmlui.Log.message(rmlui.LogType.Info, '%s: %d', 'loaded documents', 3);
rmlui.Log.parseError('panel.rml', 12, 'Unexpected %s', 'tag');
```

서식은 [문자열 가이드](strings.ko.md)의 검증된 스칼라 규칙을 따릅니다.
로그는 최대 1,021 UTF-8바이트를 유지하며 NUL에서 종료합니다. `parseError`는
메시지를 먼저 자르고 파일명과 줄 번호를 붙인 결과도 자릅니다. 음수 줄 번호는
줄 번호를 생략합니다. 두 메서드는 `void`를 반환하며 네이티브 `Rml::Log`는
로그 콜백의 불리언 결과를 무시합니다. 콜백 예외는 전파하며 콜백 재진입과
다른 런타임 환경의 호출은 거부합니다.

## 파일 API

`FileInterface(root)`는 루트 경로를 먼저 시도합니다. `FileCallbacks`를 전달하면
사용자 리소스 바이트를 제공할 수 있습니다. 초기화 전에 `setFileInterface`로 선택하고
`getFileInterface()`로 조회합니다. 선택하지 않으면 Native 파일시스템을 사용합니다.
명시한 `fileRoot`는 이미 선택한 파일시스템 API와 일치해야 합니다.

```js
const resources = new Map([
  ['virtual.rml', Buffer.from('<rml><body><p>Ready</p></body></rml>')],
]);
const files = new rmlui.FileInterface({
  open(path) {
    return resources.get(path) ?? null;
  },
});

rmlui.setFileInterface(files);
rmlui.initialise(window);
const document = context.loadDocument('virtual.rml');
```

open 배열은 Native 소유 사본이며 read, seek, tell, length는 Native에서 실행됩니다.
기존 `StreamMemory` 또는 사용자 `Stream`도 사용할 수 있지만 이 API를 사용하는
`StreamFile`은 반환할 수 없습니다. 선택적 콜백으로 일곱 가상 메서드를 구현하며
`this`를 유지합니다. 동기로 반환하고 Native API에 재진입하지 않아야 합니다.

`files.open(path)`는 검증한 `FileHandle` 또는 null을 반환합니다. 같은 API로
`read(output, size, file)`, seek, tell, length, close를 실행하세요.
`loadFile`은 바이트 사본 또는 null을 반환하며 빈 파일이면 빈 배열입니다.
shutdown은 열린 파일을 닫고 모든 API와 토큰을 만료시킵니다.
사용자 사전 로딩은 소유 스레드에서 바이트를 한 번 가져오고 이미지 디코딩과
알파 변환은 워커에서 실행합니다. 파일시스템 읽기도 워커에서 실행합니다.

## 렌더 인터페이스 선택

`getRenderInterface()`는 실제로 선택한 Native 인터페이스를 반환하며 선택 전이나
shutdown 후에는 `null`입니다. SFML 렌더러는 초기화 전이나 후에 생성할 수 있습니다.
`initialise` 전에 `setRenderInterface(renderer)`로 기본 렌더러를 선택하고
`null`로 자동 선택을 복원합니다.

```js
const renderer = rmlui.createRenderInterface(renderWindow);

rmlui.setRenderInterface(renderer);
rmlui.initialise(systemWindow);
const context = rmlui.createContext('ui', 800, 600);
```

초기화는 선택을 보존합니다. 컨텍스트는 선택한 렌더 창을 사용하고 초기화 창은
시스템 시간, 입력 및 DPI를 제공합니다. `createContext`에 별도 렌더러를 지정하면
독립된 리소스 캐시를 사용합니다. 선택한 렌더러 및 Native 관리자나 사전 로드에서
사용한 렌더러는 shutdown까지 Native 창을 보유하며 미사용 렌더러는 회수됩니다.
사용하는 모든 창은 shutdown까지 열어 두세요. 그리기와 지오메트리는 Native에
남으며 기존 배치 처리와 그리기 스냅샷을 유지합니다.

## 각 프레임

카운터는 모든 이벤트를 전달하고 네이티브 닫기 이벤트에서 루프를 중단합니다. 갱신과 그리기 순서는 다음과 같습니다.

```js
context.update();
window.clear(sfml.Color.Black);
// Set your scene view with window.setView(sceneView), then draw the scene.
window.flush();
context.render();
window.display();
```

루프가 멈추고 RmlUi가 종료될 때까지 창을 열어 둡니다. `processEvent`가 크기 변경을 처리합니다. 애플리케이션이 다른 컨텍스트 크기를 선택할 때는 `setDimensions`를 사용할 수 있습니다.

## 클릭과 정리

카운터는 이름이 있는 `increment` 함수를 등록과 제거에 사용합니다. Increment 클릭은 JavaScript 상태와 `counter.innerRML`을 갱신합니다. 종료 시 리스너 제거, 문서 언로드, 컨텍스트 제거, `shutdown()`, 창 닫기 순서를 따릅니다.

| 증상 | 확인 사항 |
| --- | --- |
| 네이티브 모듈이나 글꼴이 없음 | Bootstrap을 마치고 로컬 예제 리소스를 사용합니다. |
| 글자가 없음 | `loadFontFace` 결과와 RCSS 글꼴 이름을 확인합니다. |
| 문서가 보이지 않음 | `show`, `update`, `render` 순서를 확인합니다. |
| 클릭이 반응하지 않음 | 이벤트 전달과 핸들러 등록을 확인합니다. variables 미션 버튼에는 핸들러가 없습니다. |
| 글자가 작거나 흐림 | 초기화 후 크기와 `dp`를 사용합니다. [Retina](rendering.ko.md)를 참고하세요. |
| 종료 중 충돌 | 소유자와 창보다 먼저 리스너를 해제하고 래퍼 사용을 중단합니다. |

다음은 [문서와 이벤트](documents.ko.md)입니다.
