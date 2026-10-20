# 예제

[English](README.md) / [简体中文](README.zh-CN.md) / [日本語](README.ja.md) / **한국어**

> 이 저장소의 예제는 루트 디렉터리에서 실행합니다. 처음 실행하기 전에 `npm ci`를, 소스를 수정한 뒤에는 `npm run build`를 실행하세요. 그래픽 예제에는 사용 가능한 디스플레이 서버와 OpenGL 창 지원이 필요합니다. 공식 Vulkan 예제는 Vulkan으로 렌더링하지만 `sf.Window`가 렌더링에 쓰지 않는 OpenGL 컨텍스트도 생성합니다.

[프로젝트 홈](../README.ko.md) · [빠른 시작](../docs/getting-started.ko.md) · [개발 가이드](../docs/development.ko.md)

## 여기서 시작하기

```sh
node examples/breakout.cjs
node examples/all-types.cjs --frames=120
node examples/render-texture.cjs --frames=120
node examples/network.cjs
```

빌드가 되어 있다면 스크립트를 직접 실행하세요. `npm run demo:*`는 package.json에 따라 다시 빌드합니다. 그래픽 진입점에서 지원하는 프레임 수, 폰트 등의 매개변수는 각 스크립트를 기준으로 합니다.

<a id="breakout"></a>

## 벽돌 깨기 플레이하기

![네이티브 창에서 렌더링한 벽돌 깨기 게임](../assets/breakout.png)

[breakout.cjs](breakout.cjs)는 충돌 판정, 세 번의 목숨, 점수, 승패 상태를 갖춘 게임입니다. 왼쪽/오른쪽 방향키 또는 A/D로 이동하고, Space로 발사하거나 다시 시작하며, P로 일시 정지하고, Esc로 종료합니다. 직접 플레이할 때 포커스를 잃으면 일시 정지합니다.

`npm run demo:breakout`으로 빌드하고 실행할 수 있습니다. macOS/Linux에서 같은 게임 화면을 캡처하려면 다음을 실행하세요.

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-breakout.png \
  node examples/breakout.cjs --autoplay --frames=900
```

마지막 프레임의 실제 네이티브 화면을 저장합니다. `--autoplay`는 패들을 자동으로 조작하고 `--frames`는 실행 프레임 수를 제한합니다. `node examples/breakout.cjs --self-test`는 창을 열지 않고 게임 로직을 검사합니다.

## 그래픽과 창

| 파일 | 데모 내용 | npm 명령 |
| --- | --- | --- |
| [all-types.cjs](all-types.cjs) | 값 타입, 변환, 도형, 정점, 텍스트를 포함한 종합 장면 | `demo:types` |
| [sprites.cjs](sprites.cjs) | 대량 스프라이트 그리기 | `demo` |
| [image.cjs](image.cjs) | 픽셀 편집, 복사, 마스크, 코덱 | `demo:image` |
| [texture.cjs](texture.cjs) | 이미지 로딩, 자르기, 부분 업로드, 샘플링 | `demo:texture` |
| [sprite.cjs](sprite.cjs) | 스프라이트 애니메이션, 뒤집기, 색상, 경계 | `demo:sprite` |
| [render-texture.cjs](render-texture.cjs) | 오프스크린 합성, 텍스처 뷰, 그리기 스냅샷 | `demo:render-texture` |
| [drawable.cjs](drawable.cjs) | 사용자 정의 조합, 부모/자식 변환, 블렌딩, 스텐실 | `demo:drawable` |
| [vertex-array.cjs](vertex-array.cjs) | 동적 타일과 연속 정점 | `demo:vertices` |
| [text.cjs](text.cjs) | 텍스트 레이아웃과 정점 애니메이션 | `demo:text` |
| [window.cjs](window.cjs) | 창 이벤트, 커서, 입력 진단 | `demo:window` |
| [system-window.cjs](system-window.cjs) | System 및 Window 인터페이스 | `demo:system-window` |

계속 렌더링하는 예제 대부분은 Esc로 종료할 수 있으며, `--frames=120`으로 실행 시간을 제한할 수 있습니다. text 예제에서는 `--font=/path/to/font.ttf`와 `--text=中文示例`로 폰트와 텍스트를 지정합니다. 중국어에는 해당 글리프가 필요합니다.

일부 진단 예제는 저장소 내부의 미리 보기 및 검증 보조 함수를 사용합니다. 애플리케이션을 처음 만들 때는 공개 인터페이스만 사용하는 [빠른 시작](../docs/getting-started.ko.md)의 창 코드를 사용하세요.

## 오디오와 네트워크

| 파일 | 데모 내용 |
| --- | --- |
| [audio.cjs](audio.cjs) | Sound, Music, Worker 데이터 공급, 오디오 효과, 녹음 재생 |
| [audio-worker.cjs](audio-worker.cjs) | 오디오 예제에서 로드하는 tone 및 filter Worker 팩토리 |
| [network.cjs](network.cjs) | 로컬 TCP, Packet, UDP, Selector |
| [sleep-err.cjs](sleep-err.cjs) | 비동기 대기와 SFML 로그 출력 |
| [vector-scalars.cjs](vector-scalars.cjs) | 다양한 수치 스칼라의 벡터 연산 |

audio 예제에서는 1~4로 모드를 바꾸고, Space로 재생/일시 정지, S로 정지, E로 오디오 효과 전환, R/T로 녹음 시작/종료를 수행합니다. 방향키로 패닝과 볼륨을 조절합니다. 녹음은 시스템 마이크를 사용하며, 일반 실행 시에는 키 입력을 기다립니다.

<a id="screenshots"></a>
## 스크린샷

`SFML_DEMO_SNAPSHOT`을 지원하는 그래픽 예제는 실행 화면을 저장할 수 있습니다. macOS/Linux에서는 다음과 같이 실행합니다.

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-render-texture.png \
  node examples/render-texture.cjs --frames=2
```

PowerShell:

```powershell
$env:SFML_DEMO_SNAPSHOT = "$env:TEMP/sfml-render-texture.png"
node examples/render-texture.cjs --frames=2
Remove-Item Env:SFML_DEMO_SNAPSHOT
```

종합 all-types 예제는 PPM으로 저장하며, 다른 예제는 각 진입점의 구현에 따른 형식으로 저장합니다. 정적 스크린샷은 지정한 장면의 렌더링 결과만 증명하며, 처리량, 사운드 출력, 입력 장치 테스트를 뜻하지 않습니다.

<a id="game-projects"></a>

## 게임 프로젝트

### node-sfml-demos

[node-sfml-demos](https://github.com/XadillaX/node-sfml-demos)에는 sfml.js로 구현한 Bomberman, Breakout, Tetris, Doodle Jump, Arkanoid가 포함되어 있습니다.

프로젝트를 보관하는 디렉터리에서 이 별도 저장소를 복제한 뒤, 각 게임 디렉터리에서 의존성을 설치하고 실행하세요. Bomberman의 경우:

```sh
git clone https://github.com/XadillaX/node-sfml-demos.git
cd node-sfml-demos/bomberman
npm install
node index.js
```

게임 디렉터리, 조작법, 원본 C++ 소스 코드는 [저장소 README](https://github.com/XadillaX/node-sfml-demos#readme)를 참고하세요. [네이티브 빌드 요구 사항](../docs/getting-started.ko.md#requirements)도 적용됩니다.

<a id="16-games"></a>

### ClojureScript 게임 16개

[16-sfml.js-games-ported](https://github.com/XadillaX/16-sfml.js-games-ported)는 [jsyqrt/games](https://github.com/jsyqrt/games)의 포크입니다. 원본 게임 16개는 **C++과 SFML**로 작성되었습니다. 이 포크는 모든 게임을 **ClojureScript와 sfml.js**로 이식하며 원래 디렉터리 구조, 리소스, 게임 로직과 조작법을 유지합니다.

**nbb**를 통해 Node.js에서 실행하므로 JVM이나 별도의 컴파일 단계가 필요하지 않습니다. 프로젝트를 보관하는 디렉터리에 게임 저장소를 복제한 뒤, 저장소 루트에서 실행하세요.

```sh
git clone https://github.com/XadillaX/16-sfml.js-games-ported.git
cd 16-sfml.js-games-ported
npm ci
npx nbb "01 Tetris/main.cljs"
```

Node.js 20.5 이상, [네이티브 빌드 요구 사항](../docs/getting-started.ko.md#requirements)을 충족하는 환경, OpenGL 창을 지원하는 그래픽 세션이 필요합니다. 의존성은 `sfml.js@1.0.0-rc.2`와 `nbb@1.6.214`로 고정되어 있습니다. 각 스크립트는 자신의 디렉터리를 기준으로 리소스를 찾습니다.

| 게임 | 게임 저장소 루트에서 실행 |
| --- | --- |
| 01 · Tetris | `npx nbb "01 Tetris/main.cljs"` |
| 02 · Doodle Jump | `npx nbb "02 Doodle Jump/main.cljs"` |
| 03 · Arkanoid | `npx nbb "03 Arkanoid/main.cljs"` |
| 04 · Snake | `npx nbb "04 Snake/main.cljs"` |
| 05 · Minesweeper | `npx nbb "05 Minesweeper/main.cljs"` |
| 06 · Fifteen-Puzzle | `npx nbb "06 Fifteen-Puzzle/main.cljs"` |
| 07 · Racing (Top Down) | `npx nbb "07 Racing (Top Down)/main.cljs"` |
| 08 · Outrun | `npx nbb "08 Outrun/main.cljs"` |
| 09 · Xonix | `npx nbb "09 Xonix/main.cljs"` |
| 10 · Bejeweled | `npx nbb "10 Bejeweled/main.cljs"` |
| 11 · NetWalk (Pipe Puzzle) | `npx nbb "11 NetWalk (Pipe Puzzle)/main.cljs"` |
| 12 · Mahjong Solitaire | `npx nbb "12 Mahjong Solitaire/main.cljs"` |
| 13 · Tron | `npx nbb "13 Tron/main.cljs"` |
| 14 · Chess | `npx nbb "14 Chess/main.cljs" /path/to/stockfish` |
| 15 · Volleyball | `npx nbb "15 Volleyball/main.cljs"` |
| 16 · Asteroids | `npx nbb "16 Asteroids/main.cljs"` |

Chess에는 현재 운영체제용 [Stockfish 실행 파일](https://github.com/official-stockfish/Stockfish/releases)이 별도로 필요하며, 표의 명령에 실행 파일 경로를 전달합니다. Volleyball이 사용하는 `box2dweb`은 `npm ci`로 설치됩니다. 게임 창을 닫으면 종료됩니다. 스크린샷, 소스 코드와 조작법은 [게임 목록](https://github.com/XadillaX/16-sfml.js-games-ported#games)을 참고하세요.

## SFML 공식 예제

[official/](official/README.ko.md)에는 SFML 공식 저장소에서 이식한 예제 24개가 있습니다. 테니스, 셰이더, 텍스트, 지형, 오디오, 네트워크, X11, OpenGL 창, SFML/OpenGL 혼합 렌더링, Vulkan, Cocoa와 Win32 통합을 포함하며 원본 장면과 리소스를 유지합니다. 조작법, Node에 맞춘 조정, 출처와 라이선스는 안내 문서를 참고하세요. 아직 이식하지 않은 예제는 `android`뿐입니다.

```sh
node examples/official/tennis/Tennis.cjs
```

Vulkan은 x64의 Linux/X11과 Windows를 대상으로 하며 `nvk` 0.8.0, Vulkan 로더와 4배 비등방성 필터링을 지원하는 드라이버 및 장치가 필요합니다. SFML은 창, 이벤트와 서피스를 담당하고 nvk가 별도의 네이티브 브리지 없이 Vulkan을 직접 호출합니다. SFML Graphics는 여전히 OpenGL을 사용합니다. SFML의 Vulkan 통합은 컴파일 시점에 macOS를 지원하지 않으므로 MoltenVK 설치만으로 활성화할 수 없습니다. Linux/X11과 Windows의 네이티브 렌더링 및 조작 검증을 모두 통과했습니다. 조작법과 요구 사항은 [플랫폼 통합 안내](official/README.ko.md#platform)를 참고하세요.

```sh
cd examples/official
npm ci --prefix vulkan --ignore-scripts
node vulkan/Vulkan.cjs
```

## 이전 버전 예제

[ported/](ported/README.ko.md)는 기존 스크립트 16개를 유지합니다. 14개는 현재 API로 실행하며, 2개는 이전 비동기 그리기 인터페이스에 의존하므로 미지원으로 보고합니다.

```sh
npm run demo:ported
```

all-types-scene.cjs와 bitmap-label.cjs는 데모 보조 파일이며, 독립적인 애플리케이션 진입점이 아닙니다.
