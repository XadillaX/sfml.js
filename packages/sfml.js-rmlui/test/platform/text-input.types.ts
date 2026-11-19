import {
  TextInputHandler, TextInputContext, createContext,
  getTextInputHandler, setTextInputHandler,
  type TextInputBounds, type TextInputRange, type TextInputEvents,
} from '../../src';

declare const input: TextInputContext;
const handler = new TextInputHandler({
  onActivate(context) {
    context?.setCursorPosition(0);
  },
  onDeactivate(context) {
    const valid: boolean | undefined = context?.isValid;
    void valid;
  },
  onDestroy(context) {
    const valid: boolean = context.isValid;
    void valid;
  },
});
setTextInputHandler(handler);
setTextInputHandler(null);
const current: TextInputHandler | null = getTextInputHandler();
const events: TextInputEvents = handler.drainEvents();
const kinds: Uint32Array = events.kinds;
const bounds: TextInputBounds | null = input.getBoundingBox();
const selection: TextInputRange = input.getSelectionRange();
input.setSelectionRange(0, 1);
input.setText('😀', 0, 1);
input.setCompositionRange(0, 1);
input.commitComposition('中');
createContext('input', 100, 100, null, handler);

// @ts-expect-error Text input contexts come from native lifecycle events.
new TextInputContext();
// @ts-expect-error Handler selection requires a checked native handler.
setTextInputHandler({});
// @ts-expect-error Text must be a string.
input.setText(1, 0, 1);
// @ts-expect-error Character positions must be numbers.
input.setCursorPosition('0');
// @ts-expect-error A per-context handler is not a renderer.
createContext('input', 100, 100, handler);
void [ current, kinds, bounds, selection ];
