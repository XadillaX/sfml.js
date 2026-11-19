import {
  Element, Context, EventPhase, EventId, DefaultActionPhase, RmlEvent,
  registerEventType,
  type DispatchEventOptions, type RmlEventListener, type VariantValue,
} from '../../src';

declare const element: Element;
declare const event: RmlEvent;
declare const context: Context;

const listener: RmlEventListener = value => {
  const target: Element | null = value.target;
  const current: Element | null = value.currentTarget;
  const phase: EventPhase = value.phase;
  const parameter: VariantValue = value.parameters.value;
  if (parameter instanceof Element) {
    parameter.click();
  }
  value.stopImmediatePropagation();
  void [ target, current, phase ];
};
element.addEventListener('test', listener);
element.removeEventListener('test', listener);
const customId = registerEventType('custom', true, false,
  DefaultActionPhase.TargetAndBubble);
element.addEventListener(EventId.Click, listener);
element.removeEventListener(customId, listener);
element.dispatchEvent(customId, {}, { bubbles: false });
context.addEventListener(EventId.Click, listener);
context.removeEventListener('click', listener);
context.getRootElement().click();
// @ts-expect-error Only native default action phases are accepted.
registerEventType('bad', true, true, 1);
// @ts-expect-error Event identifiers cannot be objects.
element.dispatchEvent({ id: EventId.Click });

const options: DispatchEventOptions = { interruptible: false, bubbles: true };
const propagation: boolean = element.dispatchEvent('test', {
  integer: 18446744073709551615n,
  vector: { x: 1, y: 2, z: 3, w: 4 },
  colour: { type: 'colourb', red: 1, green: 2, blue: 3, alpha: 255 },
  reference: element,
  empty: null,
}, options);
const live: boolean = event.isPropagating && event.isImmediatePropagating;
void [ propagation, live ];

const emptyEvent = new RmlEvent();
const emptyTarget: Element | null = emptyEvent.target;
emptyEvent.release();
void emptyTarget;

// @ts-expect-error Unsupported dictionary entry.
element.dispatchEvent('test', { function: () => {} });
// @ts-expect-error Vector components are numeric.
element.dispatchEvent('test', { vector: { x: 1, y: '2' } });
// @ts-expect-error Colour types must retain their native representation.
element.dispatchEvent('test', { colour: { type: 'hex', value: '#fff' } });
// @ts-expect-error RmlUi has propagation controls, not browser preventDefault.
event.preventDefault();
// @ts-expect-error Snapshot fields are read-only.
event.target = element;
// @ts-expect-error Parameter values must be narrowed before element access.
event.parameters.value.click();
