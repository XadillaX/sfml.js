import {
  Animation, AnimationList, Transition, TransitionList, Tween, TweenType,
  Property, PropertyId, Unit, Element, RmlEvent,
  makeAnimation, makeTransition, makeTransitionList,
  animationEquals, transitionEquals, transitionListEquals,
} from '../../src';

const animation: Animation = makeAnimation({
  duration: 2, tween: new Tween(TweenType.Quadratic), name: 'pulse',
});
const transition: Transition = makeTransition({
  id: PropertyId.Width, duration: 1,
});
const animations: AnimationList = {
  type: 'animationlist', animations: [ animation ],
};
const transitions: TransitionList = makeTransitionList({
  none: false, transitions: [ transition ],
});
const property = new Property(animations, Unit.ANIMATION);
const result: AnimationList = property.get(animations);
const equal: boolean = animationEquals(animation, animation) &&
  transitionEquals(transition, transition) &&
  transitionListEquals(transitions, transitions);
declare const element: Element;
declare const event: RmlEvent;
const attribute: TransitionList = element.getAttribute('motion', transitions);
const style: TransitionList = element.getProperty('transition', transitions);
const parameter: AnimationList = event.getParameter('motion', animations);
element.setAttribute('motion', transitions);
element.setProperty(PropertyId.Animation, property);
element.dispatchEvent('motion', { animations, transitions });
void [ result, equal, attribute, style, parameter ];

// @ts-expect-error Tween is a checked native facade, not a CSS name.
makeAnimation({ tween: 'linear' });
// @ts-expect-error Native iteration counts are numeric.
makeAnimation({ numIterations: 'infinite' });
// @ts-expect-error A transition requires a PropertyId.
makeTransition({ id: 'width' });
const invalid: AnimationList = {
  // @ts-expect-error Lists contain typed animation records.
  type: 'animationlist', animations: [ transition ],
};
void invalid;
