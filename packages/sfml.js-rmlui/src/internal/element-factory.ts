import type { Element } from '../dom/elements/element';
import type { ElementNativeHandle } from '../values/types';

type ElementConstructor = new(handle: ElementNativeHandle) => Element;

/**
 * Native RTTI names mapped to facade constructors, populated by facade modules.
 * Type-only imports keep subclass evaluation independent of import order.
 *
 * @internal
 */
export const elementConstructors = new Map<string, ElementConstructor>();

/**
 * Resolve a facade or JS-only subclass to its nearest native class.
 *
 * @param constructor - Facade constructor.
 * @returns Registered native name.
 * @internal
 */
export function elementClassName(constructor: ElementConstructor): string {
  for (let current = constructor; current;
    current = Object.getPrototypeOf(current)) {
    for (const [ name, registered ] of elementConstructors) {
      if (current === registered) {
        return name;
      }
    }
  }
  throw new TypeError('Expected a registered Element constructor');
}
