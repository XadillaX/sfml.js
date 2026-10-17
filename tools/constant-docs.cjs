'use strict';

const catalog = require('./constant-docs.json');
const languages = [ 'zh', 'ja', 'ko' ];

function entry(section, key) {
  const values = Object.hasOwn(catalog[section], key)
    ? catalog[section][key] : undefined;
  if (!Array.isArray(values) || values.length !== languages.length ||
      values.some(value => typeof value !== 'string' || !value.trim())) {
    throw new Error(`Missing constant translation: ${section}/${key}`);
  }
  return values;
}

function template(key, parameters) {
  return entry('templates', key).map((text, index) =>
    text.replace(/\{(\w+)\}/g, (placeholder, name) => {
      if (!Object.hasOwn(parameters, name)) {
        throw new Error(`Unknown translation placeholder: ${placeholder}`);
      }
      return parameters[name][index];
    }));
}

function literal(text) {
  return languages.map(() => text);
}

function keyLabel(key) {
  // Only literal key legends bypass the translated label catalog.
  const symbol = /^[a-zA-Z0-9[\];:,.'\\/`=+*|!?@#$%^&()_{}"~<>-]$/;
  if (symbol.test(key) || /^F(?:[1-9]|1\d|2[0-4])$/.test(key)) {
    return literal(key);
  }
  const side = key.match(/^(left|right) (Control|Shift|Alt|System)$/i);
  if (side) {
    return template(side[1].toLowerCase(), {
      key: entry('keys', side[2]),
    });
  }
  return entry('keys', key);
}

function translations(english) {
  if (Object.hasOwn(catalog.descriptions, english)) {
    return entry('descriptions', english);
  }
  let match = english.match(/^The (.+) key$/);
  if (match) {
    const numpad = match[1].match(/^numpad (\d)$/);
    return template(numpad ? 'numpad' : 'key', {
      key: keyLabel(numpad ? numpad[1] : match[1]),
    });
  }
  match = english.match(/^(Keyboard|[Kk]eypad) (.+) key$/);
  if (match) {
    const pair = match[2].split(' and ');
    if (pair.length > 2) {
      throw new Error(`Unsupported key description: ${english}`);
    }
    const type = match[1] === 'Keyboard' ? 'keyboard' : 'keypad';
    return template(type + (pair.length === 2 ? 'Pair' : ''), {
      key: keyLabel(pair[0]),
      other: pair.length === 2 ? keyLabel(pair[1]) : [],
    });
  }
  match = english.match(/^The ([XYZRUV]) axis( of the point-of-view hat)?$/);
  if (match) {
    return template(match[2] ? 'povAxis' : 'axis', {
      axis: literal(match[1]),
    });
  }
  return entry('descriptions', english);
}

function wrap(text, prefix, continuation) {
  const lines = [];
  // A literal grave key must not open a code span across locale tags.
  // Paired backticks in SFML identifiers remain Markdown code spans.
  if ((text.match(/`/g) || []).length % 2) {
    text = text.replace(/`/g, '\\`');
  }
  let rest = text;
  let start = prefix;
  while (start.length + rest.length > 80) {
    const width = 80 - start.length;
    const space = rest.lastIndexOf(' ', width);
    const end = space > 0 ? space : width;
    lines.push(start + rest.slice(0, end));
    rest = rest.slice(end).trimStart();
    start = continuation;
  }
  lines.push(start + rest);
  return lines;
}

function constantDoc(english, indent = '') {
  const localized = translations(english);
  const prefix = `${indent} * `;
  const lines = [ `${indent}/**`, ...wrap(english, prefix, prefix) ];
  for (const [ index, language ] of languages.entries()) {
    lines.push(...wrap(localized[index], `${prefix}@${language} `, prefix));
  }
  lines.push(`${indent} */`);
  return lines.join('\n');
}

module.exports = { constantDoc };
