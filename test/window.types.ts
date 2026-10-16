import {
  Window, VideoMode, Cursor, Event, Style, State, KeyboardKey, KeyboardScancode,
  Vector2i, Vector2u, Vector3f, milliseconds, equal, less,
  type WindowHandle, type ContextSettings, type EventData,
} from '../src';

const mode = new VideoMode(new Vector2u(800, 600), 32);
const copied = new VideoMode(mode);
const ordered: boolean = less(mode, copied);
const same: boolean = equal(mode, copied);
const window = new Window(mode, 'Window', {
  // eslint-disable-next-line no-bitwise
  style: Style.Titlebar | Style.Resize,
  state: State.Windowed,
  settings: { depthBits: 24 },
});
const systemHandle: WindowHandle = window.getNativeHandle();
const embedded = new Window(systemHandle, { antiAliasingLevel: 4 });
embedded.create(systemHandle);
window.create(new Vector2u(800, 600), 'Window');
const settings: Readonly<Required<ContextSettings>> = window.getSettings();
window.setPosition(new Vector2i(20, 30));
window.setMinimumSize(undefined);
window.setMaximumSize(new Vector2u(1600, 1200));
window.setMouseCursor(new Cursor(Cursor.Type.Arrow));
window.setIcon(new Vector2u(1, 1), new Uint8Array(4));
const optional = Cursor.createFromSystem(Cursor.Type.Hand);
if (optional) window.setMouseCursor(optional);
const surface: bigint | undefined = window.createVulkanSurface(1n, 0n);
const event = window.waitEvent(milliseconds(10));
if (event?.is('KeyPressed')) {
  const key: KeyboardKey = event.data.code;
  const scan: KeyboardScancode = event.data.scancode;
  void [ key, scan ];
}
const resized = event?.getIf('Resized');
if (resized) {
  const size: Vector2u = resized.size;
  void size;
}
window.handleEvents({
  Closed: () => window.close(),
  KeyPressed: data => {
    const key: KeyboardKey = data.code;
    void key;
  },
  SensorChanged: data => {
    const value: Vector3f = data.value;
    void value;
  },
}, data => {
  if (data.kind === 'MouseMoved') {
    const position: Vector2i = data.position;
    void position;
  }
});
window.handleEvents(data => {
  const all: EventData = data;
  void all;
});
const own = new Event({ kind: 'Resized', size: new Vector2u(10, 10) });
const width: number = own.visit(data => data.size.x);

// @ts-expect-error window positions are signed
window.setPosition(new Vector2u());
// @ts-expect-error timeout is a Time
window.waitEvent(100);
// @ts-expect-error native handles cannot lose precision through number
new Window(123);
// @ts-expect-error Cursor has no public default constructor
new Cursor();
// @ts-expect-error event fields must match its kind
new Event({ kind: 'MouseMoved', size: new Vector2u() });
// @ts-expect-error size and position have distinct scalar types
window.setSize(new Vector2i());

void [ settings, ordered, same, surface, width ];
