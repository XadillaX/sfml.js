import {
  BaseXMLParser, XMLParser, XMLNodeHandler, XMLDataType, StreamMemory,
  Element, DocumentHeader, type XMLParseEvent, type XMLParseFrame,
} from '../../src';

const stream = new StreamMemory(new TextEncoder().encode('<body/>'));
const base = new BaseXMLParser({
  handleElementStart(parser, name, attributes) {
    const line: number = parser.getLineNumber();
    const openTagLine: number = parser.getLineNumberOpenTag();
    const source: string = parser.getSourceURL();
    void [ line, openTagLine, source, name, attributes ];
  },
  handleData(parser, data, type) {
    const category: XMLDataType = type;
    void [ parser, data, category ];
  },
});
base.handleElementStart('manual', { id: 'manual' });
base.handleData('content', XMLDataType.CDATA);
base.handleElementEnd('manual');

base.registerCDATATag('script');
base.registerInnerXMLAttribute('capture');
base.isCDATATag('script');
base.parse(stream);
const events: XMLParseEvent[] = base.parseEvents(stream);
for (const event of events) {
  if (event.kind === 'start') {
    const name: string = event.name;
    void [ name, event.attributes ];
  } else if (event.kind === 'data') {
    const type: XMLDataType = event.type;
    void [ type, event.data ];
  }
}

const root = new Element('div');
const parser = new XMLParser(root);
const delegate = XMLNodeHandler.createDefault();
const preparedHeader = new DocumentHeader();
const handler = new XMLNodeHandler({
  elementStart(current, name, attributes) {
    current.pushDefaultHandler();
    current.pushHandler('body');
    return delegate.elementStart(current, name, attributes);
  },
  elementEnd(current, name) {
    current.setDocumentHeader(preparedHeader);
    current.handleData('tail', XMLDataType.Text);
    return delegate.elementEnd(current, name);
  },
  elementData: (current, data, type) =>
    delegate.elementData(current, data, type),
});
XMLParser.registerPersistentCDATATag('custom');
XMLParser.registerNodeHandler('custom', handler);
const registered: XMLNodeHandler | null = XMLParser.getNodeHandler('custom');
const frame: XMLParseFrame = parser.getParseFrame();
const header: DocumentHeader = parser.getDocumentHeader();
parser.parse(stream);
void [ events, registered, frame, header ];

// @ts-expect-error XML roots require checked native Element ownership.
new XMLParser({});
// @ts-expect-error All three node virtual implementations are required.
new XMLNodeHandler({ elementStart: () => null });
new XMLNodeHandler({
  // @ts-expect-error Async structural callbacks cannot preserve native order.
  elementStart: async () => null,
  elementEnd: () => true,
  elementData: () => true,
});
// @ts-expect-error Input streams require checked native Stream ownership.
base.parse(new Uint8Array());
// @ts-expect-error Header writeback requires an owned header.
parser.setDocumentHeader({ title: 'wrong' });
