# RML과 RCSS 기초

RML은 문서의 요소를 정의하고 RCSS는 선택자로 요소의 레이아웃과 외형을 지정합니다. JavaScript는 문서를 로드하고 애플리케이션 상태에 연결합니다. 이 장은 [카운터 예제](../../packages/sfml.js-rmlui/examples/README.ko.md#demo)를 사용합니다. 먼저 [빠른 시작](getting-started.ko.md)을 완료하세요.

## 세 파일의 역할

| 파일 | 역할 |
| --- | --- |
| [tutorial.rml](../../packages/sfml.js-rmlui/examples/assets/tutorial.rml) | 요소 트리, ID, 텍스트, 스타일시트 링크 |
| [tutorial.rcss](../../packages/sfml.js-rmlui/examples/assets/tutorial.rcss) | 레이아웃, 글꼴, 색상, 호버 상태 |
| [demo.cjs](../../packages/sfml.js-rmlui/examples/demo.cjs) | 창, 글꼴, 문서 로드, 입력, 클릭 처리, 프레임 루프 |

## 문서 작성

다음은 간소화한 `tutorial.rml`입니다. `demo.cjs`가 사용하는 ID를 유지하므로 기존 실행기와 아래 스타일시트로 실행할 수 있습니다.

```xml
<rml>
  <head>
    <title>Counter</title>
    <link type="text/rcss" href="tutorial.rcss" />
  </head>
  <body>
    <div id="window">
      <div id="title">My counter</div>
      <div id="counter" class="muted">Clicks: 0</div>
      <button id="increment">Increment</button>
    </div>
  </body>
</rml>
```

`<rml>`은 루트, `<head>`는 문서 리소스, `<body>`는 화면에 표시할 UI입니다. 스타일시트 경로는 RML 파일 기준으로 해석합니다. 태그는 짝에 맞게 닫고 속성값은 따옴표로 감싸며 빈 요소는 `<link />`처럼 닫습니다. 문자 `&`와 `<`는 `&amp;`와 `&lt;`로 이스케이프합니다.

`id`는 조회와 스타일 지정에 사용할 개별 요소의 식별자입니다. `class`는 공통 스타일을 적용할 그룹이며 여러 클래스 이름은 공백으로 구분합니다. RML이 임의의 태그에 브라우저 기본 외형을 부여하지는 않습니다. 특히 `div`를 블록으로 배치하려면 `display: block`이 필요합니다.

## RCSS로 스타일 지정

RML과 같은 디렉터리의 `tutorial.rcss`에 다음 규칙을 넣습니다. 실행기는 문서를 로드하기 전에 LatoLatin 일반 및 굵은 글꼴을 로드합니다.

```css
body {
  width: 100%;
  height: 100%;
  font-family: LatoLatin;
  font-size: 16dp;
  color: #f5f7fa;
  background: #1d2430;
}

div {
  display: block;
}

#window {
  width: 480dp;
  margin: auto;
  padding: 24dp;
  box-sizing: border-box;
  background: #2b3446;
  border: 1dp #46546e;
}

#title {
  font-size: 22dp;
  font-weight: bold;
  margin-bottom: 12dp;
}

.muted {
  color: #8fd3ff;
  margin-bottom: 18dp;
}

button {
  display: inline-block;
  padding: 10dp 24dp;
  background: #e84c88;
}

button:hover {
  background: #ff6aa2;
}
```

| 선택자 | 대상 |
| --- | --- |
| `button` | 모든 버튼 요소 |
| `#window` | `id="window"`인 요소 |
| `.muted` | `muted` 클래스가 있는 요소 |
| `#window button` | `#window` 안의 하위 버튼 |
| `button:hover` | 포인터가 올라간 버튼 |

`margin`은 상자 바깥 여백이고 `padding`은 콘텐츠와 테두리 사이 여백입니다. `box-sizing: border-box`는 선언한 너비에 안쪽 여백과 테두리를 포함합니다. 글꼴과 글자색은 부모에서 상속되며 더 구체적인 선택자가 일반 규칙을 덮어쓸 수 있습니다. 호버 스타일은 외형만 바꾸므로 클릭 동작에는 리스너가 필요합니다.

고정 UI 크기와 글꼴에는 `dp`를 사용하세요. 밀도 비율이 2이면 `16dp`는 렌더링 픽셀 32개가 되어 논리 크기를 유지합니다. `px`는 렌더링 픽셀이며 `%`의 기준 크기는 속성에 따라 다릅니다. 바인딩이 컨텍스트의 밀도 비율을 초기화합니다. [Retina 크기](rendering.ko.md)를 참고하세요. `font-family`는 파일명이 아니라 로드된 글꼴 내부의 패밀리 이름과 일치해야 합니다.

RCSS에는 고유한 지원 속성 집합이 있습니다. 예를 들어 테두리 단축 표기는 `border: 1dp #46546e`입니다. 모든 브라우저 CSS 선언이 지원된다고 가정하지 마세요. Flexbox, 템플릿, 데코레이터는 상위 문서의 전용 페이지에서 설명합니다.

## 클릭을 상태에 연결

실행기는 문서를 로드한 뒤 요소를 조회하고 프레임 루프 밖에서 리스너를 한 번 등록합니다.

```js
const counter = document.getElementById('counter');
const button = document.getElementById('increment');

if (!counter || !button) {
  throw new Error('Counter elements are missing');
}

let clicks = 0;

function increment() {
  clicks += 1;
  counter.innerRML = `Clicks: ${clicks}`;
}

button.addEventListener('click', increment);
```

프레임 루프는 SFML 이벤트를 `context.processEvent`에 전달하고 `update`와 `render`를 호출합니다. 클릭하면 기존 요소가 갱신되고 다음 프레임에 값이 표시됩니다. `innerRML`은 마크업을 해석하므로 신뢰할 수 없는 텍스트를 대입하기 전에 이스케이프하세요. 이 패키지는 RML의 `<script>` 내용이나 인라인 `onclick` JavaScript를 실행하지 않습니다.

문서를 언로드하기 전에 같은 함수로 `button.removeEventListener('click', increment)`를 호출합니다. 조회, 클래스 변경, 네이티브 객체 수명은 [문서와 이벤트](documents.ko.md)에서 설명합니다.

## 직접 수정하기

제목, `.muted` 색상, 버튼 안쪽 여백을 바꾼 뒤 monorepo 루트에서 다시 실행합니다.

```sh
node packages/sfml.js-rmlui/examples/demo.cjs
```

RML과 RCSS를 수정할 때는 네이티브 재빌드가 필요하지 않습니다. 실행기는 시작할 때 파일을 읽으며 파일 변경을 감시하지 않습니다. 간소화한 문서는 제목, 카운터, 버튼을 표시하며 Increment를 누르면 값이 1 증가합니다.

## 공식 문법 참고

- [RML 매뉴얼](https://mikke89.github.io/RmlUiDoc/pages/rml.html): [문법](https://mikke89.github.io/RmlUiDoc/pages/rml/syntax.html), [요소 색인](https://mikke89.github.io/RmlUiDoc/pages/rml/element_index.html), [템플릿](https://mikke89.github.io/RmlUiDoc/pages/rml/templates.html).
- [RCSS 매뉴얼](https://mikke89.github.io/RmlUiDoc/pages/rcss.html): [문법과 단위](https://mikke89.github.io/RmlUiDoc/pages/rcss/syntax.html), [선택자](https://mikke89.github.io/RmlUiDoc/pages/rcss/selectors.html), [속성 색인](https://mikke89.github.io/RmlUiDoc/pages/rcss/property_index.html).
- [기본 요소 스타일 가이드](https://mikke89.github.io/RmlUiDoc/pages/style_guide.html)와 [Flexbox](https://mikke89.github.io/RmlUiDoc/pages/rcss/flexboxes.html).

상위 온라인 매뉴얼은 개발 브랜치를 따릅니다. 이 바인딩은 RmlUi 6.3을 대상으로 API와 렌더링 기능 일부를 노출합니다. 상위 기능을 사용하기 전에 로컬 [렌더링 지원 범위](rendering.ko.md)와 [API 가이드](api.ko.md)를 확인하세요.
