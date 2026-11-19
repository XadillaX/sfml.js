# 애니메이션과 이징

`Element.animate(nameOrId, target, duration, tween?, iterations?, alternate?,
delay?, start?)`는 애니메이션을 시작하거나 교체합니다. `target`과 `start`는
`Property`이며 네이티브 키에 복사됩니다. 시간 단위는 초입니다.
기본값은 RmlUi와 같은 Linear/Out, 반복 1회, 방향 교대 활성화, 지연 0초이며
현재 속성 값을 시작 값으로 사용합니다. 반복 횟수 `-1`은 무한 반복입니다.

```js
const { Property, PropertyId, Unit, Tween, TweenType, TweenDirection } =
  require('sfml.js-rmlui');

element.animate('width', new Property(180, Unit.PX), 0.4,
  new Tween(TweenType.Cubic, TweenDirection.Out));
element.addAnimationKey(PropertyId.Width, new Property(100, Unit.PX), 0.2);
```

`addAnimationKey`는 기존 애니메이션에 지정 시간만큼의 키를 추가합니다.
두 메서드는 네이티브 불리언을 반환합니다. 기존 애니메이션이 없거나
지원하지 않는 속성 형식이면 `false`입니다. `context.update()`가 애니메이션을
진행하고 `animationend`를 전달합니다. 시간 단계는 최대 100밀리초이며
업데이트마다 최대 한 번의 반복만 진행합니다. 오래 중지한 뒤에도 업데이트를
계속 호출해야 합니다.

`Tween`은 모든 종류와 방향 및 `evaluate(t)`, `reverse()`, `clone()`,
`equals()`, `notEquals()`, `toString()`을 제공합니다. 입력은 `[0, 1]` 범위의
유한한 수이며 출력은 오버슈트할 수 있습니다. 두 종류 생성자는 방향 인수와
구분하기 위해 두 번째 종류를 객체로 받습니다.

```js
const mixed = new Tween(TweenType.Quadratic, { out: TweenType.Cubic });
const custom = new Tween(t => t * t); // 콜백 기본 방향은 In입니다.

console.log(mixed.evaluate(0.25), custom.evaluate(0.5));
```

콜백은 유한한 수를 동기적으로 반환해야 합니다. 네이티브 입출력은 float32입니다.
예외는 네이티브 처리가 끝난 후 JS 호출자에게 전달됩니다. 평가 중 런타임과
DOM 작업은 금지하지만 다른 Tween의 중첩 평가는 허용합니다. 내장 Tween은
런타임 수명 밖에서도 사용할 수 있습니다. 콜백 Tween은 초기화가 필요하며
RmlUi 종료 시 무효화됩니다.

애니메이션 복사본은 콜백 동일성을 유지하며 필요할 때 콜백을 보관합니다.
교체하거나 완료하면 보관을 해제합니다. 분리된 트리는 V8에 보이는 참조를
사용하여 순환 참조를 수집할 수 있습니다. 패키지의 의존성 준비 과정은
RmlUi 6.3에 검증된 콜백 소유권 확장을 적용하며 원래 함수 포인터 오버로드를
유지합니다.

## CSS 모션 값 {#typed-css-motion-values}

`makeAnimation(fields?)`, `makeTransition(fields?)`,
`makeTransitionList(fields?)`는 네이티브 값 복사본을 생성합니다.
숫자는 float32 또는 정수, 플래그는 boolean, 이름은 UTF-8입니다.
Animation 기본값은 duration/delay `0`, Linear/Out, `alternate=false`,
`paused=false`, `numIterations=1`, 빈 이름입니다. Transition 기본값은
`PropertyId.Invalid`, Linear/Out, duration/delay `0`,
`reverseAdjustmentFactor=0`입니다. TransitionList 기본값은 `none=true`,
`all=false`, 빈 항목이며 항목을 지정해도 플래그는 자동으로 바뀌지 않습니다.

```js
const {
  makeAnimation, makeTransition, makeTransitionList,
} = require('sfml.js-rmlui');
const transitions = makeTransitionList({
  none: false,
  transitions: [makeTransition({
    id: PropertyId.Width, duration: 0.3,
    tween: new Tween(t => t * t), reverseAdjustmentFactor: 1,
  })],
});

element.setProperty(PropertyId.Transition,
  new Property(transitions, Unit.TRANSITION));
element.setProperty(PropertyId.Animation, new Property({
  type: 'animationlist',
  animations: [makeAnimation({ name: 'pulse', duration: 1 })],
}, Unit.ANIMATION));
```

CSS 전환은 클래스 변경처럼 스타일 규칙이 바뀔 때 시작합니다. 인라인 width를
직접 설정하면 전환은 시작하지 않습니다. 이름은 스타일시트의 `@keyframes`를
참조합니다. `none=false`와 `all=true`인 스타일에는 첫 항목이 필요하며
빈 목록은 네이티브 인덱스 접근 전에 예외를 던집니다.

Property 값, 유형 변환, 속성, 이벤트 매개변수는 두 태그 목록과 실제 Tween
파사드를 지원합니다. 항목과 Tween은 복사되므로 반환값 수정은 저장값에
영향을 주지 않습니다. `Property.get(exemplar)`는 변환 실패 시 기본 생성
목록을 반환합니다. 속성과 이벤트는 지정된 대체 값을 보존합니다.
`animationEquals`, `transitionEquals`, `transitionListEquals`는 모든 필드와
콜백 동일성을 비교하며 부정은 네이티브 `!=`에 대응합니다.

Property와 스냅샷은 GC에 보이는 참조로 콜백을 보관합니다. 연결된 요소의
스타일, 속성, 실행 중인 키는 독립적으로 보관하며 복제 요소는 자신의 소유권에
연결됩니다. 마지막 네이티브 복사본을 해제하면 보관을 해제합니다. 분리된
트리와 Property/클로저 순환은 수집할 수 있습니다. Tween과 같은 런타임,
예외 전달 및 재진입 규칙이 적용됩니다.
