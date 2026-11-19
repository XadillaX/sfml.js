import {
  Context, getContext, getNumContexts, removeContext,
} from '../../src';

declare const context: Context;
const alias: Context | null = getContext('named');
const indexed: Context | null = getContext(0);
const count: number = getNumContexts();
const removed: boolean = removeContext('named');
const instanceRemoved: boolean = context.remove();
const name: string = context.name;
const delay: number = context.getNextUpdateDelay();
context.requestNextUpdate(Infinity);
context.setDensityIndependentPixelRatio(2);
context.setDensityIndependentPixelRatio(null);
void [ alias, indexed, count, removed, instanceRemoved, name, delay ];

// @ts-expect-error Native dimensions are read-only shared views.
context.dimensions.width = 200;
// @ts-expect-error Names and indices cannot be booleans.
getContext(false);
// @ts-expect-error Automatic density is selected with null.
context.setDensityIndependentPixelRatio('auto');
