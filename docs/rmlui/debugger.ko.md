# 네이티브 Debugger

> `Debugger`는 초기화된 SFML 런타임에서 상위 RmlUi 도구를 실행합니다.
> 호스트는 도구를 표시하며 검사 대상으로 다른 컨텍스트를 지정할 수 있습니다.

```js
const { Debugger } = require('sfml.js-rmlui');

if (!Debugger.initialise(host)) {
  throw new Error('Debugger initialization failed');
}

Debugger.setContext(application);
Debugger.setVisible(true);
host.update();
```

일반 프레임에서 `host.update()`와 `host.render()`를 호출하고 표시 컨텍스트에
입력을 전달합니다. `isVisible()`은 계산된 스타일을 읽으므로 초기화나 표시 변경 후
호스트를 업데이트해야 합니다. 초기화는 내장 네이티브 글꼴을 로드하며 이미
디버거가 있으면 `initialise()`가 false를 반환합니다.

메뉴에는 Element Info, Event Log, Data Models와 윤곽선 표시가 있습니다.
Data Models는 스칼라, 배열, 구조체 및 등록된 사용자 정의를 네이티브에서 검사하며
표시 중에는 상위 라이브러리의 0.3초 간격으로 갱신합니다. JS getter나 검사
콜백의 예외는 `host.update()`에서 전파됩니다. 기본 검사는 C++에서 실행됩니다.

`setContext(null)`로 검사를 해제합니다. 대상 삭제나 대상의 모든 문서 해제는
훅을 제거하고 호스트를 유지합니다. 호스트 삭제나 호스트의 모든 문서 해제는
디버거를 종료합니다. 내부 문서의 개별 close/unload는 거부됩니다.
`Debugger.shutdown()`은 문서와 리스너를 해제하고 앱 로그 인터페이스를 복원합니다.
초기화된 런타임에서는 종료를 반복할 수 있습니다.

모든 메서드는 런타임 소유자를 검증합니다. 일반 이벤트 콜백에서는 `isVisible()`만
사용할 수 있으며 변경 작업의 재진입은 거부됩니다. 런타임 종료 후에는 재초기화가
필요합니다. 빌린 Factory 일반 allocator는 해당 런타임 동안 유효하며 플러그인
종료 시 등록만 해제합니다. 이전 대상에서 지연 해제를 기다리는 훅도 네이티브
allocator의 수명으로 보호합니다.

로컬 macOS 검증은 별도 대상과 소유 컨텍스트, 로그, 스칼라와 사용자 정의 배열／
구조체 검사, 예외, 대상 전환, 지연 해제 및 밀도 1과 2의 포인터 입력을 포함합니다.
[검증 기록](audit/6.3/debugger-native-contracts.md)을 참고하십시오.
플랫폼 작업, 예제 F8 연결 및 전체 검증은 별도로 필요합니다.
