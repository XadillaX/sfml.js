# ImGui 빠른 시작

카운터가 있는 네이티브 창을 만든 뒤 같은 프레임 루프를 장면 검사기에 적용합니다. JavaScript와 SFML 창·이벤트의 기초를 알면 됩니다. C++이나 Dear ImGui 경험은 필요하지 않습니다.

## 설치와 실행

소스 개발에는 Node.js 20 또는 22, Python, C++20 도구 체인이 필요합니다. 디스플레이와 OpenGL을 포함한 [플랫폼 요구 사항](../sfml/getting-started.ko.md#requirements)을 준비하고 monorepo 루트에서 실행하세요.

```sh
node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
```

bootstrap은 의존성을 설치하고 네이티브 라이브러리를 내려받아 패키지와 문서 사이트를 빌드합니다. 최초 준비 과정이므로 예제를 실행할 때마다 반복하지 않습니다. ImGui TypeScript만 수정했다면 `npm run build:ts --prefix packages/sfml.js-imgui`를 사용합니다.

배포된 호환 버전을 사용하는 앱에서는 두 패키지를 함께 설치합니다.

```sh
npm install sfml.js sfml.js-imgui
```

이 문서의 버전이 아직 배포되지 않았다면 monorepo 예제를 사용하세요. 예제는 `../dist`에서 로컬 빌드를 가져옵니다. 다음 독립 프로그램은 패키지 이름을 사용하므로 두 패키지가 설치된 앱에 `counter.cjs`로 저장하고 `node counter.cjs`로 실행합니다.

## 완전한 카운터

```js
const sf = require('sfml.js');
const { ImGui, SFML } = require('sfml.js-imgui');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'ImGui counter'
);
window.setFramerateLimit(60);
const clock = new sf.Clock();
let running = true;
let clicks = 0;

function drawControls() {
  ImGui.SetNextWindowSize([ 320, 160 ], ImGui.ImGuiCond.FirstUseEver);
  if (ImGui.Begin('Controls')) {
    if (ImGui.Button('Count')) {
      clicks++;
    }
    ImGui.TextUnformatted(`Clicks: ${clicks}`);
  }
  ImGui.End();
}

try {
  if (!SFML.Init(window)) {
    throw new Error('ImGui initialization failed');
  }
  while (running && window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      SFML.ProcessEvent(window, event);
      if (event.is('Closed')) {
        running = false;
      }
    }
    if (!running) {
      break;
    }
    SFML.Update(window, clock.restart().asSeconds());
    drawControls();

    window.clear(sf.Color.Black);
    SFML.Render(window);
    window.display();
  }
} finally {
  SFML.Shutdown(window);
  window.close();
}
```

검은 창에 이동 가능한 Controls 패널이 나타납니다. Count를 활성화할 때마다 값이 한 번 증가합니다. 접었다 펼쳐도 앱이 clicks를 보관하므로 값이 유지됩니다. 네이티브 창을 닫으면 루프를 종료하고 ImGui를 해제한 뒤 SFML 창을 닫습니다.

## 매 프레임의 순서

| 단계 | 호출 | 역할 |
| --- | --- | --- |
| 입력 수집 | pollEvent → SFML.ProcessEvent | 텍스트·포커스·종료를 포함한 모든 이벤트 전달 |
| 프레임 시작 | SFML.Update(window, seconds) | 입력과 시간을 갱신하고 ImGui 프레임 시작 |
| 위젯 선언 | drawControls() | 앱 상태를 읽고 위젯에서 수정 |
| 장면 그리기 | window.clear, 필요하면 window.draw | UI 뒤의 SFML 콘텐츠 준비 |
| UI 그리기 | SFML.Render(window) | 기록된 SFML 그리기를 제출한 뒤 ImGui 렌더링 |
| 표시 | window.display() | 완성된 프레임 표시 |

시간 단위는 **초**이며 밀리초를 넘기지 않습니다. 백엔드가 처리하므로 이 루프에서 ImGui.NewFrame이나 ImGui.Render를 추가 호출하지 않습니다. 지속되는 객체는 루프 전에 만들고 위젯 선언은 안에서 반복합니다.

Begin이 false를 반환하면 접힌 패널처럼 내용은 생략할 수 있지만 End는 필요합니다. 테이블·메뉴·팝업의 규칙은 다르며 [레이아웃](layout.ko.md)에서 설명합니다.

## UI와 장면 입력 구분

앱 단축키를 무시할 때도 ImGui에는 모든 이벤트를 전달합니다. 앱 입력 처리는 ProcessEvent 다음에 둡니다. 이벤트 루프에 다음을 추가하면 ImGui가 키보드를 캡처하지 않을 때만 Escape로 종료합니다.

```js
const key = event.getIf('KeyPressed');
if (key?.code === sf.Keyboard.Key.Escape &&
    !SFML.GetIO().wantCaptureKeyboard) {
  running = false;
}
```

장면 마우스 동작에는 wantCaptureMouse, 앱 키에는 wantCaptureKeyboard를 사용합니다. 캡처 플래그는 현재 ImGui 프레임 상태이며, 이벤트 처리 후 Update를 호출하는 일반 루프에서는 직전 UI 갱신의 상태를 읽습니다. ImGui로 가는 이벤트를 버리지 말고 네이티브 종료 이벤트는 항상 처리하세요.

wantTextInput은 텍스트 입력 지원 요청으로 키보드 캡처를 대체하지 않습니다. 키를 놓을 때 동작하는 장면은 UI가 소비한 누름 이벤트를 기록해 그 해제가 장면 동작을 유발하지 않게 합니다. [장면 검사기](../../packages/sfml.js-imgui/examples/README.ko.md#scene-inspector)는 Space 단축키와 키 반복 비활성화를 보여 줍니다.

## 최초 실행 문제 해결

| 증상 | 확인할 내용 |
| --- | --- |
| 모듈·네이티브 바이너리 없음 | bootstrap 완료 또는 현재 플랫폼의 호환 버전 설치 |
| 창만 있고 UI 없음 | 호출 순서, Init 성공, 저장된 패널 위치 |
| 버튼이 반응하지 않음 | 모든 이벤트 전달, 렌더링 프레임마다 Update 호출 |
| 이동·크기 변경 불가 | FirstUseEver를 사용하고 매 프레임 위치를 덮어쓰지 않기 |
| 접으면 assertion 발생 | Begin이 false여도 End 호출 |
| 종료 실패 | 루프 중단 → Shutdown → 살아 있는 창 close 순서 |

Dear ImGui는 보통 프로세스 작업 디렉터리의 imgui.ini에 패널 배치를 저장합니다. 앱 작업 디렉터리를 정하고 재시작이 초기 배치 복원이라고 가정하지 마세요.

다음은 [위젯과 상태](widgets.ko.md)입니다. API: [Init](/reference/imgui/functions/SFML.Init.html), [Update](/reference/imgui/functions/SFML.Update.html), [Render](/reference/imgui/functions/SFML.Render.html), [Begin](/reference/imgui/functions/ImGui.Begin.html).
