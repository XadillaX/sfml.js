'use strict';

function validateTypeOf(arg, name, type, optional = false) {
  if (optional && arg === undefined) {
    return;
  }

  if (typeof type !== 'string') {
    if (!(arg instanceof type)) {
      throw new TypeError(`Parameter \`${name}\` has wrong type.`);
    }
  } else {
    if (typeof arg !== type) {
      throw new TypeError(`Parameter \`${name}\` should be type of ${type}.`);
    }
  }
}

module.exports = {
  validateTypeOf,
};
