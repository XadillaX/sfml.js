# 핵심 개념

[English](concepts.md) / [简体中文](concepts.zh-CN.md) / [日本語](concepts.ja.md) / **한국어**

> sfml.js를 사용할 때는 먼저 값, 리소스, 뷰를 구분하고, 이어서 명령 기록, 제출, 화면 표시를 구분하세요. 이러한 경계가 복사, 비동기 로딩, 그리기 동작을 결정합니다.

[문서 홈](README.ko.md) · [API 안내](api.ko.md)

## 값, 리소스, 뷰

벡터, 각도, 색상, 사각형, 정점, 행렬 등의 값 타입은 처음에 JS TypedArray에 저장됩니다. 수학 연산은 JavaScript에서 수행하며, 네이티브 핸들이 필요할 때에만 같은 메모리를 감쌉니다. `Time`은 마이크로초 단위의 `bigint`를 사용합니다.

Texture, Image, Sprite, Text, 오디오 객체 등의 리소스는 네이티브 측에서 관리합니다. JS 래퍼 객체와 살아 있는 뷰가 함께 관련 메모리 할당의 수명을 유지합니다. 리소스 해제는 소유 스레드와 하위 의존성의 수명 주기를 따릅니다.

```typescript
import { FloatRect, Vector2f } from 'sfml.js';

const rect = new FloatRect(new Vector2f(10, 20), new Vector2f(100, 80));
const member = rect.position;
member.x = 30;                     // 멤버 뷰이므로 rect를 수정합니다.

const copy = new Vector2f(member);
copy.x = 90;                       // 독립 복사본이므로 rect에 영향을 주지 않습니다.

rect.position = new Vector2f(5, 6); // 값으로 복사하며, member는 여전히 rect의 멤버를 가리킵니다.
```

일반적인 JS 대입은 여전히 참조 대입입니다. 독립적인 값이 필요하면 복사 생성자를 사용하세요. 리소스의 복사 규칙은 클래스마다 다릅니다. 예를 들어 `new Texture(texture)`는 GPU 내용을 복사하지만, `new Sprite(sprite)`는 스프라이트 속성만 복사하고 텍스처를 공유합니다.

`get...()`이라는 이름만으로 반환값이 독립적인지 판단하지 마세요.

| 읽기 방식 | 소유권 및 업데이트 동작 |
| --- | --- |
| `sprite.getPosition()` | 독립적인 벡터. 결과를 수정한 뒤 `setPosition()`을 호출해야 함 |
| `rect.position`, `vertex.color` | 부모 값의 멤버 뷰. 쓰면 부모 값이 직접 수정됨 |
| `image.pixels` | 현재 이미지 할당에 대한 쓰기 가능한 RGBA 뷰 |
| `target.getTexture()` | RenderTexture의 안정적인 읽기 전용 텍스처 뷰 |
| `vertexArray.getVertex(i)` | 현재 정점 저장소의 멤버. 구조가 바뀌면 다시 가져와야 함 |
| `soundBuffer.getSamples()` | PCM 할당의 수명을 유지하는 읽기 전용 타입 뷰. 빈 버퍼는 `undefined` |

Image를 다시 로드하거나 resize한 뒤에도 기존 픽셀 뷰는 이전 할당의 수명을 계속 유지하며, 새 이미지로 자동 전환되지 않습니다. VertexArray의 용량이 늘어난 뒤에도 이전 멤버는 이전 저장소를 가리킵니다. 용량 내에서 크기를 줄였다가 다시 늘리는 경우에는 슬롯이 재사용될 수 있습니다.

`ReadonlyValue`, `ReadonlyPixels`, `ReadonlySamples` 등의 제약은 주로 TypeScript로 표현됩니다. 모든 읽기 전용 타입이 런타임에서 동결된다고 해석해서는 안 됩니다. 읽기 전용 데이터를 수정하려면 먼저 복사하세요. 기반 공유 buffer를 전송하거나 분리하거나 크기를 바꾸지 마세요.

## 리소스 로딩과 Promise

이미지와 텍스처는 `loadFromFile/Memory/Stream()`을, 폰트와 음악은 `openFromFile/Memory/Stream()`을 사용합니다. 이 진입점들은 Promise를 반환합니다.

```typescript
import { Texture } from 'sfml.js';

const texture = new Texture();
if (!await texture.loadFromFile('sprite.png')) {
  throw new Error('Cannot decode sprite.png');
}
```

Image/Texture의 파일 읽기와 디코딩은 백그라운드에서 수행되지만, 텍스처의 최종 GPU 업로드는 호출 스레드에서 동기식으로 완료됩니다. `new Texture(image)`, 픽셀 업로드, GPU 읽어오기는 동기식 작업입니다. 비동기 로딩 실패 시에는 보통 기존 리소스를 유지하며, 일반적인 SFML 실패는 `false`나 `undefined`를 반환합니다.

같은 이미지나 텍스처에 대한 여러 비동기 로딩은 완료 순서대로 결과를 반영합니다. 덮어쓰기 순서를 확정해야 한다면 하나씩 `await`하세요. 시작 순서에 의존해서는 안 됩니다.

입력 메모리의 소유권은 모듈마다 다릅니다.

| 입력 | 호출자의 책임 |
| --- | --- |
| Image/Texture의 인코딩된 바이트 | 호출 시 스냅샷을 만들므로 이후 원본 입력을 수정해도 됨 |
| `MemoryInputStream` | 원본 바이트 참조를 유지하므로 로딩 중 내용을 변경하지 않고 커서를 독점 사용 |
| Audio 비동기 읽기/쓰기 | Promise가 완료될 때까지 관련 버퍼를 변경하지 않음 |
| `Music.openFromMemory()` | 닫거나 다시 열 때까지 입력을 변경하지 않음 |

스트림과 오디오 객체의 구체적인 계약은 [System](system.ko.md#input-streams)과 [Audio](audio.ko.md)를 참고하세요.

<a id="draw-snapshots"></a>
## 그리기 스냅샷

`target.draw()`는 호출 시점의 속성과 상태를 기록합니다. 원본 객체를 수정한 뒤 다시 그리면 별도의 스냅샷이 만들어집니다.

```typescript
import {
  Color, Image, RenderTexture, Sprite, Texture, Vector2f, Vector2u,
} from 'sfml.js';

const target = new RenderTexture(new Vector2u(64, 32));
const sprite = new Sprite(new Texture(
  new Image(new Vector2u(16, 16), Color.White),
));

target.clear();
sprite.setPosition(new Vector2f(0, 0));
target.draw(sprite);
sprite.setPosition(new Vector2f(32, 0));
target.draw(sprite);
target.display();
```

최종 화면에는 사각형 두 개가 포함됩니다. Sprite 속성, RenderStates, 정점 데이터, 필요한 리소스 참조는 기록 시점에 저장됩니다. 이후 텍스처 픽셀, 지오메트리, Shader uniform을 변경하면 바인딩은 이전 상태에 의존하는 명령을 먼저 제출합니다.

| 작업 | 의미 |
| --- | --- |
| `clear()`, `draw()`, `setView()` | 명령을 순서대로 기록. 큐가 가득 차면 미리 제출할 수 있음 |
| `flush()` | 기존 명령을 동기식으로 제출 |
| `RenderWindow.display()` | 명령 제출 후 창 버퍼 교환 |
| `RenderTexture.display()` | 명령 제출 후 샘플링 가능한 텍스처 업데이트 |

`flush()`는 오프스크린 대상의 `display()`를 대체할 수 없습니다. RenderTexture의 새 내용을 사용하기 전에 display를 호출하세요. 자신의 텍스처를 직접 샘플링하거나 아직 제출되지 않은 대상 사이에 순환 의존성을 만드는 작업은 거부됩니다.

일괄 처리는 JS/C++ 경계를 넘는 호출을 줄이지만, 여러 Sprite를 자동으로 하나의 GPU 그리기 호출로 합치지는 않습니다. 텍스처를 공유하는 지오메트리가 많다면 VertexArray로 구성할 수 있고, 정적 지오메트리에는 VertexBuffer를 사용할 수 있습니다.

## Node.js 이벤트 루프

창 작업은 메인 스레드에서 실행합니다. 매 프레임 `pollEvent()`나 `handleEvents()`를 사용하고, `setImmediate()`로 다음 프레임을 예약하세요.

`waitEvent()`는 SFML의 동기식 대기 의미를 유지합니다. `sleep()`은 Node 타이머를 사용하고 Promise를 반환하며, 대기 중에도 이벤트 루프가 계속 실행됩니다. `display()`는 동기식 메서드로, 프레임 제한, 수직 동기화, 드라이버 작업의 영향을 받을 수 있습니다.

네트워크 I/O는 Promise를 반환합니다. `socket.setBlocking(true)`는 작업이 준비될 때까지 Promise가 기다린다는 뜻이며, Node 스레드 전체를 동기식으로 차단하지 않습니다.

Audio Worker는 크기가 제한된 공유 PCM 슬롯을 사용하며, 콜백 뷰는 해당 콜백이 완료되기 전까지만 유효합니다. 백그라운드 Worker만으로는 프로세스가 계속 실행되지 않으므로, 재생 중에는 창 루프를 유지하거나 명시적으로 기다리세요.

## 오류와 정리

| 결과 | 처리 방법 |
| --- | --- |
| `false`/`undefined`, SocketStatus, 프로토콜 응답 | 반환 상태 확인 |
| `TypeError`/`RangeError` | 매개변수 타입이나 범위 수정 |
| `SFMLError` | 바인딩 또는 하위 리소스의 실행 실패 처리 |
| 사용자 콜백의 예외 | 원본 오류 객체가 계속 전파됨 |

SFML 진단은 기본적으로 stderr에 기록되며, `setErrorOutput()`으로 경로를 바꿀 수 있습니다. 로그가 반환값 확인을 대신하지는 않습니다.

창은 `close()`로, 네트워크 객체는 각각의 닫기 인터페이스로 정리하며, 파일 스트림과 오디오 Worker의 비동기 정리에는 `await`가 필요합니다. 가비지 컬렉션에만 의존하면 파일 쓰기 완료, 적시 연결 종료, 녹음 큐 비우기를 보장할 수 없습니다. 리소스를 닫는 방법은 해당 모듈 문서를 참고하세요.
