import { Debugger, type Context } from '../../src';

declare const host: Context;
declare const target: Context;

const loaded: boolean = Debugger.initialise(host);
const switched: boolean = Debugger.setContext(target);
const visible: boolean = Debugger.isVisible();
Debugger.setContext(null);
Debugger.setVisible(true);
Debugger.shutdown();

// @ts-expect-error Requires a checked context wrapper.
Debugger.initialise({});
// @ts-expect-error Null is allowed only as the inspection target.
Debugger.initialise(null);
// @ts-expect-error Visibility is a strict boolean.
Debugger.setVisible(1);
// @ts-expect-error Debugger operations are static.
new Debugger();

void loaded;
void switched;
void visible;
