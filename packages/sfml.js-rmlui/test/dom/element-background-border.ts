import {
  Element, ElementBackgroundBorder, BoxArea, type Geometry, type Context,
} from '../../src';

declare const element: Element;
declare const context: Context;
const background: ElementBackgroundBorder =
  element.getElementBackgroundBorder();
background.dirtyBackground();
background.dirtyBorder();
background.render();
context.getRenderManager().prepareRender({
  x: context.dimensions.width, y: context.dimensions.height,
});
const geometry: Geometry = background.getClipGeometry(BoxArea.Border);
background.getClipGeometry(BoxArea.Padding);
background.getClipGeometry(BoxArea.Content);
// @ts-expect-error Components are obtained from their owning element.
new ElementBackgroundBorder();
// @ts-expect-error Clipping requires a native box area.
background.getClipGeometry('content');
// @ts-expect-error The component already holds its element.
background.render(element);
void geometry;
