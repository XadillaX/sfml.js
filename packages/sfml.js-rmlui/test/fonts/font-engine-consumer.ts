import {
  FontEngineInterface, FontMeasureBuffer, FontStyle, FontWeight,
  TextShapingContext, RenderManager,
  Style, FontMetrics,
  type FontFaceHandle, type FontEffectsHandle,
  type FontEngineCallbacks, type CustomFontFace,
  getFontEngineInterface, getRenderInterface, setFontEngineInterface,
  getCapabilities, type BuiltinFontEngine, type FontEngineKind,
  type RmlUiCapabilities,
} from '../../src';

let customFace: CustomFontFace | undefined;
let custom: FontEngineInterface;
const virtuals: FontEngineCallbacks = {
  initialize() {
    customFace = custom.createFontFace({
      size: 20, ascent: 15, descent: 5, lineSpacing: 20, xHeight: 10,
      underlinePosition: 2, underlineThickness: 1, hasEllipsis: true,
    }, {
      firstCharacter: 32, advances: new Int32Array(96),
      fallbackAdvance: 10,
    });
  },
  getFontFaceHandle() {
    return customFace?.handle ?? null;
  },
  getStringWidths(face, strings, shaping, prior) {
    void face;
    void shaping;
    void prior;
    return new Int32Array(strings.length);
  },
  measureStrings(face, buffer, count, shaping, prior) {
    void face;
    void shaping;
    void prior;
    const bytes: Uint8Array = buffer.bytes;
    const offsets: Uint32Array = buffer.offsets;
    const widths: Int32Array = buffer.widths;
    for (let i = 0; i < count; ++i) {
      widths[i] = offsets[i + 1] - offsets[i];
    }
    void bytes;
  },
};
custom = new FontEngineInterface(virtuals);
// @ts-expect-error Font virtuals must be synchronous.
new FontEngineInterface({ getStringWidth: async () => 1 });
// @ts-expect-error Face-selection callbacks cannot return JS addresses.
new FontEngineInterface({ getFontFaceHandle: () => 123 });
void custom;

const kind: BuiltinFontEngine = 'harfbuzz';
const harfbuzz = new FontEngineInterface(kind);
harfbuzz.registerLanguage('ar', 'Arab', 'rtl');
const selectedKind: FontEngineKind = harfbuzz.kind;
const capabilities: RmlUiCapabilities = getCapabilities();
const compiled: boolean = capabilities.fonts.harfbuzz.compiled;
const available: boolean = capabilities.fonts.harfbuzz.available;
void selectedKind;
void compiled;
void available;
// @ts-expect-error Built-in engines must be known native implementations.
new FontEngineInterface('browser');
// @ts-expect-error Registered direction must be explicit.
harfbuzz.registerLanguage('en', 'Latn', 'auto');
// @ts-expect-error Capabilities are read-only snapshots.
capabilities.fonts.bitmap.shaping = true;

const selected = new FontEngineInterface();
setFontEngineInterface(selected);
setFontEngineInterface(null);
const engine = getFontEngineInterface();
const renderer = getRenderInterface();
if (engine && renderer) {
  engine.loadFontFace('font.ttf', true, FontWeight.Auto, 0);
  engine.loadFontFace('font.ttf', 'face', FontStyle.Normal);
  engine.loadFontFace(new Uint8Array(), 'face', FontStyle.Italic, 700, true);
  const face: FontFaceHandle | null = engine.getFontFaceHandle(
    'face', FontStyle.Normal, FontWeight.Normal, 20);
  if (face) {
    const metrics: FontMetrics = engine.getFontMetrics(face);
    const shared: Float32Array = metrics.values;
    const metricSize: number = metrics.size;
    const ellipsis: boolean = metrics.hasEllipsis;
    const dimensions: readonly number[] = [
      metrics.ascent, metrics.descent, metrics.lineSpacing, metrics.xHeight,
      metrics.underlinePosition, metrics.underlineThickness,
    ];

    const shaping = new TextShapingContext('en');
    const enums: Int32Array = shaping.enums;
    const spacing: Float32Array = shaping.values;
    shaping.language = 'ja';
    shaping.textDirection = Style.Direction.Rtl;
    shaping.fontKerning = Style.FontKerning.None;
    shaping.letterSpacing = shared[0];

    void metricSize;
    void ellipsis;
    void dimensions;
    void enums;
    void spacing;
    // @ts-expect-error Font snapshots are created by a native font engine.
    new FontMetrics();
    // @ts-expect-error Scalar metric access is read-only.
    metrics.size = 12;
    // @ts-expect-error Shaping languages are strings.
    shaping.language = 12;

    const width: number = engine.getStringWidth(face, 'text', shaping, 65);
    const widths: Int32Array = engine.getStringWidths(face, [ 'one', 'two' ]);
    const buffer = new FontMeasureBuffer(2, 16);
    buffer.append('one');
    buffer.append('two');
    const measured: Int32Array = engine.measureStrings(face, buffer, shaping);
    buffer.bytes[0] = 65;
    buffer.offsets[1] = 1;
    engine.measureStrings(face, buffer, shaping, 65, 1);
    buffer.clear();
    void measured;
    const effects: FontEffectsHandle = engine.prepareFontEffects(face, []);
    engine.generateString(new RenderManager(renderer), face, effects, 'text',
      { x: width, y: widths[0] },
      { red: 128, green: 128, blue: 128, alpha: 128 }, 0.5, shaping);
    engine.getVersion(face);
    engine.releaseFontResources();
  }
  // @ts-expect-error Native face tokens cannot be addresses.
  engine.getStringWidth(123, 'forged');
  // @ts-expect-error Reusable buffers must be genuine public instances.
  engine.measureStrings({} as FontFaceHandle, {});
  // @ts-expect-error Native effects tokens cannot be addresses.
  const forged: FontEffectsHandle = 123;
  void forged;
}

// @ts-expect-error Clearing the reusable storage has no count parameter.
new FontMeasureBuffer().clear(1);
