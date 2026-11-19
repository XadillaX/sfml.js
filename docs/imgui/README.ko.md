# ImGui 가이드

<p><a class="library-brand" href="https://www.dearimgui.com/"><img src="assets/dear-imgui.jpg" width="240" height="84" alt="Dear ImGui — 로고 제작: Albane Kim"></a></p>

sfml.js-imgui로 SFML 창에 디버그 패널, 장면 검사기, 네이티브 편집 도구를 만듭니다. 첫 프레임 루프에서 시작해 상태 편집, 테이블, 텍스트 입력, 폰트, 사용자 지정 렌더링을 추가합니다.

현재 소스는 Dear ImGui 1.91.9b와 imgui-sfml 3.0을 대상으로 하며 예제는 JavaScript와 SFML 3.1 API를 사용합니다. JavaScript와 [SFML 창](../sfml/window.ko.md)의 기초가 필요하고 C++ 지식은 필요하지 않습니다.

## Dear ImGui란

[Dear ImGui](https://www.dearimgui.com/)는 대화형 도구를 위한 C++ GUI 라이브러리입니다. 즉시 모드(Immediate Mode) API에서는 매 프레임 함수 호출로 표시할 위젯을 정의합니다. 버튼 함수의 반환값으로 클릭을 확인하고 애플리케이션 상태를 갱신합니다. ImGui는 내부 상호작용 상태를 유지하고 그리기 명령을 생성하며 SFML 통합 계층이 이를 창에 표시합니다.

디버그 패널, 프로파일러, 레벨 편집기, 실시간 데이터 검사기에 적합합니다. 이 바인딩에서는 JavaScript로 위젯을 조합합니다. 지속적인 요소 트리를 스타일시트로 꾸미는 UI가 필요하면 [RmlUi 가이드](../rmlui/README.ko.md)를 참고하세요.

[공식 저장소](https://github.com/ocornut/imgui) · [공식 Wiki](https://github.com/ocornut/imgui/wiki) · [FAQ](https://www.dearimgui.com/faq/)

## 학습 순서

| 장 | 배우거나 만드는 것 |
| --- | --- |
| [빠른 시작](getting-started.ko.md) | 완전한 카운터, 프레임 수명, 입력 캡처, 안전한 종료 |
| [위젯과 상태](widgets.ko.md) | 지속 상태, 고유 ID, 실시간 장면 검사기 |
| [레이아웃](layout.ko.md) | 테이블, 메뉴, 확인 모달, 범위 짝 |
| [텍스트와 콜백](callbacks.ko.md) | UTF-8 편집, 계약, 목록 getter, 그래프 |
| [폰트와 스타일](fonts.ko.md) | 아틀라스, CJK, 간격, 색, DPI |
| [렌더링과 여러 창](rendering.ko.md) | 장면 합성, 그리기 목록, 창별 소유권 |
| [API 가이드](api.ko.md) | 정확한 시그니처, 오버로드, 수명 확인 |

실습 장마다 완전한 실행 소스를 연결하고 짧은 코드의 삽입 위치와 기대 결과를 설명합니다. 영어·중국어·일본어·한국어를 제공합니다.

## 실행 예제 선택

monorepo 루트에서 bootstrap을 한 번 실행한 뒤 예제를 시작합니다.

```sh
node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
```

- [위젯 데모](../../packages/sfml.js-imgui/examples/README.ko.md#demo): Dear ImGui 기본 위젯과 레이아웃 탐색.
- [장면 검사기](../../packages/sfml.js-imgui/examples/README.ko.md#scene-inspector): 움직이는 원의 크기·색·속도 편집.
- [workbench](../../packages/sfml.js-imgui/examples/README.ko.md#workbench): 텍스트·선택·테이블·모달·시간 그래프 조합.

## 패키지 역할

ImGui는 위젯·열거 값·콜백 래퍼·네이티브 핸들 연산을 제공합니다. SFML은 창 연동·이벤트 전달·프레임 제출을 맡습니다. getFontAtlas와 getStyleColors는 최상위 export입니다.

앱 값은 JavaScript가 소유하고 쓰기 가능한 네이티브 스칼라는 타입 배열로 전달합니다. IO·스타일 뷰·폰트·그리기 목록에는 네이티브 소유자와 유효 기간이 있습니다. 각 장에서 경계를 설명하며 정확한 계약은 [API 레퍼런스](/reference/imgui/)에서 확인합니다.
