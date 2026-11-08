# 레이아웃과 도구 패널

위젯을 메뉴, 객체 표, 확인 대화 상자가 있는 편집기로 구성합니다. [workbench 전체 소스](../../packages/sfml.js-imgui/examples/workbench.cjs)에 프레임 루프와 지속 상태가 있습니다.

```sh
node packages/sfml.js-imgui/examples/workbench.cjs
```

Name을 편집하고 객체를 선택한 다음 표의 체크박스를 바꿉니다. Scene → Reset은 모달을 열고 Cancel은 값을 유지하며 Reset은 초기화합니다. 이 장은 그 프로그램의 구성을 설명합니다.

## 레이아웃 커서 사용

위젯은 기본적으로 아래로 배치됩니다. SameLine은 다음 항목을 옆에 놓고 Separator는 구분선을 만들며 Dummy는 사용자 지정 콘텐츠 영역을 확보합니다. 각 위젯에 고정 좌표를 주기보다 이 함수들과 표를 사용합니다.

SetNextWindowSize(size, FirstUseEver)는 초기 크기를 정하면서 사용자가 바꾼 값과 저장된 설정을 존중합니다. 레이블과 입력 값의 공간을 확보하세요. 좁은 패널에서는 도구 모음을 세로로 바꾸는 등 조정이 필요하며 SameLine을 반복해도 자동 줄바꿈은 되지 않습니다.

보이는 부모 창 안에 독립 스크롤 영역을 만들 수 있습니다.

```js
if (ImGui.BeginChild(
  'help',
  [ 0, 100 ],
  ImGui.ImGuiChildFlags.Borders
)) {
  ImGui.TextUnformatted('Select an object, then edit its enabled flag.');
  ImGui.TextUnformatted('This area scrolls separately from the parent.');
}
ImGui.EndChild();
```

너비 0은 부모의 사용 가능한 너비입니다. 내용이 잘려 BeginChild가 false여도 EndChild를 호출합니다.

## 표로 값 정렬

workbench의 rows는 안정적인 ID, 레이블, 지속 Uint8Array를 포함합니다. 부모 Begin이 성공한 분기에서 다음 전체 표 함수를 호출합니다.

```js
function drawRows() {
  const flags =
    ImGui.ImGuiTableFlags.Borders +
    ImGui.ImGuiTableFlags.RowBg +
    ImGui.ImGuiTableFlags.Resizable;
  if (ImGui.BeginTable('objects', 2, flags)) {
    ImGui.TableSetupColumn('Object');
    ImGui.TableSetupColumn('Enabled');
    ImGui.TableHeadersRow();
    for (const row of rows) {
      ImGui.PushID(row.id);
      ImGui.TableNextRow();
      ImGui.TableNextColumn();
      ImGui.TextUnformatted(row.label);
      ImGui.TableNextColumn();
      ImGui.Checkbox('##enabled', row.enabled);
      ImGui.PopID();
    }
    ImGui.EndTable();
  }
}
```

TableNextRow는 행을 진행하고 TableNextColumn은 셀을 선택합니다. 열 제목이 글자 없는 체크박스를 설명하며 PushID가 입력 상태를 구분합니다. 열 너비 변경은 행 ID와 무관합니다. 행이 많으면 list clipper API로 보이는 범위만 제출해 매 프레임 전체 행을 포맷하지 않습니다.

## 동작으로 팝업 열기

OpenPopup은 열기 요청이고 BeginPopupModal은 이후 프레임의 내용 선언입니다. 매 프레임 OpenPopup을 호출하면 정상적으로 닫기 어렵습니다. 팝업 ID도 ID 스택에 의존하므로 요청과 선언은 같은 범위에 둡니다. reset은 앱 상태를 복원하는 함수입니다.

```js
function drawMenu() {
  let requestReset = false;
  if (ImGui.BeginMenuBar()) {
    if (ImGui.BeginMenu('Scene')) {
      requestReset = ImGui.MenuItem('Reset...');
      ImGui.EndMenu();
    }
    ImGui.EndMenuBar();
  }
  if (requestReset) {
    ImGui.OpenPopup('Reset scene?');
  }
  if (ImGui.BeginPopupModal(
    'Reset scene?',
    null,
    ImGui.ImGuiWindowFlags.AlwaysAutoResize
  )) {
    ImGui.TextUnformatted('Restore the current scene settings?');
    if (ImGui.Button('Reset')) {
      reset();
      ImGui.CloseCurrentPopup();
    }
    ImGui.SameLine();
    if (ImGui.Button('Cancel')) {
      ImGui.CloseCurrentPopup();
    }
    ImGui.EndPopup();
  }
}
```

부모는 ImGui.Begin('Workbench', null, ImGui.ImGuiWindowFlags.MenuBar)를 사용하고 그 안에서 drawMenu를 호출합니다. 메뉴 범위를 끝낸 뒤 요청하므로 모달 선언과 ID 범위가 같습니다. 모달은 다른 ImGui 창의 상호 작용을 막지만 JavaScript 장면 업데이트는 멈추지 않습니다.

## 범위 짝 맞추기

| 시작 | 종료 | 종료 조건 |
| --- | --- | --- |
| Begin | End | false여도 항상 |
| BeginChild | EndChild | 항상 |
| BeginTable | EndTable | true일 때만 |
| BeginMenuBar / BeginMenu | EndMenuBar / EndMenu | 해당 시작이 true일 때만 |
| BeginPopup / BeginPopupModal | EndPopup | 해당 시작이 true일 때만 |
| PushID·PushFont·스타일 Push | 해당 Pop | Push마다 한 번, 중첩의 역순 |

팝업이 안 보이면 ID 범위와 매 프레임 선언 여부를, assertion이면 범위 짝을, 잘못된 행 수정이면 안정적인 ID를 확인합니다.

다음은 [텍스트 입력과 콜백](callbacks.ko.md)입니다. API: [BeginTable](/reference/imgui/functions/ImGui.BeginTable.html), [BeginChild](/reference/imgui/functions/ImGui.BeginChild.html), [OpenPopup](/reference/imgui/functions/ImGui.OpenPopup.html), [BeginPopupModal](/reference/imgui/functions/ImGui.BeginPopupModal.html).
