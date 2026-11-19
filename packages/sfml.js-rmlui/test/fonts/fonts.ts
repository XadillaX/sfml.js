import {
  FontStyle, FontWeight, loadFontFace, releaseFontResources,
} from '../../dist';

const loaded: boolean = loadFontFace('font.ttf');
loadFontFace('faces.ttc', false, FontWeight.Bold, 1);
loadFontFace('font.ttf', 'renamed', FontStyle.Italic);
loadFontFace('font.ttf', 'renamed', FontStyle.Normal, 530, true, 0);
loadFontFace(new Uint8Array(4), 'memory', FontStyle.Normal);
loadFontFace(Buffer.alloc(4), 'memory', FontStyle.Italic, FontWeight.Auto);
releaseFontResources();

// @ts-expect-error Memory fonts require a family and style.
loadFontFace(new Uint8Array(4));
// @ts-expect-error Explicit families require an explicit style.
loadFontFace('font.ttf', 'renamed');
// @ts-expect-error Only byte views are accepted.
loadFontFace(new Uint16Array(4), 'memory', FontStyle.Normal);
// @ts-expect-error Fallback is a boolean.
loadFontFace('font.ttf', 1);
// @ts-expect-error Font styles use the native enum.
loadFontFace('font.ttf', 'family', 'italic');

void loaded;
