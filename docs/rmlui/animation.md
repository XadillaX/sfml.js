# Animation and easing

`Element.animate(nameOrId, target, duration, tween?, iterations?, alternate?,
delay?, start?)` starts or replaces an animation. `target` and `start` are
`Property` values, copied into native animation keys. Durations and delays use
seconds. Defaults match RmlUi: Linear/Out easing, one iteration, alternating
direction enabled, zero delay and the current property as the start value.
An iteration count of `-1` repeats forever.

```js
const { Property, PropertyId, Unit, Tween, TweenType, TweenDirection } =
  require('sfml.js-rmlui');

element.animate('width', new Property(180, Unit.PX), 0.4,
  new Tween(TweenType.Cubic, TweenDirection.Out));
element.addAnimationKey(PropertyId.Width, new Property(100, Unit.PX), 0.2);
```

`addAnimationKey` extends an existing animation by the supplied duration.
Both methods return the upstream boolean; adding a key without an animation
returns `false`. Unsupported property types also return `false`.
`context.update()` drives animations and dispatches `animationend`.
RmlUi limits each time step to 100 milliseconds and advances at most one
iteration per update. Continue updating even after a long pause.

`Tween` exposes all native easing families and directions, `evaluate(t)`,
`reverse()`, `clone()`, `equals()`, `notEquals()` and `toString()`. Evaluation
accepts finite progress in `[0, 1]`; curves may overshoot. The two-type
constructor uses an object to distinguish its second type from a direction:

```js
const mixed = new Tween(TweenType.Quadratic, { out: TweenType.Cubic });
const custom = new Tween(t => t * t); // Callback direction defaults to In.

console.log(mixed.evaluate(0.25), custom.evaluate(0.5));
```

Callbacks are synchronous and must return a finite number. The native value
uses float32 input/output. Callback exceptions reach the initiating JS call
after native processing unwinds. During evaluation, runtime/DOM calls are
rejected; nested evaluation of other Tweens is allowed. Built-in tweens work
outside runtime lifetime; callback tweens require initialization and expire
when RmlUi shuts down.

Animation copies retain callback identity and keep callbacks alive while
needed. Replacing or completing an animation releases its callback ownership.
Detached trees use V8-visible ownership so callback cycles can be collected.
The packaged dependency setup applies a checked extension to RmlUi 6.3 for
owned callback copies; its original function-pointer overload remains intact.

## Typed CSS motion values

`makeAnimation(fields?)`, `makeTransition(fields?)` and
`makeTransitionList(fields?)` construct copied native values. Every scalar
field uses native float32, integer or boolean storage; names preserve UTF-8.
An `Animation` defaults to duration/delay `0`, Linear/Out, `alternate=false`,
`paused=false`, `numIterations=1` and an empty name. A `Transition` defaults
to `PropertyId.Invalid`, Linear/Out, duration/delay `0` and
`reverseAdjustmentFactor=0`. `TransitionList` defaults to `none=true`,
`all=false` and an empty list. Supplying entries does not change those flags.

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

CSS transitions react to stylesheet rule changes, such as changing a class;
setting an inline width directly does not start a native CSS transition.
Animation names resolve `@keyframes` in the element's stylesheet.
`all=true` requires a first transition when `none=false`; setting an empty
all-transition list as a style throws before native code can index it.

Property values, typed property conversion, attributes and event parameters
round-trip both tagged lists with real `Tween` facades. Lists and Tween values
are copies; mutating a returned record does not change stored native values.
`Property.get(exemplar)` uses a default-constructed list on conversion failure;
attribute/event defaults retain the supplied fallback instead.
`animationEquals`, `transitionEquals` and `transitionListEquals` compare all
native fields and callback identity. Their negations represent native `!=`.

Property wrappers and returned snapshots keep callbacks alive with GC-visible
references. Attached native styles, attributes and active animation keys retain
their callbacks independently; clones bind to their own element. Removing a
value releases its lease once no native copy needs it. Detached trees and
property/closure cycles remain collectable. Callback lists follow the same
runtime, exception and reentry rules as `Tween` above.
