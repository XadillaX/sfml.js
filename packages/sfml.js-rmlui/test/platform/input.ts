import type { Event, EventData } from 'sfml.js';
import { Context, KeyIdentifier, KeyModifier, type Touch } from '../../src';

declare const context: Context;
declare const sfmlEvent: Event;
declare const snapshot: EventData;

const touches: readonly Touch[] = [
  { identifier: 9007199254740993n, position: { x: 1.25, y: 2.5 } },
  { identifier: 2, position: { x: 3, y: 4 } },
];
const results: boolean[] = [
  context.processKeyDown(KeyIdentifier.KI_PRIOR,
    // eslint-disable-next-line no-bitwise
    KeyModifier.KM_CTRL | KeyModifier.KM_META),
  context.processKeyUp(200),
  context.processTextInput('水😀'),
  context.processTextInput(0x1f600),
  context.processMouseMove(10, 20),
  context.processMouseButtonDown(0),
  context.processMouseButtonUp(0),
  context.processMouseWheel({ x: 1, y: 2 }),
  context.processMouseWheel(3),
  context.processMouseLeave(),
  context.isMouseInteracting,
  context.processTouchStart(touches),
  context.processTouchMove(touches, KeyModifier.KM_SHIFT),
  context.processTouchEnd(touches),
  context.processTouchCancel(touches),
  context.processEvent(sfmlEvent),
  context.processEvent(snapshot),
];
void results;

// @ts-expect-error Key identifiers are numeric.
context.processKeyDown('A');
// @ts-expect-error Modifiers are numeric bitmasks.
context.processKeyUp(KeyIdentifier.KI_A, 'ctrl');
// @ts-expect-error Text must be a string or Unicode scalar number.
context.processTextInput(65n);
// @ts-expect-error A two-axis wheel delta requires both axes.
context.processMouseWheel({ x: 1 });
// @ts-expect-error Touch identifiers must be exact integer types.
context.processTouchStart([{ identifier: '1', position: { x: 1, y: 2 } }]);
// @ts-expect-error The upstream cancel operation has no modifier argument.
context.processTouchCancel(touches, KeyModifier.KM_CTRL);
// @ts-expect-error Interaction is a read-only hint.
context.isMouseInteracting = false;
// @ts-expect-error Event snapshots retain their event discriminant.
context.processEvent({ type: 'unregistered' });
