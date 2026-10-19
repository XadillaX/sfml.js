# 이전 버전 예제

[English](README.md) / [简体中文](README.zh-CN.md) / [日本語](README.ja.md) / **한국어**

> 이 디렉터리는 이전 `example/`의 데모 진입점 16개를 유지합니다. 파일 이름은 같으며 확장자는 `.cjs`입니다. 14개는 현재 API에 맞게 조정되었고, 비동기 그리기 진입점 2개는 `UNSUPPORTED`를 출력하며 종료 코드는 2입니다.

[전체 예제](../README.ko.md) · [API 안내](../../docs/api.ko.md) · [개발 가이드](../../docs/development.ko.md)

이 스크립트들은 이전 장면이 현재 API에서 어떻게 동작하는지 관찰하기 위한 것입니다. 새 애플리케이션은 [빠른 시작](../../docs/getting-started.ko.md)부터 시작하세요.

## 실행

프로젝트 루트 디렉터리에서 실행합니다.

```sh
# 최초 빌드에는 네이티브 모듈이 포함됩니다.
npm run build

# 종합 창을 엽니다.
npm run demo:ported

# 포팅된 스크립트 중 하나를 실행합니다.
node examples/ported/texture.cjs
node examples/ported/sound_buffer.cjs
```

## 예제 진입점

| 파일 | 데모 내용 |
|------|----------|
| color.cjs | 색상 생성, 성분 쓰기, JSON 출력 |
| vector2.cjs | 2차원 벡터, 스칼라 변환, 복사, 이름 있는 연산 |
| vector3.cjs | 3차원 벡터, 스칼라 변환, 복사, 이름 있는 연산 |
| time.cjs | 시간 팩토리, bigint 마이크로초, Time.Zero |
| rect.cjs | position/size, 포함 여부, 교차 영역. 원래의 잘못된 입력 데모 유지 |
| video_mode.cjs | 디스플레이 모드, 크기, NaN 입력, 데스크톱 및 전체 화면 모드 조회 |
| vertex.cjs | 정점 멤버 뷰와 VertexArray 접근 |
| joystick.cjs | 조이스틱 연결, 식별 정보, 버튼 수, 축 조회 |
| sensor.cjs | 모든 센서의 가용성, 활성화, 읽기 |
| touch.cjs | 터치 상태와 위치 조회 |
| font.cjs | 로딩 실패, 폰트 로딩, 코드 포인트 1/글자 크기 10의 글리프와 줄 간격 |
| texture.cjs | 로딩 실패, GIF 로딩, 자르기, 텍스처 복사, Sprite |
| sound_buffer.cjs | WAV 디코딩, PCM 복사, 저장, 다시 로딩 |
| render_window.cjs | 원래 종합 장면의 도형, 정점 선, 그라데이션 픽셀, 자르기, 마스크, Sprite, 중국어 텍스트, 오디오 |
| render_window_display_async.cjs | 미지원: 원래의 동기식/비동기식 display 비교. displayAsync가 없음 |
| render_window_display_draw_async.cjs | 미지원: 원래의 비동기 그리기 종합 장면. drawAsync와 displayAsync가 없음 |

## 창 조작

`render_window.cjs`는 원래의 `VideoMode.getFullscreenModes()[3]`, 제목 `hello`, style 5를 사용합니다. 빨간 배경, 기존 장면 레이아웃, 기본 볼륨, 시작 시 Sound 한 번 재생을 유지하며, Music에는 반복만 설정하고 재생하지 않습니다. `setFramerateLimit(60)`과 `setImmediate(frame)` 스케줄링을 유지합니다.

| 키 | 동작 |
|------|------|
| Esc/닫기 이벤트 | 창 닫기. Esc는 실시간 조회도 유지 |
| Left | 창 위치의 x/y에 각각 1 더하기 |
| LControl | 누르고 있는 동안 800×600으로 다시 생성하고 수직 동기화 켜기 |
| LAlt | 컨텍스트 설정 출력 |
| RAlt | 창 제목 변경 |
| S | 시스템 지원 여부에 따라 가상 키보드 표시 요청 |

원래 마우스 로직도 유지합니다. 매 프레임 데스크톱 좌표와 창 기준 상대 좌표를 읽고, 원래 mode 범위로 제한한 뒤 Mouse.setPosition을 호출합니다. 원래 키 반복 동작도 유지합니다.

Windows 이외의 환경에서 종합 예제는 여전히 `/tmp/xxx.png`를 저장합니다. SoundBuffer 예제는 여전히 `os.tmpdir()` 아래의 `.game.wav`에 저장한 뒤 다시 로드하며, 자동으로 삭제하지 않습니다.

## 포팅 규칙

조정 범위는 가져오기 경로, SFML 3 매개변수와 메서드 이름, 값 타입, 비동기 로딩입니다. 장면 매개변수, 애니메이션 공식, 그리기 순서, 입력, 파일 출력, 프레임 스케줄링은 원래 로직을 유지합니다. 이미지, 폰트, 오디오는 `assets/`에 있습니다.

이름에 async가 포함된 두 진입점은 동기식 그리기나 고정 sleep으로 이전 인터페이스를 흉내 내지 않습니다. display 비교 코드는 10프레임, 50 ms 하트비트, setImmediate 래핑, displayAsync, 닫은 뒤 오류 검사를 유지합니다. 종합 비동기 장면은 drawAsync/displayAsync를 차례로 await하는 동작을 유지합니다.

좌표와 크기에는 Vector2, 회전에는 Angle, 색상에는 Color를 사용합니다. 이벤트는 `is/getIf`로 읽고, 수치 열거형을 순회할 때는 역방향 매핑을 걸러 냅니다. 로딩 작업의 boolean을 확인하며, 원래의 누락 경로 `abcdefg`/`abc.jpg`도 유지합니다. console.log/JSON.stringify는 새 버전 객체를 직접 받아 타입 자체의 표현 방식을 따릅니다. 정수 변환과 잘못된 값 처리도 새 값 타입의 규칙을 따르며, 예제 계층에서 이전 검증을 흉내 내지 않습니다.

각 스크립트는 독립적으로 데모 로직을 포함하며, 더 이상 공유 장면이나 출력 형식 보조 함수를 사용하지 않습니다. 기존 동기식 리소스 로딩은 원래 순서대로 await하도록 바뀌었으며, 병렬 사전 로딩으로 바꾸지 않았습니다.
