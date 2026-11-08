# 위젯과 상태

편집한 값을 프레임 간 유지하며 장면에 즉시 반영합니다. 완전한 [장면 검사기](../../packages/sfml.js-imgui/examples/scene-inspector.cjs)를 실행하세요.

```sh
node packages/sfml.js-imgui/examples/scene-inspector.cjs
```

Animate는 원을 멈추고 Speed는 궤도 속도를 바꿉니다. Radius와 Color는 SFML 도형과 채우기를 수정하고 Reset은 초기값을 복원합니다. [빠른 시작](getting-started.ko.md)의 이벤트 루프, 입력 캡처, 종료 처리가 포함되어 있습니다.

## 상태는 프레임 밖에 둡니다

Dear ImGui는 즉시 모드를 사용합니다. 앱이 매 프레임 위젯을 선언하고 ImGui는 포커스 같은 상호 작용 상태를 보관합니다. 편집 대상 값은 앱이 소유합니다. 함수를 다시 호출할 때마다 값을 새로 할당할 필요는 없습니다.

| 위젯·값 | 앱 저장소 | 결과 읽기 |
| --- | --- | --- |
| 체크박스·창 열림 플래그 | `new Uint8Array([ 1 ])` | `state[0] !== 0` |
| 정수·선택 인덱스 | `new Int32Array([ 0 ])` | `state[0]` |
| 슬라이더·실수 입력 | `new Float32Array([ 0.5 ])` | `state[0]` |
| RGB / RGBA | 3 / 4개 원소의 Float32Array | 0–1 채널 값 |
| 편집 텍스트 | 0으로 끝나는 Uint8Array | [버퍼](callbacks.ko.md)의 UTF-8 설명 참고 |

JavaScript 숫자는 값으로 전달되므로 네이티브 포인터가 결과를 써 넣을 수 없습니다. 일반 배열은 `[ 320, 160 ]` 같은 벡터 값에 적합하지만 쓰기 가능한 Float32Array를 대체하지 않습니다.

## 편집 패널 만들기

빠른 시작의 import, 창, 루프를 유지하고 drawControls를 아래로 바꿉니다. 상태 선언은 루프 앞에 둡니다.

```js
const enabled = new Uint8Array([ 1 ]);
const speed = new Float32Array([ 1 ]);
const tint = new Float32Array([ 0.25, 0.75, 0.95 ]);
const panelOpen = new Uint8Array([ 1 ]);

function drawControls() {
  if (!panelOpen[0]) {
    return;
  }
  if (ImGui.Begin('Controls', panelOpen)) {
    ImGui.Checkbox('Animate', enabled);
    const changed = ImGui.SliderFloatEx(
      'Speed',
      speed,
      0,
      3,
      '%.2f',
      ImGui.ImGuiSliderFlags.AlwaysClamp
    );
    ImGui.ColorEdit3('Tint', tint);
    if (changed) {
      console.log(`New speed: ${speed[0]}`);
    }
    if (ImGui.Button('Reset')) {
      enabled[0] = 1;
      speed[0] = 1;
      tint.set([ 0.25, 0.75, 0.95 ]);
    }
    ImGui.TextUnformatted(`Speed: ${speed[0].toFixed(2)}`);
  }
  ImGui.End();
}
```

닫기 버튼은 panelOpen에 0을 씁니다. 메뉴나 앱 동작이 1로 바꾸면 다시 열립니다. 접기는 내용만 생략하며 창을 닫지 않습니다. 항상 표시할 패널에 0인 열림 플래그를 계속 넘기지 마세요.

Button은 활성화, Checkbox·SliderFloatEx·ColorEdit3는 편집 여부를 반환합니다. 현재 값이 아니므로 상태는 배열에서 읽습니다. 장면이 매 프레임 값을 필요로 하면 반환값이 false여도 읽습니다. AlwaysClamp는 슬라이더의 직접 텍스트 입력도 제한합니다. 드래그 범위만으로 모든 입력 모드가 검증되지는 않습니다.

SFML 객체도 유지합니다. 검사기는 setRadius 다음에 원점을 갱신해 원을 가운데에 두고, 색 채널을 `Math.round(channel * 255)`로 변환합니다. enabled가 0이 아닐 때만 `seconds * speed[0]`로 움직임을 진행합니다.

## 반복 위젯에 안정적인 ID 부여

레이블은 ID의 일부입니다. 같은 범위의 Reset 버튼 두 개는 위치가 달라도 충돌합니다.

| 표기 | 보이는 글자 | ID |
| --- | --- | --- |
| `Reset##player` | Reset | player 접미사 포함 |
| `Reset##camera` | Reset | player와 구분 |
| `FPS: 60###stats` | FPS: 60 | 표시 값이 바뀌어도 stats 유지 |
| PushID(row.id) + Checkbox('##enabled', ...) | 글자 없음 | 안정적인 행 ID로 구분 |

정렬·추가·삭제되는 행에는 배열 인덱스 대신 객체 ID를 사용합니다. 그렇지 않으면 활성 위젯 상태가 재정렬 후 다른 행으로 옮겨갈 수 있습니다. rows는 루프 밖에서 만들고 함수는 보이는 창 안에서 호출합니다.

```js
const rows = [
  { id: 'player', label: 'Player', enabled: new Uint8Array([ 1 ]) },
  { id: 'camera', label: 'Camera', enabled: new Uint8Array([ 0 ]) },
];

function drawRows() {
  for (const row of rows) {
    ImGui.PushID(row.id);
    ImGui.Checkbox('Enabled', row.enabled);
    ImGui.SameLine();
    ImGui.TextUnformatted(row.label);
    ImGui.PopID();
  }
}
```

Begin이 성공한 분기에서 drawRows를 호출합니다. Push/Pop은 같은 범위에서 짝짓고, 예외 발생 후 복구할 코드라면 try/finally로 균형을 지킵니다.

## 텍스트·정밀도·소유권

파일명, 사용자 입력, 템플릿 문자열은 TextUnformatted로 표시합니다. `%`를 서식 명령으로 해석하지 않습니다. 서식이 필요할 때 해당 래퍼를 사용하세요.

Float32Array는 단정밀도입니다. toFixed는 표시만 바꿉니다. 더 높은 정밀도가 필요하면 별도 앱 모델을 유지하고 위젯 편집을 반영하는 시점을 정합니다.

앱에서 만든 배열은 JavaScript가 소유합니다. Storage_GetIntRef, 스타일, 콜백 뷰는 네이티브 메모리를 빌리므로 수명이 다릅니다. JavaScript 참조가 남아도 파괴된 컨텍스트나 무효화된 주소는 쓸 수 없습니다. [콜백과 버퍼](callbacks.ko.md)를 확인하세요.

매 프레임 값이 초기화되면 함수 안에서 상태를 만드는지, 편집 프레임에만 참이면 반환값을 상태로 쓰는지, 다른 행이 반응하면 ID를 확인합니다.

다음은 [레이아웃](layout.ko.md)입니다. API: [Checkbox](/reference/imgui/functions/ImGui.Checkbox.html), [SliderFloatEx](/reference/imgui/functions/ImGui.SliderFloatEx.html), [PushID](/reference/imgui/functions/ImGui.PushID.html), [TextUnformatted](/reference/imgui/functions/ImGui.TextUnformatted.html).
