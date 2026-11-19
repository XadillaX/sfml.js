# SVG와 Lottie

상위 SVG／Lottie 플러그인은 Native addon에 포함됩니다. RmlUi가 파싱,
지오메트리, 텍스처와 재생을 소유합니다. 일반적인 `context.update()`와
`context.render()` 호출로 네이티브 작업을 실행합니다.

```xml
<svg id="icon" width="40" height="20" viewBox="0 0 40 20">
  <rect width="40" height="20" fill="#00ff00"/>
</svg>
<svg src="assets/icon.svg" crop-to-content=""/>
<lottie src="assets/animation.json"/>
```

RCSS `width`／`height`는 렌더 영역, `image-color`는 색상,
`opacity`는 투명도를 설정합니다. 파일은 현재 네이티브 파일 인터페이스가
문서 URL의 상대 경로로 읽습니다. SVG는
`svg("assets/icon.svg" crop-to-content)` 데코레이터도 지원하며
`crop-to-content`는 내용 경계로 이미지를 자릅니다.

```js
const { ElementSVG, ElementLottie } = require('sfml.js-rmlui');

const icon = document.getElementById('icon');

if (icon instanceof ElementSVG) {
  icon.innerRML = '<rect width="40" height="20" fill="#ff0000"/>';
  icon.ensureSourceLoaded();
}

const animation = new ElementLottie('lottie');

animation.setAttribute('src', 'assets/animation.json');
document.appendChild(animation);
```

Element의 소유권 검사, 직접 생성, 네이티브 RTTI와
`getIntrinsicDimensions()`를 사용할 수 있습니다. `ensureSourceLoaded()`는
상위 공개 메서드를 호출하며 레이아웃과 업데이트가 일반적으로 자동 실행합니다.
SVG `innerRML`은 인라인 XML을 읽고 교체합니다. `src`가 있으면 상위 구현은
빈 문자열을 반환하고 인라인 교체를 무시합니다.

Lottie는 네이티브 시스템 시계로 반복 재생합니다. `renderSync`는 종횡비를
유지하며 RCSS 영역 비율이 다르면 내용을 가운데 배치합니다. 상위
ElementLottie에는 개별 일시 정지, 속도나 탐색 메서드가 없습니다.
공유 시스템 시계 설정은 런타임의 다른 시간 동작에도 영향을 줍니다.

[의존성 목록](../../packages/sfml.js-rmlui/tools/dependencies/optional-dependencies.json)은
LunaSVG 3.5.0, 포함된 PlutoVG 1.3.1, rlottie 0.2의 커밋과 SHA-256을 고정합니다.
PNG 디코더는 addon에 정적으로 연결되어 별도 로더 라이브러리가 필요 없습니다.
이 버전의 NEON은 ARM32 어셈블리가 필요하므로 ARM64는 상위의 이식 가능한
래스터라이저를 사용합니다.

[로컬 검증 기록](audit/6.3/vector-native-contracts.md)은 macOS arm64의
채널, 투명도, 소스 변경, 크기, 자르기, 데코레이터, 프레임, 내장 이미지와
재시작을 포함합니다. 다른 OS, 대체 글꼴과 전체 검증은 아직 완료되지 않았습니다.
