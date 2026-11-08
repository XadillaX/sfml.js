# ImGui API 가이드

목적별 가이드로 사용법을 익힌 뒤 [API 레퍼런스](/reference/imgui/)에서 인자와 반환값을 확인합니다. 목록의 요약으로 함수를 찾고 상세 페이지에서 사용 참고, 매개변수, 반환값, 네이티브 수명 제약을 읽습니다.

## 올바른 진입점 찾기

| 작업 | 진입점 | 가이드 |
| --- | --- | --- |
| 네이티브 창 연동 | SFML.Init·ProcessEvent·Update·Render·Shutdown | [시작](getting-started.ko.md) |
| 위젯 선언 | ImGui.Button·Checkbox·SliderFloatEx | [상태](widgets.ko.md) |
| 패널 구성 | BeginChild·BeginTable·메뉴·팝업 | [레이아웃](layout.ko.md) |
| UTF-8·콜백 | InputTextEx·ListBoxCallbackEx·PlotLinesCallbackEx | [입력](callbacks.ko.md) |
| 폰트·스타일 | getFontAtlas·getStyleColors·SFML.GetStyle | [폰트](fonts.ko.md) |
| 도형·창 전환 | ImGui.GetWindowDrawList·SFML.SetCurrentWindow | [렌더링](rendering.ko.md) |

## JavaScript 계약으로 읽기

[SliderFloatEx](/reference/imgui/functions/ImGui.SliderFloatEx.html)는 쓰기 가능한 Float32Array, 두 경계, 서식 문자열, 플래그를 받습니다. boolean은 편집 여부이고 현재 값은 배열에 있습니다. 네이티브 매개변수 이름이 JavaScript 숫자를 쓰기 가능한 값으로 만들지는 않습니다.

Button은 기본 크기, ButtonEx는 크기 지정입니다. PushStyleVar는 스칼라, PushStyleVarVec2는 벡터입니다. Ex가 항상 콜백을 뜻하지 않으므로 구체적인 시그니처를 확인합니다.

ImVec2Like는 `[ x, y ]`나 `{ x, y }` 같은 벡터 값을 받습니다. 수정할 숫자 포인터는 함수가 명시한 타입 배열이 필요합니다. ImGuiInputTextCallbackData 같은 구조체 핸들은 바인딩이 반환하는 타입 표식이 있는 불투명 객체입니다. 텍스처 ID와 원시 포인터 인자는 bigint이며 구조체 핸들과 바꿔 쓸 수 없습니다. 추측한 주소로 만들지 마세요.

ImGui.GetIO/GetStyle은 네이티브 핸들, SFML.GetIO/GetStyle은 현재 창의 편의 쓰기 뷰입니다. 핸들을 요구하는 도우미에 뷰를 넘길 수 없습니다.

## 호출 전 확인

1. 초기화된 컨텍스트·활성 프레임·보이는 부모가 필요한가.
2. 인자가 복사·직접 수정·대여 중 어떤 방식인가.
3. null이 창 닫기 버튼 같은 기능을 끄는가.
4. boolean은 활성화·내용 변경·선택·가시성 중 무엇인가.
5. 필요한 End/Pop과 호출 조건은 무엇인가.
6. 반환된 핸들·뷰는 언제까지 유효한가.

TypeScript 도구와 구현 확인에는 [패키지 export](../../packages/sfml.js-imgui/src/index.ts), [SFML 연동](../../packages/sfml.js-imgui/src/sfml.ts), [ImGui 모듈](../../packages/sfml.js-imgui/src/imgui/index.ts)을 참고합니다.

설명은 선언 옆에서 영어·중국어·일본어·한국어 요약과 상세로 관리하며 TypeDoc이 직접 읽습니다. 문제를 보고할 때 함수, 언어, 예상 JavaScript 호출, 실제 결과를 포함하세요.
