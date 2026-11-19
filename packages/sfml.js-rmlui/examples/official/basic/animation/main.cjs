'use strict';

const rmlui = require('../../../../dist');

/**
 * Port Samples/basic/animation/src/main.cpp using its original document.
 * @param {object} context Native RmlUi context.
 * @param {object} options Random source and backend exit callback.
 * @param {Function} options.random Uniform random source.
 * @param {Function} options.requestExit Request backend termination.
 * @return {object} Document, original frame loop and document cleanup.
 */
function createAnimation(context, {
  random = Math.random, requestExit = () => {},
} = {}) {
  const {
    Property, PropertyId, Unit, Tween, TweenType: T, TweenDirection: D,
    Transform, TransformPrimitiveType: P, KeyIdentifier: K,
  } = rmlui;
  let runLoop = true;
  let singleLoop = false;
  let nudge = 0;
  let margin = 0;
  let previousFade = 0;
  let previousTime = 0;
  let countFrames = 0;
  const radians = Math.PI / 180;

  function processEvent(value, event) {
    if (value === 'exit') {
      requestExit();
    }

    if (event.type === 'keydown') {
      const key = event.getParameter('key_identifier', 0);
      if (key === K.KI_SPACE) {
        runLoop = !runLoop;
      } else if (key === K.KI_RETURN) {
        runLoop = false;
        singleLoop = true;
      } else if (key === K.KI_OEM_PLUS) {
        nudge = 1;
      } else if (key === K.KI_OEM_MINUS) {
        nudge = -1;
      } else if (key === K.KI_ESCAPE) {
        requestExit();
      } else if ([
        K.KI_LEFT, K.KI_RIGHT, K.KI_UP, K.KI_DOWN,
      ].includes(key)) {
        const element = context.getRootElement()
          .getElementById('keyevent_response');
        if (element) {
          const target = key === K.KI_LEFT ? -200
            : (key === K.KI_RIGHT ? 200 : 0);
          element.animate('left',
            new Property(target, target ? Unit.DP : Unit.PX),
            0.5, new Tween(T.Cubic), 1, true, 0,
            key === K.KI_UP ? new Property(200, Unit.DP) : null);
        }
      }
    } else if (event.type === 'click') {
      const element = event.target;
      if (element.id === 'transition_class') {
        element.setClass('move_me', !element.isClassSet('move_me'));
      }
    } else if (event.type === 'animationend' &&
        event.target.id === 'animation_event') {
      event.target.animate('top', new Property(random() * 200, Unit.PX),
        1.2, new Tween(T.Cubic, D.InOut));
      event.target.animate('left', new Property(random() * 100, Unit.PERCENT),
        0.8, new Tween(T.Cubic, D.InOut));
    }
  }

  rmlui.Factory.registerEventListenerInstancer(
    new rmlui.EventListenerInstancer(value =>
      new rmlui.EventListener(event => processEvent(value, event))));
  const document = context.loadDocument('basic/animation/data/animation.rml');
  if (!document) {
    throw new Error('Could not load the upstream animation document');
  }
  document.getElementById('title').innerRML = 'Animation sample';

  const start = document.getElementById('start_game');
  start.animate('transform', Transform.makeProperty([
    { type: P.ROTATE2D, values: [ 10 * radians ] },
    { type: P.TRANSLATEX, values: [{ number: 100, unit: Unit.PX }] },
  ]), 1.8, new Tween(T.Elastic, D.InOut), -1, true);
  start.addAnimationKey('transform', Transform.makeProperty([
    { type: P.SCALE2D, values: [ 3, 3 ] },
  ]), 1.3, new Tween(T.Elastic, D.InOut));

  const scores = document.getElementById('high_scores');
  scores.animate('margin-left', new Property(0, Unit.PX),
    0.3, new Tween(T.Sine, D.In), 10, true, 1);
  scores.addAnimationKey('margin-left', new Property(100, Unit.PX),
    3, new Tween(T.Circular, D.Out));

  const options = document.getElementById('options');
  options.animate('image-color', new Property({
    type: 'colourb', red: 128, green: 255, blue: 255, alpha: 255,
  }, Unit.COLOUR), 0.3, new Tween(), -1, false);
  for (const [ red, green, blue, alpha, duration ] of [
    [ 128, 128, 255, 255, 0.3 ],
    [ 0, 128, 128, 255, 0.3 ],
    [ 64, 128, 255, 0, 0.9 ],
    [ 255, 255, 255, 255, 0.3 ],
  ]) {
    options.addAnimationKey('image-color', new Property({
      type: 'colourb', red, green, blue, alpha,
    }, Unit.COLOUR), duration);
  }

  const declarations = new rmlui.PropertyDictionary();
  rmlui.StyleSheetSpecification.parsePropertyDeclaration(declarations,
    'transform', 'translate(200px, 200px) rotate(1215deg)');
  document.getElementById('exit').animate('transform',
    declarations.getProperty(PropertyId.Transform), 3,
    new Tween(T.Bounce, D.Out), -1);

  document.getElementById('generic').animate('transform',
    Transform.makeProperty([
      { type: P.TRANSLATEY, values: [{ number: 50, unit: Unit.PX }] },
      { type: P.ROTATE3D, values: [ 0, 0, 1, -90 * radians ] },
      { type: P.SCALEY, values: [ 0.8 ] },
    ]), 1.5, new Tween(T.Sine, D.InOut), -1, true);

  document.getElementById('combine').animate('transform',
    Transform.makeProperty([
      { type: P.TRANSLATE2D, values: [
        { number: 50, unit: Unit.PX }, { number: 50, unit: Unit.PX },
      ] },
      { type: P.ROTATE2D, values: [ 1215 * radians ] },
    ]), 8, new Tween(), -1, true);

  document.getElementById('decomposition').animate('transform',
    Transform.makeProperty([
      { type: P.TRANSLATEY, values: [{ number: 50, unit: Unit.PX }] },
      { type: P.ROTATE3D, values: [ 0.8, 0, 1, 110 * radians ] },
    ]), 1.3, new Tween(T.Quadratic, D.InOut), -1, true);

  document.getElementById('abs_rel').animate('margin-left',
    new Property(50, Unit.PERCENT), 1.5, new Tween(), -1, true);
  document.getElementById('abs_rel_transform').animate('transform',
    Transform.makeProperty([
      { type: P.TRANSLATEX, values: [{ number: 0, unit: Unit.PX }] },
    ]), 1.5, new Tween(), -1, true);

  const animated = document.getElementById('animation_event');
  animated.animate('top', new Property(random() * 250, Unit.PX),
    1.5, new Tween(T.Cubic, D.InOut));
  animated.animate('left', new Property(random() * 250, Unit.PX),
    1.5, new Tween(T.Cubic, D.InOut));
  for (const type of [ 'keydown', 'keyup', 'animationend' ]) {
    document.addEventListener(type, event => processEvent('hello', event));
  }
  document.show();

  return {
    document,

    /**
     * Advance the original loop, including statistics while paused.
     * @param {number|Function} elapsed Seconds or the system clock reader.
     * @param {Function} present Render and present the backend frame.
     */
    frame(elapsed, present) {
      const time = typeof elapsed === 'function' ? elapsed() : elapsed;
      if (runLoop || singleLoop) {
        if (time - previousFade >= 1.4) {
          const help = document.getElementById('help');
          if (help.isClassSet('fadeout')) {
            help.setClass('fadeout', false);
            help.setClass('fadein', true);
          } else if (help.isClassSet('fadein')) {
            help.setClass('fadein', false);
            help.setClass('textalign', true);
          } else {
            help.setClass('textalign', false);
            help.setClass('fadeout', true);
          }
          previousFade = time;
        }
        context.update();
        present();
        singleLoop = false;
      }

      const dt = Math.fround(time - previousTime);
      countFrames++;
      if (nudge) {
        previousTime = time;
        margin = Math.fround(margin + Math.fround(nudge * 0.3));
        const exit = document.getElementById('exit');
        exit.setProperty(PropertyId.MarginLeft, new Property(margin, Unit.PX));
        rmlui.getSystemInterface().logMessage(rmlui.LogType.Info,
          `margin-left: '${margin.toFixed(6)}'   ` +
          `abs: ${exit.absoluteLeft.toFixed(6)}.`);
        nudge = 0;
      }
      if (dt > 0.2) {
        previousTime = time;
        const fps = Math.fround(countFrames / dt);
        countFrames = 0;
        document.getElementById('fps').innerRML = `FPS: ${fps.toFixed(6)}`;
      }
    },

    /** Close the same document owned by the upstream DemoWindow. */
    close() {
      document.close();
    },
  };
}

module.exports = { createAnimation };
