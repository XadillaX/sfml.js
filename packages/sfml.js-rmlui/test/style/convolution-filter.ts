import {
  ConvolutionFilter, FilterOperation, ColorFormat,
} from '../../src';

const filter = new ConvolutionFilter();
const initialised: boolean = filter.initialise(1, FilterOperation.Sum);
filter.initialise({ x: 1, y: 0 }, FilterOperation.Dilation);
const row: Float32Array = filter.getRow(0);
const kernel: Float32Array = filter.kernel;
const output: Uint8Array = ConvolutionFilter.allocateBytes(4);
filter.run(output, { x: 1, y: 1 }, 4, ColorFormat.RGBA8,
  Uint8Array.of(70), { x: 1, y: 1 }, { x: 0, y: 0 }, ColorFormat.A8);

// @ts-expect-error Kernel views cannot be replaced.
filter.kernel = row;
// @ts-expect-error Filters use a numerical operation.
filter.initialise(0, 'Sum');
filter.run(output, { x: 1, y: 1 }, 4, ColorFormat.RGBA8,
  // @ts-expect-error Sources must be byte views.
  [ 70 ], { x: 1, y: 1 }, { x: 0, y: 0 }, ColorFormat.A8);
void [ initialised, kernel ];
