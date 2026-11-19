import {
  Document, Element, ElementText, ElementProgress, ElementTabSet,
  GeneratedTextLine, TextLine,
} from '../../src';

declare const document: Document;
const text: ElementText | null = document.createTextNode('🌙');
if (text) {
  text.setText('line');
  const source: string = text.getText();
  const line: GeneratedTextLine = text.generateLine(
    0, Infinity, 0, true, true, false,
  );
  text.suppressAutoLayout();
  text.clearLines();
  text.addLine({ x: 0, y: 20 }, line.line);
  const lines: TextLine[] = text.getLines();
  // @ts-expect-error All native GenerateLine input flags are explicit.
  text.generateLine(0, Infinity);
  // @ts-expect-error Positions are vectors, not arrays.
  text.addLine([ 0, 20 ], 'line');
  void [ source, lines ];
}
declare const progress: ElementProgress;
progress.setValue(0.5);
progress.setMax(1);
const values: number[] = [ progress.getValue(), progress.getMax() ];
const intrinsic = progress.getIntrinsicDimensions();
declare const tabs: ElementTabSet;
declare const title: Element;
tabs.setTab(0, 'Title');
tabs.setTab(1, title);
tabs.setPanel(0, '<div>Body</div>');
tabs.setPanel(1, title);
tabs.setActiveTab(0);
tabs.removeTab(1);
const indexes: number[] = [ tabs.getNumTabs(), tabs.getActiveTab() ];
// @ts-expect-error A plain object is not an owned element.
tabs.setTab(0, {});
// @ts-expect-error Progress values are numerical.
progress.setValue('0.5');
void [ values, indexes, intrinsic ];
