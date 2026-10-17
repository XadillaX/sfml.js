# 빠른 시작

[English](getting-started.md) / [简体中文](getting-started.zh-CN.md) / [日本語](getting-started.ja.md) / **한국어**

> 목표: sfml.js를 설치하고 닫기 이벤트에 응답하는 네이티브 창을 실행합니다. 이 문서는 현재의 SFML 3.1.0 API를 사용합니다.

[문서 홈](README.ko.md) · [핵심 개념](concepts.ko.md) · [예제](../examples/README.ko.md)

<a id="requirements"></a>
## 설치 환경

sfml.js는 Node.js 네이티브 확장입니다. 설치 과정에서 현재 플랫폼용 SFML 동적 라이브러리를 다운로드하고 로컬에서 바인딩을 컴파일하므로 Python과 C++20 도구 체인이 필요합니다.

패키지에 선언된 Node.js 지원 범위는 `^18.19.0 || >=20.5.0`이며, 현재 CI 구성은 Node.js 20과 22를 사용합니다. 처음 설정할 때는 Node.js 22를 사용할 수 있습니다.

### macOS

macOS 13+의 x64, arm64 다운로드 대상을 지원합니다. Xcode Command Line Tools를 설치하고 Python을 사용할 수 있는지 확인하세요.

```sh
xcode-select --install
python3 --version
```

Node.js 아키텍처에 따라 다운로드할 SFML 아키텍처가 결정됩니다. `node -p process.arch`로 확인할 수 있습니다.

### Linux

현재 자동 다운로드는 x64를 지원합니다. Ubuntu/Debian에서는 저장소 CI와 동일하게 의존성을 설치할 수 있습니다.

```sh
sudo apt-get update
sudo apt-get install -y \
  build-essential python3 \
  libgl1-mesa-dev libx11-dev libxrandr-dev libxcursor-dev libxi-dev \
  libudev-dev libfreetype-dev libflac-dev libvorbis-dev \
  libopenal-dev libmbedtls-dev
```

디스플레이가 없는 CI에는 `xvfb`와 `xauth`도 필요합니다. 실행 방법은 [개발 가이드](development.ko.md#testing)를 참고하세요. 다른 배포판에서는 이에 해당하는 개발 패키지를 사용합니다.

### Windows

Python과 Visual Studio 2022 Build Tools를 설치하고, 'C++를 사용한 데스크톱 개발'과 Windows SDK를 선택하세요. 현재 다운로드 대상은 x64, ia32이며, 컴파일 도구 체인은 Node.js 아키텍처와 일치해야 합니다.

## 패키지 설치

애플리케이션 디렉터리에서 실행하세요.

```sh
npm install sfml.js
```

TypeScript 타입 선언은 패키지에 포함되어 있습니다. npm은 기본적으로 `latest` 태그를 설치합니다. 다음 명령으로 설치된 버전과 배포 태그를 확인할 수 있습니다.

```sh
npm ls sfml.js
npm view sfml.js dist-tags
```

현재 저장소를 직접 사용해 보려면 [개발 가이드](development.ko.md#get-the-source)에 따라 `npm ci`를 실행한 뒤 저장소 예제를 실행하세요.

설치 파일은 의존성 패키지의 `third_party/sfml/`에, 네이티브 모듈은 `build/Release/sfml.node`에 저장됩니다. 다운로드 시 SFML의 GitHub Release에 접근할 수 있어야 하며, 버전과 아키텍처가 일치하면 캐시를 재사용합니다.

`SFML_DOWNLOAD_MIRROR`로 다운로드 프록시 접두사를 지정할 수 있습니다. 최종 URL은 `<접두사>/<전체 GitHub URL>` 형식이므로, 사용하는 프록시는 이 형식을 지원해야 합니다. 설정은 [다운로드 URL 구현](../tools/lib_downloader_urls.cjs)을 참고하세요.

## 첫 번째 창 열기

`hello.cjs`를 만드세요.

```javascript
const sf = require('sfml.js');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'Hello, sfml.js',
);
const circle = new sf.CircleShape({ radius: 80 });
circle.setPosition(new sf.Vector2f(320, 220));
circle.setFillColor(new sf.Color(76, 190, 110));
window.setFramerateLimit(60);

function frame() {
  window.handleEvents({
    Closed: () => window.close(),
    KeyPressed: event => {
      if (event.code === sf.Keyboard.Key.Escape) window.close();
    },
  });
  if (!window.isOpen()) return;

  window.clear(new sf.Color(24, 28, 32));
  window.draw(circle);
  window.display();
  setImmediate(frame);
}

frame();
```

`node hello.cjs`를 실행하면 창에 초록색 원이 표시됩니다. Esc 키를 누르거나 닫기 버튼을 클릭하면 종료됩니다.

매 프레임마다 이벤트를 먼저 처리한 뒤 장면 업데이트, 화면 지우기, 그리기, 표시를 수행합니다. `setImmediate(frame)`은 다음 이벤트 루프에서 그리기를 이어 가며, 파일, 네트워크, Worker 메시지가 처리될 기회를 줍니다. `display()`는 동기식 인터페이스로, 프레임 제한이나 수직 동기화 때문에 대기할 수 있습니다. 이에 대응하는 `displayAsync()` 메서드는 없습니다.

## TypeScript 사용

패키지 진입점에서 공개 타입을 가져옵니다.

```typescript
import { RenderWindow, Vector2u } from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'TypeScript');
window.close();
```

마이크로초 단위 시간과 일부 네트워크 정수는 `bigint`를 사용하므로, 애플리케이션의 TypeScript `target`은 최소 `ES2020`이어야 합니다. CommonJS 애플리케이션에서는 `require('sfml.js')`를 사용하며, 타입 패키지를 별도로 설치할 필요가 없습니다.

## 이미지 로딩

먼저 리소스를 생성하고 로딩이 성공할 때까지 기다린 다음, 이를 사용하는 객체를 생성합니다.

```javascript
const sf = require('sfml.js');

async function loadSprite(filename) {
  const texture = new sf.Texture();
  if (!await texture.loadFromFile(filename)) {
    throw new Error(`Cannot load texture: ${filename}`);
  }
  return new sf.Sprite(texture);
}
```

반환된 Sprite를 창의 `draw()` 호출에 전달하세요. 상대 파일 경로는 호출 시점의 작업 디렉터리를 기준으로 해석됩니다.

일반적인 파일 부재나 디코딩 실패는 보통 `false`를 반환합니다. 타입 오류, 범위 오류, 실행 중 예외는 예외 발생이나 Promise 거부로 보고됩니다. 예외만 잡고 로딩 반환값을 무시해서는 안 됩니다.

## 자주 발생하는 문제

| 증상 | 확인할 사항 |
| --- | --- |
| `sfml.node`를 찾을 수 없음 | 설치 스크립트가 비활성화되었는지 확인하고, 도구 체인을 준비한 뒤 애플리케이션에서 `npm rebuild sfml.js` 실행 |
| `Unsupported SFML platform` | 지원되는 운영체제와 `process.arch` 확인. 현재 Linux arm64 자동 다운로드 패키지는 없음 |
| 창이나 OpenGL 컨텍스트를 생성할 수 없음 | 그래픽 세션과 OpenGL 드라이버 확인. Linux CI에서는 Xvfb 사용 |
| 창이 응답하지 않고 비동기 작업이 완료되지 않음 | 프레임 루프가 `setImmediate` 등의 방식으로 이벤트 루프에 제어권을 넘기는지 확인 |
| `await load...()`에서 예외가 없었지만 화면이 나오지 않음 | 불리언 반환값, 파일 경로, Sprite 위치, 텍스처 사각형 확인 |
| 텍스트에 중국어가 표시되지 않음 | 해당 문자를 지원하는 폰트를 사용하고 `Font.openFromFile()`로 로드 |

다음으로 [핵심 개념](concepts.ko.md)을 읽거나 [전체 예제](../examples/README.ko.md)를 바로 실행해 보세요.

<a id="sfml-cpp-reference"></a>
## SFML C++ 레퍼런스

[SFML 3.1.0 공식 문서](https://www.sfml-dev.org/documentation/3.1.0/)의 원본 예제에서 창과 렌더링의 기본 개념을 확인할 수 있습니다. C++의 파일 생성자나 블로킹 루프를 JavaScript에 그대로 옮겨서는 안 됩니다. 이 가이드처럼 리소스 로딩을 기다리고 이벤트 루프에 제어권을 넘겨야 합니다.
