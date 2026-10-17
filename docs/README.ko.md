# sfml.js 문서

[English](README.md) / [简体中文](README.zh-CN.md) / [日本語](README.ja.md) / **한국어**

> 이 문서는 현재 저장소의 SFML 3.1.0 바인딩을 설명합니다. 처음 사용한다면 '빠른 시작'부터 읽으세요. 구체적인 메서드 시그니처는 [TypeDoc](https://sfml.js.org/ko/reference/)에서 확인할 수 있습니다.

## 시작하기

| 문서 | 다루는 문제 |
| --- | --- |
| [빠른 시작](getting-started.ko.md) | 의존성 설치, 가져오기 방식 선택, 첫 번째 창 열기 |
| [핵심 개념](concepts.ko.md) | 값과 리소스의 복사 방식, 로딩 완료 시점, draw 적용 시점 |
| [API 안내](api.ko.md) | 다섯 모듈이 각각 제공하는 기능 |
| [예제 목록](../examples/README.ko.md) | 저장소에서 완전한 데모 실행하기 |

## 모듈별 문서

| 모듈 | 내용 |
| --- | --- |
| [System](system.ko.md) | 벡터, 각도, 시간, 입력 스트림, Unicode, 오류 처리 |
| [Window](window.ko.md) | 창 수명 주기, 이벤트, 실시간 입력, OpenGL, Vulkan |
| [Graphics](graphics.ko.md) | 이미지, 텍스처, 스프라이트, 도형, 텍스트, 뷰, 그리기 |
| [Audio](audio.ko.md) | 재생, 스트리밍 데이터 공급, 오디오 효과, 녹음, 코덱 |
| [Network](network.ko.md) | Packet, TCP/UDP, DNS, TLS, HTTP, FTP, SFTP |

## 개발 참여

[개발 가이드](development.ko.md)는 빌드, 테스트, 소스 구조, 현재의 문서 게시 절차를 설명합니다.

메서드 시그니처와 내보내기 목록은 [src/index.ts](../src/index.ts) 및 소스 주석을 기준으로 합니다. 업스트림 개념은 [SFML 3.1.0 C++ 문서 색인](https://www.sfml-dev.org/documentation/3.1.0/)을 참고하세요. JavaScript에 맞게 조정한 동작은 sfml.js 가이드와 [TypeDoc](https://sfml.js.org/ko/reference/)을 기준으로 하며, Node.js의 비동기 처리, 메모리, 네트워크 어댑테이션은 이 프로젝트의 설명을 따릅니다.
