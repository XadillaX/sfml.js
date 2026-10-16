import {
  version, type Version, Clipboard, Context, type ReadonlyContext,
  type ContextSettings, Touch, Vector2u, Vector2i, Window,
} from '../src';

const runtime: Version = version();
const major: number = runtime.major;
const release: boolean = runtime.isRelease;
const text: string = Clipboard.getString();
Clipboard.setString(text);
const context = new Context({}, new Vector2u(32, 32));
const active: ReadonlyContext | undefined = Context.getActiveContext();
const settings: Readonly<Required<ContextSettings>> = context.getSettings();
const id: bigint = Context.getActiveContextId();
const pointer: bigint | undefined = Context.getFunction('glGetString');
const extension: boolean = Context.isExtensionAvailable('GL_ARB_sync');
const enabled: boolean = context.setActive(true);
const down: boolean = Touch.isDown(0);
const globalPosition: Vector2i = Touch.getPosition(0);
const localPosition: Vector2i = Touch.getPosition(0, new Window());

// @ts-expect-error Version is immutable
runtime.major = 1;
// @ts-expect-error Context settings are immutable
settings.depthBits = 0;
// @ts-expect-error const Context reference cannot change activation
active?.setActive(false);
// @ts-expect-error Context dimensions must be unsigned
new Context({}, new Vector2i());
// @ts-expect-error settings and size must be supplied together
new Context({});
// @ts-expect-error Clipboard accepts strings
Clipboard.setString(123);
// @ts-expect-error Touch finger indices are numbers
Touch.isDown(0n);

void [ major, release, id, pointer, extension, enabled, down,
  globalPosition, localPosition ];
