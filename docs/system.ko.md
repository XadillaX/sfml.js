# System

[English](system.md) / [简体中文](system.zh-CN.md) / [日本語](system.ja.md) / **한국어**

> System은 값 타입, 시간, 입력 스트림, Unicode 경계, 오류 처리를 제공합니다. 일반적인 수치 계산은 JS에서 수행하며, 리소스 관련 작업은 인터페이스에 따라 네이티브 측에서 실행됩니다.

[API 안내](api.ko.md) · [핵심 개념](concepts.ko.md)

## 벡터와 연산

```typescript
import { Vector2f, Vector2i, add, multiply, addAssign } from 'sfml.js';

const position = new Vector2f(10, 20);
const velocity = new Vector2f(2, 3);
const next = add(position, velocity);
const doubled = multiply(velocity, 2);
addAssign(position, velocity);
const pixels = new Vector2i(position);
```

일반 연산은 독립적인 값을 반환하며, `*Assign`은 왼쪽 피연산자를 수정하고 반환합니다. 대입 시 벡터의 스칼라 타입이 자동 변환되지는 않습니다. 변환이 필요하면 해당 생성자를 사용하세요.

| 스칼라 태그 | JS 성분 타입 | 저장소 |
| --- | --- | --- |
| `i8`/`u8` | number | Int8Array/Uint8Array |
| `i16`/`u16` | number | Int16Array/Uint16Array |
| `i32`/`u32` | number | Int32Array/Uint32Array |
| `i64`/`u64` | bigint | BigInt64Array/BigUint64Array |
| `f32`/`f64` | number | Float32Array/Float64Array |

`Vector2i/u/f`와 `Vector3i/u/f`는 각각 i32/u32/f32에 대응합니다. 다른 스칼라는 `new Vector2('f64', x, y)`와 같은 형식으로 사용합니다.

두 벡터 타입 모두 `lengthSquared()`, `dot()`, `cross()`, 성분별 곱셈과 나눗셈을 제공합니다. 2차원 벡터에는 `perpendicular()`도 있습니다. 부동소수점 벡터는 `length()`와 `normalized()`를 제공하며, 부동소수점 2차원 벡터는 각도, 회전, 투영 연산도 제공합니다. 정수 벡터는 부동소수점 전용 메서드를 지원하지 않습니다.

벡터의 `multiply()`/`divide()`에는 스칼라를 사용하고, 성분별 연산에는 `componentWiseMul()`/`componentWiseDiv()`를 사용합니다. 0으로 나누기, 영벡터 정규화, 영벡터 축으로의 투영은 예외를 발생시킵니다. 64비트 정수 계산은 bigint를 유지합니다. f32 계산은 SFML의 정밀도 규칙에 따라 반올림되며, 삼각함수 연산에서는 플랫폼 수학 라이브러리에 따른 제한적인 차이가 허용됩니다.

## 각도

```typescript
import { Angle, degrees, radians, divide } from 'sfml.js';

const heading = degrees(90);
const turn = radians(Math.PI);
const copy = new Angle(heading);
const ratio = divide(turn, heading);
console.log(copy.asDegrees(), ratio);
```

회전 인터페이스는 Angle을 받습니다. `wrapSigned()`, `wrapUnsigned()`는 해당 범위로 래핑한 각도를 반환하지만, 비교 시에는 자동으로 래핑하지 않습니다. `Angle.Zero`는 읽기 전용 상수로, 복사한 뒤 수정할 수 있습니다. Angle은 float32를 사용하며, 나머지 연산의 제수는 양수여야 합니다.

## 시간과 시계

```typescript
import { Clock, milliseconds, microseconds, sleep } from 'sfml.js';

const clock = new Clock();
await sleep(milliseconds(16));
const elapsed = clock.restart();
console.log(elapsed.asSeconds(), elapsed.asMicroseconds());
console.log(microseconds(1000n).asMilliseconds());
```

| 인터페이스 | 의미 |
| --- | --- |
| `new Time()`/`new Time(source)`/`new Time(bigint)` | 길이가 0인 시간, 복사, 마이크로초로 생성 |
| `seconds(number)` | 초를 Time으로 변환 |
| `milliseconds(number)` | int32 밀리초 입력. 소수 부분은 0 방향으로 버림 |
| `microseconds(bigint)` | 마이크로초 입력 |
| `asMicroseconds()`/`toDuration()` | 마이크로초 bigint |
| `asSeconds()`/`asMilliseconds()` | float32 초/int32 밀리초 |
| `Clock.start()`/`stop()` | 시간 측정 재개/일시 정지 |
| `Clock.restart()`/`reset()` | 기존 경과 시간을 반환하고 0으로 초기화한 뒤 실행/일시 정지 |

Time은 부호 있는 int64 마이크로초를 저장하며, 정수 배수 연산에는 bigint를, 부동소수점 배수에는 number를 사용합니다. `Time.Zero`는 읽기 전용 상수입니다. 범위를 벗어나거나 잘못된 나눗셈을 수행하면 RangeError가 발생하며, 제자리 연산이 실패하면 원래 값을 유지합니다.

Clock은 `process.hrtime.bigint()`를 사용하고 독립적인 Time 스냅샷을 반환합니다. 자체 타이머는 없으며, 시계 해상도와 시스템 절전 중의 동작은 Node.js와 플랫폼에 따라 결정됩니다.

`sleep(time)`은 Promise를 반환하고 Node 타이머로 기다리며 이벤트 루프를 차단하지 않습니다. 양수 시간은 밀리초 단위로 올림합니다. 0이나 음수 시간은 즉시 완료되며, 실제 재개 시점은 스케줄링의 영향을 받습니다.

### 타임아웃 설정

`TimeoutWithPredicate`는 확인 주기와 조건 함수를 저장할 뿐, 자체적으로 타이머를 시작하지 않습니다.

- `new TimeoutWithPredicate(time)`: 고정 주기이며 조건 함수는 항상 false를 반환합니다.
- `new TimeoutWithPredicate(predicate, period?)`: 기본 주기는 1 ms이며, true는 계속 기다린다는 뜻입니다.
- `getPeriod()`는 읽기 전용 Time을, `getPredicate()`는 원본 함수를 반환합니다.

이를 받는 인터페이스가 확인 시점을 결정합니다. 현재 SFTP는 진행이 없는 동안의 대기를 제어하는 데 사용합니다. 자세한 내용은 [Network](network.ko.md#sftp)를 참고하세요.

`SuspendAwareClock.now()`는 시스템 절전 시간을 포함하는 네이티브 나노초 시점을 반환하며, Android 분기에서만 지원됩니다. 데스크톱에서 호출하면 SFMLError가 발생합니다. 현재 자동 다운로드 절차에는 Android 빌드 대상이 없습니다.

## 색상, 사각형, 정점

| 타입 | 생성 및 주요 연산 |
| --- | --- |
| Color | RGB/RGBA, `0xRRGGBBAA`, 복사; `r/g/b/a`, `toInteger()` |
| FloatRect/IntRect | `position` + `size`, 복사, 명시적 변환; `contains()`, `findIntersection()`, `getCenter()` |
| Vertex | `position`, `color`, `texCoords` 또는 복사 생성 |

이 값들은 주로 그래픽 인터페이스에서 사용합니다. Color 성분은 uint8로 저장되며, 직접 쓰면 해당 비트 폭으로 축소됩니다. 색상 덧셈과 뺄셈은 포화 연산이고, 색상 곱셈은 채널별로 `floor(a * b / 255)`를 계산합니다. Color 상수는 읽기 전용입니다.

사각형과 정점의 멤버는 공유 뷰입니다. 사각형은 왼쪽과 위쪽 경계를 포함하고 오른쪽과 아래쪽 경계는 제외합니다. 음수 크기는 정규화된 범위로 계산하며, 교집합의 면적이 양수가 아니면 `undefined`를 반환합니다. Vertex의 기본 위치와 텍스처 좌표는 0이고, 색상은 흰색입니다.

<a id="input-streams"></a>
## 입력 스트림

InputStream은 탐색 가능한 바이트 스트림 프로토콜이며, 메서드는 동기식 값이나 Promise를 반환할 수 있습니다.

| 메서드 | 반환값 |
| --- | --- |
| `read(data)` | Uint8Array에 쓰고 실제 바이트 수를 bigint로 반환. EOF는 `0n` |
| `seek(position)` | 실제 바이트 위치를 bigint로 반환 |
| `tell()` | 현재 바이트 위치 bigint |
| `getSize()` | 전체 바이트 수 bigint |

`undefined`는 I/O 실패를 뜻하며, 발생한 오류는 그대로 전파됩니다. 이 네 메서드를 구현한 객체도 스트림으로 전달할 수 있습니다. Node Readable에는 탐색 기능을 추가로 구현해야 합니다.

`MemoryInputStream(data)`는 입력 바이트의 참조를 유지합니다. 로딩 중에는 내용을 변경하지 말고, 한 작업이 커서를 독점하도록 하세요. `FileInputStream`은 Node 파일 핸들을 사용하며, 객체별로 비동기 읽기/쓰기와 탐색을 직렬 실행합니다.

```typescript
import { FileInputStream, Image } from 'sfml.js';

async function readImage(filename: string) {
  const stream = new FileInputStream();
  try {
    if (!await stream.open(filename)) throw new Error('Cannot open file');
    const image = new Image();
    if (!await image.loadFromStream(stream)) throw new Error('Cannot decode image');
    return image;
  } finally {
    await stream.close();
  }
}
```

로딩이 완료될 때까지 기다린 뒤 스트림을 닫으세요. 같은 스트림에서 여러 번 로드할 때는 하나씩 await해야 합니다. FileInputStream의 파일 오프셋 범위는 0~2⁵³−1입니다. EOF에서 파일을 자동으로 닫지 않으므로 다시 seek할 수 있습니다.

## Unicode와 버전

`Unicode.isGraphemeBoundary(text, position)`, `isWordBoundary()`, `isSentenceBoundary()`는 SFML의 Unicode 규칙을 사용합니다. position은 JS 문자열의 UTF-16 인덱스로, 범위는 0~`text.length`입니다. 서로게이트 쌍의 중간은 경계가 아닙니다.

`version()`은 캐시된 읽기 전용 SFML 런타임 버전을 반환하며, `major`, `minor`, `patch`, `isRelease`, `string`을 포함합니다. npm 패키지 버전은 아닙니다.

## 오류와 로그

SFMLError는 바인딩 계층이나 SFML의 실행 실패를 나타내며, `instanceof SFMLError`로 판별할 수 있습니다. 매개변수 오류에는 TypeError/RangeError를 사용하고, 사용자 콜백의 오류는 그대로 전파됩니다. SFML이 반환하는 일반적인 실패 상태는 여전히 false/undefined이며, 전부 예외로 변환되지는 않습니다.

`err()`는 `sf::err()`에 쓰는 싱글턴 Node Writable을 반환합니다. `setErrorOutput(writable)`은 SFML 로그를 리디렉션하며, null을 전달하면 출력을 끄고 인수 없이 호출하면 기본 stderr로 복원합니다.

```typescript
import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { err, setErrorOutput } from 'sfml.js';

const output = createWriteStream('sfml.log');
setErrorOutput(output);
err().write('SFML diagnostic\n');
setErrorOutput();
output.end();
await finished(output);
```

로그 경로는 프로세스 전체 설정이며 Worker도 가장 최근의 설정을 공유합니다. Node 자체의 stderr에는 영향을 주지 않습니다. 백그라운드 로그는 바이트 청크 단위로 전달되어 UTF-8 문자 경계나 줄 경계가 보장되지 않으므로, 텍스트를 파싱할 때는 StringDecoder를 사용할 수 있습니다.

<a id="sfml-cpp-reference"></a>
## SFML C++ 레퍼런스

원본 클래스 문서: [Vector2](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Vector2.html), [Angle](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Angle.html), [Time](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Time.html), [Clock](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Clock.html), [InputStream](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1InputStream.html).

C++ 레퍼런스는 수학, 시간, 스트림의 기본 개념을 설명합니다. JS의 이름 있는 연산자, bigint 시간 표현, Promise 기반 sleep, 스트림 메서드의 구체적인 동작은 이 바인딩의 가이드를 따르세요.
