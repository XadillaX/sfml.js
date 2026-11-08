# 텍스트 입력, 콜백과 버퍼

입력 필드는 바이트를 수정하고 목록은 JavaScript에서 레이블을, 그래프는 값을 가져옵니다. 완전한 [workbench](../../packages/sfml.js-imgui/examples/workbench.cjs)를 실행하세요.

```sh
node packages/sfml.js-imgui/examples/workbench.cjs
```

Name은 아래 문자열을 바꾸고 Selection은 객체를 선택하며 Frame ms는 프레임 시간 링 버퍼를 읽습니다. Name에 포커스를 주면 콜백 바이트 수가 갱신됩니다. CallbackAlways는 활성 편집 중의 콜백이며 비활성 필드에서도 무조건 실행되는 앱 콜백은 아닙니다.

## UTF-8 저장과 읽기

버퍼는 루프 밖에서 한 번 만듭니다. 용량은 끝의 0을 포함한 **바이트 수**입니다. 문자 수와 다르며 비 ASCII 문자는 여러 바이트를 쓸 수 있습니다. 다음 함수는 다중 바이트 문자 중간을 자르지 않고 넘치는 입력을 거부합니다.

```js
const name = new Uint8Array(128);

function writeText(target, value) {
  const bytes = Buffer.from(value, 'utf8');
  if (value.includes('\0') || bytes.length >= target.length) {
    throw new RangeError('Text needs room for one trailing zero byte');
  }
  target.fill(0);
  target.set(bytes);
}

function readText(source) {
  const end = source.indexOf(0);
  return Buffer.from(source.subarray(0, end < 0 ? source.length : end))
    .toString('utf8');
}

writeText(name, 'Scene');
```

초기화한 뒤 보이는 창 안에서 매 프레임 호출합니다.

```js
if (ImGui.InputText('Name', name, name.length)) {
  console.log(readText(name));
}
```

기본 반환값은 내용 변경 여부입니다. EnterReturnsTrue를 설정하면 Enter 확인 여부가 되므로 연속 저장과 확인 저장 중 필요한 방식에 맞춥니다. 반환값과 관계없이 편집 상태는 버퍼에 들어 있습니다.

이전 앱 문자열로 버퍼를 매 프레임 덮어쓰지 마세요. 초기화 후에는 ImGui가 편집하도록 하고 다른 객체 로드나 리셋 때 명시적으로 동기화합니다. 적절한 고정 용량을 고릅니다. CallbackResize는 타입 배열을 자동으로 확장하지 않으며 콜백에서 배열을 교체하는 것은 지원되는 소유권 방식이 아닙니다.

## 콜백 데이터를 동기적으로 읽기

일반 InputText에는 콜백이 필요 없습니다. JavaScript 처리가 필요할 때 InputTextEx를 사용합니다.

```js
let callbackBytes = 0;

function inspectInput(data) {
  const fields = ImGui.viewImGuiInputTextCallbackData(data);
  callbackBytes = fields.BufTextLen;
  return 0;
}

function drawTextEditor() {
  ImGui.InputTextEx(
    'Name',
    name,
    name.length,
    ImGui.ImGuiInputTextFlags.CallbackAlways,
    inspectInput
  );
  ImGui.TextUnformatted(`Current name: ${readText(name)}`);
  ImGui.TextUnformatted(`Last active callback: ${callbackBytes} bytes`);
}
```

BufTextLen은 사용 중인 UTF-8 바이트 수, BufSize는 용량입니다. 핸들과 뷰는 그 호출 중에만 빌립니다. 필요한 숫자나 문자열을 복사하고 뷰를 보관하거나 await·타이머에서 사용하지 않습니다. 계약이 요구하는 숫자를 반환하며 보통 0은 기본 처리를 유지합니다.

## 목록과 그래프 데이터 제공

선택 배열과 데이터는 프레임 밖에서 유지하고 호출 중에는 행 순서를 고정합니다. getter가 여러 번 실행될 수 있으므로 빠르고 부작용이 없어야 합니다.

```js
const labels = [ 'Player', 'Light', 'Camera' ];
const selected = new Int32Array([ 0 ]);
const timings = new Float32Array([ 16, 17, 15, 19, 16 ]);

function drawData() {
  ImGui.ListBoxCallbackEx(
    'Selection',
    selected,
    labels.length,
    index => labels[index]
  );
  ImGui.TextUnformatted(`Selected: ${labels[selected[0]]}`);
  ImGui.PlotLinesCallbackEx(
    'Frame ms',
    timings.length,
    index => timings[index],
    null,
    0,
    null,
    0,
    40,
    [ 0, 70 ]
  );
}
```

drawData를 보이는 창 안에서 호출합니다. 인덱스는 0부터 시작합니다. 데이터가 줄면 선택 범위를 보정하고 빈 목록에는 원소 접근 대신 빈 상태를 표시합니다. 링 버퍼는 workbench처럼 가장 오래된 샘플 위치를 valuesOffset으로 넘깁니다.

외부 데이터는 렌더링 밖에서 로드하고 도착하면 모델을 갱신합니다. async getter는 Promise를 반환하지만 네이티브 호출은 즉시 문자열이나 숫자를 필요로 하므로 기다릴 수 없습니다.

## 메모리 소유권 구분

| 값 | 소유자 | 유효 기간 |
| --- | --- | --- |
| 앱 타입 배열 | JavaScript | 모든 읽기·쓰기 호출 중 유지 |
| 입력 콜백 핸들·뷰 | 현재 네이티브 콜백 | 해당 호출 안에서만 |
| IO·스타일·폰트 | 컨텍스트·아틀라스 | 소유자 파괴나 호환되지 않는 재구축 전까지 |
| Storage 참조 뷰 | 네이티브 저장소 | 구조 변경으로 주소가 무효화될 수 있음 |
| DrawList·DrawCmd 콜백 핸들 | 렌더러 | 문서화된 프레임·콜백 범위 |

AddCallbackEx는 렌더러가 목록을 처리할 때, 보통 SFML.Render 안에서 실행됩니다. 그 안에서 위젯을 선언하지 않습니다. 캡처한 리소스와 userData 대상은 가능한 모든 호출이 끝날 때까지 유지합니다. 복제한 목록은 독립적으로 재생할 수 있으므로 현재 프레임 종료가 수명의 끝은 아닙니다.

네이티브 핸들이나 불투명 포인터는 JavaScript 함수가 아닙니다. 함수를 bigint로 바꾸거나 원시 포인터 API에 넘기지 말고 JavaScript 콜백을 명시적으로 받는 Ex 래퍼를 사용합니다.

텍스트 잘림은 바이트 용량과 끝의 0을, 올바르게 디코딩되지만 네모로 보이면 [폰트](fonts.ko.md)를, 콜백 실패는 반환 타입·플래그·빌린 데이터의 수명을 확인하세요.

API: [InputTextEx](/reference/imgui/functions/ImGui.InputTextEx.html), [ListBoxCallbackEx](/reference/imgui/functions/ImGui.ListBoxCallbackEx.html), [PlotLinesCallbackEx](/reference/imgui/functions/ImGui.PlotLinesCallbackEx.html), [AddCallbackEx](/reference/imgui/functions/ImGui.AddCallbackEx.html).
