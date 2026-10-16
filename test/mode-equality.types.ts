import {
  BlendMode, BlendAlpha, BlendAdd, StencilMode, StencilValue,
  RenderStates, equal, notEqual,
} from '../src';

const blend = new BlendMode();
const stencil = new StencilMode();
const readonlyBlend: Readonly<BlendMode> = BlendAlpha;
const readonlyStencil: Readonly<StencilMode> = stencil;
const results: boolean[] = [
  equal(blend, readonlyBlend),
  notEqual(BlendAdd, blend),
  equal(stencil, readonlyStencil),
  notEqual(readonlyStencil, stencil),
  equal(RenderStates.Default.blendMode, blend),
  notEqual(stencil, RenderStates.Default.stencilMode),
];
// @ts-expect-error Different mode types cannot be compared.
equal(blend, stencil);
// @ts-expect-error Different mode types cannot be compared in either order.
notEqual(stencil, blend);
// @ts-expect-error SFML does not define standalone StencilValue equality.
equal(new StencilValue(0), new StencilValue(0));
void results;
