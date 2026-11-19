import type { RenderWindow } from 'sfml.js';
import {
  SystemInterface, LogType, getSystemInterface, setSystemInterface,
  type SystemCallbacks, type TranslationResult,
} from '../../src';

declare const window: RenderWindow;
const callbacks: SystemCallbacks = {
  translateString(input) {
    return { value: input, translations: 0 };
  },
  joinPath(document, resource) {
    return `${document}/${resource}`;
  },
  logMessage(type, message) {
    return type === LogType.Info && message.length > 0;
  },
  activateKeyboard(caret, height) {
    const coordinates: number[] = [ caret.x, caret.y, height ];
    void coordinates;
  },
};
const system = new SystemInterface(window, callbacks);
setSystemInterface(system);
setSystemInterface(null);
const current: SystemInterface | null = getSystemInterface();
const seconds: number = system.getElapsedTime();
const clock: Float64Array = system.clock;
const translated: TranslationResult = system.translateString('text');
clock[0] = 1;

const joined: string = system.joinPath('document.rml', 'font.ttf');
const logged: boolean = system.logMessage(LogType.Info, 'message');
system.setMouseCursor('pointer');
system.setClipboardText('水😀');
const clipboard: string = system.getClipboardText();
system.activateKeyboard({ x: 1, y: 2 }, 16);
system.deactivateKeyboard();

// @ts-expect-error Selection requires an authenticated native interface.
setSystemInterface({});
// @ts-expect-error Clipboard callbacks must be synchronous.
new SystemInterface(window, { getClipboardText: async () => 'text' });
// @ts-expect-error Translation callbacks must supply a substitution count.
new SystemInterface(window, { translateString: input => ({ value: input }) });
// @ts-expect-error Upstream maximum sentinel is not a log type.
system.logMessage(6, 'text');
// @ts-expect-error Time callbacks use shared native storage.
new SystemInterface(window, { getElapsedTime: () => 1 });
// @ts-expect-error Paths require strings.
system.joinPath('document.rml', 1);
// @ts-expect-error Clipboard values are text, not encoded byte arrays.
system.setClipboardText(new Uint8Array());

void [ current, seconds, translated, joined, logged, clipboard ];
