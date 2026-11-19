import {
  ElementUtilities, PositionAnchor, ClipMaskOperation, BoxArea, Element,
  type Box, type ElementRectangle, type ElementClippingRegion,
  type ClipMaskGeometry,
} from '../../src';

declare const element: Element;
const found: Element | null = ElementUtilities.getElementById(element, 'id');
const tags: Element[] = ElementUtilities.getElementsByTagName(element, 'div');
ElementUtilities.getElementsByTagName(element, 'div', 'section');
ElementUtilities.getElementsByClassName(element, 'active');
const width: number = ElementUtilities.getStringWidth(element, 'A', 86);
ElementUtilities.getDensityIndependentPixelRatio(element);
const region: ElementClippingRegion =
  ElementUtilities.getClippingRegion(element, true, true);
const mask: ClipMaskGeometry | undefined = region.clipMask[0];
if (mask && mask.operation === ClipMaskOperation.Set) {
  mask.geometry.render(mask.absoluteOffset);
  mask.geometry.release();
}
const bounds: ElementRectangle | null =
  ElementUtilities.getBoundingBox(element, BoxArea.Auto);
const box: Box = ElementUtilities.buildBox({ x: 100, y: 100 }, element);
ElementUtilities.buildBox({ x: 100, y: 100 }, element, true);
ElementUtilities.formatElement(element, { x: 100, y: 100 });
ElementUtilities.positionElement(element, { x: 0, y: 0 },
  PositionAnchor.BottomRight);
ElementUtilities.setClippingRegion(element);
ElementUtilities.applyTransform(element);
const applied: boolean = ElementUtilities.applyDataViewsControllers(element);
// @ts-expect-error Data construction requires a checked Element.
ElementUtilities.applyDataViewsControllers({});
// @ts-expect-error Native bounding area is required.
ElementUtilities.getBoundingBox(element);
// @ts-expect-error String text only.
ElementUtilities.getStringWidth(element, 123);
// @ts-expect-error Boolean mask request only.
ElementUtilities.getClippingRegion(element, 1);
// @ts-expect-error Position anchor is required.
ElementUtilities.positionElement(element, { x: 0, y: 0 });
// @ts-expect-error Utilities are static.
new ElementUtilities();
void [ found, tags, width, bounds, box, applied ];
