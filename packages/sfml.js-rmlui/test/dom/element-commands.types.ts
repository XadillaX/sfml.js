import {
  Context, Element, ElementCommandBuffer, ElementCommandOpcode,
  ElementCommandStatus, PropertyId, Unit, DataModelConstructor,
} from '../../src';

declare const context: Context;
declare const element: Element;

const byId: Element | null = element.getElementById('target');
const bySelector: Element | null = element.querySelector('button');
const summary: string = element.getEventDispatcherSummary();
const scrollContainer: Element | null = element.getClosestScrollableContainer();
const model: DataModelConstructor | null = element.getDataModel();
void [ byId, bySelector, summary, scrollContainer, model ];
// @ts-expect-error Element IDs are native strings.
element.getElementById(42);
// @ts-expect-error CSS selectors are native strings.
element.querySelector(42);

const buffer = new ElementCommandBuffer(context, [ element ], 1000);
buffer.opcodes[0] = ElementCommandOpcode.SetNumeric;
buffer.elements[0] = 0;
buffer.properties[0] = PropertyId.Width;
buffer.numbers[0] = 20;
buffer.units[0] = Unit.PX;
buffer.bases[0] = 100;
const count: number = buffer.submit(1);
const capacity: number = buffer.capacity;
const completed: number = buffer.consumed;
const numbers: Float32Array = buffer.outputNumbers;
const units: Int32Array = buffer.outputUnits;
const states: Uint8Array = buffer.outputStatus;
const status: ElementCommandStatus = states[0];
buffer.reserve(2000);
buffer.replaceElements([ element ]);
void [ count, capacity, completed, numbers, units, status ];

// @ts-expect-error Commands require an actual Context wrapper.
new ElementCommandBuffer({}, [ element ]);
// @ts-expect-error Slot tables contain Element wrappers.
buffer.replaceElements([ context ]);
// @ts-expect-error Prefix lengths are numeric.
buffer.submit('1');
// @ts-expect-error Capacity is read-only.
buffer.capacity = 3;
// @ts-expect-error Planes cannot be replaced by caller arrays.
buffer.numbers = new Float32Array(3);
