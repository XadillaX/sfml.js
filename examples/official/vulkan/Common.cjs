'use strict';

const vk = require('nvk');

/**
 * Turn a failed Vulkan call into an error handled by the owner's cleanup.
 * @param {number|undefined} result VkResult, or a void query result.
 * @param {string} operation Name of the failed operation.
 */
function check(result, operation = 'Vulkan') {
  if (result !== undefined && result !== vk.VK_SUCCESS) {
    throw new Error(`${operation} failed (VkResult ${result})`);
  }
}

/**
 * Read a Vulkan count/output-array query, retrying VK_INCOMPLETE.
 * @param {Function|null} Type Element constructor; null for numeric enums.
 * @param {Function} query Callback accepting the count and output array.
 * @return {Array|Int32Array} Queried objects or numeric enum values.
 */
function enumerate(Type, query) {
  for (;;) {
    const count = { $: 0 };
    check(query(count, null));
    const values = Type ?
      Array.from({ length: count.$ }, () => new Type()) :
      new Int32Array(count.$);
    const result = query(count, values);
    if (result === vk.VK_INCOMPLETE) continue;
    check(result);
    return values.slice(0, count.$);
  }
}

/** Own a group of native resources in reverse destruction order. */
class Scope {
  /** Store cleanup functions only after their allocation succeeds. */
  constructor() {
    this.callbacks = [];
  }

  /**
   * Register a resource's destruction.
   * @param {Function} callback Synchronous cleanup function.
   */
  defer(callback) {
    this.callbacks.push(callback);
  }

  /** Release everything, including resources preceding a failed setup. */
  dispose() {
    const errors = [];
    while (this.callbacks.length) {
      try {
        this.callbacks.pop()();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) {
      throw new AggregateError(errors, 'Vulkan cleanup failed');
    }
  }
}

module.exports = { vk, check, enumerate, Scope };
