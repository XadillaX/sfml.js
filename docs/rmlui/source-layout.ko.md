# RmlUi 소스 구조

[English](source-layout.md) · [简体中文](source-layout.zh-CN.md) · [日本語](source-layout.ja.md) · **한국어**

`packages/sfml.js-rmlui`는 네이티브 바인딩, TypeScript 인터페이스와 테스트를 책임별로 배치합니다. 새 구현은 담당 모듈에 두고 관련 헤더와 구현 파일을 함께 둡니다.

| 디렉터리 | 책임 |
| --- | --- |
| `runtime/` | 초기화, Context, 런타임 상태, 기능 조회, 콜백 수명, Plugin, Debugger |
| `dom/documents/` | 문서, Factory, 속성 모음, XML 파싱 |
| `dom/elements/` | Element, 레이아웃, 스크롤, 요소 인스턴스화, SVG, Lottie |
| `dom/controls/` | 폼, 텍스트 컨트롤, 선택 항목, 패널 |
| `data/` | 데이터 모델, 타입 등록, 주소, 멤버, 일괄 처리, 진단 |
| `events/` | 이벤트, 리스너, 디스패치, 인스턴스화 |
| `style/properties/` | Property, 파서, 명세, 스타일시트 |
| `style/effects/` | 데코레이터, 필터, 효과 값과 콜백 |
| `style/values/` | 계산된 스타일, 스타일 구조체, 변환, 매핑된 뷰 |
| `animation/` | 애니메이션, 전환, Tween, 값 콜백 |
| `rendering/` | 렌더링 관리, 지오메트리, 텍스처, 레이어, 리소스, SFML 렌더러 |
| `fonts/` | 폰트 로드, FreeType/HarfBuzz/비트맵 엔진, 측정, 글리프, 폰트 효과 |
| `scripting/` | 스크립트 인터페이스, 호스트, 스크립트 객체 |
| `scripting/lua/` | Lua 호스트, 모델, 값, 함수, 인스턴스화 |
| `platform/` | SFML 시스템 연동, 입력, 텍스트 입력, 창 밀도 |
| `io/` | 파일 인터페이스, 스트림 |
| `values/` | Variant, 수치 값, 문자열, URL, 공용 타입 |

이 디렉터리들은 `native/`와 `src/` 아래에 있습니다. 한 계층에서만 필요한 구현은 해당 계층에 둡니다. `src/internal/`은 네이티브 로더, 래퍼 할당, 공유 메모리 변환 등 모듈 간 내부 프로토콜을 보관합니다.

`src/index.ts`는 npm 공개 진입점이고 `native/addon.cc`는 네이티브 모듈 등록 진입점입니다. 패키지 빌드 설정은 루트의 `binding.gyp`, `package.json`, `tsconfig.json`에 둡니다.

생성 파일은 `src/generated/`와 `native/generated/`에 있습니다. 생성 로직을 바꾸려면 `tools/codegen/`의 생성기를 수정한 뒤 다시 생성합니다.

| 도구 디렉터리 | 책임 |
| --- | --- |
| `tools/build/` | 패키지 네이티브 빌드, Lua C++ 컴파일, 컴파일 데이터베이스 수정. 저장소 LSP 데이터베이스 병합은 소속 Rush 작업 공간에서만 수행 |
| `tools/codegen/` | 업스트림 헤더에서 입력, 이벤트, 속성 ID, 스타일 바인딩 생성 |
| `tools/dependencies/` | 의존성 버전, 검증, 다운로드, 빌드 소스 목록 |
| `tools/dependencies/patches/` | RmlUi, Lua, Debugger, 수치, 문자열, rlottie 패치 |
| `tools/performance/` | 성능 측정, 네이티브 호출 횟수 |
| `tools/testing/` | 런타임 테스트 재귀 수집·실행, 클립보드 보존, npm 소스 패키지 파일 목록과 빌드 의존성 검증 |

`test/`는 런타임 및 타입 테스트를 모듈별로 배치합니다. `test/native/`는 C++ 대조 프로그램과 빌드 스크립트를 모듈별로 배치합니다. 스크립트는 현재 패키지의 기존 오브젝트 파일을 재사용하며, 호출자가 기존 임시 출력 디렉터리를 지정합니다.

`packages/sfmljs-rmlui-vscode/tools/testing/`는 기존 VS Code에서 확장 통합 검증을 실행합니다. 같은 패키지의 `tools/packaging/`는 VSIX에 포함된 클라이언트, 언어 서버, 언어 리소스와 네 언어 README를 검증합니다. 저장소 공용 Windows 도구 체인 초기화는 `tools/ci/`에 있으며 기존 Node.js CI와 전용 RmlUi CI가 공유합니다.

`third_party/`는 업스트림 디렉터리 구조를 유지합니다. `build/`와 `dist/`는 기존 빌드 디렉터리를 재사용합니다. 소스 이동 후에는 새 경로의 산출물이 있는 이전 산출물만 제거합니다.

디렉터리 이동은 RmlUi 6.3 전체 인수 완료를 뜻하지 않습니다. `audit/6.3/`의 기존 증거는 수집 당시 경로와 해시를 유지합니다. 이전 경로는 [소스 이동 대응표](audit/6.3/source-layout-map.json)에서 확인하세요.
