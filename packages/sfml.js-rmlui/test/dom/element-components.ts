import {
  Element, ElementScroll, ScrollOrientation,
  TransformState, ElementTransformBuffer,
} from '../../src';

declare const element: Element;
const scroll: ElementScroll = element.getElementScroll();
scroll.update();
scroll.enableScrollbar(ScrollOrientation.VERTICAL, 100);
scroll.disableScrollbar(ScrollOrientation.HORIZONTAL);
scroll.updateScrollbar(ScrollOrientation.VERTICAL);
const scrollbar: Element | null =
  scroll.getScrollbar(ScrollOrientation.VERTICAL);
const size: number = scroll.getScrollbarSize(ScrollOrientation.HORIZONTAL);
scroll.formatScrollbars();
scroll.updateProperties();
const ownedScroll = new ElementScroll(element);
ownedScroll.enableScrollbar(ScrollOrientation.VERTICAL, 100);
ownedScroll.release();
const borrowed: TransformState | null = element.getTransformState();
const owned = new TransformState();
const changed: boolean = owned.setTransform(new Float32Array(16));
owned.setLocalPerspective(null);
const matrix: Float32Array | null = owned.getTransform();
const perspective: Float32Array | null = owned.getLocalPerspective();
const inverse: Float32Array | null = borrowed?.getInverseTransform() ?? null;
const batch = new ElementTransformBuffer([ element ]);
batch.refresh();
const output: Float32Array = batch.matrices;
const flags: Uint8Array = batch.flags;
const length: number = batch.length;
// @ts-expect-error An independently owned component requires a host element.
new ElementScroll();
// @ts-expect-error A native scrollbar component requires a live Element.
new ElementScroll(owned);
// @ts-expect-error Native scrollbar direction is an enum.
scroll.getScrollbar('vertical');
// @ts-expect-error Matrix input is a Float32Array.
owned.setTransform([ 1 ]);
// @ts-expect-error The buffer only accepts elements.
new ElementTransformBuffer([ owned ]);
// @ts-expect-error Native output identity cannot be replaced.
batch.matrices = new Float32Array();
void [
  scrollbar, size, changed, matrix, perspective, inverse, output, flags, length,
];
