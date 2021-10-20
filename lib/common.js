'use strict';

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

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
  createDeferred,
  validateTypeOf,
};
