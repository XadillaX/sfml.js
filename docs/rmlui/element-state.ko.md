# 요소 클래스, 속성과 포커스

## 네이티브 스타일 구성 요소 {#native-style-component}

`getStyle()`은 동일성을 유지하는 요소 소유
[`ElementStyle`](/reference/rmlui/classes/ElementStyle.html)을 반환합니다.
클래스와 의사 클래스 setter는 구성 요소를 직접 변경하므로 변경 후
`updateDefinition()`을 명시적으로 호출합니다. `setClass`는 포함 여부의 변경을
반환합니다. `setPseudoClass(name, activate, overrideClass = false)`는 활성 포함
여부의 변경을 반환하며 일반, 재정의, 결합 비트는 1, 2, 3입니다. 일반 활성 상태를
해제해도 재정의는 유지됩니다. `getClassNameList()`와 `getActivePseudoClasses()`는
네이티브 상태를 복사합니다.

`setProperty(id, property)`, `setCustomProperty('--name', property)`,
`setVarShorthand(id, property)`는 형식화된 값을 복사하고 ID나 이름을 변경 상태로
표시합니다. 약식에는 등록된 전역 ID와 VAR_EXPRESSION 문자열이 필요합니다.
`removeProperty`, `removeCustomProperty`, `removeVarShorthand`는 인라인 대체 값을
제거합니다. `getLocalStyleProperties()`는 사용자 속성과 약식을 포함한 전체 인라인
사전을 복사합니다.

`getProperty`와 `getCustomProperty`는 캐스케이드, 상속, 변수를 해석합니다.
`getLocalProperty`, `getLocalCustomProperty`, `getLocalShorthand`는 대체 전 로컬
값을 복사하며 `getLocalPropertyWithResolvedVariables`는 로컬 지정 값을 해석합니다.
`getSpecifiedProperty`, `getSpecifiedCustomProperty`, `getSpecifiedShorthand`는
변수 대체 전 캐스케이드 결과를 유지합니다. 모두 소유 사본이나 null을 반환합니다.
`iterate()`는 중복 없는 일반 ID를 복사합니다. `iterateAll(filter = null)`은
사용자 속성과 약식을 포함하고 약식 자리 표시자를 제외하며 상위 구현의 캐스케이드
필터를 유지합니다.

`resolveNumericValue(value, base)`와 `resolveRelativeLength(value,
RelativeTarget)`는 유한한 단일 단위로 네이티브 계산을 수행합니다.
`dirtyProperty`, `dirtyInheritedProperties`, `dirtyPropertiesWithUnits`,
`dirtyPropertiesWithUnitsRecursive`는 실제 변경 상태를 조작하며 재귀 작업에는 비 DOM
자식도 포함됩니다. `anyPropertiesDirty()`는 속성, 변수, 약식을 확인합니다.

```js
const style = element.getStyle();

style.setClass('selected', true);
style.updateDefinition();
style.setProperty(PropertyId.Width, new Property(24, Unit.PX));
const values = new ComputedValues(element);
const dirty = style.computeValues(
  values, parent.getComputedValues(), document.getComputedValues(),
  true, 1, { x: 320, y: 240 },
);

for (const id of dirty) {
  style.dirtyProperty(id);
}

context.update();
```

`computeValues`는 같은 요소에 연결된 소유 값으로 계산하며 실제 변경 집합을 소비하고
상속 의존성을 자식에게 전달합니다. 부모부터 자식 순서로 실행합니다. 요소 속성 변경
훅이나 배치 갱신을 실행하지 않으므로 다음 배치 갱신 전에 반환된 모든 ID를 다시
변경 상태로 표시하세요. 밀도는 유한한 양수, 뷰포트는 유한한 값이어야 합니다. 읽기
전용 출력, 다른 요소에 연결된 출력, 만료된 글꼴 핸들은 거부합니다.

`resolveKeyFrameProperty(id, propertyOrNull, block, resolver)`는 네이티브 변수와
약식을 확장합니다. `KeyFramePropertyResolver`는 선택 캐시, 의존성, 출력 저장소를
재사용합니다. 블록이나 변수 환경 변경 전에 `reset()`하세요. 로컬 변수는 블록 사전
다음 스타일시트와 상위 요소에서 찾습니다. `hasSubstitutedShorthands`는 지연 캐시
상태이고 `variableDependencies`는 마지막 해석의 의존성 사본입니다. 결과는 소유
사본이며 실패 시 null입니다. 요소 파괴 시 스타일이 무효화되고 런타임 종료 시
스타일과 해석기가 모두 무효화됩니다.

고빈도 수치는 `ElementCommandBuffer` 공유 영역과 `StyleSetNumeric`,
`StyleRemoveProperty`, `StyleGetNumeric`, `StyleGetLocalNumeric`,
`StyleResolveNumeric`, `StyleResolveRelativeLength`를 사용합니다. 상대 길이에서는
`properties`에 `RelativeTarget`을 저장합니다. 한 번의 submit으로 네이티브에서
명령 접두부를 순서대로 처리하며 요소별 Addon 호출을 제거합니다. 기존 사본, 수명,
콜백 규칙을 유지합니다.

## 요소 작업

`setClassNames(names)`는 전체 클래스 이름을 교체하고 `getClassNames()`는
공백 구분 문자열을 반환합니다. `setPseudoClass(name, active)`,
`isPseudoClassSet(name)`, `arePseudoClassesSet(names)`는 콜론 없는 네이티브
의사 클래스 이름을 사용합니다. 빈 목록은 모두 활성화된 것으로 판단합니다.
`getActivePseudoClasses()`는 독립 스냅샷을 반환합니다.

`getAddress(includePseudoClasses = false, includeParents = true)`는
`div#item.selected:hover < body` 같은 RmlUi 주소를 반환합니다.
리프에서 조상 방향이며 CSS 선택자가 아닙니다.

```js
element.setClassNames('item selected');
element.setPseudoClass('invalid', true);
element.setAttributes({
  title: 'Inventory',
  count: 12,
  sequence: 9223372036854775807n,
  position: { x: 20, y: 40 },
});
const count = element.getAttribute('count', 0);
const raw = element.getAttributeValue('sequence');
```

`setAttribute(name, value)`와 `setAttributes(values)`는 문자열, 불리언,
숫자, 부호 있는 또는 없는 64비트 BigInt, 벡터, 유형을 표시한 색, null을
지원합니다. null은 Variant NONE을 저장하며 키를 삭제하지 않습니다.
`hasAttribute(name)`으로 누락 키와 NONE을 구분하고 `removeAttribute(name)`으로
삭제합니다. `getNumAttributes()`는 네이티브 키 개수입니다.

일괄 설정은 키를 병합하고 그룹에 `OnAttributeChange`를 한 번 호출합니다.
모든 JS getter와 변환을 완료한 후 요소를 빌리고 변경합니다. 변환 오류 시
기존 속성은 유지됩니다. 네이티브 콜백의 부수 효과를 되돌리는 트랜잭션은
아닙니다. 입력 유형 변경에는 단일 속성과 같은 하위 트리 파괴 방지 검사를
적용합니다. 이벤트 전달 중인 대상의 속성 변경은 예외가 될 수 있습니다.
콜백 안의 읽기는 가능합니다.

기존 `getAttribute(name)`은 네이티브 문자열 변환 결과 또는 null을 반환합니다.
`getAttribute(name, defaultValue)`는 기본값 유형으로 변환 템플릿을 선택합니다.
number는 double, BigInt는 int64, INT64_MAX 초과 기본값은 uint64입니다.
키가 없으면 기본값을 반환합니다. 네이티브 규칙에 따라 number 유형의 잘못된
숫자 문자열은 0이 됩니다. 잘못된 정수 문자열은 BigInt 기본값을 유지합니다.
안전하지 않은 숫자 또는 문자열의 정수 변환은 사전에 예외를 던집니다.
null은 변환 유형을 지정하지 못하므로 기본값으로 거부합니다.

`getAttributeValue(name)`은 원시 값을 복사하며 누락 키와 NONE은 null입니다.
`getAttributes()`는 모든 키와 값을 자체 데이터 속성으로 복사합니다. 벡터와
색도 복사하므로 요소 파괴 후에도 읽을 수 있고, 스냅샷 변경은 네이티브 속성에
영향을 주지 않습니다.

속성 값은 수명 보호된 요소 참조, 소유 스타일 목록과 변환, 형식이 있는 스크립트
및 불투명 포인터 값을 허용합니다.
[`VariantValue`](/reference/rmlui/types/VariantValue.html)로 네이티브 표현을
선택합니다. 임의 호스트 객체에는 형식이 있는 포인터 선택자 또는 검증된 네이티브
출처가 필요합니다. 이벤트 매개변수는 콜백 범위 요소 참조도 지원합니다.
[네이티브 값](./numeric-values.ko.md)을 참고하세요.

`getContext()`는 소유 문서를 통해 고유 컨텍스트를 반환합니다. 분리 요소와
컨텍스트 루트는 네이티브와 같이 null입니다. `getFocusLeafNode()`는 가장 깊은
포커스 자손을 반환하며, 자손 포커스가 없으면 자신을 반환합니다.

[문서 제어](./documents.ko.md)와
[네이티브 유형 및 기본 동작](./rtti-default-actions.ko.md)을 참고하세요.

`getEventDispatcherSummary()`는 `click (2)` 같은 네이티브 진단 문자열을
복사합니다. 캡처와 일반 등록을 합산하며 리스너가 없으면 빈 문자열입니다.

`getEventDispatcher()`는 동일성을 유지하는 요소 소유
[`EventDispatcher`](/reference/rmlui/classes/EventDispatcher.html)를 반환합니다.
`attachEvent(idOrName, listener, capture = false)`와
`detachEvent(idOrName, listener, capture = false)`는 Element 등록과 공유하며
같은 등록은 중복하지 않습니다. `detachAllEvents()`는 위젯 리스너와 비 DOM 자식을
포함해 모두 재귀 해제합니다. 실행 중 콜백은 안전하게 끝내고 타입 해제 알림은
외부 경계에서 복사한 요소 식별자로 실행합니다. `toString()`은 같은 진단 문자열을
반환합니다. 파괴나 종료 시 무효화하며 토큰은 분리 요소를 유지합니다.

```js
const dispatcher = element.getEventDispatcher();

dispatcher.attachEvent(EventId.Click, onClick);
EventDispatcher.dispatchEvent(
  element, EventId.Click, 'click', {}, true, false, DefaultActionPhase.Target,
);
dispatcher.detachEvent(EventId.Click, onClick);
```

정적 `dispatchEvent(target, id, type, parameters, interruptible, bubbles,
defaultActionPhase)`에는 모든 플래그가 필수입니다. id는 리스너를 선택하고 type은
독립된 이름 복사본이며 등록 기본값은 읽지 않습니다. 상위와 같이 bubbles가 false여도
`TargetAndBubble`은 조상 기본 동작을 실행합니다. 매개변수 접근은 대상 검사 전입니다.

`getClosestScrollableContainer()`는 자신을 먼저 검사하고 조상으로 이동합니다.
먼저 `context.update()`를 호출하세요. auto/scroll은 해당 축의 내용이 표시
영역을 초과할 때만 해당하며 `overscroll-behavior: contain`은 넘침 없이도
해당합니다. 컨테이너가 없으면 null입니다.

`getDataModel()`은 컨텍스트 조회와 같은 검증된 `DataModelConstructor` 또는
연결되지 않았으면 null을 반환합니다. 분리 시 연결이 해제되고 재삽입 시 새 부모의
모델을 따릅니다. 모델 제거는 보유한 모델 핸들도 무효화합니다. 요소 파괴 후에는
조회할 수 없으며, 보유한 모델의 수명은 컨텍스트를 따릅니다. 조회는 기존 네이티브
포인터 인덱스를 사용하며 모델이나 요소 컬렉션을 순회하지 않습니다.
