import {
  Element, EventListener, EventListenerInstancer, Factory, RmlEvent,
  type EventListenerAttachment, type EventListenerHook,
} from '../../src';

declare const element: Element;
declare const event: RmlEvent;
const hook: EventListenerHook = (
  identity: Readonly<EventListenerAttachment>,
) => {
  const id: string = identity.id;
  const tag: string = identity.tagName;
  void id;
  void tag;
};
const listener = new EventListener(
  value => value.stopPropagation(), hook, hook);
element.addEventListener('click', listener, true);
element.removeEventListener('click', listener, true);
listener.processEvent(event);
listener.onAttach(element);
listener.onDetach(element);
listener.release();
const instancer = new EventListenerInstancer((value, requestingElement) =>
  (value === requestingElement.id ? listener : null));
Factory.registerEventListenerInstancer(instancer);
Factory.registerEventListenerInstancer(null);
const direct: EventListener | null =
  instancer.instanceEventListener('click', element);
const factory: EventListener | null =
  Factory.instanceEventListener('click', element);
void direct;
void factory;
// @ts-expect-error Allocators must return authentic listener facades.
new EventListenerInstancer(() => ({}));
// @ts-expect-error Listener event processing takes RmlEvent.
listener.processEvent(element);
