import type { LazyValue } from '../src/internal/lazy-value';

declare const state: LazyValue<'vector2', Float32Array>;

state.values[0] = 1;

// @ts-expect-error Native initialization is private to the binding module.
state.native();

// @ts-expect-error The native method is not part of the public instance keys.
export const nativeKey: keyof typeof state = 'native';
