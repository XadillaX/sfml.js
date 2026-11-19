import {
  ClassIdentifier, Document, Element, ElementFormControl, ElementTabSet,
  RmlEvent,
} from '../../src';

declare const element: Element;
declare const document: Document;
declare const tabs: ElementTabSet;
declare const event: RmlEvent;
const identifier: ClassIdentifier = element.getClassIdentifier();
const matches: boolean = element.isClass(
  ElementFormControl.getStaticClassIdentifier(),
);
document.isClass(Element.getStaticClassIdentifier());
tabs.processDefaultAction(event);
element.processDefaultAction(event);
// @ts-expect-error Class identifiers cannot be arbitrary symbols.
element.isClass(Symbol('Element'));
// @ts-expect-error Numbers are not class identifiers.
element.isClass(1);
// @ts-expect-error An event snapshot object does not carry a native lease.
tabs.processDefaultAction({ type: 'click' });
void [ identifier, matches ];
