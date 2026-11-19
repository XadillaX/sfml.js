import type { RenderWindow } from 'sfml.js';
import {
  initialise, shutdown, version,
  type Context, type Document, type Element, type RmlEvent, type EventPhase,
  type VariantVector2,
} from '../../src';

declare const window: RenderWindow;
declare const context: Context;
declare const element: Element;
declare const event: RmlEvent;

const initialized: boolean = initialise(window);
const configured: boolean = initialise(window, { highDpi: false });
const nativeVersion: string = version;
const width: number = context.dimensions.width;
const height: number = context.dimensions.height;
const density: number = context.densityIndependentPixelRatio;
const updated: boolean = context.update();
const rendered: boolean = context.render();
const loaded: Document = context.loadDocument('panel.rml');
const theme: boolean = context.isThemeActive('night');
context.setDimensions(640, 480);
context.activateTheme('night', true);
shutdown();

const tag: string = element.tagName;
const id: string = element.id;
const markup: string = element.innerRML;
const owner: Document | null = element.getOwnerDocument();
const classSet: boolean = element.isClassSet('selected');
element.id = 'selected';
element.innerRML = '<div/>';
element.setClass('selected', true);

const phase: EventPhase = event.phase;
const type: string = event.type;
const eventId: number = event.id;
const interruptible: boolean = event.isInterruptible;
const screenPosition: VariantVector2 = event.unprojectedMouseScreenPosition;
event.stopPropagation();

// @ts-expect-error Initialization requires a native SFML render target.
initialise({});
// @ts-expect-error Runtime shutdown takes no target or options.
shutdown(window);
// @ts-expect-error Context dimensions require separate numeric axes.
context.setDimensions({ x: 640, y: 480 });
// @ts-expect-error Theme activation requires an explicit boolean.
context.activateTheme('night', 'active');
// @ts-expect-error Native document paths and streams are distinct from buffers.
context.loadDocument(new Uint8Array());
// @ts-expect-error Native DOM attributes do not coerce identifiers.
element.id = 42;
// @ts-expect-error Class mutation requires a boolean.
element.setClass('selected', 1);
// @ts-expect-error The native event phase is a read-only snapshot.
event.phase = 0;

void [
  initialized, configured, nativeVersion, width, height, density, updated,
  rendered, loaded, theme, tag, id, markup, owner, classSet, phase, type,
  eventId, interruptible, screenPosition,
];
