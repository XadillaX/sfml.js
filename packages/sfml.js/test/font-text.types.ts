import {
  Font, Glyph, Text, TextStyle, LineAlignment, TextOrientation, ClusterGrouping,
  Color, Vector2f, RenderTexture, Vector2u, type FontInfo, type ReadonlyFont,
  type ReadonlyTexture, type ReadonlyValue, type ShapedGlyph,
} from '../src';

const font = new Font();
const opened: Promise<boolean> = font.openFromFile('font.ttf');
const info: FontInfo = font.getInfo();
const id: bigint = info.id;
const atlas: ReadonlyTexture = font.getTexture(30);
const glyph: ReadonlyValue<Glyph> = font.getGlyph(65, 30, false);
const copy = new Glyph(glyph);
copy.bounds.position.x = 3;
const text = new Text({ font, string: 'hello', characterSize: 30 });
// eslint-disable-next-line no-bitwise
text.setStyle(TextStyle.Bold | Text.Style.Italic);
text.setLineAlignment(LineAlignment.Center);
text.setTextOrientation(TextOrientation.TopToBottom);
text.setClusterGrouping(ClusterGrouping.Grapheme);
text.setPosition(new Vector2f(5, 6));
text.setGlyphPreProcessor((shaped, appearance) => {
  const glyph: ShapedGlyph = shaped;
  appearance.fillColor = Color.Red;
  appearance.style = Text.Style.Bold;
  void glyph;
});
text.getVertexData().getVertex(0).color = Color.Blue;
const retained: ReadonlyFont = text.getFont();
const target = new RenderTexture(new Vector2u(100, 100));
target.draw(text);
target.draw(new Text(text));
const readonlyText: ReadonlyValue<Text> = text;
target.draw(new Text(readonlyText));
// @ts-expect-error Const Text does not expose mutable setters.
readonlyText.setString('changed');
// @ts-expect-error Const Text does not expose mutable style setters.
readonlyText.setStyle(TextStyle.Bold);
// @ts-expect-error Font information is readonly.
info.family = 'family';
// @ts-expect-error Glyph references expose readonly members.
glyph.bounds.position.x = 4;
// @ts-expect-error Font atlas is readonly.
atlas.setSmooth(false);
// @ts-expect-error Text font getter is a const reference.
retained.setSmooth(false);
// @ts-expect-error Text requires a font through its options.
new Text();
// @ts-expect-error Positional font/string/size overloads are not exposed.
new Text(font, 'hello', 30);
// @ts-expect-error Shaped glyph positions are readonly.
text.getShapedGlyphs()[0].position.x = 1;
void [ opened, id, copy ];
