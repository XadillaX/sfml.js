# Window

[English](window.md) / [简体中文](window.zh-CN.md) / [日本語](window.ja.md) / **한국어**

> 2D 그리기에는 RenderWindow를 사용하고, OpenGL을 직접 연결할 때는 Window를 사용할 수 있습니다. 창 작업은 메인 스레드에서 실행합니다.

[API 안내](api.ko.md) · [Graphics](graphics.ko.md) · [빠른 시작](getting-started.ko.md)

## 생성과 닫기

```typescript
import { RenderWindow, VideoMode, Vector2u, State, Style } from 'sfml.js';

const window = new RenderWindow(
  new VideoMode(new Vector2u(800, 600)),
  'sfml.js',
  {
    style: Style.Default,
    state: State.Windowed,
    settings: { depthBits: 24, stencilBits: 8 },
  },
);
window.close();
```

Window와 RenderWindow는 빈 생성자로 만든 뒤 `create()`를 호출할 수 있으며, Vector2u 크기나 기존 시스템 창의 bigint 핸들도 받습니다. `close()`는 창을 닫으며, JS 객체에서는 다시 create를 호출할 수 있습니다.

RenderWindow는 `instanceof Window`와 `instanceof RenderTarget`을 모두 만족합니다. 직접 그리거나 창 기준 마우스 좌표를 조회할 수 있고, `Texture.update(window)`의 소스로도 사용할 수 있습니다.

| 인터페이스 | 용도 |
| --- | --- |
| `get/setPosition()`, `get/setSize()` | 창 위치와 클라이언트 영역 크기 |
| `setMinimumSize()`, `setMaximumSize()` | 크기 제한. undefined로 제한 해제 |
| `setTitle()`, `setVisible()`, `setIcon()` | 제목, 표시 여부, RGBA 아이콘 |
| `requestFocus()`, `hasFocus()` | 포커스 요청과 조회 |
| `setMouseCursor()`, `setMouseCursorVisible()`, `setMouseCursorGrabbed()` | 커서 및 마우스 이동 제한 |
| `setKeyRepeatEnabled()`, `setJoystickThreshold()` | 입력 동작 |
| `setVerticalSyncEnabled()`, `setFramerateLimit()` | 프레임 표시 간격 |
| `getSettings()`, `getNativeHandle()` | 실제 컨텍스트 설정과 시스템 창 핸들 |

위치는 Vector2i, 크기는 Vector2u를 사용합니다. `setIcon(size, pixels)`는 RGBA8 바이트를 받으며, RenderWindow에서는 Image도 받습니다.

## 이벤트 루프

```typescript
import { RenderWindow, Vector2u, Keyboard } from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'Events');
window.setFramerateLimit(60);

function frame() {
  window.handleEvents({
    Closed: () => window.close(),
    KeyPressed: event => {
      if (event.code === Keyboard.Key.Escape) window.close();
    },
    Resized: event => console.log(event.size.x, event.size.y),
  });
  if (!window.isOpen()) return;
  window.clear();
  window.display();
  setImmediate(frame);
}
frame();
```

`handleEvents(handlers, fallback?)`는 이벤트 큐를 비우며, 해당 타입의 핸들러를 우선 호출합니다. 하나의 함수로 모든 이벤트를 처리하도록 전달할 수도 있습니다.

직접 분기해야 한다면 `pollEvent()`를 사용하세요.

```typescript
let event;
while ((event = window.pollEvent())) {
  if (event.is('Closed')) window.close();
  const key = event.getIf('KeyPressed');
  if (key) console.log(key.code, key.scancode);
}
```

`pollEvent()`는 이벤트가 없으면 undefined를 반환합니다. Event의 data는 kind로 구분하는 유니온 타입이며, `is()`, `getIf()`, `visit()`으로 타입을 좁히거나 데이터에 접근할 수 있습니다. TextEntered는 Unicode 코드 포인트를 사용합니다.

`waitEvent(timeout = Time.Zero)`는 동기식 블로킹 인터페이스로, 타임아웃되거나 창이 닫히면 undefined를 반환합니다. Node I/O를 함께 처리해야 하는 프레임 루프에서는 pollEvent/handleEvents를 사용하고, 프레임 사이에 이벤트 루프에 제어권을 넘기세요.

## 실시간 입력과 시스템 기능

| 인터페이스 | 설명 |
| --- | --- |
| `Keyboard.isKeyPressed(key)` | 현재 키 코드 상태 |
| `Keyboard.isKeyPressed(scancode, 'scancode')` | 현재 물리 스캔 코드 상태 |
| `Keyboard.localize()`/`delocalize()`/`getDescription()` | 현재 키보드 레이아웃 매핑과 설명 |
| `Mouse.getPosition(window?)`/`setPosition(position, window?)` | 창을 생략하면 화면 좌표 사용 |
| `Mouse.isButtonPressed(button)` | 현재 마우스 버튼 상태 |
| Joystick | 연결, 버튼, 축, 장치 식별 정보. 창 루프가 없으면 `update()` 호출 |
| Sensor | 먼저 `isAvailable()`로 확인한 뒤 활성화하고 읽기 |
| Clipboard | `getString()`/`setString()`, JS Unicode 문자열 지원 |
| Touch | 터치 접점 상태와 위치. SFML 3.1.0에서 실시간 Touch API는 사용 중단 예정으로 지정됨 |

입력 네임스페이스의 열거형과 최상위 열거형은 같은 객체를 공유합니다. 예를 들어 `Keyboard.Key`와 `KeyboardKey`가 그렇습니다.

`Cursor.createFromSystem()`, `createFromPixels()`는 실패 시 undefined를 반환하지만, 생성자 실패는 예외를 발생시킵니다. 창은 사용 중인 Cursor의 수명을 유지합니다. macOS에서는 시스템 커서를 사용하기 전에 창을 먼저 생성해야 합니다.

VideoMode는 `size`와 `bitsPerPixel`을 사용합니다. `getDesktopMode()`, `getFullscreenModes()`는 장치 모드를 조회하고, `isValid()`는 전체 화면 모드의 유효성을 판단합니다. 모든 컴퓨터가 특정 개수의 전체 화면 모드를 제공한다고 가정하지 마세요.

## OpenGL과 Vulkan

Context는 독립적인 OpenGL 컨텍스트를 생성하며, 활성화, 실제 설정, 확장 조회, 함수 주소 조회 기능을 제공합니다. `Context.getActiveContextId()`는 bigint를 반환하고, 활성 컨텍스트가 없으면 `0n`입니다. `getFunction()`은 주소를 bigint로 반환하며, 이를 호출하려면 일치하는 시그니처의 네이티브 코드가 필요합니다.

RenderWindow의 `setActive()`, `pushGLStates()`, `popGLStates()`, `resetGLStates()`는 SFML과 사용자 정의 OpenGL을 함께 사용할 때 쓰입니다. GL 상태를 직접 수정하기 전에 SFML 명령을 제출하세요. push/pop은 같은 컨텍스트에서 쌍을 이루어야 합니다.

Vulkan 네임스페이스는 다음을 제공합니다.

- `isAvailable(requireGraphics = true)`.
- `getFunction(name)`.
- `getGraphicsRequiredInstanceExtensions()`.

`window.createVulkanSurface(instance, allocator = 0n)`는 bigint 서피스 핸들을 반환하고, 실패하면 undefined를 반환합니다. 인스턴스, 할당자, 서피스의 해제는 호출자가 책임집니다.

SFML 3.1.0의 macOS 빌드는 Vulkan 백엔드를 제공하지 않습니다. 이 조회 함수들은 사용 불가 상태를 반환하며, MoltenVK를 설치해도 SFML의 해당 플랫폼 분기는 바뀌지 않습니다. Windows/X11에서의 성공 경로는 해당 환경에서 검증해야 합니다.

## 데모 실행

빌드 후 `node examples/window.cjs --frames=120`을 실행하면 이벤트, 키 코드, 포인터 위치, 창 속성을 확인할 수 있습니다. 프레임 수를 생략하면 계속 실행됩니다.

| 키 | 동작 |
| --- | --- |
| F1/F2 | 커서 종류/표시 여부 |
| F3/F4 | 키 반복/수직 동기화 |
| F5/F6 | 창 크기/크기 제한 |
| F7/F8 | 제목 변경/1초 동안 숨긴 뒤 복원 |
| F9/F10 | 이벤트 API/창 이동 |
| Esc | 닫기 |

macOS에서는 Fn 키를 함께 눌러야 할 수 있습니다. 조이스틱, 센서, 터치, Vulkan 기능은 장치 조회 결과로 판단하세요. CI 빌드 통과가 이러한 하드웨어 경로를 모두 검증했다는 뜻은 아닙니다.

<a id="sfml-cpp-reference"></a>
## SFML C++ 레퍼런스

원본 클래스 문서: [Window](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Window.html), [RenderWindow](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderWindow.html), [Event](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Event.html), [VideoMode](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VideoMode.html), [Cursor](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Cursor.html).

C++ 문서의 이벤트 타입과 좌표 규칙을 참고하되, JS에서는 문자열과 타입이 지정된 페이로드로 이벤트를 분기합니다. 프레임 사이에는 `setImmediate()`로 제어권을 넘기며, `waitEvent()`는 동기식이라는 점을 유지해야 합니다.
