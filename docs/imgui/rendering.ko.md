# 렌더링과 여러 창

SFML 장면 위에 ImGui를 그리고 패널 안에 사용자 지정 도형을 추가하며 각 창의 리소스 소유권을 이해합니다. 장면 합성은 [검사기](../../packages/sfml.js-imgui/examples/scene-inspector.cjs), 패널 내부 그리기는 [workbench](../../packages/sfml.js-imgui/examples/workbench.cjs)에서 확인합니다.

```sh
node packages/sfml.js-imgui/examples/scene-inspector.cjs
node packages/sfml.js-imgui/examples/workbench.cjs
```

한 번에 하나씩 실행하고 창을 닫아 종료합니다. 검사기는 UI 뒤에 움직이는 SFML 원을 그리고 workbench는 선택 레이블 옆에 ImGui 원의 영역을 확보합니다.

## UI 전에 장면 제출

검사기는 매 프레임 다음 순서를 따릅니다.

```js
SFML.Update(window, seconds);
drawControls(seconds);
window.clear(background);
window.draw(circle);
SFML.Render(window);
window.display();
```

seconds, background, circle, drawControls는 전체 검사기 소스의 값입니다. 위젯이 모델을 수정한 뒤 장면 그리기를 기록합니다. SFML.Render는 백엔드 호출 전에 window.flush를 실행해 기록된 SFML 그리기를 UI보다 먼저 반영합니다.

UI 렌더링 뒤에 clear하면 UI가 지워집니다. Render 후에 SFML을 그리면 위젯을 덮을 수 있습니다. 일반적인 오버레이에는 이 순서를 사용하면 OpenGL 상태를 직접 관리할 필요가 없습니다.

## 패널 내부 그리기

현재 창의 그리기 목록은 창의 클리핑에 맞는 장식에 적합합니다. 보이는 창 안에서 다음을 호출합니다.

```js
function drawPreview() {
  const origin = ImGui.GetCursorScreenPos();
  const list = ImGui.GetWindowDrawList();
  if (list) {
    ImGui.ImDrawList_AddCircleFilled(
      list,
      [ origin.x + 48, origin.y + 48 ],
      32,
      ImGui.GetColorU32(ImGui.ImGuiCol.PlotHistogram)
    );
  }
  ImGui.Dummy([ 96, 96 ]);
  ImGui.SameLine();
  ImGui.TextUnformatted('Custom preview');
}
```

Begin 성공 후 drawPreview를 호출합니다. 그리기 목록은 화면 좌표를 쓰므로 GetCursorScreenPos를 시작점으로 사용합니다. 색은 현재 스타일에서 패킹된 값으로 가져와 바이트 순서를 추측하지 않습니다. 그리기 명령만으로는 레이아웃 영역이나 입력 항목이 생기지 않아 Dummy가 필요합니다.

클릭·드래그가 필요하면 같은 영역에 InvisibleButtonEx 같은 항목을 배치하고 항목·마우스 조회로 앱 상태를 갱신합니다. 보이는 도형만으로는 입력 처리가 되지 않습니다.

## 텍스처 ID는 백엔드 리소스

ImGui.Image는 bigint 형태의 백엔드 텍스처 ID를 받으며 sf.Texture 객체나 파일명을 받지 않습니다. JavaScript 객체나 interop 포인터를 bigint로 바꾸어 ID를 만들지 마세요. 네이티브 객체 주소와 GPU 텍스처 ID는 의미가 다릅니다.

명시적으로 지원하는 텍스처 ID 브리지를 사용합니다. [상호 운용 가이드](../interop/README.ko.md)는 네이티브 객체 공유를 설명하지만 객체 핸들 자체는 ImGui 텍스처 어댑터가 아닙니다. 참조하는 모든 그리기 명령이 끝날 때까지 실제 GPU 텍스처를 유지합니다. 검증된 브리지가 없다면 검사기처럼 같은 창에 SFML로 장면 미리보기를 그릴 수 있습니다.

## 네이티브 창별 컨텍스트

각 SFML.Init은 해당 네이티브 창의 연동을 초기화합니다. Begin의 ImGui 패널은 또 다른 SFML 창이 아닙니다. 여러 네이티브 창에는 각각 Init·Update·Render·Shutdown이 필요합니다.

[여러 창 실행 테스트](../../packages/sfml.js-imgui/test/multi-window.test.cjs)가 컨텍스트 전환을 확인합니다. 앱에서는 다음 순서로 처리합니다.

1. 각 창을 초기화하고 상태와 시계를 유지합니다.
2. 폰트·스타일·IO 접근 전에 SetCurrentWindow로 해당 창을 선택합니다.
3. 이벤트를 전달하고 프레임을 시작한 뒤 위젯을 선언합니다.
4. 해당 창을 지우고 Render·display합니다.
5. 종료 시 Shutdown 후 close하고 이후 프레임 처리에서 제거합니다.

ProcessEvent·Update·Render는 해당 컨텍스트를 선택합니다. 하지만 폰트 로드나 스타일 수정은 우연히 마지막 처리된 창에 의존하지 마세요. 폰트와 빌린 뷰는 원래 컨텍스트 소유이며 다른 창의 핸들로 사용하지 않습니다.

업데이트 주기가 다르면 창마다 경과 시간을 계산합니다. 같은 시계를 각 창에서 연속 restart하면 각 창의 프레임 길이가 아니라 창 처리 사이의 시간을 측정합니다.

## 프레임 리소스 수명

그리기 목록은 현재 프레임에서 얻습니다. Shutdown 이후까지 캐시하지 말고 내용이 다음 프레임에도 남는다고 가정하지 않습니다. JavaScript 참조는 네이티브 소유권을 보장하지 않습니다.

AddCallbackEx는 위젯 구성 이후 렌더링 중 실행됩니다. Begin·위젯 추가·컨텍스트 전환·사용 중인 리소스 파괴를 하지 않습니다. 복제한 목록은 독립된 수명과 콜백 보관을 관리해야 합니다. [콜백](callbacks.ko.md)을 참고하세요.

도형이 다음 위젯을 덮으면 영역 확보를, 위치가 틀리면 좌표계를, 다른 창의 폰트·스타일이면 컨텍스트 선택을 확인합니다.

API: [Render](/reference/imgui/functions/SFML.Render.html), [GetWindowDrawList](/reference/imgui/functions/ImGui.GetWindowDrawList.html), [ImDrawList_AddCircleFilled](/reference/imgui/functions/ImGui.ImDrawList_AddCircleFilled.html), [SetCurrentWindow](/reference/imgui/functions/SFML.SetCurrentWindow.html).
