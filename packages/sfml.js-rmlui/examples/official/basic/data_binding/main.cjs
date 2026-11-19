'use strict';

// Application port of Samples/basic/data_binding/src/main.cpp in RmlUi 6.3.
// RML, RCSS, textures and templates are loaded from upstream without rewriting.
const { bindFields, liveFields, append, eraseString } =
  require('./data-storage.cjs');

function createTypes(model) {
  const types = model.getDataTypeRegister();
  const text = types.registerScalar('SampleText', 'string');
  const real = types.registerScalar('SampleFloat', 'float32');
  const integer = types.registerScalar('SampleInt', 'int32');
  const boolean = types.registerScalar('SampleBool', 'bool');
  return { types, text, real, integer, boolean };
}

function createBasics(context) {
  const model = context.createDataModel('basics');
  const state = bindFields(model, {
    title: 'Simple data binding example', animal: 'dog', show_text: true,
  });
  return { model, state };
}

function createEvents(context, schemas) {
  const model = context.createDataModel('events');
  const { types, real, integer } = schemas;
  const floats = types.registerArray('SampleFloats', real);
  const position = types.registerStruct('SamplePosition');
  position.registerMember('x', real);
  position.registerMember('y', real);
  const positions = types.registerArray('SamplePositions', position);
  const state = bindFields(model, {
    hello_world: 'Hello World!',
    mouse_detector: 'Mouse-move <em>Detector</em>.',
    rating: 99,
  }, { rating: integer });
  model.bind('list', [ 1, 2, 3, 4, 5 ], floats);
  model.bind('positions', [], positions);
  model.bindFunc('good_rating', () => Number(state.rating > 50));
  model.bindFunc('great_rating', () => Number(state.rating > 80));
  const recorded = model.getVariable('positions');
  model.bindEventCallback('add_mouse_pos', (handle, event) => {
    append(recorded, {
      x: event.getParameter('mouse_x', 0),
      y: event.getParameter('mouse_y', 0),
    });
    handle.dirtyVariable('positions');
  });
  model.bindEventCallback('clear_positions', handle => {
    recorded.resize(0);
    handle.dirtyVariable('positions');
  });
  const list = model.getVariable('list');
  function update() {
    if (model.isVariableDirty('rating')) {
      model.dirtyVariable('good_rating');
      model.dirtyVariable('great_rating');
      const size = Math.trunc(state.rating / 10) + 1;
      if (size !== list.size) {
        list.resize(size);
        const view = list.getNumericView();
        for (let i = 0; i < size; ++i) {
          view[i] = size + i;
        }
        model.dirtyVariable('list');
      }
    }
  }
  return { model, state, update };
}

function createForms(context, schemas) {
  const model = context.createDataModel('forms');
  const { types, text, integer } = schemas;
  const strings = types.registerArray('SampleStrings', text);
  const state = bindFields(model, {
    rating: 50, pizza: true, pasta: false, lasagne: false, animal: 'dog',
    selected_subject: 0, new_subject: 'New subject',
  }, { rating: integer, selected_subject: integer });
  model.bind('subjects', [
    'Choose your subject', 'Feature request', 'Bug report',
    'Praise', 'Criticism',
  ], strings);
  const subjects = model.getVariable('subjects');
  model.bindEventCallback('add_subject', (handle, _event, args) => {
    const name = args.length === 1 ? String(args[0]) : '';
    if (name) {
      append(subjects, name);
      handle.dirtyVariable('subjects');
    }
  });
  model.bindEventCallback('erase_subject', (handle, _event, args) => {
    const index = args.length === 1 ? Math.trunc(Number(args[0])) : -1;
    if (index >= 0 && index < subjects.size) {
      eraseString(subjects, index);
      state.selected_subject = 0;
      handle.dirtyVariable('subjects');
      handle.dirtyVariable('selected_subject');
    }
  });
  return { model, state };
}

const invaderFields = [
  'name', 'sprite', 'color', 'max_health', 'charge_rate', 'health', 'charge',
];
const names = [
  'Angry invader', 'Harmless invader', 'Deceitful invader', 'Cute invader',
];
const sprites = [ 'icon-invader', 'icon-flag', 'icon-game', 'icon-waves' ];
const colors = [
  [ 255, 40, 30 ], [ 20, 40, 255 ], [ 255, 255, 30 ], [ 230, 230, 230 ],
];
const f32 = Math.fround;
const timeBits = new DataView(new ArrayBuffer(8));

// C printf rounds the exact binary double to even. JS toFixed rounds ties up.
function formatSeconds(value) {
  timeBits.setFloat64(0, Math.abs(value));
  const bits = timeBits.getBigUint64(0);
  const leadingBit = 2n ** 52n;
  const exponent = Number((bits / leadingBit) % 2048n);
  const fraction = bits % leadingBit;
  const mantissa = exponent ? fraction + leadingBit : fraction;
  const shift = exponent ? exponent - 1023 - 52 : -1074;
  const numerator = mantissa * 100n;
  const denominator = shift < 0 ? 2n ** BigInt(-shift) : 1n;
  const scaled = shift < 0 ? numerator : numerator * 2n ** BigInt(shift);
  let rounded = scaled / denominator;
  const remainder = scaled % denominator;
  if (remainder * 2n > denominator ||
      (remainder * 2n === denominator && rounded % 2n)) {
    ++rounded;
  }
  const whole = String(rounded / 100n);
  const decimal = String(rounded % 100n).padStart(2, '0');
  return `${value < 0 ? '-' : ''}${whole}.${decimal}`.padStart(5, '0');
}

function colorValue(channels) {
  return {
    type: 'colourb', red: channels[0], green: channels[1],
    blue: channels[2], alpha: 255,
  };
}

function createInvaders(context, schemas, random) {
  const model = context.createDataModel('invaders');
  const { types, text, real, integer } = schemas;
  // Mirrors RegisterScalar<Colourb>: a retained color has a string projection.
  const color = types.registerScalar('SampleColourb', {
    get: value => '#' + [ value.red, value.green, value.blue ]
      .map(channel => channel.toString(16).padStart(2, '0')).join(''),
    set: (value, next) => Object.assign(value, next),
  });
  const record = types.registerStruct('SampleInvader');
  for (const name of invaderFields) {
    const schema = name === 'color' ? color
      : ([ 'name', 'sprite' ].includes(name) ? text : real);
    record.registerMember(name, schema);
  }
  const records = types.registerArray('SampleInvaders', record);
  model.bind('invaders', Array.from({ length: 12 }, () => ({
    name: '', sprite: '', color: colorValue([ 255, 255, 255 ]),
    max_health: 0, charge_rate: 0, health: 0, charge: 0,
  })), records);
  const state = bindFields(model, {
    health: 0, charge: 0, score: 0, elapsed_time: 0, num_games_played: 0,
  }, {
    health: real, charge: real, score: integer, num_games_played: integer,
  });
  state.next_invader_spawn_time = 0;
  state.invaders = Array.from({ length: 12 }, (_, index) => liveFields(
    model.getVariable('invaders').child(index), invaderFields));
  model.registerTransformFunc('format_time', args => {
    if (!args.length) {
      return null;
    }
    const time = Number(args[0]);
    const minutes = Math.trunc(time / 60);
    const seconds = time - 60 * minutes;
    return `${String(minutes).padStart(2, '0')}:${formatSeconds(seconds)}`;
  });
  model.bindEventCallback('start_game', handle => {
    state.health = 100;
    state.charge = 30;
    state.score = 0;
    state.elapsed_time = 0;
    state.next_invader_spawn_time = 0;
    state.num_games_played += 1;
    for (const invader of state.invaders) {
      invader.health = 0;
    }
    for (const name of [
      'health', 'charge', 'score', 'elapsed_time',
      'num_games_played', 'invaders',
    ]) {
      handle.dirtyVariable(name);
    }
  });
  model.bindEventCallback('fire', (handle, _event, args) => {
    if (args.length !== 1) {
      return;
    }
    const invader = state.invaders[Math.trunc(Number(args[0]))];
    if (!invader || state.health <= 0 || invader.health <= 0) {
      return;
    }
    const health = Math.max(f32(invader.health -
      f32(state.charge * f32(Math.sqrt(state.charge)))), 0);
    state.charge = 30;
    state.score += Math.trunc(f32(invader.health - health))
      + 1000 * Number(health === 0);
    invader.health = health;
    for (const name of [ 'invaders', 'charge', 'score' ]) {
      handle.dirtyVariable(name);
    }
  });

  function update(dt) {
    if (state.health === 0) {
      return;
    }
    state.elapsed_time += dt;
    model.dirtyVariable('elapsed_time');
    state.charge = Math.min(f32(state.charge + f32(40 * dt)), 100);
    model.dirtyVariable('charge');
    if (state.elapsed_time >= state.next_invader_spawn_time) {
      const next = {
        name: names[Math.floor(random() * names.length)],
        sprite: sprites[Math.floor(random() * sprites.length)],
        color: colorValue(colors[Math.floor(random() * colors.length)]),
        max_health: f32(f32(300 + f32(30 * state.elapsed_time)) +
          f32(random() * 300)),
        charge_rate: f32(10 + f32(random() * 50)),
        health: 0, charge: 0,
      };
      next.health = next.max_health;
      const begin = Math.floor(random() * state.invaders.length);
      for (let i = 0; i < state.invaders.length; ++i) {
        const invader = state.invaders[(i + begin) % state.invaders.length];
        if (invader.health <= 0) {
          Object.assign(invader, next);
          model.dirtyVariable('invaders');
          break;
        }
      }
      state.next_invader_spawn_time = state.elapsed_time +
        60 / (50 + 0.1 * state.elapsed_time);
    }
    for (const invader of state.invaders) {
      if (invader.health <= 0) {
        continue;
      }
      invader.charge = f32(invader.charge + f32(invader.charge_rate * f32(dt)));
      if (invader.charge >= 100) {
        state.health = Math.max(f32(state.health - f32(10 * dt)), 0);
        model.dirtyVariable('health');
      }
      if (invader.charge >= 120) {
        invader.charge = 0;
      }
      model.dirtyVariable('invaders');
    }
  }
  return { model, state, update };
}

function createDataBinding(context, { random = Math.random } = {}) {
  const basics = createBasics(context);
  const schemas = createTypes(basics.model);
  const events = createEvents(context, schemas);
  const invaders = createInvaders(context, schemas, random);
  const forms = createForms(context, schemas);
  const document = context.loadDocument(
    'basic/data_binding/data/data_binding.rml');
  document.getElementById('title').innerRML = 'Data binding';
  document.show();
  return {
    document,
    models: {
      basics: basics.model, events: events.model,
      invaders: invaders.model, forms: forms.model,
    },
    state: {
      basics: basics.state, events: events.state,
      invaders: invaders.state, forms: forms.state,
    },
    update(dt) {
      events.update();
      invaders.update(dt);
    },
  };
}

module.exports = { createDataBinding };
