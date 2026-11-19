import { tweenHandle, tweenFromNative } from '../animation/tween';
import type { Tween } from '../animation/tween';
import { Element } from '../dom/elements/element';
import { Context } from '../runtime/context';
import { RmlEvent, eventHandle, eventFromHandle } from '../events/event';
import { Variant, variantHandle } from '../values/variant';
import type {
  ElementNativeHandle, ContextNativeHandle, VariantReadValue,
  VariantOpaqueObject, VariantScriptObject,
} from '../values/types';
import type { DataVariantValue } from '../data/data-model';
import type { Animation, Transition } from '../animation/animation-values';
import {
  DecoratorList, FilterList, FontEffectList,
  effectValueToNative, effectValueFromNative, type NativeEffectValue,
} from '../style/effects/effect-values';

const opaqueObjects = new WeakSet<object>();
const scriptObjects = new WeakSet<object>();

/** @internal */
export type NativeMotion<T extends Animation | Transition> =
  Omit<T, 'tween'> & { tween: object };

/**
 * Marshal a motion record without retaining user accessors.
 *
 * @internal
 * @param value - Public fields.
 * @returns Fields with a checked native Tween handle.
 */
export function motionToNative(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return value;
  }
  const copy = { ...value } as { tween?: Tween | object };
  if (copy.tween !== undefined) {
    copy.tween = tweenHandle(copy.tween as Tween);
  }
  return copy;
}

/**
 * Wrap the independent native Tween copy.
 *
 * @internal
 * @param value - Native record.
 * @returns Public motion value.
 */
export function motionFromNative<T extends Animation | Transition>(
  value: NativeMotion<T>,
): T {
  return { ...value, tween: tweenFromNative(value.tween) } as T;
}

/**
 * Marshal tagged lists; native validates scalar fields and snapshots values.
 *
 * @internal
 * @param value - Public Variant input.
 * @param requireSelector - Require explicit tags for pointer defaults.
 * @returns Native Variant input.
 */
export function variantToNative(
  value: unknown, requireSelector = false,
): unknown {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (value instanceof Element) {
    return value.handle;
  }
  if (value instanceof Context) {
    return value.handle;
  }
  if (value instanceof RmlEvent) {
    return eventHandle(value);
  }
  if (value instanceof Variant) {
    return variantHandle(value);
  }

  if (value instanceof DecoratorList || value instanceof FilterList ||
      value instanceof FontEffectList) {
    return effectValueToNative(value);
  }

  if (scriptObjects.has(value) || opaqueObjects.has(value)) {
    if (requireSelector) {
      throw new TypeError('Variant default requires an explicit type selector');
    }

    return {
      type: scriptObjects.has(value) ? 'scriptinterface' : 'voidptr', value,
    };
  }

  const input = value as {
    type?: string; transitions?: unknown[]; animations?: unknown[];
  };
  const type = input.type;
  if (type === 'scriptinterface') {
    const pointer = value as { type: string; value: unknown };
    const target = pointer.value;
    let handle = target;
    if (target instanceof Element || target instanceof Context) {
      handle = target.handle;
    } else if (target instanceof RmlEvent) {
      handle = eventHandle(target);
    }

    // Native checks the original object's private registration directly.
    // Its public fields are opaque, including user-defined selector keys.
    return { type, value: handle };
  }

  const field = type === 'transitionlist' ? 'transitions'
    : type === 'animationlist' ? 'animations' : undefined;
  if (!field) {
    return value;
  }

  const copy = { ...input, type };
  const entries = copy[field];
  if (Array.isArray(entries)) {
    copy[field] = entries.map(motionToNative);
  }
  return copy;
}

/**
 * Restore Tween facades only for owned motion list snapshots.
 *
 * @internal
 * @param value - Native owned Variant output.
 * @returns Public owned value.
 */
export function variantFromNative(value: unknown): VariantReadValue {
  if (typeof value === 'object' && value !== null) {
    const input = value as {
      type?: string;
      elementHandle?: ElementNativeHandle;
      contextHandle?: ContextNativeHandle;
      eventHandle?: object;
      opaqueObject?: object;
      scriptObject?: object;
      transitions: NativeMotion<Transition>[];
      animations: NativeMotion<Animation>[];
    };

    if (input.scriptObject !== undefined) {
      scriptObjects.add(input.scriptObject);
      return input.scriptObject as VariantScriptObject;
    }

    if (input.opaqueObject !== undefined) {
      opaqueObjects.add(input.opaqueObject);
      return input.opaqueObject as VariantOpaqueObject;
    }

    if (input.elementHandle !== undefined) {
      return Element.wrap(input.elementHandle);
    }
    if (input.contextHandle !== undefined) {
      return new Context(input.contextHandle);
    }
    if (input.eventHandle !== undefined) {
      return eventFromHandle(input.eventHandle);
    }

    if (input.type === 'decorators' || input.type === 'filters' ||
        input.type === 'fonteffects') {
      return effectValueFromNative(value as NativeEffectValue);
    }

    if (input.type === 'transitionlist') {
      return {
        ...input, transitions: input.transitions.map(motionFromNative),
      } as VariantReadValue;
    }
    if (input.type === 'animationlist') {
      return {
        ...input, animations: input.animations.map(motionFromNative),
      } as VariantReadValue;
    }
  }

  return value as VariantReadValue;
}

/**
 * Decode a data-model value and enforce its non-pointer output contract.
 *
 * @internal
 * @param value - Native data Variant.
 * @returns Owned data value.
 */
export function dataVariantFromNative(value: unknown): DataVariantValue {
  if (typeof value === 'object' && value !== null &&
      ('opaqueObject' in value || 'scriptObject' in value)) {
    throw new TypeError('Data Variant requires an owned non-pointer value');
  }

  const result = variantFromNative(value);
  if (result instanceof Element || result instanceof Context ||
      result instanceof RmlEvent || result instanceof Variant ||
      (typeof result === 'object' && result !== null &&
       'type' in result &&
       (result.type === 'scriptinterface' || result.type === 'voidptr'))) {
    throw new TypeError('Data Variant requires an owned non-pointer value');
  }

  return result as DataVariantValue;
}
