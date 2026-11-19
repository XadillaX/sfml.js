# 네이티브 지오메트리와 합성곱

`MeshUtilities`는 원본 사각형, 선, 배경 및 테두리 지오메트리를 Native 소유
`Mesh`에 추가합니다. `ConvolutionFilter`는 바이트 뷰에서 원본 알파 필터를
실행합니다. 값 유틸리티는 초기화 전과 종료 후에도 사용할 수 있습니다.
렌더링 가능한 `Geometry` 생성에는 유효한 렌더링 관리자가 필요합니다.

## 메시 생성

```js
const { Mesh, MeshUtilities, RenderBox } = require('sfml.js-rmlui');
const mesh = new Mesh();
const colour = { red: 60, green: 30, blue: 10, alpha: 120 };

MeshUtilities.generateQuad(mesh, { x: 2, y: 3 }, { x: 4, y: 5 }, colour);
MeshUtilities.generateLine(mesh, { x: 0.4, y: 0.6 }, { x: 2.4, y: 1.6 }, colour);
const box = new RenderBox(
  { x: 30, y: 20 }, { x: 2, y: 3 }, [ 1, 2, 3, 4 ], [ 15, 9, 7, 5 ]);

MeshUtilities.generateBackgroundBorder(
  mesh, box, colour, [ colour, colour, colour, colour ]);
```

색은 알파를 미리 곱한 RGBA 바이트이며 자동 곱셈은 수행하지 않습니다.
`generateQuad`의 기본 UV 모서리는 `(0,0)`과 `(1,1)`이며 마지막 두 인수로
지정할 수 있습니다. `generateLine`은 양쪽 경계를 픽셀 그리드에 맞춥니다.
배경은 `RenderBox`의 너비, 오프셋 및 모서리 반경을 사용하며 알파가 0인 배경이나
테두리는 생략합니다.

추가 인덱스에는 기존 정점 오프셋이 포함됩니다. 내보낸 정점 또는 인덱스 뷰가
이전 할당을 보유하면 Native는 접두부를 한 번 복사하여 이전 뷰를 독립적으로
유지합니다. 보유 뷰가 없으면 메시를 재사용하고 용량을 기하급수적으로 늘립니다.
추가 후에는 새 뷰를 얻어야 합니다. `RenderManager.makeGeometry(mesh)`는
메시를 검증하고 스냅샷을 보관합니다.

## 공유 명령 배치

```js
const commands = MeshUtilities.allocateCommands(2);

commands.set([ 0, 2, 3, 4, 5, 60, 30, 10, 120, 0, 0, 1, 1 ]);
commands.set([ 1, 0.4, 0.6, 2.4, 1.6, 60, 30, 10, 120 ],
  MeshUtilities.commandStride);
const batched = new Mesh();

MeshUtilities.append(batched, commands);
```

반환값은 직접 쓸 수 있는 Native 소유 `Float32Array`입니다. 배치는 Native를
한 번 호출하고 선택한 전체 레코드를 검증한 후 지오메트리를 생성합니다.
명령 버퍼를 복사하지 않습니다. `append(mesh, commands, count)`는 지정한
접두부를 실행하며 `count`를 생략하면 전체 레코드를 실행합니다.

레코드마다 `commandStride` 필드가 있으며 현재 40개입니다.

| 필드 0의 작업 | 필드 배치 |
| --- | --- |
| 사각형: 0 | 1–4: x/y/너비/높이, 5–8: RGBA, 9–12: u0/v0/u1/v1 |
| 선: 1 | 1–4: x/y/너비/높이, 5–8: RGBA |
| 배경: 2 | 1–2: 채움 크기, 3–4: 테두리 오프셋, 5–8: 너비, 9–12: 반경, 13–16: RGBA |
| 배경과 테두리: 3 | 배경 필드 다음 17–32: 위/오른쪽/아래/왼쪽 RGBA |

너비와 반경은 `RenderBox` 순서를 따릅니다. 예약 필드는 무시합니다.
좌표는 유한하고 색은 정수 바이트이며 채움 크기, 너비 및 반경은 음수가 아니어야
합니다. 분리된 버퍼 또는 동시 공유 저장소를 가진 버퍼는 거부합니다.

## 알파 합성곱

```js
const { ConvolutionFilter, FilterOperation, ColorFormat } =
  require('sfml.js-rmlui');
const filter = new ConvolutionFilter();

filter.initialise({ x: 1, y: 0 }, FilterOperation.Sum);
filter.kernel.set([ 0.25, 0.5, 0.25 ]);
const source = ConvolutionFilter.allocateBytes(3);

source.set([ 40, 80, 120 ]);
const output = ConvolutionFilter.allocateBytes(3);

filter.run(output, { x: 3, y: 1 }, 3, ColorFormat.A8,
  source, { x: 3, y: 1 }, { x: 0, y: 0 }, ColorFormat.A8);
console.log(Array.from(output)); // [40, 80, 80]
```

`initialise(radius, operation)`는 정사각형 커널을 만들며 x/y 반경은 직사각형
커널을 만듭니다. 음수 반경은 `false`를 반환하고 이전 커널을 보존합니다.
잘못된 열거 값이나 할당 범위는 예외입니다. `getRow(index)`는 검증된 공유 행을
반환합니다. 재초기화는 저장소를 바꾸지만 기존 행과 커널 뷰는 이전 할당을 보유하여
래퍼 수거와 종료 후에도 유효합니다.

`run`은 Native를 한 번 호출합니다. 소스 행은 밀집되어 있으며 대상 간격은
바이트 단위입니다. 알파만 바꾸므로 RGB와 행 패딩은 보존합니다. 소스 오프셋은
대상 원점을 기준으로 합니다. 버퍼는 유효하고 겹치지 않으며 동시 공유 저장소가
없는 바이트 뷰여야 합니다. 커널은 초기화되어 있고 가중치는 유한하며 안전 범위
안에 있어야 합니다. `Sum`은 255를 넘는 값을 포화시킵니다. 음수 Sum 가중치는
Native 사전 검사를 수행하며 출력 알파가 음수이면 쓰기 전에 예외를 발생시킵니다.
`Dilation`은 가장 큰 가중 알파를 선택하며 최솟값은 0입니다.

값 타입과 자원 수명은 [API 가이드](api.ko.md)를 참고하세요.
