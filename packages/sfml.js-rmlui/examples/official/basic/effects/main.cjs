'use strict';

const filterDefaults = {
  opacity: 1, sepia: 0, grayscale: 0, saturate: 1, brightness: 1,
  contrast: 1, hue_rotate: 0, invert: 0, blur: 0, drop_shadow: false,
};
const transformDefaults = {
  scale: 1, rotate_x: 0, rotate_y: 0, rotate_z: 0, perspective: 3000,
  perspective_origin_x: 50, perspective_origin_y: 50, transform_all: false,
};

/**
 * Bind exactly the scalar fields and submenu-scoped reset of basic/effects.
 * @param {object} context Live RmlUi context.
 * @return {object} Native model, document and shutdown hook.
 */
function createEffects(context) {
  const model = context.createDataModel('effects');
  const scalar = model.getDataTypeRegister()
    .registerScalar('EffectsFloat', 'float32');
  for (const [ name, value ] of Object.entries({
    show_menu: false, submenu: 'filter',
    ...filterDefaults, ...transformDefaults,
  })) {
    if (!model.bind(name, value,
      typeof value === 'number' ? scalar : undefined)) {
      throw new Error(`Could not bind effects.${name}`);
    }
  }
  model.bindEventCallback('reset', () => {
    const submenu = model.getVariable('submenu').get();
    const defaults = submenu === 'transform' ? transformDefaults
      : submenu === 'filter' ? filterDefaults : {};
    for (const [ name, value ] of Object.entries(defaults)) {
      model.getVariable(name).set(value);
    }
    model.dirtyAllVariables();
  });
  const document = context.loadDocument('basic/effects/data/effects.rml');
  document.show();

  return {
    document, model,
    close() {
      document.close();
      context.removeDataModel('effects');
    },
  };
}

module.exports = { createEffects };
