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

  if (!Array.isArray(type)) {
    type = [ type ];
  }

  for (const t of type) {
    if (typeof t !== 'string') {
      if (arg instanceof t) {
        return;
      }
    } else {
      if (typeof arg === t) {
        return;
      }
    }
  }

  throw new TypeError(`Parameter \`${name}\` should be type of ${type.map(t => {
    if (typeof t === 'string') return t;
    return t.name;
  }).join(', ')}.`);
}

module.exports = {
  createDeferred,
  validateTypeOf,
};
