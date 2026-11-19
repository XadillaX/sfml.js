import {
  Element, BoxArea, ScrollAlignment, ScrollParentage, ScrollBehavior,
  StylePosition, StyleFloat, StyleDisplay,
  type VariantVector2, type ProjectedPoint, type ScrollIntoViewOptions,
} from '../../src';

declare const element: Element;
const position: VariantVector2 = element.getAbsoluteOffset(BoxArea.Border);
const relative: VariantVector2 = element.getRelativeOffset();
const projected: ProjectedPoint = element.project(position);
const containing: VariantVector2 = element.getContainingBlock();
const parent: Element | null = element.offsetParent;
const mode: StylePosition = element.getPosition();
const float: StyleFloat = element.getFloat();
const display: StyleDisplay = element.getDisplay();
const visible: boolean = element.isVisible(true);
const hit: boolean = element.isPointWithinElement(projected.point);
const replaced: boolean = element.isReplaced();
const metrics: number[] = [
  element.absoluteLeft, element.absoluteTop, element.clientLeft,
  element.clientTop, element.clientWidth, element.clientHeight,
  element.offsetLeft, element.offsetTop, element.offsetWidth,
  element.offsetHeight, element.scrollWidth, element.scrollHeight,
  element.scrollTop, element.scrollLeft, element.getLineHeight(),
  element.baseline, element.zIndex,
];
element.scrollTop = 20;
element.scrollLeft = 30;
element.clipArea = BoxArea.Padding;
element.setScrollableOverflowRectangle({ x: 400, y: 500 }, true);
element.setOffset({ x: 10, y: 20 }, parent);
element.setOffset({ x: 10, y: 20 }, null, true);
// @ts-expect-error Native offset parent is an Element or null.
element.setOffset({ x: 10, y: 20 }, {});
// @ts-expect-error Fixed offsets require a boolean.
element.setOffset({ x: 10, y: 20 }, null, 1);
element.scrollTo({ x: 10, y: 20 }, ScrollBehavior.Smooth);
element.scrollIntoView();
element.scrollIntoView(false);
element.scrollIntoView({
  vertical: ScrollAlignment.Center, horizontal: ScrollAlignment.Nearest,
  parentage: ScrollParentage.Closest,
});

const defaultScroll: ScrollIntoViewOptions = {};
const explicitScroll: ScrollIntoViewOptions = {
  vertical: ScrollAlignment.End,
  horizontal: ScrollAlignment.Adaptive,
  behavior: ScrollBehavior.Instant,
  parentage: ScrollParentage.All,
};
element.scrollIntoView(defaultScroll);
element.scrollIntoView(explicitScroll);

// @ts-expect-error Native scroll behavior requires its own enum.
element.scrollIntoView({ behavior: 'instant' });
// @ts-expect-error Scroll parentage accepts only ancestor traversal modes.
element.scrollIntoView({ parentage: 2 });

// @ts-expect-error Native read-only metric.
element.clientWidth = 10;
// @ts-expect-error Only declared alignment values are accepted.
element.scrollIntoView({ vertical: 'center' });
// @ts-expect-error A point requires both coordinates.
element.project({ x: 1 });
// @ts-expect-error Native read-only offset parent.
element.offsetParent = element;
void [
  relative, projected, containing, parent, mode, float, display,
  visible, hit, replaced, metrics,
];
