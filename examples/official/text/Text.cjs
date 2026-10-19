'use strict';

// Port of SFML/examples/text/Text.cpp; see ../README.md.
const path = require('node:path');
const sf = require('../../..');

const windowWidth = 1200;
const textSize = 23;
const textSpacing = 5;
const rainbowDeltaPerSecond = 60;
let currentYPosition = 140;

/** A shaped text sample with glyph, cursor and per-character effects. */
class DemoText {
  constructor(font, message) {
    this.font = font;
    this.text = new sf.Text({ font, string: message, characterSize: textSize });
    this.boundingBox = new sf.RectangleShape();
    this.glyphBox = new sf.RectangleShape();
    this.cursor = new sf.RectangleShape();
    this.glyphIndex = 0;
    this.cursorIndex = 0;
    this.cursorPositions = [];
    this.colorDirection = false;
    this.rainbowColorHue = 0;
    this.preProcessingMode = 0;
    this.generateEffectData();

    const bounds = this.text.getLocalBounds();
    currentYPosition -= bounds.position.y;
    this.text.setPosition(new sf.Vector2f(
      (windowWidth - bounds.size.x) / 2, currentYPosition
    ));
    const global = this.text.getGlobalBounds();
    currentYPosition = global.position.y + global.size.y + textSpacing;

    this.boundingBox.setFillColor(sf.Color.Transparent);
    this.boundingBox.setOutlineColor(sf.Color.Red);
    this.boundingBox.setOutlineThickness(1);
    this.glyphBox.setFillColor(sf.Color.Transparent);
    this.glyphBox.setOutlineColor(sf.Color.Green);
    this.glyphBox.setOutlineThickness(1);
    this.cursor.setFillColor(sf.Color.White);
    this.update();
  }

  /** Recompute overlays and the rainbow animation's resting positions. */
  update() {
    const bounds = this.text.getLocalBounds();
    const position = this.text.getPosition();
    this.boundingBox.setPosition(new sf.Vector2f(
      position.x + bounds.position.x, position.y + bounds.position.y
    ));
    this.boundingBox.setSize(bounds.size);
    this.updateGlyphBox(0);
    this.computeCursorPositions();
    this.updateCursorPosition(0);
    this.rainbowYPositions = Array.from(
      this.text.getVertexData(), vertex => vertex.position.y
    );
  }

  /**
   * Move the selected glyph, distinguishing horizontal and vertical spaces.
   * @param {number} offset - Glyph index delta.
   */
  updateGlyphBox(offset) {
    const glyphs = this.text.getShapedGlyphs();
    this.glyphIndex = Math.max(
      0, Math.min(this.glyphIndex + offset, glyphs.length - 1)
    );
    const shaped = glyphs[this.glyphIndex];
    const bounds = shaped.glyph.bounds;
    const local = this.text.getLocalBounds();
    const boxHeight = this.text.getCharacterSize();
    const whitespace = new sf.Color(0, 127, 255);

    if (bounds.size.y === 0) {
      this.glyphBox.setPosition(new sf.Vector2f(
        shaped.position.x + bounds.position.x,
        local.position.y + shaped.position.y - boxHeight
      ));
      this.glyphBox.setSize(new sf.Vector2f(bounds.size.x, boxHeight));
      this.glyphBox.setOutlineColor(whitespace);
    } else if (bounds.size.x === 0) {
      this.glyphBox.setPosition(new sf.Vector2f(
        -local.size.x / 2, local.position.y + shaped.position.y - boxHeight
      ));
      this.glyphBox.setSize(new sf.Vector2f(local.size.x, bounds.size.y));
      this.glyphBox.setOutlineColor(whitespace);
    } else {
      this.glyphBox.setPosition(new sf.Vector2f(
        shaped.position.x + bounds.position.x,
        shaped.position.y + bounds.position.y
      ));
      this.glyphBox.setSize(bounds.size);
      this.glyphBox.setOutlineColor(sf.Color.Green);
    }
  }

  /** Interpolate caret locations inside ligatures and across directions. */
  computeCursorPositions() {
    this.cursorPositions = [];
    const global = this.text.getGlobalBounds();
    const glyphs = this.text.getShapedGlyphs();
    const ascent = this.font.getAscent(this.text.getCharacterSize());
    const descent = this.font.getDescent(this.text.getCharacterSize());
    const direction = sf.TextDirection;
    let previousCluster = 0;
    let previousPosition = new sf.Vector2f();
    let previousSize = new sf.Vector2f();
    let previousAdvance = 0;
    let previousDirection = direction.Unspecified;

    this.cursor.setSize(
      this.text.getTextOrientation() === sf.TextOrientation.Default
        ? new sf.Vector2f(1, ascent - descent)
        : new sf.Vector2f(global.size.x, 1)
    );
    for (const shaped of glyphs) {
      if (previousCluster !== 0 && shaped.cluster === previousCluster) {
        continue;
      }

      const size = shaped.glyph.bounds.size;
      const position = new sf.Vector2f(
        shaped.position.x, shaped.baseline - ascent
      );
      if (shaped.textDirection === direction.RightToLeft) {
        position.x += size.x;
      }
      if (shaped.textDirection === direction.TopToBottom) {
        position.x = shaped.position.x + (size.x - global.size.x) / 2;
        position.y = shaped.position.y - (size.x === 0 ? size.y / 2 : ascent);
      } else if (shaped.textDirection === direction.BottomToTop) {
        position.x = shaped.position.x + (size.x - global.size.x) / 2;
        position.y = shaped.position.y -
          (size.x === 0 ? -size.y / 2 : descent);
      }

      // JS cluster and Unicode boundary indices are UTF-16 offsets.
      const subWidth = (position.x - previousPosition.x) /
        (shaped.cluster - previousCluster);
      while (shaped.cluster - previousCluster > 1) {
        previousPosition.x += subWidth;
        ++previousCluster;
        this.cursorPositions.push(new sf.Vector2f(previousPosition));
      }
      previousCluster = shaped.cluster;
      previousPosition = position;
      previousSize = size;
      previousAdvance = shaped.glyph.advance;
      previousDirection = shaped.textDirection;
      this.cursorPositions.push(new sf.Vector2f(previousPosition));
    }

    const length = this.text.getString().length;
    if (this.cursorPositions.length < length) {
      const subWidth = (previousDirection === direction.RightToLeft
        ? -previousAdvance : previousAdvance) / (length - previousCluster);
      const position = new sf.Vector2f(previousPosition);
      while (this.cursorPositions.length < length) {
        position.x += subWidth;
        this.cursorPositions.push(new sf.Vector2f(position));
      }
    }

    const end = new sf.Vector2f(previousPosition);
    switch (previousDirection) {
      case direction.LeftToRight:
        end.x += Math.max(previousSize.x, previousAdvance);
        break;
      case direction.RightToLeft:
        end.x -= Math.max(previousSize.x, previousAdvance);
        break;
      case direction.TopToBottom:
        end.y += Math.max(previousSize.y, previousAdvance);
        break;
      case direction.BottomToTop:
        end.y -= Math.max(previousSize.y, previousAdvance);
        break;
      default:
        return;
    }
    this.cursorPositions.push(end);
  }

  /**
   * Move the cursor to the next valid grapheme boundary.
   * @param {number} offset - Cursor movement direction.
   */
  updateCursorPosition(offset) {
    const string = this.text.getString();
    this.cursorIndex = Math.max(
      0, Math.min(this.cursorIndex + offset, string.length)
    );
    while (this.cursorIndex < string.length &&
      !sf.Unicode.isGraphemeBoundary(string, this.cursorIndex)) {
      this.cursorIndex += offset < 0 ? -1 : 1;
    }
    this.cursor.setPosition(this.cursorPositions[
      Math.min(this.cursorIndex, this.cursorPositions.length - 1)
    ]);
  }

  /**
   * Select the nearest glyph and valid cursor location to a mouse press.
   * @param {object} position - Mouse position in world coordinates.
   */
  handleMousePress(position) {
    if (!this.boundingBox.getGlobalBounds().contains(position)) {
      return;
    }
    const transform = this.text.getTransform();
    const distanceTo = shape => {
      const center = transform.transformPoint(
        shape.getGlobalBounds().getCenter()
      );
      return Math.hypot(center.x - position.x, center.y - position.y);
    };

    let closestIndex = 0;
    let closestDistance = this.text.getLocalBounds().size.x;
    const glyphCount = this.text.getShapedGlyphs().length;
    for (let i = 0; i < glyphCount; ++i) {
      this.glyphIndex = i;
      this.updateGlyphBox(0);
      const distance = distanceTo(this.glyphBox);
      if (distance < closestDistance) {
        closestIndex = i;
        closestDistance = distance;
      }
    }
    this.glyphIndex = closestIndex;
    this.updateGlyphBox(0);

    closestIndex = 0;
    closestDistance = this.text.getLocalBounds().size.x;
    this.cursorIndex = 0;
    this.updateCursorPosition(0);
    for (;;) {
      const distance = distanceTo(this.cursor);
      if (distance < closestDistance) {
        closestIndex = this.cursorIndex;
        closestDistance = distance;
      }
      const previous = this.cursorIndex;
      this.updateCursorPosition(1);
      if (this.cursorIndex === previous) {
        break;
      }
    }
    this.cursorIndex = closestIndex;
    this.updateCursorPosition(0);
  }

  /** Assign alternating word colors/outlines and sentence styles once. */
  generateEffectData() {
    const colors = [
      new sf.Color(255, 127, 127), new sf.Color(127, 255, 127),
      new sf.Color(127, 127, 255), new sf.Color(127, 255, 255),
      new sf.Color(255, 127, 255), new sf.Color(255, 255, 127),
    ];
    const string = this.text.getString();
    let colorIndex = 0;
    let outline = false;
    let italicize = false;
    let embolden = false;
    this.effectData = Array.from(
      { length: string.length }, () => ({ color: new sf.Color() })
    );

    for (let i = 0; i < string.length; ++i) {
      if (' \t\n'.includes(string[i])) {
        continue;
      }
      if (sf.Unicode.isWordBoundary(string, i)) {
        colorIndex = (colorIndex + 1) % colors.length;
        outline = !outline;
      }
      if (sf.Unicode.isSentenceBoundary(string, i)) {
        italicize = !italicize;
        embolden = !embolden;
      }
      this.effectData[i] = {
        color: colors[colorIndex], outline, italicize, embolden,
      };
    }
  }

  /**
   * Apply the selected per-glyph effect before geometry generation.
   * @param {object} glyph - Shaped glyph metadata.
   * @param {object} appearance - Mutable glyph appearance.
   */
  preProcessGlyph(glyph, appearance) {
    const effect = this.effectData[glyph.cluster];
    switch (this.preProcessingMode) {
      case 1:
        appearance.fillColor = this.colorDirection
          ? (glyph.textDirection === sf.TextDirection.RightToLeft
            ? new sf.Color(127, 255, 127) : new sf.Color(255, 255, 127))
          : effect.color;
        break;
      case 2:
        if (effect.outline) {
          appearance.outlineColor = sf.Color.Magenta;
          appearance.outlineThickness = 1;
        }
        break;
      case 3:
        if (effect.italicize && appearance.style % 4 < sf.TextStyle.Italic) {
          appearance.style += sf.TextStyle.Italic;
        }
        break;
      case 4:
        if (effect.embolden && appearance.style % 2 === 0) {
          appearance.style += sf.TextStyle.Bold;
        }
        break;
      default:
        break;
    }
  }

  /** Cycle None, Color, Outline, Italicize and Embolden. */
  cyclePreProcessing() {
    this.preProcessingMode = (this.preProcessingMode + 1) % 5;
    this.text.setGlyphPreProcessor(
      (glyph, appearance) => this.preProcessGlyph(glyph, appearance)
    );
  }

  /**
   * Animate shared vertex colors and positions per shaped cluster.
   * @param {number} delta - Hue change in degrees.
   */
  updateRainbowText(delta) {
    this.rainbowColorHue = (this.rainbowColorHue + delta) % 360;
    const glyphs = this.text.getShapedGlyphs();
    const vertices = this.text.getVertexData();
    const hueStep = 360 / this.text.getString().length;
    let hue = this.rainbowColorHue;
    let previousCluster = 0;

    for (const glyph of glyphs) {
      if (glyph.cluster !== previousCluster) {
        hue += hueStep;
        previousCluster = glyph.cluster;
      }
      hue %= 360;
      const h = hue / 60;
      const x = Math.round((1 - Math.abs(h % 2 - 1)) * 255);
      const colors = [
        [ 255, x, 0 ], [ x, 255, 0 ], [ 0, 255, x ],
        [ 0, x, 255 ], [ x, 0, 255 ], [ 255, 0, x ],
      ];
      const color = new sf.Color(...colors[Math.floor(h)]);
      const end = glyph.vertexOffset + glyph.vertexCount;
      for (let i = glyph.vertexOffset; i < end; ++i) {
        const vertex = vertices.getVertex(i);
        vertex.color = color;
        vertex.position.y = this.rainbowYPositions[i] +
          Math.sin(hue * 2 * Math.PI / 180) * 2;
      }
    }
  }
}

/** Load the original multilingual samples and run the text demonstration. */
async function main() {
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(windowWidth, 800)), 'SFML Text',
    { style: sf.Style.Titlebar + sf.Style.Close }
  );
  window.setVerticalSyncEnabled(true);
  const font = new sf.Font();
  if (!await font.openFromFile(path.join(__dirname, 'resources/tuffy.ttf'))) {
    throw new Error('Failed to load tuffy.ttf');
  }
  const instructions = new sf.Text({
    font, characterSize: 14,
    string: 'F1: Toggle text bounding box\nF2: Toggle glyph bounding box\n' +
      'F3: Toggle cursor\nF4: Cycle pre-processing ' +
      '(None, Color, Outline, Italicize, Embolden)\n' +
      'Left/Right Arrow: Move cursor and glyph bounding box\n' +
      'Mouse Press: Set cursor and glyph bounding box position',
  });
  instructions.setPosition(new sf.Vector2f(10, 10));
  const demoTexts = [];

  /**
   * Open a sample font asynchronously before constructing its text.
   * @param {string} filename - Original resource filename.
   * @param {string} message - Original sample string.
   */
  async function add(filename, message) {
    const sampleFont = new sf.Font();
    const filenamePath = path.join(__dirname, 'resources', filename);
    if (!await sampleFont.openFromFile(filenamePath)) {
      throw new Error(`Failed to load ${filename}`);
    }
    const demo = new DemoText(sampleFont, message);
    demoTexts.push(demo);
    return demo;
  }

  const latin = 'NotoSerif-Regular.ttf';
  const arabic = 'NotoNaskhArabic-Regular.ttf';
  for (const [ filename, message ] of [
    [ latin, "Hello. How are you? I hope you're having a great day!" ],
    [ 'NotoSerifArmenian-Regular.ttf',
      'Բարև։ Ինչպե՞ս ես։ Հուսով եմ՝ լավ օր ես անցկացնում։' ],
    [ 'NotoSerifGeorgian-Regular.ttf',
      'გამარჯობა. როგორ ხარ? იმედია, კარგად გაატარე დღე!' ],
    [ arabic, 'مرحباً، كيف حالك؟ أتمنى أن يكون يومك سعيداً!' ],
    [ latin, 'Hallo. Wie geht es dir? Ich hoffe, du hast einen schönen Tag!' ],
    [ 'NotoSerifDevanagari-Regular.ttf',
      'नमस्ते। आप कैसे हैं? आशा है आपका दिन अच्छा गुजर रहा होगा!' ],
    [ 'NotoSerifHebrew-Regular.ttf', 'שלום. מה שלומך? מקווה שיש לך יום נהדר!' ],
    [ 'NotoSerifJP-Regular.subset.ttf',
      'こんにちは。お元気ですか？素敵な一日をお過ごしください！' ],
    [ latin, 'Γεια σας. Τι κάνετε; Ελπίζω να έχετε μια υπέροχη μέρα!' ],
    [ 'NotoSerifKhmer-Regular.ttf',
      'ជំរាបសួរ។ សុខសប្បាយជាទេ? សង្ឃឹមថាអ្នកមានថ្ងៃដ៏អស្ចារ្យ!' ],
    [ latin, 'Hola. ¿Cómo estás? ¡Que tengas un buen día!' ],
    [ 'NotoSerifKR-Regular.subset.ttf',
      '안녕하세요. 잘 지내시죠? 좋은 하루 보내시길 바랍니다!' ],
    [ 'NotoSerifMyanmar-Regular.ttf',
      'မင်္ဂလာပါ။ နေကောင်းလား? ' +
      'ကောင်းသောနေ့ကို ပိုင်ဆိုင်နိုင်မည်ဟု မျှော်လင့်ပါသည်။' ],
    [ 'NotoSerifTamil-Regular.ttf',
      'வணக்கம். எப்படி இருக்கீங்க? ' +
      'இந்த நாள் உங்களுக்கு ரொம்ப நல்லா அமைய வாழ்த்துக்கள்!' ],
    [ latin, 'Здравствуйте. Как поживаете? Надеюсь, у вас отличный день!' ],
    [ 'NotoSerifTC-Regular.subset.ttf', '你好。你好嗎？祝你今天過得愉快！' ],
    [ 'NotoSerifThai-Regular.ttf',
      'สวัสดี สบายดีไหม หวังว่าคุณคงมีวันดีๆ นะ!' ],
    [ 'NotoSerifTibetan-Regular.ttf',
      'བདེ་མོ། ཁྱོད་བདེ་མོ? ཁྱེད་རང་ལ་ཉིན་མོ་ཡག་པོ་ཞིག་ཡོང་བའི་རེ་བ་ཡོད།' ],
    [ latin,
      "Bonjour. Comment allez-vous ? J'espère que vous " +
      'passez une bonne journée !' ],
    [ 'NotoSerifEthiopic-Regular.ttf', 'ሀሎ። ስላም፧ ጥሩ ቀን እንዳለህ ተስፋ አድርግ!' ],
  ]) {
    await add(filename, message);
  }

  const ligature = await add(
    latin, 'ligatures:\nflowers\nmuffins\nwaffles\nstuff'
  );
  const normal = await add(latin, 'Normal/Bold/Italic');
  const bold = await add(latin, 'Normal/Bold/Italic');
  const italic = await add(latin, 'Normal/Bold/Italic');
  const zalgo = await add(latin,
    'Z̴̢̧͕̱͍͖̱̙̲̳͉̘̐̒͜a̴̲̖̖̖͈͉̪͎̜̽̓̀̀̒͌l̸̰͙̳̗͎͙̼͓̭̥͖̾̀̅̏͐̾͊̃͂̾ͅ' +
    'g̷̡̢͚̗͎̰̦͔̰̬͍̖̩̺̞͕̓̃̇ö̴̜̳̼̘̗͖͍̻͎͓̣̮̝̯͉̞́̄̉̀̄͆̈́͛̐̂̾͐̓̄');
  const tab = await add(latin, 'Tab: >\t<');
  const rainbow = await add(latin, 'Rainbow Text!');
  const bidi = await add(arabic,
    'Aligned multi-line\nنص ثنائي الاتجاه باستخدام مكتبة SFML الإصدار ' +
    `\u202A${sf.version().string}\u202C.\nالأرقام: 0123456789`);
  const left = await add(arabic, 'Left-Aligned\nText\nنص محاذي');
  const center = await add(arabic, 'Center-Aligned\nText\nنص محاذي');
  const right = await add(arabic, 'Right-Aligned\nText\nنص محاذي');
  const strike = await add(latin, 'Strikethrough');
  const underline = await add(latin, 'Underlined');
  const verticalKorean = await add(
    'NotoSerifKR-Regular.subset.ttf', '누워서 떡 먹기'
  );
  const verticalJapanese = await add(
    'NotoSerifJP-Regular.subset.ttf', '七転び八起き'
  );
  const verticalChinese = await add('NotoSerifTC-Regular.subset.ttf', '一字值千金');
  const down = await add(latin, 'Down Text');
  const up = await add(latin, 'Up Text');
  const verticalStrike = await add(latin, 'Strikethrough');
  const verticalUnderline = await add(latin, 'Underlined');

  for (const [ demo, x, y ] of [
    [ ligature, 20, 350 ], [ normal, 20, 620 ], [ bold, 20, 650 ],
    [ italic, 20, 680 ], [ zalgo, 160, 370 ], [ tab, 20, 300 ],
    [ rainbow, 300, 10 ], [ left, 20, 150 ], [ center, 560, 10 ],
    [ right, 1180, 600 ], [ strike, 950, 130 ], [ underline, 950, 170 ],
  ]) {
    demo.text.setPosition(new sf.Vector2f(x, y));
  }
  bold.text.setStyle(sf.TextStyle.Bold);
  italic.text.setStyle(sf.TextStyle.Italic);
  rainbow.text.setStyle(sf.TextStyle.Bold);
  bidi.text.setPosition(new sf.Vector2f(
    windowWidth - bidi.text.getGlobalBounds().size.x - 20, 10
  ));
  bidi.colorDirection = true;
  left.text.setLineAlignment(sf.LineAlignment.Left);
  center.text.setLineAlignment(sf.LineAlignment.Center);
  right.text.setLineAlignment(sf.LineAlignment.Right);
  strike.text.setStyle(sf.TextStyle.StrikeThrough);
  underline.text.setStyle(sf.TextStyle.Underlined);

  for (const [ demo, margin, y ] of [
    [ verticalKorean, 200, 240 ], [ verticalJapanese, 170, 260 ],
    [ verticalChinese, 140, 270 ], [ down, 110, 200 ], [ up, 80, 225 ],
    [ verticalStrike, 50, 140 ], [ verticalUnderline, 20, 180 ],
  ]) {
    demo.text.setTextOrientation(demo === up
      ? sf.TextOrientation.BottomToTop : sf.TextOrientation.TopToBottom);
    demo.text.setPosition(new sf.Vector2f(
      windowWidth - demo.text.getGlobalBounds().size.x - margin, y
    ));
  }
  verticalStrike.text.setStyle(sf.TextStyle.StrikeThrough);
  verticalUnderline.text.setStyle(sf.TextStyle.Underlined);
  for (const demo of demoTexts) {
    demo.update();
  }

  let drawBoundingBox = false;
  let drawGlyphBox = false;
  let drawCursor = false;
  const clock = new sf.Clock();

  /** Process original controls and animate text, yielding after each frame. */
  function frame() {
    window.handleEvents({
      Closed: () => window.close(),
      KeyPressed: event => {
        const scan = sf.Keyboard.Scan;
        switch (event.scancode) {
          case scan.Left:
          case scan.Right:
            for (const demo of demoTexts) {
              const offset = event.scancode === scan.Left ? -1 : 1;
              demo.updateGlyphBox(offset);
              demo.updateCursorPosition(offset);
            }
            break;
          case scan.Escape:
            window.close();
            break;
          case scan.F1:
            drawBoundingBox = !drawBoundingBox;
            break;
          case scan.F2:
            drawGlyphBox = !drawGlyphBox;
            break;
          case scan.F3:
            drawCursor = !drawCursor;
            break;
          case scan.F4:
            for (const demo of demoTexts) {
              demo.cyclePreProcessing();
            }
            break;
          default:
            break;
        }
      },
      MouseButtonPressed: event => {
        if (event.button === sf.Mouse.Button.Left) {
          for (const demo of demoTexts) {
            demo.handleMousePress(window.mapPixelToCoords(event.position));
          }
        }
      },
    });
    if (!window.isOpen()) {
      return;
    }

    window.clear();
    rainbow.updateRainbowText(
      clock.restart().asSeconds() * rainbowDeltaPerSecond
    );
    for (const demo of demoTexts) {
      const states = new sf.RenderStates(demo.text.getTransform());
      if (drawBoundingBox) {
        window.draw(demo.boundingBox);
      }
      if (drawGlyphBox) {
        window.draw(demo.glyphBox, states);
      }
      window.draw(demo.text);
      if (drawCursor) {
        window.draw(demo.cursor, states);
      }
    }
    window.draw(instructions);
    window.display();
    if (window.isOpen()) {
      setImmediate(frame);
    }
  }
  frame();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
