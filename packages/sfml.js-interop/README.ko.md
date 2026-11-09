# sfml.js-interop

[![npm version](https://img.shields.io/npm/v/sfml.js-interop.svg?style=for-the-badge&colorA=5DDB61&colorB=4BC74F&label=sfml.js-interop)](https://www.npmjs.org/package/sfml.js-interop)

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **한국어**

[sfml.js](../sfml.js)와 [sfml.js-imgui](../sfml.js-imgui) 같은 애드온을 위한 공유 네이티브 헤더와 SFML SDK 경로입니다. 앱은 일반적으로 JavaScript 패키지를 직접 사용하며, 이 패키지는 네이티브 확장 작성자를 위한 것입니다.

[전체 상호 운용 가이드](../../docs/interop/README.ko.md) · [개발 안내](../../docs/sfml/development.ko.md)

## 사용법

확장의 의존성에 `sfml.js-interop`을 선언하세요. [nan](https://www.npmjs.com/package/nan)처럼 이 패키지를 require하면 include 디렉터리가 반환됩니다.

```js
const includeDir = require('sfml.js-interop');
```

`require('sfml.js-interop/paths')`는 해석된 SDK 경로를 내보냅니다.

| Export | 경로 |
| --- | --- |
| `root` | 다운로드한 SDK가 있는 패키지 루트 |
| `include` | 상호 운용 헤더 디렉터리 |
| `sfmlInclude` | SFML C++ 헤더 |
| `sfmlLib` | SFML 링크 라이브러리 |
| `sfmlBin` | SFML 런타임 바이너리 |

형제 저장소의 비공개 헤더를 하드코딩하지 말고 `binding.gyp`에서 두 include 디렉터리를 참조하세요.

```json
{
  "include_dirs": [
    "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")",
    "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")"
  ]
}
```

## 계약

- `sfml-js-interop.h`는 `SFMLJS_INTEROP_VERSION`(현재 1)을 제공하고 `shared-handle.h`, `exception-boundary.h`, `numeric-fields.h`를 가져옵니다.
- 호스트 바인딩의 계약과 SFML 버전을 맞추세요. 버전 매크로가 같다는 것만으로 서로 다른 빌드 설정의 바이너리 간 ABI 호환성을 보장하지는 않습니다.
- `RenderWindowFrom`은 공개 JavaScript RenderWindow 객체가 아닌 바인딩 내부 네이티브 창 핸들을 받습니다.
- 네이티브 소유자가 수명을 관리합니다. 뷰와 빌린 포인터는 소유자, 컨텍스트, 창보다 오래 유지할 수 없습니다.
- 기록된 그리기에 필요한 자원을 유지하고 호출 시점의 스냅샷을 보존하며, C++ 콜백을 V8에 노출할 때는 공유 예외 경계를 사용합니다.

SDK 다운로더는 이 패키지가 담당합니다. Rush는 interop 다음에 sfml.js와 sfml.js-imgui를 빌드합니다. 전체 사용 예시는 [통합 소스](../sfml.js-imgui/native/interop.h)와 [JS 브리지](../sfml.js-imgui/src/internal/sfml-interop.ts)를 참고하세요.

## 라이선스

[MIT](../sfml.js/LICENSE).
