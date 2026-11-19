'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function load(context, content) {
  return context.loadDocumentFromMemory(
    `<rml><head/><body data-model="factory">${content}</body></rml>`);
}

const cases = {
  'real-rml-views-use-dirty-dependencies-and-native-sort': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    model.bind('value', 3);
    model.bind('other', 9);
    const updates = [];
    const instances = [];
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => {
        const view = new rmlui.DataView(element, {
          initialize(current, requested, expression, modifier) {
            assert.equal(current, model);
            assert.equal(requested, element);
            assert.equal(expression, 'value');
            assert.equal(modifier, 'label');
            return true;
          },
          update(current) {
            updates.push(element.id);
            element.setAttribute('result', current.getVariable('value').get());
            return true;
          },
          getVariableNameList: () => [ 'value' ],
        }, element.id === 'first' ? -20 : 20);
        instances.push(view);
        return view;
      }), 'host');
    const document = load(context,
      '<div id="last" data-host-label="value"/>' +
      '<div id="first" data-host-label="value"/>');
    context.update();
    assert.deepEqual(updates, [ 'first', 'last' ]);
    assert.equal(document.getElementById('first').getAttribute('result'), '3');
    assert.ok(instances[0].sortOrder > instances[1].sortOrder);
    assert.deepEqual(instances[0].getVariableNameList(), [ 'value' ]);
    updates.length = 0;
    model.dirtyVariable('other');
    context.update();
    assert.deepEqual(updates, []);
    model.getVariable('value').set(5);
    model.dirtyVariable('value');
    context.update();
    assert.deepEqual(updates, [ 'first', 'last' ]);
    assert.equal(document.getElementById('last').getAttribute('result'), '5');
    assert.throws(() => instances[0].release(), /own|transfer|model/i);
  },

  'real-controller-event-and-deferred-release': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    model.bind('value', 1);
    let controller;
    let releases = 0;
    let target;
    let process;
    rmlui.Factory.registerDataControllerInstancer(
      new rmlui.DataControllerInstancer(element => {
        controller = new rmlui.DataController(element, {
          initialize(current, requested, expression, modifier) {
            assert.equal(current, model);
            assert.equal(requested, element);
            assert.equal(expression, 'value');
            assert.equal(modifier, 'click');
            target = element;
            process = () => {
              current.getVariable(expression).set(8);
              current.dirtyVariable(expression);
            };
            element.addEventListener(modifier, process);
            return true;
          },
          release() {
            ++releases;
            target.removeEventListener('click', process);
          },
        });
        return controller;
      }), 'host');
    const document = load(context, '<button id="button" ' +
      'data-host-click="value"/><span id="value">{{value}}</span>');
    document.getElementById('button').click();
    context.update();
    assert.equal(model.getVariable('value').get(), 8);
    assert.match(document.getElementById('value').innerRML, /8/);
    assert.equal(controller.getElement(), target);
    assert.throws(() => controller.release(), /own|transfer|model/i);
    context.removeDataModel('factory');
    assert.equal(releases, 1);
    assert.equal(controller.isValid, false);
  },

  'default-factory-owners-initialize-update-and-release': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    model.bind('value', 'old');
    const document = load(context, '<input id="input"/>');
    const input = document.getElementById('input');
    assert.equal(rmlui.Factory.instanceDataView('missing', input), null);
    assert.equal(rmlui.Factory.instanceDataController('missing', input), null);
    const view = rmlui.Factory.instanceDataView('value', input);
    assert.equal(view.getElement(), input);
    assert.equal(view.isValid, true);
    assert.equal(view.initialize(model, input, 'value', ''), true);
    assert.deepEqual(view.getVariableNameList(), [ 'value' ]);
    assert.equal(view.update(model), true);
    assert.equal(input.getAttribute('value'), 'old');
    assert.equal(view.update(model), false);
    const controller = rmlui.Factory.instanceDataController('value', input);
    assert.equal(controller.initialize(model, input, 'value', ''), true);
    input.dispatchEvent('change', { value: 'new' });
    assert.equal(model.getVariable('value').get(), 'new');
    assert.equal(view.update(model), true);
    assert.equal(input.getAttribute('value'), 'new');
    controller.release();
    input.dispatchEvent('change', { value: 'ignored' });
    assert.equal(model.getVariable('value').get(), 'new');
    view.release();
    assert.equal(view.isValid, false);
    assert.equal(controller.isValid, false);
    assert.throws(() => view.update(model), /valid/i);
    assert.throws(() => view.release(), /valid/i);
  },

  'first-registration-defaults-structural-names-duplicate-gc': async env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    model.bind('value', 1);
    const element = load(context, '<div id="item"/>').getElementById('item');
    let rejected;
    (() => {
      const callback = () => {
        throw new Error('duplicate default must never run');
      };
      rejected = new WeakRef(callback);
      rmlui.Factory.registerDataViewInstancer(
        new rmlui.DataViewInstancer(callback), 'value', true);
    })();
    await collect();
    assert.equal(rejected.deref(), undefined);
    assert.equal(rmlui.Factory.isStructuralDataView('value'), false);
    assert.ok(rmlui.Factory.instanceDataView('value', element));
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(() => null), 'host', true);
    assert.equal(rmlui.Factory.isStructuralDataView('host'), true);
    assert.ok(rmlui.Factory.getStructuralDataViewAttributeNames()
      .includes('data-host'));
    assert.equal(rmlui.Factory.instanceDataView('host', element), null);
    let duplicate;
    (() => {
      const callback = () => {
        throw new Error('first controller registration must win');
      };
      duplicate = new WeakRef(callback);
      rmlui.Factory.registerDataControllerInstancer(
        new rmlui.DataControllerInstancer(() => null), 'host');
      rmlui.Factory.registerDataControllerInstancer(
        new rmlui.DataControllerInstancer(callback), 'host');
    })();
    await collect();
    assert.equal(duplicate.deref(), undefined);
    assert.equal(rmlui.Factory.instanceDataController('host', element), null);
  },

  'direct-instancers-single-transfer-and-wrong-results': env => {
    const { context, rmlui } = env;
    context.createDataModel('factory');
    const document = load(context, '<div id="one"/><div id="two"/>');
    const one = document.getElementById('one');
    const two = document.getElementById('two');
    const callbacks = {
      initialize: () => true,
      update: () => false,
      getVariableNameList: () => [],
    };
    const view = new rmlui.DataView(one, callbacks);
    const instancer = new rmlui.DataViewInstancer(() => view);
    assert.equal(instancer.instanceView(one), view);
    assert.equal(instancer.instanceView(one), view);
    assert.equal(view.isValid, true);
    view.release();
    assert.throws(() => instancer.instanceView(one), /valid/i);
    const wrong = new rmlui.DataView(one, callbacks);
    assert.throws(() =>
      new rmlui.DataViewInstancer(() => wrong).instanceView(two),
    /element/i);
    assert.equal(wrong.isValid, true);
    assert.throws(() =>
      new rmlui.DataViewInstancer(() => undefined).instanceView(one),
    /DataView/i);
    const decline = new rmlui.DataViewInstancer(() => null);
    assert.equal(decline.instanceView(one), null);
    const controller = new rmlui.DataController(one,
      { initialize: () => true });
    assert.equal(new rmlui.DataControllerInstancer(() => controller)
      .instanceController(one), controller);
    assert.throws(() => new rmlui.DataView(one, callbacks, 1000), RangeError);
    assert.throws(() => new rmlui.DataView(one, callbacks, -1001), RangeError);
    assert.throws(() => new rmlui.DataView(one, callbacks, 0.5), RangeError);
  },

  'first-error-callback-conversion-recursion-and-destructive-reentry': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    const element = load(context, '<div id="item"/>').getElementById('item');
    const sentinel = new Error('first view error');
    let update = () => false;
    const view = new rmlui.DataView(element, {
      initialize: () => true,
      update: current => update(current),
      getVariableNameList: () => [],
    });
    update = () => {
      throw sentinel;
    };
    assert.throws(() => view.update(model), error => error === sentinel);
    update = () => view.update(model);
    assert.throws(() => view.update(model), /recurs/i);
    update = () => {
      view.release();
      return false;
    };
    assert.throws(() => view.update(model), /active|callback/i);
    update = () => {
      context.removeDataModel('factory');
      return false;
    };
    assert.throws(() => view.update(model), /callback|mutation/i);
    assert.equal(model.isValid, true);
    update = () => 'true';
    assert.throws(() => view.update(model), /boolean/i);
    update = () => false;
    assert.equal(view.update(model), false);
    const names = new rmlui.DataView(element, {
      initialize: () => true,
      update: () => false,
      getVariableNameList: () => [ 1 ],
    });
    assert.throws(() => names.getVariableNameList(), /string/i);
    const instancer = new rmlui.DataViewInstancer(() => {
      throw sentinel;
    });
    assert.throws(() => instancer.instanceView(element),
      error => error === sentinel);
  },

  'pending-native-views-retain-callbacks-and-release-them': async env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    model.bind('value', 2);
    let updateWeak;
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => {
        const update = () => {
          element.setAttribute('seen', 2);
          return true;
        };
        updateWeak = new WeakRef(update);
        return new rmlui.DataView(element, {
          initialize: () => true, update,
          getVariableNameList: () => [ 'value' ],
        });
      }), 'host');
    const document = load(context, '<div id="item" data-host="value"/>');
    await collect();
    assert.ok(updateWeak.deref());
    context.update();
    assert.equal(document.getElementById('item').getAttribute('seen'), '2');
    context.removeDataModel('factory');
    await collect();
    assert.equal(updateWeak.deref(), undefined);
  },

  'owned-context-callback-cycle-and-shutdown-generation': async env => {
    const { context, rmlui, window } = env;
    let contextWeak;
    let updateWeak;
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => {
        const owner = element.getContext();
        const update = () => {
          owner.dimensions.x;
          return false;
        };
        updateWeak = new WeakRef(update);
        return new rmlui.DataView(element, {
          initialize: () => true, update,
          getVariableNameList: () => [],
        });
      }), 'host');
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'factory-cycle', context.getRenderManager(), null);
      owned.setDimensions(200, 160);
      owned.createDataModel('factory');
      load(owned, '<div data-host="value"/>');
      owned.update();
      contextWeak = new WeakRef(owned);
    })();
    await collect();
    assert.equal(contextWeak.deref(), undefined);
    assert.equal(updateWeak.deref(), undefined);
    context.createDataModel('factory');
    const element = load(context, '<div id="item"/>').getElementById('item');
    const view = rmlui.Factory.instanceDataView('value', element);
    const controller = rmlui.Factory.instanceDataController('value', element);
    rmlui.shutdown();
    assert.equal(rmlui.initialise(window, { highDpi: false }), true);
    assert.equal(view.isValid, false);
    assert.equal(controller.isValid, false);
    assert.throws(() => view.getElement(), /valid/i);
  },

  'native-default-delegation-behavior-and-core-release': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    model.bind('value', 'before');
    let view;
    let controller;
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => {
        view = rmlui.Factory.instanceDataView('value', element);
        return view;
      }), 'native');
    rmlui.Factory.registerDataControllerInstancer(
      new rmlui.DataControllerInstancer(element => {
        controller = rmlui.Factory.instanceDataController('value', element);
        return controller;
      }), 'native');
    const document = load(context, '<input id="input" data-native="value"/>');
    const input = document.getElementById('input');
    assert.equal(input.getAttribute('value'), 'before');
    input.dispatchEvent('change', { value: 'after' });
    context.update();
    assert.equal(model.getVariable('value').get(), 'after');
    assert.equal(input.getAttribute('value'), 'after');
    assert.throws(() => controller.release(), /own|model/i);
    context.removeDataModel('factory');
    assert.equal(view.isValid, false);
    assert.equal(controller.isValid, false);
    input.dispatchEvent('change', { value: 'removed' });
  },

  'rejected-initialization-releases-once-and-suppresses-later-errors': env => {
    const { context, rmlui } = env;
    context.createDataModel('factory');
    let releases = 0;
    let view;
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => {
        view = new rmlui.DataView(element, {
          initialize: () => false,
          update: () => {
            throw new Error('rejected view must not update');
          },
          getVariableNameList: () => [],
          release: () => {
            ++releases;
          },
        });
        return view;
      }), 'rejected');
    load(context, '<div data-rejected="value"/>');
    assert.equal(releases, 1);
    assert.equal(view.isValid, false);
    const sentinel = new Error('first initialization');
    const later = new Error('later release');
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => new rmlui.DataView(element, {
        initialize() {
          throw sentinel;
        },
        update: () => false,
        getVariableNameList: () => [],
        release() {
          throw later;
        },
      })), 'throwing');
    assert.throws(() => load(context, '<div data-throwing="value"/>'),
      error => error === sentinel);
  },

  'variable-name-accessors-remain-active-and-first-error-is-preserved': env => {
    const { context, rmlui } = env;
    context.createDataModel('factory');
    let view;
    let read = () => 'value';
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => {
        view = new rmlui.DataView(element, {
          initialize: () => true, update: () => false,
          getVariableNameList: () => Object.defineProperty([ '' ], 0, {
            get: () => read(),
          }),
        });
        return view;
      }), 'host');
    load(context, '<div data-host="value"/>');
    const sentinel = new Error('dependency accessor');
    read = () => {
      throw sentinel;
    };
    assert.throws(() => view.getVariableNameList(),
      error => error === sentinel);
    read = () => view.getVariableNameList()[0];
    assert.throws(() => view.getVariableNameList(), /recurs/i);
    read = () => {
      context.removeDataModel('factory');
      return 'value';
    };
    assert.throws(() => view.getVariableNameList(), /callback|mutation/i);
  },

  'structural-parser-unexpanded-rml-and-native-depth-scheduling': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    model.bind('value', 1);
    const order = [];
    let expression;
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => new rmlui.DataView(element, {
        initialize(_current, _attached, content, modifier) {
          assert.equal(content, 'value');
          expression = element.getAttribute('rmlui-inner-rml');
          assert.equal(modifier, '');
          assert.equal(element.innerRML, '');
          return true;
        },
        update() {
          order.push('structural');
          return false;
        },
        getVariableNameList: () => [ 'value' ],
      })), 'structure', true);
    load(context, '<div data-structure="value"><span>untouched</span></div>');
    assert.match(expression, /<span>untouched<\/span>/);
    assert.deepEqual(order, [ 'structural' ]);
  },

  'default-controller-release-during-native-setter-is-rejected': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    let controller;
    let assigned;
    model.bindFunc('value', () => 'old', value => {
      assigned = value;
      controller.release();
    });
    const document = load(context, '<input id="input"/>');
    const input = document.getElementById('input');
    controller = rmlui.Factory.instanceDataController('value', input);
    controller.initialize(model, input, 'value', '');
    assert.throws(() => input.dispatchEvent('change', { value: 'new' }),
      /active|callback/i);
    assert.equal(assigned, 'new');
    assert.equal(controller.isValid, true);
    controller.release();
  },

  'default-view-release-during-native-expression-is-rejected': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('factory');
    let view;
    model.bindFunc('value', () => {
      view.release();
      return 'old';
    });
    const input = load(context, '<input id="input"/>').getElementById('input');
    view = rmlui.Factory.instanceDataView('value', input);
    view.initialize(model, input, 'value', '');
    assert.throws(() => view.update(model), /active|callback/i);
    assert.equal(view.isValid, true);
    view.release();
  },

  'core-transfer-cannot-be-reused-and-document-close-expires-views': env => {
    const { context, rmlui } = env;
    context.createDataModel('factory');
    let view;
    const create = element => {
      view ??= new rmlui.DataView(element, {
        initialize: () => true, update: () => false,
        getVariableNameList: () => [],
      });
      return view;
    };
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(create), 'host');
    const document = load(context, '<div id="item" data-host="value"/>');
    const element = document.getElementById('item');
    assert.throws(() => rmlui.Factory.instanceDataView('host', element),
      /initialized|transfer|own/i);
    document.close();
    context.update();
    assert.equal(view.isValid, false);
    assert.throws(() => view.release(), /valid/i);
  },

  'delegated-default-sort-survives-reparenting-and-repeated-direct-returns':
    env => {
      const { context, rmlui } = env;
      context.createDataModel('factory');
      const document = load(context, '<div id="parent"/>');
      const child = document.createElement('input');
      const view = rmlui.Factory.instanceDataView('value', child);
      const originalOrder = view.sortOrder;
      document.getElementById('parent').appendChild(child);
      const instancer = new rmlui.DataViewInstancer(() => view);
      assert.equal(instancer.instanceView(child), view);
      assert.equal(view.sortOrder, originalOrder);
      assert.equal(instancer.instanceView(child), view);
      assert.equal(view.sortOrder, originalOrder);
      view.release();
    },

  'owned-context-controller-callback-cycles-are-collectible': async env => {
    const { context, rmlui } = env;
    let contextWeak;
    let callbackWeak;
    rmlui.Factory.registerDataControllerInstancer(
      new rmlui.DataControllerInstancer(element =>
        new rmlui.DataController(element, {
          initialize(current, attached) {
            const owner = attached.getContext();
            const process = () => {
              current.dirtyAllVariables();
              owner.dimensions.x;
            };
            callbackWeak = new WeakRef(process);
            attached.addEventListener('click', process);
            return true;
          },
        })), 'host');
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'controller-cycle', context.getRenderManager(), null);
      owned.setDimensions(200, 160);
      owned.createDataModel('factory');
      load(owned, '<button data-host="value"/>');
      contextWeak = new WeakRef(owned);
    })();
    await collect();
    assert.equal(contextWeak.deref(), undefined);
    assert.equal(callbackWeak.deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Native data factory');
  assert.equal(rmlui.initialise(window, { highDpi: false }), true);
  try {
    await cases[name]({
      rmlui, window, context: rmlui.createContext('data-factory', 200, 160),
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ], {
        encoding: 'utf8', timeout: 20000,
      });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} data factory failures`);
}
