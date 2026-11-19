import {
  Box, BoxArea, BoxDirection, BoxEdge, RenderBox,
  type Element, type PositionedBox, type EdgeSizes, type CornerSizes,
} from '../../src';

declare const element: Element;

const box: Box = element.getBox();
const positioned: PositionedBox = element.getBox(1);
const view: Float32Array = positioned.box.content;
view[0] = 20;
box.setContent({ x: 20, y: 30 });
box.setEdge(BoxArea.Padding, BoxEdge.Top, 5);
box.getSizeAcross(BoxDirection.Horizontal, BoxArea.Margin);
const boxVectors: Array<{ x: number; y: number }> = [
  box.getSize(), box.getPosition(BoxArea.Padding),
  box.getFrameSize(BoxArea.Border),
];
const boxEdges: number[] = [
  box.getEdge(BoxArea.Padding, BoxEdge.Top),
  box.getCumulativeEdge(BoxArea.Border, BoxEdge.Left),
];
const boxEqual: boolean = box.equals(box.clone());

element.setBox(box);
element.addBox(new Box(), { x: 10, y: 10 });
element.getNumBoxes();
const rendering: RenderBox = element.getRenderBox(BoxArea.Content);
const edges: EdgeSizes = rendering.getBorderWidths();
const corners: CornerSizes = rendering.getBorderRadius();
rendering.setBorderWidths(edges);
rendering.setBorderRadius(corners);
new RenderBox({ x: 1, y: 2 }, { x: 0, y: 0 }, edges, corners);
rendering.equals(rendering.clone());
box.notEquals(box.clone());

const renderVectors: Array<{ x: number; y: number }> = [
  rendering.getFillSize(), rendering.getFillOffset(),
  rendering.getBorderOffset(),
];
rendering.setFillSize({ x: 10, y: 20 });
rendering.setBorderOffset({ x: 1, y: 2 });
const renderUnequal: boolean = rendering.notEquals(rendering.clone());

// @ts-expect-error Indexed boxes include an output offset.
const wrong: Box = element.getBox(1);
// @ts-expect-error RenderBox cannot be used as a layout Box.
element.setBox(rendering);
// @ts-expect-error Edge widths require four values.
rendering.setBorderWidths([ 1, 2, 3 ]);
// @ts-expect-error Views cannot be replaced.
box.content = new Float32Array(2);
// @ts-expect-error A RenderBox does not carry Box layout edges.
box.equals(rendering);
// @ts-expect-error Fill dimensions require a vector.
rendering.setFillSize([ 10, 20 ]);

void [
  wrong, boxVectors, boxEdges, boxEqual, renderVectors, renderUnequal,
];
