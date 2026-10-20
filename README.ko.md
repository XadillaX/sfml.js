<p align="center">
  <img src="./assets/branding/sfml-js-symbol-pentagon.svg" width="80" height="80" align="middle" alt="" />
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/branding/sfml-js-wordmark-dark.svg" />
    <img src="./assets/branding/sfml-js-wordmark.svg" width="246" height="68" align="middle" alt="sfml.js" />
  </picture>
</p>

<p align="center">
<a href="https://www.sfml-dev.org/documentation/3.1.0/">SFML 3.1.0</a>을 기반으로 Node.js에 네이티브 창, 2D 그래픽, 오디오 기능을 제공합니다.
</p>

<p align="center">
<a href="https://www.npmjs.org/package/sfml.js">
  <img src="https://img.shields.io/npm/v/sfml.js.svg?style=for-the-badge&colorA=FF7800&colorB=CC5600&label=NPM" alt="npm 버전" />
</a>
<a href="https://www.npmjs.org/package/sfml.js">
  <img src="https://img.shields.io/npm/dm/sfml.js.svg?style=for-the-badge&colorA=5DDB61&colorB=4BC74F&label=DOWNLOADS" alt="npm 다운로드 수" />
</a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href="#contributors-"><img src="https://img.shields.io/badge/3-ALL%20CONTRIBUTORS?style=for-the-badge&colorA=FF69b4&colorB=cc47a4&label=ALL%20CONTRIBUTORS" alt="3 contributors" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<a href="https://github.com/XadillaX/node-sfml">
  <img src="https://img.shields.io/github/stars/XadillaX/node-sfml.svg?style=for-the-badge&colorA=FBBD30&colorB=F2AA08&label=STAR" alt="GitHub 스타 수" />
</a>
</p>

[English](README.md) / [简体中文](README.zh-CN.md) / [日本語](README.ja.md) / **한국어**

JavaScript나 TypeScript로 데스크톱 멀티미디어 애플리케이션을 만드세요. 스프라이트, 도형, 텍스트를 그리고, 창 이벤트를 처리하며, 오디오를 재생하고 녹음하고, SFML 스타일의 네트워크 API로 데이터를 주고받을 수 있습니다.

[웹사이트](https://sfml.js.org/ko/) · [빠른 시작](docs/getting-started.ko.md) · [가이드](docs/README.ko.md) · [타입 레퍼런스](https://sfml.js.org/ko/reference/) · [예제](examples/README.ko.md)

## 제공 기능

| 모듈 | 기능 |
| --- | --- |
| System | 타입이 지정된 벡터, 각도, 시간, 시계, Unicode 경계, 탐색 가능한 입력 스트림 |
| Window | 네이티브 창, 타입이 지정된 이벤트, 키보드, 마우스, 조이스틱, 클립보드, OpenGL 컨텍스트 |
| Graphics | 스프라이트, 도형, Unicode 텍스트, 카메라, 셰이더, 정점 버퍼, 오프스크린 렌더링 |
| Audio | 효과음, 스트리밍 음악, 녹음, 공간 오디오, Worker 기반 처리 |
| Network | Node.js 전송 계층을 통한 TCP, UDP, 패킷, DNS, TLS, HTTP, FTP, SFTP |

TypeScript 선언이 포함되어 있습니다. 수치 값과 리소스 뷰에는 타입 배열을 사용하며, 렌더링은 상태 스냅샷을 기록한 뒤 명령을 일괄 제출합니다. 소유권, 비동기 로딩, 렌더링 동작은 [핵심 개념](docs/concepts.ko.md)을 참고하세요.

## 설치

```bash
npm install sfml.js
```

설치 과정에서 네이티브 애드온을 컴파일하고 호환되는 SFML 라이브러리를 다운로드합니다. 설치 전에 **Python과 C++20 도구 체인**을 준비하세요.

| 플랫폼 | 다운로드 대상 | 빌드 도구 |
| --- | --- | --- |
| macOS 13+ | x64, arm64 | Xcode Command Line Tools |
| Linux | x64 | GCC 또는 Clang, make, X11, OpenGL 및 오디오 개발 라이브러리 |
| Windows | x64, ia32 | Visual Studio 2022 C++ Build Tools |

패키지에 선언된 Node.js 지원 범위는 `^18.19.0 || >=20.5.0`이며, CI는 Linux, macOS, Windows에서 Node.js 20과 22를 사용하도록 구성되어 있습니다. 다운로드 대상으로 제공된다고 해서 모든 아키텍처와 장치를 테스트했다는 뜻은 아닙니다. 플랫폼별 명령은 [설치 안내](docs/getting-started.ko.md#requirements)를 참고하세요.

## 첫 번째 창

다음 코드를 `hello.cjs`로 저장하고 `node hello.cjs`를 실행하세요.

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

이 예제는 네이티브 데스크톱 창을 생성합니다. 그래픽 세션에서 실행하세요. `setImmediate()`는 프레임 사이에 Node.js가 I/O를 처리할 수 있게 합니다. `display()`는 동기식이며, 프레임 제한이나 수직 동기화를 위해 대기할 수 있습니다.

TypeScript에서는 `import { RenderWindow, Vector2u } from 'sfml.js'`와 같은 이름 있는 가져오기를 사용합니다. 파일 로딩은 Promise를 사용합니다.

```javascript
async function loadSprite(filename) {
  const texture = new sf.Texture();
  if (!await texture.loadFromFile(filename)) {
    throw new Error(`Cannot load texture: ${filename}`);
  }
  return new sf.Sprite(texture);
}
```

## 문서

README와 가이드는 영어, 중국어 간체, 일본어, 한국어로 제공됩니다. 기본 언어는 영어입니다.

| 시작 문서 | 다루는 내용 |
| --- | --- |
| [빠른 시작](docs/getting-started.ko.md) | 설치, 가져오기, 첫 번째 창 |
| [핵심 개념](docs/concepts.ko.md) | 값, 리소스 수명, Promise, 그리기 스냅샷 |
| [API 가이드](docs/api.ko.md) | System, Window, Graphics, Audio, Network 안내 |
| [예제](examples/README.ko.md) | 실행 가능한 프로그램과 조작 방법 |
| [개발](docs/development.ko.md) | 빌드, 테스트, 기여 |

[TypeDoc](https://sfml.js.org/ko/reference/)은 자동 생성된 시그니처와 소스 주석을 제공합니다. [SFML C++ 문서](https://www.sfml-dev.org/documentation/3.1.0/)는 업스트림 API를 설명하며, 이 저장소의 가이드는 JavaScript 고유의 동작을 설명합니다.

## 예제 실행

![sfml.js 네이티브 창에서 실행되는 벽돌 깨기 게임](assets/breakout.png)

[breakout.cjs](examples/breakout.cjs)의 실행 화면입니다. 도형, 키보드 입력, 게임 루프를 JavaScript로 구현했습니다. 왼쪽/오른쪽 방향키 또는 A/D로 이동하고, Space로 발사하며, Esc로 종료합니다.

```bash
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
npm ci
node examples/breakout.cjs
node examples/all-types.cjs --frames=120
node examples/network.cjs
```

[포팅된 예제](examples/ported/README.ko.md)는 기존 데모를 유지하면서 SFML 3 API에 맞게 조정한 것입니다. `drawAsync()` 또는 `displayAsync()`가 필요한 두 예제는 `UNSUPPORTED`를 출력합니다. 이 바인딩에서는 해당 메서드를 제공하지 않습니다.

[node-sfml-demos](https://github.com/XadillaX/node-sfml-demos)에는 sfml.js로 구현한 Bomberman, Breakout, Tetris, Doodle Jump, Arkanoid가 포함되어 있습니다. 설치 및 실행 명령은 [게임 프로젝트](examples/README.ko.md#game-projects)를 참고하세요.

[16-sfml.js-games-ported](https://github.com/XadillaX/16-sfml.js-games-ported)는 [jsyqrt/games](https://github.com/jsyqrt/games)의 C++과 SFML로 작성된 원본 게임 16개를 모두 ClojureScript와 sfml.js로 이식한 프로젝트입니다. 게임 목록과 nbb 실행 명령은 [게임 16개](examples/README.ko.md#16-games)를 참고하세요.

[play-nes](https://github.com/XadillaX/play-nes) — sfml.js와 JSNES로 구축된 데스크톱 NES 에뮬레이터.

## 기여하기

[개발 가이드](docs/development.ko.md)에 따라 환경을 준비하세요. 수정, 문서, 예제에 관한 풀 리퀘스트를 환영합니다. 버그를 보고할 때는 실행 가능한 재현 코드와 함께 Node.js 버전, 운영체제, 아키텍처를 포함해 주세요.

<a id="contributors-"></a>
<a id="maintenance-XadillaX"></a>

## 기여자 ✨

다음 분들께 감사드립니다([이모지 설명](https://allcontributors.org/docs/en/emoji-key)).

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://xcoder.in/"><img src="https://avatars.githubusercontent.com/u/2842176?v=4&amp;s=100" width="100px;" alt="Khaidi Chu"/><br /><sub><b>Khaidi Chu</b></sub></a><br /><a href="#maintenance-XadillaX" title="Maintenance">🚧</a> <a href="https://github.com/XadillaX/node-sfml/commits?author=XadillaX" title="Code">💻</a></td>
    <td align="center"><a href="https://pokemonworkshop.com/forum"><img src="https://avatars.githubusercontent.com/u/7335788?v=4&amp;s=100" width="100px;" alt="NuriYuri"/><br /><sub><b>NuriYuri</b></sub></a><br /><a href="https://github.com/XadillaX/node-sfml/commits?author=NuriYuri" title="Code">💻</a></td>
    <td align="center"><a href="https://godot.id"><img src="https://avatars.githubusercontent.com/u/40712686?v=4&amp;s=100" width="100px;" alt="Hanz"/><br /><sub><b>Hanz</b></sub></a><br /><a href="https://github.com/XadillaX/node-sfml/commits?author=HanzCEO" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

이 프로젝트는 [all-contributors](https://github.com/all-contributors/all-contributors) 명세를 따릅니다. 어떤 형태의 기여든 환영합니다!

## 라이선스

[MIT](LICENSE).
