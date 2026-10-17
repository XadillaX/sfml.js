# API 안내

[English](api.md) / [简体中文](api.zh-CN.md) / [日本語](api.ja.md) / **한국어**

> sfml.js는 SFML 3.1.0을 기반으로 합니다. 직접 작성한 가이드는 사용법, 반환값, Node.js에 맞춘 조정을 설명하며, 전체 시그니처와 타입 제약은 소스에서 생성한 [TypeDoc](https://sfml.js.org/ko/reference/)에서 제공합니다.

[문서 홈](README.ko.md) · [빠른 시작](getting-started.ko.md) · [핵심 개념](concepts.ko.md)

모든 공개 인터페이스는 `sfml.js`에서 가져옵니다. 내보내기 목록은 [src/index.ts](../src/index.ts)를 참고하세요. 애플리케이션 코드에서 `dist/internal`이나 네이티브 모듈 핸들에 접근할 필요는 없습니다.

## 작업별 선택

| 작업 | 문서 | 주요 인터페이스 |
| --- | --- | --- |
| 좌표, 각도, 프레임 시간 계산 | [System](system.ko.md) | Vector2/3, Angle, Time, Clock, 이름 있는 연산자 |
| 사용자 정의 파일 소스 연결 | [입력 스트림](system.ko.md#input-streams) | InputStream, MemoryInputStream, FileInputStream |
| 창 열기와 입력 수신 | [Window](window.ko.md) | RenderWindow, Window, Event, Keyboard, Mouse |
| 이미지와 애니메이션 표시 | [Graphics](graphics.ko.md) | Image, Texture, Sprite |
| 도형과 텍스트 그리기 | [Graphics](graphics.ko.md) | Shape, Font, Glyph, Text |
| 카메라, 오프스크린 합성, 일괄 지오메트리 처리 | [Graphics](graphics.ko.md) | View, RenderTexture, VertexArray, VertexBuffer |
| 사용자 정의 그리기와 셰이더 | [Graphics](graphics.ko.md) | Drawable, RenderStates, Shader, Glsl |
| 재생, 녹음, 오디오 처리 | [Audio](audio.ko.md) | SoundBuffer, Sound, Music, SoundStream, SoundRecorder |
| 네트워크 연결과 파일 전송 | [Network](network.ko.md) | Packet, TcpSocket, UdpSocket, Http, Ftp, Sftp |

## System

`Vector2`/`Vector3`는 여러 스칼라 타입을 지원합니다. `Vector2i/u/f`와 `Vector3i/u/f`는 자주 사용하는 특수화입니다. `degrees()`/`radians()`로 Angle을, 시간 팩토리 함수로 Time을 생성합니다.

JavaScript에는 C++ 연산자 오버로딩이 없으므로 해당 연산에는 `add()`, `multiply()`, `equal()`, `*Assign()`을 사용합니다. `Clock`, 비동기 `sleep()`, `TimeoutWithPredicate`, 입력 스트림, `Unicode`, 오류 로그 인터페이스도 이 모듈에 속합니다.

자세한 내용은 [System](system.ko.md)을 참고하세요.

## Window

`Window`는 시스템 창과 OpenGL 컨텍스트를 제공합니다. 2D 그리기에는 보통 Window와 RenderTarget의 기능을 함께 갖춘 `RenderWindow`를 사용합니다.

이벤트는 `pollEvent()`, `handleEvents()`, 동기식 `waitEvent()`로 가져올 수 있습니다. 키보드, 마우스, 조이스틱, 센서에는 실시간 조회 기능도 있습니다. `Clipboard`, `Cursor`, `Context`, `Vulkan`은 시스템 통합 기능을 담당합니다.

자세한 내용은 [Window](window.ko.md)를 참고하세요.

## Graphics

Image는 CPU 측 픽셀을, Texture는 GPU 텍스처를 저장하며, Sprite는 텍스처를 참조해 그립니다. Shape는 원, 사각형, 볼록 다각형, 사용자 정의 볼록 도형을 제공합니다. Font와 Text는 폰트 로딩, 텍스트 레이아웃, 편집 가능한 정점을 제공합니다.

RenderTarget은 창과 오프스크린 대상의 그리기 인터페이스를 통일합니다. View는 카메라와 뷰포트를 제어하고, RenderStates는 변환, 블렌딩, 스텐실, 텍스처, Shader를 제어합니다. 정점 배열과 GPU 정점 버퍼로 지오메트리를 직접 구성할 수 있습니다.

자세한 내용은 [Graphics](graphics.ko.md)와 [그리기 스냅샷](concepts.ko.md#draw-snapshots)을 참고하세요.

## Audio

짧은 효과음에는 SoundBuffer + Sound를, 긴 오디오에는 Music을 사용합니다. SoundSource는 볼륨, 패닝, 공간 오디오 속성을 제공합니다. SoundStream, SoundRecorder, EffectProcessor는 Worker 콜백으로 사용자 정의 데이터를 처리합니다.

자세한 내용은 [Audio](audio.ko.md)를 참고하세요. 특히 샘플 수, 채널 배치, 버퍼의 유효 기간에 주의해야 합니다.

## Network

Network는 Node.js 전송 계층으로 SFML 스타일 API를 구현합니다. 실제 서비스 코드는 SFML C++ Network를 호출하지 않습니다. Packet은 SFML 인코딩 규칙을 유지하며, TCP, UDP, DNS, TLS, HTTP, FTP, SFTP의 I/O는 Promise를 사용합니다.

상태 반환, 부분 전송, 프로토콜 제한, 종료 방법을 포함한 자세한 내용은 [Network](network.ko.md)를 참고하세요.

## 호환 범위

| 항목 | 현재 동작 |
| --- | --- |
| C++ 포인터, 참조 출력 매개변수 | 객체, 뷰, 반환 객체로 표현 |
| C++ 템플릿 및 연산자 | 명시적인 스칼라 태그, 클래스, 이름 있는 함수로 표현 |
| 파일 로딩 | Promise 사용, 구체적인 실패 상태는 각 인터페이스의 규칙을 유지 |
| 소멸 | 네이티브 소유권과 JS 참조를 함께 사용하며, 닫기 인터페이스가 있는 리소스는 명시적으로 닫아야 함 |
| `drawAsync()`/`displayAsync()` | 제공하지 않으며, 이전 예제에서 명시적으로 미지원으로 보고 |
| Android SuspendAwareClock | 조건부 컴파일 인터페이스가 있으며, 현재 다운로드 절차는 데스크톱 대상 |
| Vulkan | 조회 인터페이스가 내보내지며, 사용 가능 여부는 SFML 플랫폼 백엔드에 따라 결정됨. macOS 백엔드에서는 사용 불가 |

플랫폼별 빌드와 테스트 범위는 [개발 가이드](development.ko.md#testing)를 참고하세요.

<a id="sfml-cpp-reference"></a>
## SFML C++ 레퍼런스

[SFML 3.1.0 공식 문서 색인](https://www.sfml-dev.org/documentation/3.1.0/)은 C++ API의 개념을 확인하는 기준입니다. JavaScript 시그니처와 타입 제약은 [TypeDoc](https://sfml.js.org/ko/reference/)을 기준으로 하세요. 각 모듈의 관련 원본 클래스와 JS 차이는 아래에서 확인할 수 있습니다.

- [System C++ 레퍼런스](system.ko.md#sfml-cpp-reference)
- [Window C++ 레퍼런스](window.ko.md#sfml-cpp-reference)
- [Graphics C++ 레퍼런스](graphics.ko.md#sfml-cpp-reference)
- [Audio C++ 레퍼런스](audio.ko.md#sfml-cpp-reference)
- [Network C++ 레퍼런스](network.ko.md#sfml-cpp-reference)
