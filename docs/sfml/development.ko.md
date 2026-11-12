# 개발 가이드

[English](development.md) / [简体中文](development.zh-CN.md) / [日本語](development.ja.md) / **한국어**

> 이 문서는 소스를 수정하고 문서를 유지 보수하며 저장소 테스트를 실행하는 기여자를 위한 안내입니다. 의존성으로 사용하는 경우에는 [빠른 시작](getting-started.ko.md)부터 읽으세요.

[문서 홈](README.ko.md) · [API 안내](api.ko.md) · [예제 목록](../../packages/sfml.js/examples/README.ko.md)

<a id="get-the-source"></a>
## 소스 가져오기

Node.js, Python, C++20 도구 체인을 준비하세요. 플랫폼별 설치 명령은 [설치 환경](getting-started.ko.md#requirements)을 참고한 뒤 다음을 실행합니다.

```sh
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
node tools/bootstrap.cjs
```

`node tools/bootstrap.cjs`는 Rush로 의존성을 설치하고 interop, 두 바인딩, 사이트를 의존 순서대로 빌드합니다. SFML과 ImGui 라이브러리는 해당 패키지가 내려받습니다. 이 저장소에서는 Node.js 20 또는 22를 권장하며 사이트에는 Node.js 20 이상이 필요합니다.

## 빌드

아래 명령은 모두 저장소 루트 디렉터리에서 실행합니다.

| 명령 | 용도 |
| --- | --- |
| `npm --prefix packages/sfml.js run build` | 네이티브 모듈과 TypeScript 컴파일 |
| `npm --prefix packages/sfml.js run build:native` | 네이티브 모듈 컴파일 및 clangd 설정 업데이트 |
| `npm --prefix packages/sfml.js run build:ts` | 상수 생성 및 TypeScript 컴파일 |
| `npm --prefix site run build` | 4개 언어 사이트와 API 레퍼런스 빌드 |
| `npm --prefix site run build:reference` | TypeDoc API 문서만 생성 |
| `npm --prefix site run dev` | 사이트 개발 미리 보기 시작 |
| `npm --prefix site run preview` | 프로덕션 빌드를 로컬에서 미리 보기 |
| `npm --prefix packages/sfml.js run lint` | 소스, 도구, 테스트, 예제 검사 |
| `npm --prefix packages/sfml.js run test:types` | TypeScript 인터페이스 검증 |
| `npm --prefix packages/sfml.js run test:runtime` | 런타임 테스트를 직렬 실행. 사전 빌드 필요 |
| `npm --prefix packages/sfml.js test` | lint, 빌드, 타입 검사, 런타임 테스트를 순서대로 실행 |
| `npm --prefix packages/sfml.js pack --dry-run` | npm 패키지 파일 목록 확인 |

TypeScript만 수정했다면 `npm --prefix packages/sfml.js run build:ts`를 실행할 수 있습니다. 네이티브 코드를 수정했다면 `npm --prefix packages/sfml.js run build`를 실행하세요. 런타임 테스트는 자동으로 다시 빌드하지 않으므로, 실행 전에 빌드 결과가 소스와 일치하는지 확인해야 합니다.

<a id="testing"></a>
## 테스트와 검증

```sh
npm --prefix packages/sfml.js test
```

`npm --prefix packages/sfml.js test`는 lint, 네이티브 및 TypeScript 빌드, 타입 검사, 런타임 테스트를 실행합니다.

런타임 테스트는 파일별로 직렬 실행되며 공개 인터페이스, 네이티브 SFML 대조, 실제 렌더링 픽셀, 비동기 I/O, 스냅샷, 수명 주기를 검증합니다. 타입 테스트는 `test/*.types.ts`, 런타임 테스트는 `test/*.test.cjs`, 네이티브 대조 테스트는 `test/native/`에 있습니다.

그래픽 테스트에는 디스플레이 서버와 OpenGL 컨텍스트가 필요합니다. 디스플레이가 없는 Linux 환경에서는 [Linux CI](../../.github/workflows/node.js.yml)에 따라 Xvfb를 설치한 뒤 실행하세요.

```sh
LIBGL_ALWAYS_SOFTWARE=1 \
  xvfb-run -a -s "-screen 0 1280x1024x24 -noreset" npm --prefix packages/sfml.js run test:runtime
```

CI 구성은 Linux, macOS, Windows의 Node.js 20/22를 포함하며, [Windows CI](../../.github/workflows/node.js-windows.yml)는 Mesa 소프트웨어 OpenGL을 사용합니다.

CI는 스피커, 마이크, 조이스틱, 센서, 전체 화면 전환 등의 장치 검증을 대신할 수 없습니다. SFML의 macOS 백엔드는 Vulkan을 지원하지 않으며, SuspendAwareClock.now는 Android만 지원합니다. 결과를 보고할 때는 실제 실행 플랫폼과 건너뛴 항목을 명시하세요.

## 문서 유지 보수

각 패키지 README는 해당 패키지를 소개합니다. 루트의 `docs/sfml/`, `docs/imgui/`, `docs/interop/`에 가이드를 두고 실행 가능한 예제와 API 소스 주석은 소유 패키지에 유지합니다. 루트 `site/`는 비공개 Rush 프로젝트 `sfml-js-site`이며 VitePress, TypeDoc, 번역, 사이트 테스트를 관리합니다.

- 예제는 공개 패키지 `sfml.js`를 가져옵니다. 저장소 데모 스크립트에서만 저장소 상대 경로를 사용합니다.
- 완전한 예제와 주변 코드가 필요한 조각을 구분하고, async 함수, 리소스 파일, 장치 요구 사항을 설명합니다.
- 로딩 불리언 값과 네트워크 상태를 확인하고, 예제가 끝나면 소유한 리소스를 닫습니다.
- 공개 동작을 변경하면 JSDoc, 해당 가이드, 영향을 받는 예제도 함께 유지 보수합니다.

사이트 의존성을 설치하고 빌드합니다.

```sh
node common/scripts/install-run-rush.js build --to sfml-js-site
```

bootstrap 이후 `npm --prefix site run dev`로 Markdown을 준비하고 사이트를 실행합니다. 가이드 변경 후에는 명령을 다시 시작하고 테마 변경에는 핫 리로드를 사용합니다. `npm --prefix site run build`는 `site/build/site/`에 전체 사이트를 생성합니다. 코어의 `/guide`, `/examples`, `/reference` 주소를 유지하며 ImGui는 `/imgui/`와 `/reference/imgui/`, 확장 안내는 `/interop/`에 배치합니다. 중국어, 일본어, 한국어 경로도 제공합니다.

`npm --prefix site test`는 경로, 번역, 테마를 검사합니다. 사이트 빌드는 모든 링크, 앵커, 언어별 페이지와 자원도 검사합니다. `npm --prefix site run build:reference`는 두 API를 `site/build/site/reference/`와 해당 언어 디렉터리에 생성합니다. TypeDoc은 소스 주석을 읽고 번역의 완전성을 검사합니다. ImGui API 번역은 선언 옆에서 직접 관리합니다.

[Publish Docs 워크플로](../../.github/workflows/publish-docs.yml)는 `main`이 업데이트될 때 실행되며, 수동 실행도 지원합니다. 생성 결과는 `gh-pages` 브랜치의 `docs/`에 커밋하고, 해당 브랜치의 루트 파일은 보존하며, 기존 `CNAME`(`sfml.js.org`)을 유지합니다. 생성 내용에 변화가 없으면 커밋을 건너뜁니다.

이전 TypeDoc 클래스와 인터페이스 URL은 프래그먼트를 유지하며 해당 영어 레퍼런스 페이지로 이동합니다. API 언어를 전환해도 현재 페이지와 멤버 앵커가 유지됩니다. 단독 빌드의 `site/build/site/reference/`에도 번역을 위한 `zh/`, `ja/`, `ko/` 하위 디렉터리가 생성됩니다.

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

자동 생성되는 상수 설명은 `tools/constant-docs.json`과 `tools/constant-docs.cjs`의 템플릿에서 관리합니다. 수정 후 `npm --prefix packages/sfml.js run generate:window`와 `npm --prefix packages/sfml.js run generate:network`를 실행하고 생성된 주석은 직접 편집하지 마세요.

## 예제 실행

아래 명령은 저장소 루트 디렉터리에서 실행합니다.

```sh
npm --prefix packages/sfml.js run demo:types -- --frames=120
npm --prefix packages/sfml.js run demo:window -- --frames=120
npm --prefix packages/sfml.js run demo:audio
npm --prefix packages/sfml.js run demo:network
```

예제는 [개요](../../packages/sfml.js/examples/README.ko.md), [기능 예제](../../packages/sfml.js/examples/features/README.ko.md), [공식 예제](../../packages/sfml.js/examples/official/README.ko.md), [게임과 앱](../../packages/sfml.js/examples/projects/README.ko.md)으로 나뉩니다. 명령과 [캡처 지원](../../packages/sfml.js/examples/features/README.ko.md#screenshots)은 각 진입점에 설명되어 있습니다. 빌드 후 스크립트를 직접 실행하고 지원하는 진입점에만 `--frames`를 전달하세요.

## 소스와 생성 파일

| 디렉터리 | 내용 |
| --- | --- |
| `packages/sfml.js/` | 코어 소스, 네이티브 바인딩, 테스트와 예제 |
| `packages/sfml.js-imgui/` | ImGui 바인딩 소스, 다국어 API 주석과 데모 |
| `packages/sfml.js-interop/` | 공유 헤더와 SFML SDK 다운로더 |
| `docs/` | 패키지별 공유 가이드 |
| `site/` | VitePress, TypeDoc, 테마와 사이트 테스트 |
| `common/` | Rush 설정과 공유 잠금 파일 |

`build/`, `dist/`, `node_modules/`, 다운로드한 SFML은 모두 생성된 내용입니다. 창 및 네트워크 상수는 현재 SFML 헤더에서 생성하므로 `src/*/gen/constants.ts`를 직접 편집하지 마세요.

네이티브 빌드는 패키지별 컴파일 데이터베이스를 만들고 루트 `compile_commands.json`으로 합칩니다. 루트 `.clangd`가 이를 사용합니다. `node tools/configure-lsp.cjs`는 기존 데이터베이스만 병합하며 네이티브 코드를 재빌드하지 않습니다.

## 구현 규칙

값 타입은 TypedArray로 계산하고 저장소를 공유하며, 네이티브 리소스와 해당 뷰가 메모리 수명을 유지합니다. 그래픽 리소스는 소유 스레드에서 소멸해야 합니다. 그리기 기록은 스냅샷 의미를 유지해야 하며, 이후의 속성 변경이 이미 기록한 결과를 바꾸어서는 안 됩니다.

관련 진입점은 `src/internal/lazy-value.ts`, `src/internal/graphics-state.ts`, `packages/sfml.js-interop/include/shared-handle.h`, `native/deferred-delete.h`, `native/batch-drawable.h`입니다. 공개 필드나 메서드를 추가할 때는 기능, 매개변수, 업스트림 대응 관계를 설명하는 JSDoc을 작성하세요.

다운로더, 설치 훅, 플랫폼 빌드는 서로 연결되어 있으므로 수정 시 해당 플랫폼에서 검증해야 합니다. 다운로드 URL과 아키텍처 매핑은 `packages/sfml.js-interop/tools/lib_downloader_urls.cjs`에, 캐시는 `packages/sfml.js-interop/third_party/sfml/`에 있습니다.

## 변경 제출

PR에는 구체적인 동작, 관련 검증, 아직 검증하지 않은 플랫폼 경로를 설명하세요. 네이티브 변경 시에는 영향을 받는 네이티브 대조 테스트를 실행합니다. 문서만 변경한 경우에는 링크, 코드 예제, TypeDoc 빌드를 확인합니다. 성능 수치에는 장비, Node.js/SFML 버전, 시나리오, 측정 방법을 함께 기재해야 합니다.

### rush change로 변경 기록하기

패키지 버전은 Rush 버전 정책이 관리하는 자리 표시자이며 `package.json`의 `version`을 직접 수정하지 마세요. 공개되는 세 패키지(`sfml.js-interop`, `sfml.js`, `sfml.js-imgui`)는 단일 록스텝 정책 `sfml-js`를 사용하며 항상 함께 릴리스되고 동일한 버전 번호를 공유합니다.

공개 패키지를 변경한 뒤 저장소 루트에서 실행하고 생성된 파일을 `common/changes/`에 커밋하세요.

```sh
node common/scripts/install-run-rush.js change
```

영향받는 패키지마다 `patch`, `minor`, `major`를 선택합니다. 변경 파일은 CHANGELOG 내용이 되며 실제 버전은 록스텝 정책의 `nextBump`가 결정하고, 모든 릴리스에서 세 패키지가 함께 범프되고 게시됩니다.

### CI로 릴리스하기

릴리스는 **Publish packages** 워크플로가 실행하며 main의 CI가 모두 성공한 뒤에만 태그를 만드세요.

1. `common/changes/*.json` 변경 파일을 포함한 PR을 병합합니다.
2. main 커밋에 `v*` 태그를 푸시합니다(태그 이름은 워크플로 트리거 전용이며 버전은 록스텝 정책이 결정합니다).

   ```sh
   git tag v2026.11.09
   git push origin v2026.11.09
   ```

3. 워크플로는 세 패키지를 모두 빌드하고 테스트를 다시 실행한 뒤 `rush publish --apply --publish --target-branch main`을 실행합니다. 변경 파일 적용, 버전과 CHANGELOG 갱신, main으로의 범프 병합, 패키지별 태그 생성, npm 게시가 진행됩니다.

전제 조건: npm 자동화 게시 토큰을 저장소 시크릿 `NPM_AUTH_TOKEN`에 저장하고(`common/config/rush/.npmrc-publish`가 참조), main이 워크플로의 `GITHUB_TOKEN` 푸시를 허용해야 합니다. 록스텝 정책은 게시 시점에 세 패키지 간의 모든 내부 의존을 정확한 게시 버전으로 고정합니다. 작업 트리의 매니페스트는 케어트 범위를 유지합니다(`versionFormatForCommit: original`).
