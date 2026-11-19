'use strict';

const rmlui = require('../../../../dist');

const tweenFunctions = new Map([
  [ 'back', rmlui.TweenType.Back ], [ 'bounce', rmlui.TweenType.Bounce ],
  [ 'circular', rmlui.TweenType.Circular ], [ 'cubic', rmlui.TweenType.Cubic ],
  [ 'elastic', rmlui.TweenType.Elastic ],
  [ 'exponential', rmlui.TweenType.Exponential ],
  [ 'linear', rmlui.TweenType.Linear ],
  [ 'quadratic', rmlui.TweenType.Quadratic ],
  [ 'quartic', rmlui.TweenType.Quartic ],
  [ 'quintic', rmlui.TweenType.Quintic ],
  [ 'sine', rmlui.TweenType.Sine ],
]);
const tweenDirections = new Map([
  [ 'in', rmlui.TweenDirection.In ], [ 'out', rmlui.TweenDirection.Out ],
  [ 'in-out', rmlui.TweenDirection.InOut ],
]);

/** Inline action listener translated from original DemoEventListener.cpp. */
class DemoEventListener {
  /**
   * Keep the original inline value, attached element and DemoWindow.
   * @param {string} value Original inline attribute value.
   * @param {object} element Native element requesting the listener.
   * @param {object} demoWindow Original window application.
   * @param {Function} random Uniform source for RandomInteger(255).
   */
  constructor(value, element, demoWindow, random) {
    this.value = value;
    this.element = element;
    this.demoWindow = demoWindow;
    this.random = random;
  }

  /**
   * Process the exact original action without replacing native controls.
   * @param {object} event Live native RmlUi event.
   */
  processEvent(event) {
    const { value, element, demoWindow } = this;
    if (value === 'change_color') {
      const settings = demoWindow.getTweeningParameters();
      const color = {
        type: 'colourb',
        red: Math.floor(this.random() * 255),
        green: Math.floor(this.random() * 255),
        blue: Math.floor(this.random() * 255),
        alpha: 255,
      };
      const target = new rmlui.Property(color, rmlui.Unit.COLOUR);
      element.animate('image-color', target,
        settings.duration, new rmlui.Tween(settings.type, settings.direction));
      event.stopPropagation();
    } else if (value === 'move_child') {
      const child = element.getFirstChild();
      if (child) {
        const f32 = Math.fround;
        const offset = element.getAbsoluteOffset();
        const x = f32(f32(f32(event.getParameter('mouse_x', 0)) - offset.x) -
          f32(f32(0.35) * child.clientWidth));
        const y = f32(f32(f32(event.getParameter('mouse_y', 0)) - offset.y) -
          f32(f32(0.9) * child.clientHeight));
        const destination = rmlui.Transform.makeProperty([{
          type: rmlui.TransformPrimitiveType.TRANSLATE2D,
          values: [
            { number: x, unit: rmlui.Unit.PX },
            { number: y, unit: rmlui.Unit.PX },
          ],
        }]);
        const settings = demoWindow.getTweeningParameters();
        if (settings.duration <= 0) {
          child.setProperty(rmlui.PropertyId.Transform, destination);
        } else {
          child.animate('transform', destination, settings.duration,
            new rmlui.Tween(settings.type, settings.direction));
        }
      }
    } else if (value === 'tween_function' || value === 'tween_direction') {
      const options = value === 'tween_function' ? tweenFunctions :
        tweenDirections;
      const setting = options.get(event.getParameter('value', ''));
      // RMLUI_ERROR is a no-op in the original Release application. Keep the
      // existing setting for unknown values instead of inventing a fallback.
      if (setting !== undefined) {
        const parameters = demoWindow.getTweeningParameters();
        parameters[value === 'tween_function' ? 'type' : 'direction'] = setting;
        demoWindow.setTweeningParameters(parameters);
      }
    } else if (value === 'tween_duration') {
      const duration = Math.fround(parseFloat(element.getValue()) || 0);
      const parameters = demoWindow.getTweeningParameters();
      parameters.duration = duration;
      demoWindow.setTweeningParameters(parameters);
      const label = element.getElementById('duration');
      if (label) {
        label.innerRML = duration.toFixed(2);
      }
    } else if (value === 'rating') {
      const label = element.getElementById('rating');
      const emoji = element.getElementById('rating_emoji');
      if (label && emoji) {
        const rating = Math.trunc(event.getParameter('value', 50));
        label.innerRML = `${rating}%`;
        emoji.innerRML = rating <= 0 ? '😢'
          : rating < 50 ? '😐' : rating < 75 ? '😮' : rating < 100 ? '😎' : '🏆';
      }
    } else if (value === 'submit_form') {
      let output = '<p>';
      for (const name of Object.keys(event.parameters)) {
        let content = rmlui.StringUtilities.encodeRml(
          event.getParameter(name, ''));
        if (name === 'message') {
          content = '<br/>' + content;
        }
        output += `<strong>${name}</strong>: ${content}<br/>`;
      }
      demoWindow.submitForm(output + '</p>');
    } else if (value === 'set_sandbox_body' || value === 'set_sandbox_style') {
      const body = value === 'set_sandbox_body';
      const source = element.getElementById(body
        ? 'sandbox_rml_source' : 'sandbox_rcss_source');
      if (source) {
        if (body) {
          demoWindow.setSandboxBody(source.getValue());
        } else {
          demoWindow.setSandboxStylesheet(source.getValue());
        }
      }
    } else if (value === 'cancel_selection_on_escape' &&
        event.getParameter('key_identifier', 0) ===
          rmlui.KeyIdentifier.KI_ESCAPE &&
        element instanceof rmlui.ElementFormControlSelect &&
        element.isSelectBoxVisible()) {
      element.cancelSelectBox();
      event.stopPropagation();
    }
  }
}

/**
 * Register the original listener instancer before loading DemoWindow.
 * @param {object} demoWindow Original application window.
 * @param {Function} random Uniform source for original colour changes.
 * @return {object} Native listener instancer retained by Factory.
 */
function createDemoEventListenerInstancer(demoWindow, random) {
  return new rmlui.EventListenerInstancer((value, element) => {
    const listener = new DemoEventListener(value, element, demoWindow, random);
    return new rmlui.EventListener(event => listener.processEvent(event));
  });
}

module.exports = { DemoEventListener, createDemoEventListenerInstancer };
