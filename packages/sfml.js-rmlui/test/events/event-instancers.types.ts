import {
  EventInstancer, EventPhase, Factory, RmlEvent,
  registerEventType, type Element, type EventReleaseSnapshot,
} from '../../src';

/**
 * Compile consumer operations without executing native allocation.
 *
 * @param target - Live native target.
 */
export function eventInstancerConsumer(target: Element): void {
  const id = registerEventType('consumer', true, true);
  const allocator = new EventInstancer();
  const custom = new EventInstancer((element, eventId, type, parameters,
    interruptible) => allocator.instanceEvent(element, eventId, type,
    parameters, interruptible), snapshot => {
    const typed: EventReleaseSnapshot = snapshot;
    void typed;
  });
  Factory.registerEventInstancer(custom);
  const event: RmlEvent | null = Factory.instanceEvent(
    target, id, 'consumer', { count: 42, exact: 1n, element: target }, true);
  if (event) {
    event.setPhase(EventPhase.Target);
    event.setCurrentElement(target);
    event.setCurrentElement(null);
    const phase: EventPhase = event.phase;
    const current: Element | null = event.currentTarget;
    void phase;
    void current;
    event.release();
  }
  const owned = allocator.instanceEvent(target, id, 'consumer', {}, true);
  if (owned) {
    allocator.releaseEvent(owned);
  }
  // @ts-expect-error Callback must return an owned event or null.
  new EventInstancer(() => target);
  // @ts-expect-error InstanceEvent requires a registered numeric id.
  allocator.instanceEvent(target, 'consumer', 'consumer', {}, true);
  // @ts-expect-error Release requires a native event.
  allocator.releaseEvent(target);
}
