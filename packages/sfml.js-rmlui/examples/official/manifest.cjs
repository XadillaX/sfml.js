'use strict';

const { createAnimation } = require('./basic/animation/main.cjs');
const { createBenchmark } = require('./basic/benchmark/main.cjs');
const customLog = require('./basic/custom_log/main.cjs');
const { createLoadDocument } = require('./basic/load_document/main.cjs');
const { createVariables } = require('./basic/variables/main.cjs');
const { createDataBinding } = require('./basic/data_binding/main.cjs');
const { createDemo } = require('./basic/demo/main.cjs');
const { createTreeView } = require('./basic/tree_view/main.cjs');
const { createDrag } = require('./basic/drag/main.cjs');
const { createEffects } = require('./basic/effects/main.cjs');
const { createTransform } = require('./basic/transform/main.cjs');
const { createSvg } = require('./basic/svg/main.cjs');
const { createLottie } = require('./basic/lottie/main.cjs');
const bitmap = require('./basic/bitmap_font/main.cjs');
const harfbuzz = require('./basic/harfbuzz/main.cjs');
const ime = require('./basic/ime/main.cjs');
const { createTemplate } = require('./tutorial/template/main.cjs');
const { createDragTutorial } = require('./tutorial/drag/main.cjs');
const invaders = require('./invaders/main.cjs');
const luaInvaders = require('./lua_invaders/main.cjs');

// Application metadata is independent of the command-line and window runner.
const samples = {
  animation: {
    title: 'Animation Sample',
    description: 'Original tweens, transitions, arrow keys, pause and step',
    width: 1700, height: 900,
    create: createAnimation,
  },
  benchmark: {
    title: 'Benchmark Sample',
    description: '50 regenerated rows with separate update and render controls',
    width: 1800, height: 1000,
    create: createBenchmark,
  },
  'custom-log': {
    title: 'Custom File Handler Sample',
    description: 'Original native log messages written to a selected log file',
    prepare: customLog.prepare,
    create: customLog.createCustomLog,
  },
  'load-document': {
    title: 'Load Document Sample',
    description: 'Document loading with the original template and textures',
    create: createLoadDocument,
  },
  variables: {
    title: 'RCSS Variables Sample',
    description: 'Themes, custom properties, and runtime accent colors',
    resizable: false,
    highDpi: false,
    create: createVariables,
  },
  'data-binding': {
    title: 'Data Binding Sample',
    description: 'Four native data models with events, controls and Invaders',
    width: 1600, height: 900,
    create: createDataBinding,
  },
  'basic-demo': {
    title: 'Demo Sample',
    description: 'Original controls, tweening, form progress and live sandbox',
    width: 1600, height: 890,
    create: createDemo,
    documentHandlesEscape: true,
  },
  'tree-view': {
    title: 'Tree View Sample',
    description: 'Actual sample directory tree with expand/collapse controls',
    create: (context, options) => createTreeView(context, options.samplesRoot),
  },
  'basic-drag': {
    title: 'Drag Sample',
    description: 'Native-owned icons with cross-window transfer and ordering',
    create: createDrag,
  },
  effects: {
    title: 'Effects Sample',
    description: 'All original filter and transform controls and reset actions',
    create: createEffects,
  },
  transform: {
    title: 'Transform Sample',
    description: 'Orthographic and perspective rotation with Space to pause',
    width: 1600, height: 950,
    create: createTransform,
  },
  svg: {
    title: 'SVG Sample',
    description: 'SVG element, decorator and three inline data update paths',
    create: createSvg,
  },
  lottie: {
    title: 'Lottie Sample',
    description: 'Native playback of the original mountain animation',
    create: createLottie,
  },
  'bitmap-font': {
    title: 'Bitmap Font Sample',
    description: 'The original bitmap font atlas and font engine',
    create: bitmap.createBitmapFont, prepare: bitmap.prepare,
    fonts: bitmap.fonts,
  },
  harfbuzz: {
    title: 'HarfBuzz Text Shaping Sample',
    description: 'Native text shaping with English, Arabic and Hindi controls',
    create: harfbuzz.createHarfBuzz, prepare: harfbuzz.prepare,
    fonts: harfbuzz.fonts,
  },
  ime: {
    title: 'IME Sample',
    description: 'Original multilingual input and textarea with Noto fallback',
    create: ime.createIme,
    fonts: ime.fonts,
  },
  template: {
    title: 'Template Tutorial',
    description: 'Window decorated with the original nine-slice texture',
    create: createTemplate,
  },
  drag: {
    title: 'Drag Tutorial',
    description: 'Two movable, resizable inventory windows',
    create: createDragTutorial,
  },
  invaders: {
    title: 'RmlUi Invaders from Mars',
    description: 'Original native game, starfield, menus and persistent scores',
    resizable: false,
    contextName: 'main',
    documentHandlesEscape: true,
    create: invaders.createInvaders,
  },
  'lua-invaders': {
    title: 'RmlUi Invaders from Mars (Lua Powered)',
    description: 'Original Lua documents and Game table with native gameplay',
    resizable: false,
    contextName: 'main',
    documentHandlesEscape: true,
    create: luaInvaders.createInvaders,
  },
};

module.exports = { samples };
