import { BlendMode } from '../graphics/blend-mode';
import { RenderStates } from '../graphics/render-states';
import { StencilMode } from '../graphics/stencil-mode';
import { Texture } from '../graphics/texture';
import { Shader } from '../graphics/shader';

export const defaultRenderStates = RenderStates.Default as RenderStates;

function enumeration(value: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= maximum;
}

/** Validate before a user callback or a leaf command reserves queue space. */
export function validateRenderStates(states: RenderStates): void {
  // Default and its value members are frozen and known to be valid.
  if (states === defaultRenderStates) return;
  const b = states.blendMode;
  const s = states.stencilMode;
  if (!(b instanceof BlendMode) || !(s instanceof StencilMode)) {
    throw new TypeError('Expected BlendMode and StencilMode values');
  }
  if (!enumeration(b.colorSrcFactor, 9) ||
      !enumeration(b.colorDstFactor, 9) ||
      !enumeration(b.alphaSrcFactor, 9) ||
      !enumeration(b.alphaDstFactor, 9) ||
      !enumeration(b.colorEquation, 4) ||
      !enumeration(b.alphaEquation, 4) ||
      !enumeration(s.stencilComparison, 7) ||
      !enumeration(s.stencilUpdateOperation, 5) ||
      !enumeration(s.stencilReference.value, 0xffffffff) ||
      !enumeration(s.stencilMask.value, 0xffffffff) ||
      !enumeration(states.coordinateType, 1)) {
    throw new RangeError('Invalid render state');
  }
  if (typeof s.stencilOnly !== 'boolean' ||
      (states.texture !== null && !(states.texture instanceof Texture))) {
    throw new TypeError('Invalid render state');
  }
  if (states.shader !== null && !(states.shader instanceof Shader)) {
    throw new TypeError('Expected a Shader or null');
  }
}
