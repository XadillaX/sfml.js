import {
  ScriptInterface, Context, Element, RmlEvent, type ClassIdentifier,
} from '../../dist';

declare const element: Element;
declare const event: RmlEvent;
declare const context: Context;

const elementBase: ScriptInterface = element;
const eventBase: ScriptInterface = event;
const contextBase: ScriptInterface = context;

const concreteObjects: Array<object | null> = [
  element.getScriptObject(), context.getScriptObject(), event.getScriptObject(),
];
element.setScriptObject({ owner: element });
context.setScriptObject({ owner: context });
event.setScriptObject({ owner: event });
element.setScriptObject(null);
context.setScriptObject(null);
event.setScriptObject(null);

const concreteIdentifiers: ClassIdentifier[] = [
  context.getClassIdentifier(), elementBase.getClassIdentifier(),
];
const concreteMatches: boolean[] = [
  context.isClass(Context.getStaticClassIdentifier()),
  event.isClass(RmlEvent.getStaticClassIdentifier()),
];
context.release();

contextBase.setScriptObject({ context });
contextBase.isClass(Context.getStaticClassIdentifier());
contextBase.release();
const identifier: ClassIdentifier = ScriptInterface.getStaticClassIdentifier();
const matches: boolean = eventBase.isClass(identifier);
const object: object | null = elementBase.getScriptObject();
elementBase.setScriptObject({ owner: element });
eventBase.setScriptObject({ owner: event });
eventBase.setScriptObject(null);
const parameter: Element | null = event.getElementParameter('element');
event.getElementParameter('element', element);
event.getElementParameter('element', null);
event.getClassIdentifier();
RmlEvent.getStaticClassIdentifier();
elementBase.release();
eventBase.release();

// @ts-expect-error ScriptInterface has no standalone native allocation.
new ScriptInterface();
// @ts-expect-error A pointer default must be a checked element or null.
event.getElementParameter('element', {});
// @ts-expect-error Pointer output remains nullable.
const required: Element = event.getElementParameter('element');
// @ts-expect-error Native class identifiers are opaque module-owned tokens.
event.isClass(Symbol('ScriptInterface'));
// @ts-expect-error Script objects do not accept pointer numbers.
elementBase.setScriptObject(1);
// @ts-expect-error Clearing a script object requires explicit null.
eventBase.setScriptObject(undefined);
// @ts-expect-error Context script associations require an object or null.
context.setScriptObject(7);
// @ts-expect-error Event class identifiers cannot be arbitrary symbols.
event.isClass(Symbol('Event'));

void [
  elementBase, eventBase, identifier, matches, object, parameter, required,
  concreteObjects, concreteIdentifiers, concreteMatches,
];
