# sfml.js-rmlui

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **한국어**

[sfml.js](../sfml.js)를 위한 [RmlUi](https://github.com/mikke89/RmlUi) 6.3 통합으로, SFML 3.1을 통해 렌더링합니다. RML 문서와 RCSS 스타일로 네이티브 UI를 정의하고 JavaScript 또는 TypeScript로 요소를 애플리케이션 로직에 연결합니다.

[빠른 시작](../../docs/rmlui/getting-started.ko.md) · [예제](examples/README.ko.md) · [API 레퍼런스](https://sfml.js.org/ko/reference/rmlui/) · [sfml.js](../sfml.js/README.ko.md)

Native 바인딩과 TypeScript 인터페이스는 기능별로 구성되어 있습니다.
모듈과 도구의 위치는 [소스 구조](../../docs/rmlui/source-layout.ko.md)를 참고하세요.

## 기능

- 외부 파일이나 메모리에서 RML을 로드하고 요소의 클래스, 속성, 스타일, 마크업을 변경합니다.
- JavaScript 이벤트 리스너를 등록하고 실행 중 RCSS 테마를 전환합니다.
- [네이티브 Debugger](../../docs/rmlui/debugger.ko.md)로 요소, 로그, 모델을 검사하며 호스트와 대상을 별도로 지정합니다.
- 기하 데이터를 네이티브 메모리에 유지하며 SFML 정점 버퍼, 텍스처, 셰이더로 그립니다.
- 스텐실 클리핑, 레이어 합성, 블러, 드롭 섀도를 지원합니다.
- macOS Retina 표면, 물리 픽셀 입력, `dp` 기반 밀도 독립 레이아웃을 지원합니다.
- 영어, 중국어 간체, 일본어, 한국어 API 문서를 제공합니다.

RmlUi는 자체 마크업과 스타일 언어를 구현합니다. [네이티브 데이터 모델](../../docs/rmlui/data-models.ko.md), [Node／Lua 문서 스크립트](../../docs/rmlui/scripts.ko.md), Debugger, [SVG／Lottie 요소](../../docs/rmlui/vector-elements.ko.md)와 네이티브 [FreeType／HarfBuzz／비트맵 글꼴](../../docs/rmlui/fonts.ko.md)을 제공합니다. 브라우저 DOM API나 임의의 브라우저 CSS는 사용할 수 없습니다. 그라데이션, 이미지 마스크, 색상／배경 필터와 3D 변환은 구현되었고 macOS에서 고정 버전 GL3 렌더러와 비교했습니다. [렌더링 지원](../../docs/rmlui/rendering.ko.md#renderer-coverage)을 참고하세요. Linux／Windows 실행 검증은 아직 완료되지 않았습니다.

## 빌드와 실행

다음은 현재 monorepo 소스를 사용하는 절차입니다. Node.js, Python, C++20 도구, 디스플레이, OpenGL 요구 사항은 [플랫폼 요구 사항](../../docs/sfml/getting-started.ko.md#requirements)을 참고하세요.

```sh
# From the monorepo root, install and build once.
node tools/bootstrap.cjs
cd packages/sfml.js-rmlui
npm run demo
npm run examples -- variables
npm run examples -- --list
```

준비된 작업 공간에서는 `sfml.js-interop`과 `sfml.js`를 먼저 빌드한 뒤 이 패키지에서 `npm run build`를 실행합니다. macOS는 Xcode Command Line Tools와 CMake가 필요합니다. 의존성 단계는 `sfml.js-interop/third_party`의 SFML 소스／빌드 디렉터리와 버전이 일치하는 패치된 Window 라이브러리를 재사용합니다.

## 프레임 수명 주기

| 단계 | 호출 | 계약 |
| --- | --- | --- |
| 초기화 | `initialise(window)` | 열린 `RenderWindow` 하나를 프로세스 전체 런타임에 연결합니다. |
| 준비 | `loadFontFace`, `createContext`, `loadDocument`, `show` | 문서보다 글꼴을 먼저 로드하고 초기화 후 크기를 읽습니다. |
| 입력 | `context.processEvent(event)` | 모든 SFML 이벤트를 직접 전달합니다. false는 소비되었다는 뜻입니다. |
| 레이아웃 | `context.update()` | 레이아웃, 애니메이션, 표시 밀도를 갱신합니다. |
| 그리기 | `window.clear`, 장면 그리기, `window.flush`, `context.render` | UI 전에 대기 중인 SFML 명령을 제출합니다. |
| 표시 | `window.display()` | 완성된 프레임을 표시합니다. |
| 종료 | 리스너 제거, `context.remove`, `shutdown`, `window.close` | 창이 살아 있는 동안 RmlUi를 해제합니다. |

RmlUi 6.3의 `update()`와 `render()`는 빈 컨텍스트에서도 true를 반환합니다. 반환값은 레이아웃 변경이나 보이는 기하 데이터의 존재를 나타내지 않습니다.

## 예제

![SFML 창 안의 RmlUi 테마](examples/screenshots/variables.png)

[카운터](examples/README.ko.md#demo)의 Increment 버튼은 실제로 동작합니다. 공식 [variables](examples/README.ko.md#variables) 페이지는 테마와 호버 스타일을 보여 주며, 미션 버튼에는 상위 프로젝트에서도 클릭 동작이 없습니다. 문서 로드, 템플릿, 드래그 튜토리얼과 VisualTests 113개 페이지도 열 수 있습니다.

```sh
npm run examples -- drag
npm run examples -- template
npm run examples -- visual/clip_mask
```

## 문서와 검증

| 가이드 | 내용 |
| --- | --- |
| [빠른 시작](../../docs/rmlui/getting-started.ko.md) | 빌드, 리소스, 프레임 루프 |
| [문서와 이벤트](../../docs/rmlui/documents.ko.md) | 요소 편집, 리스너, 소유권 |
| [렌더링과 Retina](../../docs/rmlui/rendering.ko.md) | 좌표, `dp`, 스텐실과 렌더러 범위 |
| [글꼴](../../docs/rmlui/fonts.ko.md) | 네이티브 엔진, 셰이핑, 아틀라스 제약과 기능 확인 |
| [API 가이드](../../docs/rmlui/api.ko.md) | 정확한 시그니처, 기본값, 반환값 |

`npm test`로 lint, 네이티브／TypeScript 빌드, 타입 검사, 런타임 회귀를 확인합니다. macOS의 `npm --prefix ../sfml.js-interop run test:high-dpi`는 표면, 픽셀 캡처, 커서 좌표를 검증합니다. 실제 모니터 사이의 이동은 장치 테스트가 필요합니다.

## 라이선스

[MIT](../sfml.js/LICENSE).
