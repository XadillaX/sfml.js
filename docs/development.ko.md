# 개발 가이드

[English](development.md) / [简体中文](development.zh-CN.md) / [日本語](development.ja.md) / **한국어**

> 이 문서는 소스를 수정하고 문서를 유지 보수하며 저장소 테스트를 실행하는 기여자를 위한 안내입니다. 의존성으로 사용하는 경우에는 [빠른 시작](getting-started.ko.md)부터 읽으세요.

[문서 홈](README.ko.md) · [API 안내](api.ko.md) · [예제 목록](../examples/README.ko.md)

<a id="get-the-source"></a>
## 소스 가져오기

Node.js, Python, C++20 도구 체인을 준비하세요. 플랫폼별 설치 명령은 [설치 환경](getting-started.ko.md#requirements)을 참고한 뒤 다음을 실행합니다.

```sh
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
npm ci
```

`install`은 네이티브 모듈을 컴파일하고, `prepare`는 TypeScript 상수, JavaScript, 선언 파일을 생성합니다. 빌드 훅은 먼저 SFML 3.1.0을 확인하고 다운로드합니다. npm 의존성으로 설치할 때는 배포 패키지의 dist를 사용하므로, 설치 단계에서는 네이티브 모듈만 컴파일하면 됩니다.

## 빌드

아래 명령은 모두 저장소 루트 디렉터리에서 실행합니다.

| 명령 | 용도 |
| --- | --- |
| `npm run build` | 네이티브 모듈과 TypeScript 컴파일 |
| `npm run build:native` | 네이티브 모듈 컴파일 및 clangd 설정 업데이트 |
| `npm run build:ts` | 상수 생성 및 TypeScript 컴파일 |
| `npm run build:docs` | 4개 언어 사이트와 API 레퍼런스 빌드 |
| `npm run build:reference` | TypeDoc API 문서만 생성 |
| `npm run docs:dev` | 사이트 개발 미리 보기 시작 |
| `npm run docs:preview` | 프로덕션 빌드를 로컬에서 미리 보기 |
| `npm run lint` | 소스, 도구, 테스트, 예제 검사 |
| `npm run test:types` | TypeScript 인터페이스 검증 |
| `npm run test:runtime` | 런타임 테스트를 직렬 실행. 사전 빌드 필요 |
| `npm test` | lint, 빌드, 타입 검사, 런타임 테스트를 순서대로 실행 |
| `npm pack --dry-run` | npm 패키지 파일 목록 확인 |

TypeScript만 수정했다면 `npm run build:ts`를 실행할 수 있습니다. 네이티브 코드를 수정했다면 `npm run build`를 실행하세요. 런타임 테스트는 자동으로 다시 빌드하지 않으므로, 실행 전에 빌드 결과가 소스와 일치하는지 확인해야 합니다.

<a id="testing"></a>
## 테스트와 검증

```sh
npm test
```

`npm test`는 lint, 네이티브 및 TypeScript 빌드, 타입 검사, 런타임 테스트를 실행합니다.

런타임 테스트는 파일별로 직렬 실행되며 공개 인터페이스, 네이티브 SFML 대조, 실제 렌더링 픽셀, 비동기 I/O, 스냅샷, 수명 주기를 검증합니다. 타입 테스트는 `test/*.types.ts`, 런타임 테스트는 `test/*.test.cjs`, 네이티브 대조 테스트는 `test/native/`에 있습니다.

그래픽 테스트에는 디스플레이 서버와 OpenGL 컨텍스트가 필요합니다. 디스플레이가 없는 Linux 환경에서는 [Linux CI](../.github/workflows/node.js.yml)에 따라 Xvfb를 설치한 뒤 실행하세요.

```sh
LIBGL_ALWAYS_SOFTWARE=1 \
  xvfb-run -a -s "-screen 0 1280x1024x24 -noreset" npm run test:runtime
```

CI 구성은 Linux, macOS, Windows의 Node.js 20/22를 포함하며, [Windows CI](../.github/workflows/node.js-windows.yml)는 Mesa 소프트웨어 OpenGL을 사용합니다.

CI는 스피커, 마이크, 조이스틱, 센서, 전체 화면 전환 등의 장치 검증을 대신할 수 없습니다. SFML의 macOS 백엔드는 Vulkan을 지원하지 않으며, SuspendAwareClock.now는 Android만 지원합니다. 결과를 보고할 때는 실제 실행 플랫폼과 건너뛴 항목을 명시하세요.

## 문서 유지 보수

README는 프로젝트 소개와 최소 예제를 담당하고, `docs/`는 작업 및 모듈별 사용법을 설명하며, `examples/README.md`는 실행 가능한 진입점을 제공합니다. 전체 시그니처는 소스 주석에서 생성하므로, 직접 작성한 문서에서 선언을 중복 관리하지 마세요.

- 예제는 공개 패키지 `sfml.js`를 가져옵니다. 저장소 데모 스크립트에서만 저장소 상대 경로를 사용합니다.
- 완전한 예제와 주변 코드가 필요한 조각을 구분하고, async 함수, 리소스 파일, 장치 요구 사항을 설명합니다.
- 로딩 불리언 값과 네트워크 상태를 확인하고, 예제가 끝나면 소유한 리소스를 닫습니다.
- 공개 동작을 변경하면 JSDoc, 해당 가이드, 영향을 받는 예제도 함께 유지 보수합니다.

사이트 의존성을 설치하고 빌드합니다.

```sh
npm ci --prefix site
npm run build:docs
```

`site/`에는 VitePress 테마와 빌드 스크립트가 있습니다. 영어, 중국어, 일본어, 한국어 가이드와 API 레퍼런스를 생성합니다. TypeDoc은 `/reference/`, `/zh/reference/`, `/ja/reference/`, `/ko/reference/`에 배치하며 전체 사이트는 `build/site/`에 출력합니다. 원본 Markdown을 편집하고 `npm run docs:dev`를 다시 시작하여 생성 내용을 갱신하세요. 테마 변경에는 핫 리로드가 적용됩니다.

문서 생성에는 네이티브 모듈을 컴파일하거나 로드할 필요가 없습니다. 문서 전용 환경에서는 먼저 `npm ci --ignore-scripts`를 실행할 수 있습니다. `npm run build:reference`는 TypeDoc만 `build/docs/`에 생성합니다. `npm --prefix site test`는 링크 변환과 이전 URL 리다이렉트를 검증하며, 프로덕션 빌드에서는 경로, 앵커, 리소스도 검사합니다.

[Publish Docs 워크플로](../.github/workflows/publish-docs.yml)는 `main`이 업데이트될 때 실행되며, 수동 실행도 지원합니다. 생성 결과는 `gh-pages` 브랜치의 `docs/`에 커밋하고, 해당 브랜치의 루트 파일은 보존하며, 기존 `CNAME`(`sfml.js.org`)을 유지합니다. 생성 내용에 변화가 없으면 커밋을 건너뜁니다.

이전 TypeDoc 클래스와 인터페이스 URL은 프래그먼트를 유지하며 해당 영어 레퍼런스 페이지로 이동합니다. API 언어를 전환해도 현재 페이지와 멤버 앵커가 유지됩니다. 단독 빌드의 `build/docs/`에도 번역을 위한 `zh/`, `ja/`, `ko/` 하위 디렉터리가 생성됩니다.

JSDoc은 영어를 먼저 쓰고 `@zh`, `@ja`, `@ko` 번역을 이어서 작성합니다. 번역은 해당 요약이나 블록 태그 바로 뒤에 둡니다. 매개변수 번역은 `@ko name - 설명` 형식을 사용합니다. 식별자, 예제 코드, 링크를 유지하세요. 설명 번역이 누락되면 문서 빌드가 실패합니다.

```ts
/**
 * Read the elapsed time.
 * @zh 读取经过的时间。
 * @ja 経過時間を読み取ります。
 * @ko 경과 시간을 읽습니다.
 * @param unit - Time unit.
 * @zh unit - 时间单位。
 * @ja unit - 時間の単位。
 * @ko unit - 시간 단위.
 */
```

자동 생성되는 상수 설명은 `tools/constant-docs.json`과 `tools/constant-docs.cjs`의 템플릿에서 관리합니다. 수정 후 `npm run generate:window`와 `npm run generate:network`를 실행하고 생성된 주석은 직접 편집하지 마세요.

## 예제 실행

아래 명령은 저장소 루트 디렉터리에서 실행합니다.

```sh
npm run demo:types -- --frames=120
npm run demo:window -- --frames=120
npm run demo:audio
npm run demo:network
```

예제는 [개요](../examples/README.ko.md), [기능 예제](../examples/features/README.ko.md), [공식 예제](../examples/official/README.ko.md), [게임과 앱](../examples/projects/README.ko.md)으로 나뉩니다. 명령과 [캡처 지원](../examples/features/README.ko.md#screenshots)은 각 진입점에 설명되어 있습니다. 빌드 후 스크립트를 직접 실행하고 지원하는 진입점에만 `--frames`를 전달하세요.

## 소스와 생성 파일

| 디렉터리 | 내용 |
| --- | --- |
| `src/` | TypeScript 구현 |
| `native/` | C++ 바인딩 |
| `test/` | 런타임, 타입, 네이티브 대조 테스트 |
| `tools/` | 상수 생성기, 벤치마크, 테스트 도구 |
| `docs/` | API 및 개발 문서 |
| `site/` | 사이트 테마, 다국어 지원, 검색, 빌드 스크립트 |

`build/`, `dist/`, `node_modules/`, 다운로드한 SFML은 모두 생성된 내용입니다. 창 및 네트워크 상수는 현재 SFML 헤더에서 생성하므로 `src/*/gen/constants.ts`를 직접 편집하지 마세요.

네이티브 빌드 후에는 `.clangd`에서 사용할 `build/compile_commands.json`이 자동 생성됩니다. 언어 서버 설정만 업데이트하려면 `npm run configure:lsp`를 실행하세요. 편집기에 이전 진단이 남아 있으면 clangd를 다시 시작합니다.

## 구현 규칙

값 타입은 TypedArray로 계산하고 저장소를 공유하며, 네이티브 리소스와 해당 뷰가 메모리 수명을 유지합니다. 그래픽 리소스는 소유 스레드에서 소멸해야 합니다. 그리기 기록은 스냅샷 의미를 유지해야 하며, 이후의 속성 변경이 이미 기록한 결과를 바꾸어서는 안 됩니다.

관련 진입점은 `src/internal/lazy-value.ts`, `src/internal/graphics-state.ts`, `native/shared-handle.h`, `native/deferred-delete.h`, `native/batch-drawable.h`입니다. 공개 필드나 메서드를 추가할 때는 기능, 매개변수, 업스트림 대응 관계를 설명하는 JSDoc을 작성하세요.

다운로더, 설치 훅, 플랫폼 빌드는 서로 연결되어 있으므로 수정 시 해당 플랫폼에서 검증해야 합니다. 다운로드 URL과 아키텍처 매핑은 `tools/lib_downloader_urls.cjs`에, 캐시는 `third_party/sfml/`에 있습니다.

## 변경 제출

PR에는 구체적인 동작, 관련 검증, 아직 검증하지 않은 플랫폼 경로를 설명하세요. 네이티브 변경 시에는 영향을 받는 네이티브 대조 테스트를 실행합니다. 문서만 변경한 경우에는 링크, 코드 예제, TypeDoc 빌드를 확인합니다. 성능 수치에는 장비, Node.js/SFML 버전, 시나리오, 측정 방법을 함께 기재해야 합니다.
