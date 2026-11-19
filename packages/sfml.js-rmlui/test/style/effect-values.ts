import {
  DecoratorList, FilterList, FontEffectList, FontEffectLayer,
  Property, PropertyId, Unit,
  type Element, type RmlEvent, type VariantValue,
  DecoratorDeclaration, FilterDeclaration, DecoratorInstancer, FilterInstancer,
  type FontEffectSnapshot, type FontEffectCallbacks,
  FontEffect, FontGlyph, ColorFormat, type FontGlyphMetrics, type FontGlyphMap,
} from '../../dist';

declare const element: Element;
declare const event: RmlEvent;

const decorators = new DecoratorList('image(example.png)');
const filters = new FilterList('blur(2px)');
const effects = new FontEffectList('outline(1px red)');
const values: VariantValue[] = [ decorators, filters, effects ];
const declaration: DecoratorDeclaration = decorators.list[0];
const filter: FilterDeclaration = filters.list[0];
const effect: FontEffectSnapshot = effects.list[0];
const writableEffect: FontEffect = effects.list[0];
const glyph = new FontGlyph();
const glyphMap: FontGlyphMap = new Map([[ 65, glyph ]]);
glyph.bearing = { x: -1, y: 2 };
glyph.advance = 4;
glyph.bitmapDimensions = { x: 1, y: 1 };
glyph.bitmapOwnedData = Uint8Array.of(255);
glyph.colorFormat = ColorFormat.A8;
const weakGlyph: FontGlyph = glyph.weakCopy();
const glyphMetrics: FontGlyphMetrics = writableEffect.getGlyphMetrics(glyph);
const callbacks: FontEffectCallbacks = {
  hasUniqueTexture: () => true,
  getGlyphMetrics(input, origin, dimensions) {
    const snapshot: FontGlyph = input;
    return { supported: snapshot.advance > 0, origin, dimensions };
  },
  generateGlyphTexture(destination, dimensions, stride, input) {
    const snapshot: FontGlyph = input;
    FontEffect.fillColorValuesFromAlpha(destination, dimensions, stride);
    void snapshot;
  },
};
new FontEffect(callbacks);
new FontEffect({});
// @ts-expect-error Unique texture overrides must return a boolean.
new FontEffect({ hasUniqueTexture: () => 1 });
// @ts-expect-error Metric callbacks must be synchronous.
new FontEffect({ getGlyphMetrics: async () => glyphMetrics });
writableEffect.generateGlyphTexture(
  new Uint8Array(36), { x: 3, y: 3 }, 12, weakGlyph);
FontEffect.fillColorValuesFromAlpha(
  new Uint8Array(36), { x: 3, y: 3 }, 12);
FontEffect.fillColorValuesFromAlpha(
  // @ts-expect-error RGBA storage must contain bytes.
  new Float32Array(36), { x: 3, y: 3 }, 12);
writableEffect.colour = {
  type: 'colourb', red: 1, green: 2, blue: 3, alpha: 255,
};
writableEffect.fingerprint = 12n;
writableEffect.layer = FontEffectLayer.Front;
effects.list = [ writableEffect, new FontEffect() ];
effects.value = 'manual';
new FontEffectList(effects.list, 'manual');
// @ts-expect-error Owned effect classes cannot be replaced with metadata.
effects.list = [ effect ];
// @ts-expect-error Native size_t is represented by bigint.
writableEffect.fingerprint = 123;
// @ts-expect-error Native pointers cannot be supplied as bitmap data.
glyph.bitmapData = 123;
const layer: FontEffectLayer = effect.layer;
const fingerprint: bigint = effect.fingerprint;
const property = new Property(filters, Unit.FILTER);
const converted: FilterList = property.get(filters);
const fallback: FontEffectList = element.getAttribute('effect', effects);
const parameter: DecoratorList = event.getParameter('effect', decorators);
element.setProperty(PropertyId.Filter, property);
element.setAttribute('effect', filters);
element.dispatchEvent('effect', { value: effects });

// @ts-expect-error RCSS input must be text.
new FilterList(3);
filters.value = 'blur(4px)';
filters.list = [ filter ];
new FilterList(filters.list, 'manual');
new DecoratorList(decorators.list, 'manual');
new FilterDeclaration().instancer = FilterInstancer.get('blur');
new DecoratorDeclaration().instancer = DecoratorInstancer.get('image');
// @ts-expect-error Instancer types cannot be interchanged.
new FilterDeclaration().instancer = DecoratorInstancer.get('image');
// @ts-expect-error Fingerprints retain exact integers.
const fingerprintNumber: number = effect.fingerprint;
// @ts-expect-error Lists cannot be fabricated from metadata.
const fake: FilterList = { value: 'none', isNull: true };

void [ values, declaration, filter, layer, fingerprint, converted, fallback,
  parameter, fingerprintNumber, fake, glyphMetrics, glyphMap ];
