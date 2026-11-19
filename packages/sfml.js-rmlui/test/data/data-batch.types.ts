import {
  DataBatchView, DataModelHandle, Element, ElementCommandBuffer,
  ElementCommandOpcode, PropertyId, Unit, type DataBatchViewUpdate,
} from '../../src';

declare const model: DataModelHandle;
declare const element: Element;

const update: DataBatchViewUpdate = (batch, count) => {
  const slots: Uint32Array = batch.slots;
  const inputs: Float64Array = batch.inputs;
  const commands: ElementCommandBuffer = batch.commands;
  for (let i = 0; i < count; i++) {
    commands.opcodes[i] = ElementCommandOpcode.SetNumeric;
    commands.elements[i] = slots[i];
    commands.properties[i] = PropertyId.Width;
    commands.units[i] = Unit.PX;
    commands.numbers[i] = inputs[i] + 1;
  }
  return count;
};
const batch = new DataBatchView(model, [ element ], [ 'value' ], update,
  { sortOffset: -10, commandCapacity: 2 });
batch.commands.reserve(4);
batch.release();

// @ts-expect-error Group registration requires a model.
new DataBatchView(element, [ element ], [ 'value' ], update);
// @ts-expect-error Expressions must be strings.
new DataBatchView(model, [ element ], [ 3 ], update);
// @ts-expect-error Kernels return a synchronous command count.
new DataBatchView(model, [ element ], [ 'value' ], async () => 1);
// @ts-expect-error Retained input planes cannot be replaced.
batch.inputs = new Float64Array(1);
