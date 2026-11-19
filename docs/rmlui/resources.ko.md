# 렌더 리소스

이 API는 RmlUi를 초기화한 후 사용합니다. 리소스 변경은 소유자 스레드에서 실행하며
이벤트 콜백 내 호출은 거부됩니다.

```ts
import * as rmlui from 'sfml.js-rmlui';

const renderer = rmlui.getRenderInterface();
const context = rmlui.createContext('overlay', 800, 600, renderer);

for (const source of rmlui.getTextureSourceList()) {
  rmlui.releaseTexture(source, context.renderInterface);
}

rmlui.releaseCompiledGeometry(renderer);
```

| 작업 | 효과 |
| --- | --- |
| `getRenderInterface()` | 선택된 기본 렌더러를 반환하며 선택 전이나 shutdown 후에는 null입니다. |
| `createRenderInterface(window)` | 독립된 SFML 렌더러와 캐시를 생성합니다. |
| `setRenderInterface(renderer \| null)` | 초기화 전에 기본 렌더러를 선택하며 null은 자동 선택을 복원합니다. |
| `context.renderInterface` | 컨텍스트를 생성할 때 지정한 렌더러를 반환합니다. |
| `getTextureSourceList()` | 모든 관리자의 파일 URL을 네이티브 순서와 중복을 유지해 복사합니다. |
| `releaseTexture(source, renderer?)` | 로드된 텍스처 핸들을 해제한 경우에만 true를 반환합니다. |
| `releaseTextures(renderer?)` | 로드되거나 생성된 텍스처를 해제하고 다음 사용 시 다시 로드합니다. |
| `releaseCompiledGeometry(renderer?)` | 핸들을 해제하고 재컴파일할 메시를 유지합니다. |
| `releaseRenderManagers()` | 컨텍스트가 사용하지 않는 관리자 및 글꼴 리소스를 해제하고 활성 컨텍스트를 갱신합니다. |

렌더러를 생략하거나 `null`을 전달하면 모든 렌더러의 리소스가 대상입니다.
불투명한 `RenderInterface`를 전달하면 범위를 제한할 수 있습니다.
같은 창이라도 별도로 만든 렌더러는 독립된 캐시를 사용합니다.
경로 해석이 앞의 슬래시 등을 바꿀 수 있으므로 `getTextureSourceList()`가 반환한 URL을
그대로 사용하세요. 핸들을 해제한 뒤에도 캐시된 원본 경로는 남습니다.
생성된 텍스처에는 URL이 없습니다.

렌더러 참조는 컨텍스트나 미사용 관리자를 제거한 뒤에도 유효하지만 shutdown 시 무효화됩니다.
재초기화해도 복구되지 않습니다. 선택되거나 Native 관리자 및 사전 로드에서 사용하는
렌더러는 종료까지 창을 보유하며 미사용 렌더러는 회수됩니다.
그동안 창을 열어 두어야 합니다. 추가 렌더러는 기본 시스템 인터페이스나 고 DPI 설정을 바꾸지 않습니다.

`releaseRenderManagers()` 전에 분리된 요소를 모두 다시 연결하거나 회수하세요.
지오메트리 또는 콜백 텍스처를 유지할 수 있어 분리된 트리가 남으면 해제를 거부합니다.
이전 렌더러에 속한 요소는 다른 렌더러로 이동할 수 없습니다. 원래 관리자의 리소스를
보유하기 때문입니다. `clone()`으로 독립된 하위 트리를 만드세요.
같은 렌더러의 컨텍스트 간에는 동일성을 유지해 이동할 수 있습니다.

글꼴 원본 및 캐시 수명은 [글꼴 가이드](fonts.ko.md)를 참조하세요.

## 컴파일된 필터와 셰이더

`context.getRenderManager()`와 `element.getRenderManager()`는 관리자의 고유 래퍼를
반환하며 관리자가 없는 요소는 `null`을 반환합니다. 같은 렌더러를 사용하는 컨텍스트는
관리자를 공유합니다. `new RenderManager(renderer)`는 독립된 네이티브 관리자를
생성하고 런타임 종료까지 유지합니다. 래퍼 회수 후에도 폰트 텍스처 캐시는 유효합니다.
종료 시 폰트와 캐시 글리프 텍스처를 먼저 해제한 다음 관리자를 파괴합니다.

```ts
const manager = context.getRenderManager();
const compiled = manager.compileFilter('blur', { sigma: 2 });
const handles = new rmlui.FilterHandleList();

compiled.addHandleTo(handles);
console.log(compiled.isValid, handles.size);
compiled.release();
handles.clear();
```

`Filter.compileFilter(element)`는 요소의 관리자로 네이티브 가상 함수를 호출하고
상대 길이를 해석합니다. `compileFilter`와 `compileShader`는 각각 소유
`CompiledFilter`와 `CompiledShader`를 반환합니다. 사용자 정의 `Filter`의 반환값은
소유권을 RmlUi에 한 번만 이전하며 JS 리소스는 비워집니다.
적용할 요소의 관리자로 만든 리소스를 반환해야 합니다. 둘 다 `isValid`, 반복 호출 가능한
`release()`, `0n`을 반환하는 `invalidHandle()`을 제공합니다. 기본 생성자와
지원되지 않거나 실패한 컴파일은 빈 리소스를 생성합니다. 필수 매개변수가 없거나
잘못되면 예외를 던집니다. 스칼라, 벡터, 색상 및 색상 정지점 값을 복사합니다.

`addHandleTo`는 빈 리소스를 무시하고 순서와 중복을 유지합니다. 래퍼 회수 후에도 목록이
네이티브 리소스를 유지합니다. 명시적 해제는 리소스를 비우지만 기존 항목은 제거하지
않습니다. `size`는 항목 수이며 `clear()`는 목록의 소유권을 해제합니다.
포인터 값은 노출하지 않습니다. 종료 시 모든 컴파일된 리소스를 관리자보다 먼저 해제합니다.
전역 `releaseRenderManagers()`는 미사용 빌린 관리자와 리소스를 무효화하고,
활성 공유 관리자 및 독립된 관리자는 유지합니다.

렌더러는 내장 필터 10개, 저장 알파 마스크, 레이어, 그라데이션, creation과 명시적
셰이더 소스를 구현합니다. 매개변수와 네이티브 렌더링 인터페이스 규약은
[렌더링](./rendering.ko.md)을 참고하세요. 수명 테스트는 실제 실행한 작업을 검증합니다.

캐시되지 않은 텍스처 로드는 seek 두 번, 파일 길이와 실제 읽기 바이트 수를 확인합니다.
실패나 예외 시 열린 핸들을 한 번만 닫으며 업로드 성공 시에만 출력 크기를 변경합니다.
파일 이미지는 알파를 한 번 곱하고 생성 RGBA는 이미 사전 곱셈되어 있습니다.
잘못된 크기, 빈·짧은 픽셀 범위나 GPU resize 실패 시 네이티브 렌더러가 0을 반환하며
성공 업로드를 기록하지 않습니다. 앱 콜백 예외는 런타임 경계에서 전파됩니다.

## 메시, 지오메트리 및 텍스처 뷰

`new Mesh(vertexCount, indexCount)`는 네이티브 벡터를 할당합니다.
`vertices`는 20바이트 간격의 `Rml::Vertex`를 가진 쓰기 가능한 `Uint8Array`입니다.
0/4는 float32 x/y, 8–11은 미리 곱한 RGBA, 12/16은 float32 u/v입니다.
`indices`는 삼각형당 정점 번호 3개를 가진 `Int32Array`입니다.
뷰는 메시 회수와 종료 후에도 저장소를 유지합니다. `resize()`는 새 저장소에 공통 접두부를
보존하므로 변경 후 뷰를 다시 가져오세요.

`manager.makeGeometry(mesh)`는 유한 좌표, 삼각형 개수와 인덱스 범위를 검증하고,
네이티브 벡터를 복사한 뒤 비어 있지 않은 원본을 비웁니다. 기존 뷰는 지오메트리를
변경하지 못합니다. 인덱스가 비어 있으면 원본을 유지하고 빈 지오메트리를 반환합니다.
`mesh.isValid`는 네이티브처럼 인덱스가 비어 있지 않은지만 검사합니다.

`Geometry.render(translation, texture?, shader?)`는 RmlUi 반올림을 적용하고 같은
관리자의 텍스처 및 셰이더를 받습니다. 직접 RmlUi를 그리기 전에 대기 중인 sfml.js
창 명령을 flush하세요. `getMesh()`는 독립적인 변경 가능 사본을 반환하며 빈 리소스나
해제된 리소스에는 예외를 던집니다. `release()`는 메시를 반환하며
`GeometryReleaseMode.ClearMesh`는 폐기합니다. 재해제는 빈 메시를 반환합니다.
메시 비교에는 네이티브 값을 사용합니다.

`manager.loadTexture(source, documentPath?)`는 캐시된 `Texture` 뷰를 반환합니다.
기본 경로 해석기는 source 앞의 `/`를 제거하므로 필요 시 상대 이름과 문서 경로를 사용하세요.
로딩은 지연됩니다. `isValid`는 항목 존재를 의미하며 `getDimensions()`가 로딩을 수행하고
실패하면 0 크기를 반환합니다. `equals()`는 관리자 및 항목 동일성을 비교합니다.
`new Texture()`는 빈 뷰를 만듭니다.

리소스는 래퍼 회수 후에도 독립 관리자를 유지합니다. 미사용 빌린 관리자 해제나 종료 시
무효화됩니다. `releaseTexture`와 `releaseCompiledGeometry`는 GPU 데이터만 해제하므로
뷰와 메시 지오메트리는 재사용할 수 있습니다. [콜백 텍스처](
./render-state.ko.md#callback-textures)는 지연 바이트 생성, 소유 핸들 이전 및
레이어 저장을 제공하며 네이티브 소유권을 유지합니다.

## 타입 정점과 스프라이트 시트

`new Vertex()`는 정점 하나를 소유하며 `mesh.getVertex(index)`는 기존 항목을 매핑합니다.
`position`, `colour`, `texCoord`는 조회 시 사본을 반환하며 대입 시 모든 성분을 씁니다.
`positionView`, `colourView`, `texCoordView`는 네이티브 메모리를 공유합니다.
새 정점은 영벡터와 불투명 검정(`red/green/blue = 0`, `alpha = 255`)입니다.
색상은 미리 곱한 바이트를 받으며 자동으로 곱하지 않습니다. `equals()`는 부호 있는 0은
같고 NaN은 다르게 비교합니다. 크기 변경, 지오메트리 전송, 회수 및 종료 후에도 기존 뷰는
원래 할당을 유지합니다.

`new TextureSource(source?, documentPath?)`는 입력 문자열을 유지하며 관리자별로
텍스처를 캐시합니다. `getSource()`, `getDefinitionSource()`는 원본 문자열을 반환하고
`getTexture(manager)`는 지연 로딩하는 `Texture` 뷰를 반환합니다.
캐시된 관리자를 유지하며 미사용 관리자 해제 시 캐시를 초기화합니다. 유효한 관리자로
재사용할 수 있지만 런타임 종료 시 무효화됩니다.
`TexturedMesh`는 `{ mesh, texture }` 레코드이며 `TexturedMeshList`는 순서 있는 배열입니다.
메시는 `makeGeometry()`에, 텍스처는 `Geometry.render()`에 전달합니다.

`SpritesheetList`는 네이티브 모음을 소유합니다.
`addSpriteSheet(name, imageSource, definitionSource, definitionLineNumber,
displayScale, definitions)`는 픽셀 단위 `[name, { p0, p1 }]` 쌍을 복사하며 같은 이름을
덮어씁니다. `merge(other)`는 시트를 추가하고 같은 이름을 덮어쓰며 자기 병합은 사본을
사용합니다. `reserve(sheets, sprites)`는 `numSpriteSheets()`, `numSprites()`를
변경하지 않고 용량을 예약합니다. `getSprite(name)`는 null 또는
`{ rectangle, spriteSheet }` 사본을 반환합니다.

`Spritesheet`는 `name`, `definitionLineNumber`, `displayScale`(해상도의 역수) 및 독립적인
`textureSource`를 가집니다. 생성자 인수는 상위 라이브러리와 같은 이름, 소스, 문서 경로,
행 번호, 배율입니다. 삽입, 병합 및 목록 회수 후에도 반환된 메타데이터는 유지되며 사본
수정은 목록을 변경하지 않습니다. `SpriteMap`은 이름을 사본에 매핑합니다.
텍스처 소스에는 위의 런타임 수명 규칙이 적용됩니다.

## Decorator 생성과 수동 요소 데이터

`new DecoratorInstancer(callback)`는 동기
`(name, properties, active) => Decorator | null` 팩터리를 받습니다.
`registerProperty`, `registerShorthand`로 로컬 속성을 정의한 뒤
`DecoratorInstancer.register(name, instancer)`로 등록합니다. 기존 선언이 참조하므로
교체된 인스턴서도 종료까지 유지됩니다. 미등록 콜백의 순환 참조는 GC할 수 있습니다.

`active`는 콜백 동안만 유효한 `DecoratorInstancerInterface`이며 중첩 위임도 지원합니다.
`getSprite(name)`는 정보 사본을, `getTexture(filename)`는 선언 출처 경로로 해석한
텍스처를, `getRenderManager()`는 검증된 관리자를 반환합니다. 반환 또는 예외 이후
저장한 인터페이스는 사용할 수 없으며 반환된 리소스의 수명은 독립적입니다.
속성 출처가 없으면 빈 텍스처를 반환합니다.

```js
const builtin = rml.DecoratorInstancer.get('horizontal-gradient');
const defaults = new rml.PropertyDictionary();

builtin.getPropertySpecification().setPropertyDefaults(defaults);
rml.DecoratorInstancer.register('delegated',
  new rml.DecoratorInstancer((_name, _properties, active) =>
    builtin.instanceDecorator('horizontal-gradient', defaults, active)));
```

사전에는 기본값을 포함한 모든 등록 속성이 필요하며 콜백은 사본을 받습니다.
문서 로딩 중에도 생성하므로 DOM 변경, 속성 등록, 런타임 종료 및 같은 인스턴서의
재귀 호출은 거부합니다. RmlUi는 장식기를 여러 요소에 공유하고 데이터를 재생성합니다.

`decorator.generateElementData(element, paintArea = BoxArea.Padding)`는 소유
`DecoratorData` 또는 null을 반환하며 영역은 `Auto` 이외의 구체적인 값이어야 합니다.
`renderElement(element, data)`는 원래 장식기, 요소 및 관리자를 검사합니다.
직접 렌더링 전에 대기 중인 SFML 명령을 flush하세요. `releaseElementData(data)`는
한 번만 해제하며 장식기가 유효하면 반복할 수 있습니다. 원래 요소 파괴 후에도 해제할 수
있고 버려진 데이터는 GC가 해제합니다. 관리자 해제 시 수동 데이터를 먼저 해제하고
장식기를 무효화합니다. RmlUi가 자동 관리하는 요소 데이터와는 독립적입니다.

`new Decorator<Data>(manager, callbacks)`는 세 네이티브 가상 함수를 동기
JavaScript로 구현합니다. `generateElementData(element, paintArea)`는 객체 또는
null을 반환하며 null은 렌더링을 비활성화합니다. `renderElement(element, data)`와
`releaseElementData(data)`는 동일한 객체를 받습니다. Promise와 원시 값은 거부합니다.
요소 조회와 지오메트리 생성·렌더링·해제는 가능하며 DOM 변경, 종료 및 같은 장식기의
재귀 콜백은 거부합니다.

사용자 정의 장식기는 `addTexture(texture)`, `getNumTextures()`,
`getTexture(index = 0)`를 제공합니다. 텍스처는 같은 렌더 관리자에 속해야 합니다.
유효하지 않은 텍스처 추가는 -1, 중복 추가는 기존 인덱스를 반환합니다.
범위 밖 조회는 유효하지 않은 텍스처를 반환하며 내장 장식기에는 이 작업을 허용하지 않습니다.

네이티브 문서와 전역 스타일 캐시는 비활성 미디어 블록을 포함해 콜백을 유지합니다.
JS 소유 시트, 컨테이너, 명시적 생성 인터페이스와 분리된 트리는 GC에 보이는 참조를
사용하므로 필요 없는 순환은 수집됩니다. 수동 데이터의 소유권은 독립적이므로 요소를
유지해도 그 요소를 위해 생성한 모든 수동 데이터를 유지하지는 않습니다.

명시적 해제는 가장 바깥 RmlUi 호출이 반환하기 전에 콜백을 호출합니다.
네이티브 정리는 안전한 런타임 경계까지
콜백을 지연하며 GC 소멸자에서 JavaScript를 실행하지 않습니다. GC에 의한 해제는
다음 RmlUi 호출에서 처리하고 이미 수집된 데이터나 클로저는 건너뜁니다.
확정적인 정리는 명시적으로 해제해야 합니다. 종료 시 관리자를 무효화하기 전에
수동 데이터를 해제한 뒤 콜백 클로저를 지웁니다.

## 스타일시트와 명시적 생성 인터페이스

`StyleSheetContainer`는 파싱한 RCSS와 미디어 블록을 소유합니다.
`loadStyleSheetContainer(source, sourceUrl = '', beginLineNumber = 1)`로
텍스트를 로드합니다. URL은 상대 리소스의 기준이며 양수 행 번호는 출처를 기록합니다.
반환값은 상위 파서의 결과이며 실패해도 일부 파싱된 규칙이 남을 수 있습니다.
로드와 병합은 컴파일 전에 수행합니다. `mergeStyleSheetContainer(other)`는
컴파일된 수신자와 자기 병합을 거부합니다. `combineStyleSheetContainer(other)`는
새로운 컴파일 전 결합 컨테이너를 반환합니다.

`updateCompiledStyleSheet(context)`는 뷰포트, 밀도, 테마 조건을 평가합니다.
`getCompiledStyleSheet()`는 첫 컴파일 전에는 null, 이후에는 검증된 읽기 전용
`StyleSheet` 뷰를 반환합니다. 업데이트가 true이면 이전 뷰가 모두 무효화되며
false이면 유지됩니다. 미디어 블록이 남아 있어도 이전 뷰는 무효화됩니다.
뷰는 JS 래퍼와 독립적으로 네이티브 컨테이너를 유지합니다.

`sheet.combineStyleSheet(other)`는 독립적인 수정 가능 시트를 생성합니다.
소유 결합 결과에서만 `mergeStyleSheet(other)`와 `buildNodeIndex()`를 사용합니다.
요소 매칭 전에 인덱스를 구축하세요. `getSprite`, `getNamedDecorator`, `getKeyframes`는
독립된 정보와 속성 사전을 반환하며 없으면 null입니다. 결합할 때 뒤쪽의 같은 이름
장식기와 애니메이션이 우선합니다.

`getElementDefinition(element)`는 계층을 매칭하여 불변 네이티브
`ElementDefinition`을 반환합니다. 매칭이 없거나 텍스트 요소이면 null입니다.
`getProperty(id)`, `getCustomProperty(name)`, `getPropertyIds()`,
`getProperties()`는 독립된 사본을 반환합니다. 요소 파괴 및 시트 병합 후에도
정의는 유지되며 shutdown 시 무효화됩니다. 병합 후 인덱스를 다시 구축하세요.

`element.getStyleSheet()`는 문서의 컴파일 뷰를 반환합니다.
`document.getStyleSheetContainer()`는 읽기 전용이며 load, merge, update는
예외를 던집니다. `document.setStyleSheetContainer(container)`는 소유자를 유지하고
미디어 쿼리를 컴파일합니다. null은 규칙을 제거합니다. `updateDocument()`로
스타일과 레이아웃을 적용하세요. 여러 문서가 컨테이너를 공유해도 미디어 변경은
이전 뷰를 무효화합니다. 문서 파괴나 교체 후에도 유지한 컨테이너와 재컴파일하지
않은 뷰는 유효합니다. `reloadStyleSheet()`는 읽을 수 있는 원래 문서 URL에서
style 태그와 연결된 RCSS를 다시 읽으며 DOM 및 인라인 속성을 유지합니다.

`new DecoratorInstancerInterface(manager, sheet, source = null)`은 네이티브
소유자를 유지하고 `PropertySource`를 복사합니다. 팩터리 콜백 밖에서도
`instancer.instanceDecorator`에 전달할 수 있습니다. 출처가 null이면 파일 이름
텍스처 요청은 빈 텍스처를 반환합니다. 시트나 관리자가 무효화되면 인터페이스도
무효화됩니다. 콜백에서 받은 인터페이스는 여전히 콜백 종료 시 무효화됩니다.
shutdown은 시트와 컨테이너를 무효화합니다.
`sheet.instanceDecorators(manager, declarations, source = null)`은 공유 장식기의
독립 배열을 반환합니다. 비어 있지 않은 선언 문자열은 문자열, 원본 경로, 렌더 관리자로
캐시하며 빈 문자열은 매번 새로 생성합니다. 병합하면 캐시를 지우고 관리자 파괴 시
리소스 해제 전에 해당 관리자의 캐시를 해제합니다. 반환된 장식기는 원본 시트가 회수되어도
유효하지만 원래 관리자에 속합니다. 팩터리 예외는 호출자에게 전달하며 네이티브 생성
실패는 빈 배열을 반환합니다. [Stream 입력](./streams.ko.md)은 파일, 메모리와
동기 콜백을 지원합니다.

## Factory 해석과 캐시 {#factory-parsing-and-caches}

`Factory.instanceElement(parent, instancer, tag, attributes = {})`는 독립된
태그와 소유 Variant 속성으로 네이티브 생성기를 호출합니다. 실제 네이티브 하위 타입을
유지하고 `parent.appendChild(node)` 전까지 분리된 상태입니다. null 부모를 지원하며
생성 실패 시 null을 반환합니다. 등록된 `*`는 알 수 없는 이름의 대체 생성기입니다.
속성에 빌린 요소 포인터를 저장할 수 없습니다.

`Factory.instanceElementText(parent, text)`는 번역과 엔티티 디코딩 후 네이티브
텍스트 또는 RML 자식을 추가합니다. 공백만 있으면 추가하지 않습니다.
`instanceElementStream(parent, stream)`은 현재 위치와 원본 URL로 해석합니다.
네이티브 결과와 부분 쓰기를 유지합니다. 6.3 스트림 도우미는 구문 진단 후에도
true를 반환하며 호스트 읽기 실패는 예외로 전달합니다. 컨텍스트 루트에 추가하거나
콜백에서 다시 해석하는 작업은 거부합니다.

`instanceStyleSheetString(text)`, `instanceStyleSheetFile(filename)`,
`instanceStyleSheetStream(stream)`은 컴파일 전 소유 컨테이너를 반환하고 해석 실패 시
null을 반환합니다. 파일은 설정한 네이티브 파일 인터페이스를 사용하며 열기 실패도
null입니다. 해석한 규칙이 없으면 null이며 구문 진단 후에도 부분 컨테이너를
반환할 수 있습니다. 결과는
`document.setStyleSheetContainer(container)`로 적용합니다.

`Factory.clearStyleSheetCache()`와 `Factory.clearTemplateCache()`는 이후 로드에
적용되며 보유한 컨테이너와 컴파일 뷰를 무효화하지 않습니다. 콜백 내 캐시 변경은
거부합니다. `isStructuralDataView(name)`은 `for`와 같은 접두사 없는 정확한 이름을
사용합니다. `getStructuralDataViewAttributeNames()`는 전체 `data-` 속성 이름의
독립 배열을 반환합니다. 종료 시 네이티브 소유자는 무효화됩니다.

[요소 팩터리](../../packages/sfml.js-rmlui/examples/factory-elements.cjs)
앱은 네이티브 입력, 자식 해석 및 캐시 비우기를 검증합니다.

## 요소 생성기 {#element-instancers}

`ElementFormControl.createInstancer(valueAttribute = 'value')`는 JS 콜백 없는
네이티브 컨트롤 생성기를 제공하며 가상 함수의 값을 지정 속성에 저장합니다.
다른 생성기와 같은 검사된 생성, 복제, 해제 출처를 유지합니다. 공유 데이터 갱신,
직접 생성의 속성 규칙과 제출 태그는 [폼 컨트롤](./controls.ko.md)을 참조하세요.

`Factory.getElementInstancer(tag)`는 고유한 `ElementInstancer` 또는 null을
반환합니다. 알 수 없는 태그는 등록한 `*`로 대체합니다. 등록 이름은 소문자로
변환하지만 검색 키는 정확한 값을 사용합니다.
`Factory.registerElementInstancer(name, instancer)`는 종료까지 어댑터를 유지합니다.
교체한 어댑터도 기존 요소가 사용하는 동안 유지됩니다.
null을 전달하면 해당 이름을 비활성화하며 `*`를 비활성화하면 대체 생성기도 제거합니다.

```js
const input = Factory.getElementInstancer('input');
const custom = new ElementInstancer((parent, tag, attributes) =>
  input.instanceElement(parent, tag, attributes), snapshot => {
  console.log('Released', snapshot.tagName, snapshot.attributes);
});

Factory.registerElementInstancer('account-control', custom);
const field = Factory.instanceElement(null, 'account-control', 'account', {
  type: 'text', value: 'Native control',
});

custom.releaseElement(field);
```

생성 콜백은 null 또는 다른 생성기의
`instanceElement(parent, tag, attributes = {})`로 만든 분리 요소를 반환합니다.
직접 호출은 생성기 동작을 따르며 Factory는 이후 속성과 플러그인 알림을 적용합니다.
Factory와 clone은 네이티브 하위 타입과 원래 생성기를 유지하며 중첩을 지원합니다.
빌린 요소, 연결된 요소, 호출 중이거나 생성 출처를 기록하지 않은 요소는 전달하지
못합니다. 콜백 속성과 해제 알림은 독립된 복사본입니다.

`releaseElement(element)`는 이 정확한 어댑터로 만든 소유 분리 요소만 받으며
파괴 후 모든 래퍼가 무효화됩니다. 네이티브는 동기 파괴하고 이후 안전한 경계에서
선택적 해제 관찰자에 파괴 전 `{ tagName, attributes }`를 전달합니다.
생성 콜백 내부 GC를 포함해 네이티브 소멸자는 JS를 호출하지 않습니다.
GC 알림은 다음 네이티브 호출에서 관찰자에 도달할 수 있을 때 실행합니다.
회수한 관찰자와 환경 정리에서는 JS를 호출하지 않습니다.
알림 예외는 전달하지만 네이티브 파괴는 완료됩니다.

다른 생성기와 값 복사본을 사용할 수 있으며 DOM 및 등록 변경과 재귀는 거부합니다.
등록한 어댑터는 종료까지 유지합니다. 미등록 어댑터는 네이티브 트리 또는 분리 소유자의
보이는 참조를 따라 순환 GC를 허용합니다. 종료 시 어댑터를 무효화하고 네이티브 풀을
파괴하기 전에 요소를 해제합니다. 요소 팩터리는 사용자 입력의 생성과 해제를 검증합니다.

## 컨텍스트 생성기와 소유 문서 스트림

`new ContextInstancer()`는 네이티브 생성자를 사용합니다.

`new Context(name, manager, handler)`는 등록된 Factory 생성기를 선택하지 않고
소유 네이티브 컨텍스트를 직접 생성합니다. 크기 0과 밀도 1을 유지하며 Core 등록 및
플러그인 생성 알림을 수행하지 않고 `remove()` 또는 GC로 해제합니다.
텍스트 입력 처리기는 명시적으로 전달하며 null은 그대로 유지합니다.
`context.getTextInputHandler()`는 실제 검증된 대여 처리기 또는 null을 반환합니다.
사용자 처리기 및 네이티브 조합 입력 세션은 [텍스트 입력](./text-panels.ko.md)을
참고하세요. 실제 입력기 검증은 [IME 기록](./audit/6.3/native-ime-checkpoint.md)에 별도로 기록합니다.

생성에는 `*` 생성기의 null이 아닌 루트와 `body` 생성기의 `ElementDocument`가 필요합니다.
비활성화, 생성 거부 또는 잘못된 문서 타입은 역참조 전에 예외를 던지며 콜백 오류의
원래 동일성을 유지합니다. 실패 시 할당한 요소를 파괴하고 Core 등록을 추가하지 않습니다.

`new ContextInstancer(create, release?)`는 다른 타입 생성기에 할당을 위임하고
네이티브 파괴 후 안전한 경계에서 `{ name }`을 알립니다.
반환한 할당은 요청한 이름, 렌더링 관리자, 네이티브 텍스트 입력 처리기와 일치해야 합니다.
null은 생성을 거부하며 예외는 전파됩니다. 중첩 해제 알림은 외부부터 내부 순서입니다.

`Factory.registerContextInstancer(instancer)`는 `createContext`의 생성기를 선택하고
교체한 생성기도 종료까지 유지합니다. `Factory.instanceContext(name, manager, handler)`와
`instancer.instanceContext(name, manager, handler)`는 Core에 등록하지 않은 소유
컨텍스트를 반환합니다. 텍스트 입력 처리기가 없으면 null을 전달합니다.
기본 크기는 0이므로 레이아웃 전에 `setDimensions`를 사용합니다.
자식은 V8의 가시 참조로 컨텍스트를 유지하며 클로저 순환은 회수할 수 있습니다.
`context.remove()`는 같은 이름의 등록 컨텍스트를 제거하지 않고 해당 할당을 해제합니다.
`instancer.releaseContext(context)`는 최외곽 생성기도 검사하고 등록 컨텍스트를 거부합니다.
전체 폰트 자원 또는 렌더링 관리자 해제 전에 소유 컨텍스트를 해제해야 합니다.
상위 자원 무효화는 등록된 Core 컨텍스트만 순회합니다.

`Factory.instanceDocumentStream(context, stream, documentBaseTag)`는 원본 URL 및
네이티브 문서 헤더 처리로 소유 분리 문서를 해석합니다.
기본 태그는 문서 생성기를 선택하며 원본은 `body` 등 등록된 XML 처리기를 사용합니다.
컨텍스트에 삽입하지 않고 로드 알림도 보내지 않습니다. 자식은 문서를 유지합니다.
컨텍스트 제거 시 빌린 자원보다 먼저 해당 문서를 파괴합니다.
스트림 예외는 전파되며 구문 진단 후 일부 문서를 반환할 수 있습니다.

```js
const custom = new ContextInstancer((name, manager, handler) =>
  new Context(name, manager, handler));

Factory.registerContextInstancer(custom);
const owned = Factory.instanceContext(
  'independent', context.getRenderManager(), null);

owned.setDimensions(760, 480);
const parsed = Factory.instanceDocumentStream(owned, new StreamMemory(
  Buffer.from('<rml><head/><body id="parsed"/></rml>')), 'body');

console.log(parsed.id, owned.getNumDocuments()); // parsed, 0
owned.remove();
```

## 이벤트 생성기와 소유 이벤트

`new EventInstancer()`는 네이티브 이벤트를 생성합니다. 사용자 콜백은 다른 생성기의
소유 `RmlEvent`를 반환하며 null은 생성을 거부합니다. 대상, ID, 유형과 중단 플래그는
요청과 같아야 하며 매개변수는 변경할 수 있습니다. 소유권 이전 후 원본 핸들은 만료됩니다.
`Factory.registerEventInstancer(instancer)`는 실제 네이티브 발송에 적용하며
교체한 등록 생성기도 종료까지 유지합니다.

`Factory.instanceEvent(target, id, type, parameters, interruptible)`와
`instancer.instanceEvent(...)`는 발송하지 않은 소유 이벤트를 반환합니다.
`event.setPhase(phase)`와 `event.setCurrentElement(elementOrNull)`는 마우스 투영을
포함하는 네이티브 설정을 실행하고 보관한 필드를 갱신합니다. 전파와 매개변수 작업에는
유효한 이벤트가 필요하며 소유 이벤트는 대상, 현재 요소와 매개변수 요소도 검사합니다.
`event.release()`는 소유 이벤트를 해제하고 `instancer.releaseEvent(event)`는
정확한 최외곽 생성기도 검사합니다. 발송 콜백에서 빌린 이벤트는 해제할 수 없습니다.
GC와 종료에서도 삭제하며 복사한 필드는 해제 후에도 읽을 수 있습니다.
해제 콜백은 삭제 후 안전한 경계에서 `{ type, id }`를 최외곽 생성기부터 받으며
환경 정리에서는 JS를 호출하지 않습니다.

```js
const allocator = new EventInstancer();
const custom = new EventInstancer((...args) =>
  allocator.instanceEvent(...args), snapshot => console.log(snapshot.type));

Factory.registerEventInstancer(custom);
const id = registerEventType('account-save', true, true);
const event = Factory.instanceEvent(input, id, 'account-save',
  { value: input.getValue() }, true);

event.setPhase(EventPhase.Target);
event.setCurrentElement(input);
console.log(event.getParameter('value', ''));
event.release();
```

## 네이티브 리스너와 인라인 속성

`new EventListener(process, attach?, detach?)`는 네이티브 리스너를 만듭니다.
`element.addEventListener(type, listener, capture?)`에 전달하고 같은 인자로
`removeEventListener`를 호출합니다. 여러 요소, 이벤트 유형과 단계에 등록할
수 있으며 같은 등록은 중복되지 않습니다. 네이티브 요소가 콜백을 유지하고
분리한 요소와 콜백 순환은 회수할 수 있습니다.

`EventListenerInstancer(create)`는 정확한 속성값과 요청 요소를 받으며
유효한 `EventListener` 또는 null을 반환합니다.
`Factory.registerEventListenerInstancer(instancerOrNull)`은 실제 RML
`on*` 속성을 제어하고 생성기를 교체 또는 종료까지 유지합니다.
속성 문자열을 JavaScript로 평가하지 않습니다. 속성 교체와 삭제는 이전
리스너를 해제합니다. 생성 중 요소의 `id`, `tagName` 읽기와 리스너 생성은
허용하지만 DOM 변경은 거부합니다.
`Factory.instanceEventListener(value, element)`와
`instancer.instanceEventListener(value, element)`는 미등록 리스너를
반환하므로 등록할 때까지 결과를 유지해야 합니다.

등록과 해제 콜백은 등록 시 복사한 `{ id, tagName }`을 받습니다.
실제 등록마다 네이티브 처리가 끝난 외부 경계에서 한 번 알립니다.
환경 정리는 JavaScript를 호출하지 않습니다. 수동 `listener.onAttach(element)`,
`onDetach(element)`는 알림만 전달하며 실제 등록은 요소 작업을 사용합니다.
`listener.processEvent(event)`는 이벤트 발송 없이 임시 이벤트 핸들을 전달하고
처리 중 원본 이벤트 해제, 이전과 재귀 처리를 거부합니다.
모든 등록을 해제한 후 비활성 리스너를 `listener.release()`로 파괴할 수 있습니다.
종료 시 리스너와 생성기를 무효화하고 콜백 참조를 해제합니다.

```js
Factory.registerEventListenerInstancer(new EventListenerInstancer(
  (action, element) => new EventListener(event => {
    if (action === 'save') {
      console.log(element.id, event.type);
    }
  })));
button.setAttribute('onclick', 'save');
button.click();
button.removeAttribute('onclick');
```
