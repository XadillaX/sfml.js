import {
  Element, EventDispatcher, EventListener, EventId,
  DefaultActionPhase, type RmlEventListener,
} from '../../src';

declare const element: Element;
declare const callback: RmlEventListener;
const dispatcher: EventDispatcher = element.getEventDispatcher();
dispatcher.attachEvent(EventId.Click, callback);
dispatcher.attachEvent('click', callback, true);
dispatcher.detachEvent(EventId.Click, callback);
const typed = new EventListener(callback);
dispatcher.attachEvent(EventId.Click, typed);
dispatcher.detachEvent(EventId.Click, typed);
dispatcher.detachAllEvents();
const summary: string = dispatcher.toString();
const propagated: boolean = EventDispatcher.dispatchEvent(
  element, EventId.Click, 'click', { reference: element, integer: 42n },
  true, false, DefaultActionPhase.TargetAndBubble,
);
// @ts-expect-error Components are obtained from their owning element.
new EventDispatcher();
EventDispatcher.dispatchEvent(
  // @ts-expect-error Static dispatch requires a numeric EventId.
  element, 'click', 'click', {}, true, true, DefaultActionPhase.None);
EventDispatcher.dispatchEvent(
  // @ts-expect-error Native dispatch flags are booleans.
  element, EventId.Click, 'click', {}, 'true', true, DefaultActionPhase.None);
// @ts-expect-error Arbitrary objects are not listeners.
dispatcher.attachEvent(EventId.Click, {});
void [ summary, propagated ];
