# 글꼴

초기화 전에 네이티브 FreeType, HarfBuzz 또는 비트맵 엔진을 선택합니다.
선택하지 않으면 초기화가 기본 FreeType 엔진을 만듭니다.

```js
const rmlui = require('sfml.js-rmlui');
const engine = new rmlui.FontEngineInterface();

rmlui.setFontEngineInterface(engine);
rmlui.initialise(window);
engine.loadFontFace('regular.ttf', 'application-font', rmlui.FontStyle.Normal);
const face = engine.getFontFaceHandle(
  'application-font', rmlui.FontStyle.Normal, rmlui.FontWeight.Normal, 20,
);

if (face) {
  const shaping = new rmlui.TextShapingContext('en');

  shaping.letterSpacing = 1;
  const widths = engine.getStringWidths(face, [ 'one', 'two' ], shaping);
  const metrics = engine.getFontMetrics(face);

  console.log(widths, metrics.ascent, metrics.lineSpacing);
}
```

`getFontEngineInterface()`는 선택된 엔진의 동일한 래퍼를 반환하며 선택 전과 종료 후는
`null`입니다. 초기화 전 `setFontEngineInterface(null)`은 자동 선택을 복원합니다.
선택되어 실행 중인 엔진만 글꼴을 조작합니다. 추가 엔진 생성은 전역 provider를
초기화하지 않으며 Core만 Initialize와 Shutdown을 호출합니다. 기본 레이아웃,
글리프 생성과 아틀라스 관리는 C++에서 실행합니다.

서체와 효과 핸들은 불투명 Native 토큰입니다. 글꼴, 관리자 해제나 종료 후 무효입니다.
`prepareFontEffects(face, effects)`는 해당 서체와 글꼴 세대에 연결된 토큰을 반환합니다.
`generateString(manager, face, effects, text, position, colour, opacity, shaping)`
은 정수 너비와 순서 있는 `TexturedMeshList`를 반환합니다. 메시가 공유 정점과 인덱스
스냅샷을 소유하며 아틀라스 텍스처는 렌더 관리자에 속합니다. 글꼴 해제 시 텍스처가
무효가 됩니다. 색은 미리 곱한 RGBA 바이트이며 opacity는 효과의 불투명도로
기본값이 1입니다. 직접 생성할 때 Native가 미로드 글리프를 먼저 읽고 아틀라스를
구성합니다. 새 글리프로 아틀라스를 재구성하면 이전 텍스처 뷰가 무효화되지만
소유한 메시 바이트는 유효합니다.

`FontMetrics.values`는 어센트, 디센트, 줄 간격, x 높이, 밑줄 위치와 두께의 독립된
Native 스냅샷을 공유합니다. `TextShapingContext.enums`는 Direction/FontKerning,
`values`는 문자 간격을 공유합니다. 네이티브 작업은 사용 전에 인수를 검증하고
복사합니다. `getStringWidths`는 한 번의 Native 호출로 배열을 측정하고 Native 소유의
공유 int32 너비를 반환합니다. 숫자 할당은 회수와 종료 후에도 유효하며 메트릭
스냅샷 편집은 엔진 캐시를 변경하지 않습니다.

`FontMetrics.size`와 `hasEllipsis`는 복사된 정수와 불리언 필드를 읽습니다.
여섯 실수 getter는 Native 호출 없이 `values`를 읽습니다. 어센트는 기준선
위쪽을 양수로, 디센트와 밑줄 위치는 아래쪽을 양수로 표시합니다.
밑줄 위치에는 음수도 사용할 수 있습니다.

셰이핑 기본값은 빈 언어, `Style.Direction.Auto`, `Style.FontKerning.Auto`,
간격 0입니다. 숫자 getter와 setter는 공유 뷰를 사용하며 언어 읽기와 교체는
Native를 호출합니다. 콜백 안에서 언어를 교체해도 현재 배치의 동결된 인수는
바뀌지 않습니다. 초기화 전에 만들고 종료 후 재사용할 수 있지만 런타임 소유
환경 제한은 적용됩니다. 기본 FreeType은 `Style.FontKerning.None` 이외에는
커닝을 적용하며 글리프마다 문자 간격의 소수 부분을 버립니다. 언어와 방향은
공급자에 전달되지만 FreeType은 복잡한 문자 셰이핑을 수행하지 않습니다.
필요한 셰이핑 기능을 갖춘 공급자를 사용하세요.

반복 측정에는 고정 `FontMeasureBuffer`를 한 번 할당합니다.

```js
const buffer = new rmlui.FontMeasureBuffer(2, 64);

buffer.append('one');
buffer.append('two');
const widths = engine.measureStrings(face, buffer, shaping);

buffer.clear();
buffer.append('next');
engine.measureStrings(face, buffer, shaping); // 같은 widths를 재사용합니다.
```

`bytes`는 공유 UTF-8, `offsets`는 행 경계, `widths`는 고정 공유 출력입니다.
직접 쓸 때는 `measureStrings`의 다섯 번째 인수에 활성 행 수를 지정합니다.
경계는 0부터 시작하고 감소하지 않으며 바이트 용량 안에 있어야 합니다.
Native는 모든 활성 UTF-8 구간을 검증한 후 출력에 씁니다. 비활성 너비는
이전 값을 유지합니다. 스레드 이전은 거부되거나 독립 복사본을 만듭니다.
직접 `ArrayBuffer.transfer()`를 호출하면 측정 버퍼가 무효화됩니다. 이후 측정은
분리된 뷰를 거부하며 이전한 저장소는 유지됩니다.
측정은 입출력 저장소를 재사용하지만 처음 읽는 글리프는 메모리를 할당할 수
있습니다. `append`는 입력을 준비할 때 UTF-8 인코딩을 수행합니다.

RmlUi를 초기화한 뒤 문서보다 먼저 글꼴을 로드합니다. `loadFontFace`는
`Rml::LoadFontFace`의 세 오버로드를 지원합니다.

```js
const fs = require('node:fs');
const { loadFontFace, FontStyle, FontWeight } = require('sfml.js-rmlui');

loadFontFace('regular.ttf');
loadFontFace('collection.ttc', false, FontWeight.Normal, 1);
loadFontFace('regular.ttf', 'application-font', FontStyle.Normal);
loadFontFace(
  fs.readFileSync('italic.ttf'),
  'application-font', FontStyle.Italic, 530, true, 0,
);
```

첫 형식은 글꼴 내부의 패밀리와 스타일을 사용합니다. 이름을 지정하는 파일 및 메모리
형식은 전달한 패밀리와 스타일을 RCSS용으로 등록합니다. 빈 패밀리는 메타데이터의
패밀리와 스타일을 사용합니다. 경로는 활성 파일 인터페이스와 설정된
`initialise(window, { fileRoot })`를 통해 해석됩니다.

`FontWeight.Auto`(0)는 굵기를 감지하며 가변 글꼴의 사용 가능한 모든 굵기를
로드합니다. 1~1000의 정수는 가변 글꼴 굵기를 선택하거나 정적 글꼴의 등록 굵기를
변경합니다. `Normal`은 400, `Bold`는 700입니다. 컬렉션 인덱스 기본값은 0,
굵기는 Auto, 대체 지정은 false입니다. 대체 글꼴은 다른 서체에 없는 문자를
보완합니다. 중복 등록은 기존 대체 상태를 갱신하지 않습니다.

반환값은 RmlUi의 성공 여부입니다. 파일, 데이터 또는 컬렉션 페이스가 잘못되면
false를 반환하고 인수 타입이나 범위가 잘못되면 예외가 발생합니다. 동기 작업이며
런타임 소유 환경에서 이벤트 콜백 밖에서 호출해야 합니다.

메모리 입력은 Buffer, Uint8Array와 하위 뷰를 지원합니다. 네이티브 코드가 뷰
범위만 복사하므로 반환 후 입력을 변경, 전송, 회수할 수 있습니다. 공유되거나
분리된 버퍼는 거부됩니다. 복사본은 `shutdown` 이후까지 유지됩니다. 컬렉션
일부가 등록될 수 있으므로 실패한 로드의 복사본도 유지됩니다.

기본 엔진의 `releaseFontResources()`는 글리프와 텍스처 캐시를 해제하고 네이티브 글꼴 핸들을
무효화하며 모든 컨텍스트를 갱신합니다. 등록된 페이스와 원본 바이트는 유지되어
후속 레이아웃과 렌더링에서 캐시를 재구성할 수 있습니다. 초기화된 런타임에서
이벤트 콜백 밖에서 호출해야 합니다.

## 내장 엔진과 기능 확인

```js
const engine = new rmlui.FontEngineInterface('harfbuzz');

engine.registerLanguage('ar', 'Arab', 'rtl');
rmlui.setFontEngineInterface(engine);
rmlui.initialise(window);
engine.loadFontFace('Cairo-Regular.ttf', 'arabic', rmlui.FontStyle.Normal);
console.log(engine.kind, rmlui.getCapabilities());
```

생성자는 `freetype`, `harfbuzz`, `bitmap` 또는 동기 사용자 지정 콜백을 받습니다.
`kind`는 이 종류를 반환하며 콜백은 `custom`입니다. 종료 후 이전 엔진은 거부됩니다.
전환하려면 런타임을 종료한 뒤 새 엔진을 생성하고 다음 초기화 전에 선택합니다.

HarfBuzz 15.1.0은 C++에서 클러스터, 연결 글리프와 합자를 처리하며 기본 엔진과
동일하게 컴파일된 FreeType을 사용합니다. 언어, 방향, 커닝과 정수 자간을 따르지만
측정의 이전 문자는 업스트림에서 무시합니다. `registerLanguage`는 BCP47 태그를
네 글자 ISO15924 문자 코드와 `ltr`／`rtl`에 연결하여 Auto 방향에 사용합니다.
초기화 전에 호출하세요. 파일, 이름 지정 파일과 메모리 로드를 지원합니다.
이름 지정 파일 어댑터는 엔진 종료까지 원본 바이트를 유지합니다.

비트맵 엔진은 업스트림 단일 페이지 XML `.fnt`와 상대 경로 아틀라스를 읽고
아틀라스 전진 거리와 커닝을 적용합니다. 측정에는 이전 문자도 포함됩니다.
크기는 아틀라스로 고정되며 패밀리, 스타일과 크기는 업스트림의 느슨한 최적 일치를
사용합니다. 셰이핑, 자간, 커닝 전환, 글꼴 효과와 효과 불투명도는 무시합니다.
일반 메모리 글꼴 로드는 false입니다. Debugger의 특수 패밀리는 성공을 반환하지만
내장 글꼴을 읽지 않고 이미 로드한 비트맵 서체를 사용합니다.

`getCapabilities()`는 초기화 전, 실행 중과 종료 후 독립 스냅샷을 반환합니다.
`compiled`는 바이너리 링크 여부이고 `available`은 현재 런타임 가용성입니다.
모듈은 초기화가 필요하고 글꼴은 활성 선택도 필요합니다. 초기화 전 선택은
`selectedFontEngine`에 표시하지만 사용할 수는 없습니다. 모듈 가용성이 Lua 호스트나
표시된 Debugger의 존재를 뜻하지는 않습니다. 기능 플래그는 구현 사양을 설명하며
사용하려면 `compiled`와 `available`도 확인해야 합니다. 사용자 지정 기능은 콜백에 달립니다.

두 엔진은 기본으로 컴파일됩니다. 기존 패키지 디렉터리에서 비활성화할 수 있습니다.

```sh
GYP_DEFINES="rmlui_harfbuzz=0 rmlui_bitmap_font=0" npm run build
```

각 플래그는 독립적으로 0이나 1을 사용합니다. 미컴파일 엔진을 생성하면 예외가 발생하며
자동 대체하지 않습니다. 의존성 설치는 고정 아카이브를 계속 검증합니다.
모든 구성은 기존 빌드 디렉터리를 재사용합니다. 다른 OS와 전체 프로젝트 검증은 별도로 기록합니다.

## 사용자 지정 서체 엔진

생성자에 동기 `FontEngineCallbacks`를 전달하여 상위 가상 함수를 구현합니다.
Core가 초기화와 종료를 호출하며 세 로드 콜백은 파일 메타데이터, 지정한 이름,
독립된 메모리 바이트를 받습니다. 초기화 또는 서체 선택 중
`engine.createFontFace(metrics, advances?)`로 등록합니다. 토큰은 소유 엔진과
세대에 연결됩니다. 선택적 메트릭 및 버전 콜백을 생략하면 등록 메트릭과 공유
`face.version`을 사용합니다.

`FontAdvanceTable`은 독립된 코드포인트 너비를 Native에 저장합니다.
`face.advances`를 수정한 후 `face.version[0]`을 증가시키면 생성 지오메트리가
무효화됩니다. 자간은 지원하지만 커닝과 셰이핑은 계산하지 않습니다.
문맥 측정에는 압축 콜백을 사용합니다.

```js
let customFace;
const custom = new rmlui.FontEngineInterface({
  initialize() {
    customFace = custom.createFontFace({
      size: 20, ascent: 15, descent: 5, lineSpacing: 20, xHeight: 10,
      underlinePosition: 2, underlineThickness: 1, hasEllipsis: true,
    });
  },
  getFontFaceHandle() {
    return customFace.handle;
  },
  measureStrings(face, packed, count, shaping, priorCharacter) {
    for (let i = 0; i < count; ++i) {
      packed.widths[i] =
        (packed.offsets[i + 1] - packed.offsets[i]) * 7;
    }
  },
});

rmlui.setFontEngineInterface(custom);
rmlui.initialise(window);
```

이 예는 ASCII 바이트 너비만 계산합니다. 렌더링하려면 `generateString`에서
정수 너비와 Texture 뷰가 있는 소유 메시를 반환합니다. `prepareFontEffects`가
반환한 불투명 데이터는 엔진이 유지하여 생성 콜백에 전달합니다. Native가 메시
소유권을 받고 서체, 효과, 텍스처 세대를 검증합니다.

압축 콜백은 Native UTF-8 스냅샷, uint32 경계와 int32 결과를 받으며 비어 있지
않은 배치마다 한 번 실행합니다. 문자열별 JS 값을 만들지 않습니다. 상위 단일
문자열 요청도 count 1로 처리합니다. 모든 활성 너비를 쓰고 `undefined`를 반환합니다.
성공과 입출력 연결 상태를 확인한 후 결과를 반영합니다. 예외, Promise, Core 재진입,
뷰 분리는 원래 너비의 부분 변경 없이 호출을 거부합니다. Native 너비 표의
오버플로도 전체 출력을 유지합니다.

용량은 기하급수로 증가하며 안정된 호출은 같은 객체와 배열을 재사용합니다.
활성 입력 바이트와 경계, 결과 너비만 복사합니다. 후속 호출이 보관한 작업
공간 뷰를 덮어씁니다. 확장 또는 분리는 작업 공간을 교체하며 이전 배열은
GC와 종료 후에도 순수 Native 저장소를 유지합니다. Worker 이전은 거부되거나
복사됩니다. 호환 `getStringWidths`와 `getStringWidth`는 문자열 변환이 필요하며
단일 문자열 콜백은 행마다 실행합니다.

사용자 지정 해제는 서체와 효과를 무효화하고 작업 공간을 버린 후
`releaseFontResources` 콜백을 호출합니다. 해제 후 또는 다음 서체 선택에서
다시 등록합니다. 보관한 숫자 배열은 메모리 안전성을 유지합니다. 사용자 지정 기능은
콜백에 달립니다. 내장 이름으로 HarfBuzz나 업스트림 비트맵 엔진을 선택하세요.

패키지 디렉터리에서 `node tools/performance/measure-custom-font-performance.cjs`를 실행하여
1,000, 10,000, 100,000행에서 같은 출력의 Native, 압축 JS와 호환 측정을 비교합니다.
준비, 레이아웃, 렌더링, 표시와 GPU는 측정 밖입니다. JSON은 p50/p95와 양방향
호출, 할당, 명시적 복사 횟수를 기록합니다.
