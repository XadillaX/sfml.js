# RmlUi 가이드

<p><a class="library-brand" href="https://mikke89.github.io/RmlUiDoc/"><img src="assets/rmlui.png" width="246" height="84" alt="RmlUi"></a></p>

`sfml.js-rmlui`로 SFML 창 안에 문서 기반 UI를 만듭니다. RML은 요소 트리, RCSS는 외형을 정의하고 JavaScript는 애플리케이션 상태와 이벤트 처리를 관리합니다. 현재 소스는 RmlUi 6.3과 SFML 3.1을 대상으로 합니다.

JavaScript와 [SFML 창](../sfml/window.ko.md)의 기초 지식을 전제로 합니다. RmlUi 6.3은 HTML/CSS와 비슷하지만 브라우저를 내장하지 않습니다. [네이티브 데이터 모델](data-models.ko.md)은 스칼라와 콜백, 재귀 레코드 및 배열, 사용자 정의 변수, 공유 숫자 저장소와 부분 업데이트를 다룹니다. 아래 가이드는 런타임, 문서 트리, 스타일, 렌더링, 입력, 글꼴, 스크립트 및 리소스 소유권을 설명하며 [API 참조](/reference/rmlui/)는 TypeScript 계약을 설명합니다.

## RmlUi란

[RmlUi](https://github.com/mikke89/RmlUi)는 HTML/CSS와 비슷한 문서 문법을 사용하는 C++ UI 라이브러리입니다. RML 문서를 한 번 로드해 지속적인 요소 트리를 만들고 RCSS로 꾸민 뒤, 애플리케이션 상태에 따라 개별 요소를 갱신합니다. RmlUi가 레이아웃과 지오메트리 생성을 담당하고 이 패키지가 SFML로 렌더링합니다.

게임 메뉴, HUD, 인벤토리 창, 레이아웃과 디자인을 별도 리소스 파일로 관리하는 UI에 적합합니다. RML, RCSS, Node.js 이벤트 처리 코드가 함께 동작하며 브라우저 DOM이나 웹 JavaScript 환경은 사용하지 않습니다. 매 프레임 위젯 호출로 도구를 구성하려면 [ImGui 가이드](../imgui/README.ko.md)를 참고하세요.

[공식 문서](https://mikke89.github.io/RmlUiDoc/) · [공식 저장소](https://github.com/mikke89/RmlUi)

## 학습 순서

| 장 | 내용 |
| --- | --- |
| [빠른 시작](getting-started.ko.md) | 카운터 실행, 초기화, 글꼴, 프레임 순서 |
| [RML과 RCSS 기초](rml-rcss.ko.md) | 마크업, 선택자, 레이아웃, 클릭 연결, 공식 문법 참고 |
| [문서와 이벤트](documents.ko.md) | RML 로드, 요소 편집, 리스너 등록, 네이티브 객체 해제 |
| [네이티브 Debugger](debugger.ko.md) | 별도 호스트에서 요소, 로그, 데이터 모델 검사 |
| [SVG와 Lottie](vector-elements.ko.md) | 네이티브 벡터 요소, 데코레이터, 프레임과 소스 |
| [지오메트리와 합성곱](geometry-utilities.ko.md) | 메시 일괄 생성과 공유 알파 버퍼 필터 |
| [렌더링과 Retina](rendering.ko.md) | SFML 합성, 고밀도 표시, 효과 지원 범위 |
| [공유 저장소와 배치 처리](performance.ko.md) | 수치 명령 제출, JS 계산 배치와 리소스 준비 |
| [API 가이드](api.ko.md) | 타입, 기본값, 반환값, 수명 계약 찾기 |

가이드와 소스에서 생성한 API 레퍼런스는 영어, 중국어 간체, 일본어, 한국어로 유지합니다.

## 예제 실행

monorepo 루트에서 실행합니다.

```sh
node tools/bootstrap.cjs
node packages/sfml.js-rmlui/examples/demo.cjs
node packages/sfml.js-rmlui/examples/official.cjs variables
```

[예제 목록](../../packages/sfml.js-rmlui/examples/README.ko.md)에 스크린샷, 조작법, 소스 링크가 있습니다. 카운터의 Increment는 동작하며 variables의 미션 버튼은 호버 스타일만 보여 줍니다.

## 소유권 경계

프로세스 런타임은 `RenderWindow` 하나에 연결되며 초기화한 Node.js 환경과 스레드에 속합니다. 컨텍스트, 문서, 글꼴, 렌더링 리소스를 관리합니다. 래퍼는 네이티브 유효성을 공유합니다. JS 참조는 소유권이 있는 분리 트리를 유지하고 연결된 요소의 수명은 부모가 관리합니다. 파괴 시 리스너를 자동 해제하며 무효한 래퍼에 접근하면 예외가 발생합니다. SFML 창을 닫기 전에 RmlUi를 종료하세요. 지연 파괴와 Worker 제한은 [네이티브 수명](documents.ko.md#네이티브-수명)을 참고하세요.
