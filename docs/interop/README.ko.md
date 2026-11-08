# 네이티브 확장 개발

sfml.js-interop은 두 바인딩에 공유 네이티브 헤더와 SFML SDK 경로를 제공합니다. 앱은 일반적으로 JavaScript 패키지를 사용하고 네이티브 확장은 이 계약을 통해 통합합니다. 형제 저장소의 비공개 헤더를 직접 포함하지 마세요.

확장의 의존성에 `sfml.js-interop`을 선언하세요. nan처럼 `require('sfml.js-interop')`은 include 디렉터리를 반환합니다. `require('sfml.js-interop/paths')`는 `root`, `include`, `sfmlInclude`, `sfmlLib`, `sfmlBin`을 내보내며 소비하는 패키지에서 경로를 해석해야 합니다.

```json
{
  "include_dirs": [
    "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")",
    "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")"
  ]
}
```

`sfml-js-interop.h`는 `SFMLJS_INTEROP_VERSION`(현재 1), `shared-handle.h`, `exception-boundary.h`, `numeric-fields.h`를 제공합니다. 호스트 바인딩의 계약과 SFML 버전을 맞추세요. `RenderWindowFrom`은 공개 JavaScript RenderWindow 객체가 아닌 바인딩 내부 네이티브 창 핸들을 받습니다.

네이티브 소유자가 수명을 관리합니다. 뷰와 빌린 포인터는 소유자, 컨텍스트, 창보다 오래 유지할 수 없습니다. 기록된 그리기에 필요한 자원을 유지하고 호출 시점의 스냅샷을 보존하세요. C++ 콜백을 V8에 노출할 때는 공유 예외 경계를 사용합니다. 버전 매크로가 같다는 사실만으로 서로 다른 빌드 설정의 바이너리 간 ABI 호환성을 보장하지는 않습니다.

Rush는 interop 다음에 sfml.js와 sfml.js-imgui를 빌드합니다. SDK 다운로더는 interop에 속하며 확장에 형제 패키지 경로를 하드코딩하지 않습니다. [통합 소스](../../packages/sfml.js-imgui/native/interop.h), [JS 브리지](../../packages/sfml.js-imgui/src/internal/sfml-interop.ts), [개발 안내](../sfml/development.ko.md)를 참고하세요.
