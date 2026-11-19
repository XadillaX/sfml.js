import {
  Element, ElementSVG, ElementLottie, type Context,
} from '../../src';

/**
 * Exercise native vector element consumers and invalid calls.
 *
 * @param context - Existing native context.
 */
export function vectorConsumers(context: Context): void {
  const svg = new ElementSVG('svg');
  const lottie = new ElementLottie('lottie');
  svg.ensureSourceLoaded();
  lottie.ensureSourceLoaded();
  svg.innerRML = '<rect width="10" height="10"/>';
  lottie.setAttribute('src', 'animation.json');

  const document = context.createDocument();
  document?.appendChild(svg);
  document?.appendChild(lottie);
  const element: Element = svg;
  element.getIntrinsicDimensions();
  svg.isClass(ElementSVG.getStaticClassIdentifier());

  // @ts-expect-error Native upstream source loading accepts no arguments.
  lottie.ensureSourceLoaded('animation.json');
  // @ts-expect-error SVG remains an Element and has no invented playback API.
  svg.pause();
}
