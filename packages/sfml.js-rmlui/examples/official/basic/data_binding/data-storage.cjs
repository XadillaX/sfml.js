'use strict';

// Cached checked paths expose the upstream sample's fields without copying the
// entire model each frame. Native controllers and application code share them.
function liveFields(variable, names) {
  const result = {};
  for (const name of names) {
    const child = variable.child(name);
    Object.defineProperty(result, name, {
      enumerable: true,
      get: () => child.get(),
      set: value => child.set(value),
    });
  }
  return result;
}

function bindFields(model, values, schemas = {}) {
  const result = {};
  for (const [ name, value ] of Object.entries(values)) {
    if (!model.bind(name, value, schemas[name])) {
      throw new Error(`Failed to bind ${name}`);
    }
    const variable = model.getVariable(name);
    Object.defineProperty(result, name, {
      enumerable: true,
      get: () => variable.get(),
      set: next => variable.set(next),
    });
  }
  return result;
}

function append(variable, value) {
  const index = variable.size;
  variable.resize(index + 1);
  const child = variable.child(index);
  if (value !== null && typeof value === 'object') {
    for (const [ name, member ] of Object.entries(value)) {
      child.child(name).set(member);
    }
  } else {
    child.set(value);
  }
}

function eraseString(variable, index) {
  const size = variable.size;
  for (let i = index; i + 1 < size; ++i) {
    variable.child(i).set(variable.child(i + 1).get());
  }
  variable.resize(size - 1);
}

module.exports = { liveFields, bindFields, append, eraseString };
