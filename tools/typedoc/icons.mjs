import { readFileSync } from 'node:fs';
import { JSX, ReflectionKind } from 'typedoc';

const element = JSX.createElement;
const kindIcons = {
  Accessor: 'function',
  CallSignature: 'function',
  Class: 'class',
  Constructor: 'function',
  ConstructorSignature: 'function',
  Enum: 'list',
  EnumMember: 'value',
  Function: 'function',
  GetSignature: 'function',
  IndexSignature: 'value',
  Interface: 'interface',
  Method: 'function',
  Module: 'folder',
  Namespace: 'folder',
  Parameter: 'value',
  Project: 'folder',
  Property: 'value',
  Reference: 'link',
  SetSignature: 'function',
  TypeAlias: 'value',
  TypeLiteral: 'class',
  TypeParameter: 'value',
  Variable: 'value',
  Document: 'document',
};
const iconAssets = {
  ...Object.fromEntries(Object.entries(kindIcons).map(([ kind, name ]) =>
    [ ReflectionKind[kind], name ])),
  folder: 'folder',
  chevronDown: 'arrow',
  chevronSmall: 'arrow',
  checkbox: 'check',
  menu: 'menu',
  search: 'search',
  anchor: 'link',
  alertNote: 'info',
  alertTip: 'tip',
  alertImportant: 'info',
  alertWarning: 'warning',
  alertCaution: 'caution',
};
const artwork = new Map();

/**
 * Read one attributed Game Icon for TypeDoc's shared SVG sprite.
 * @param {string} name - Locally vendored icon name.
 */
function iconBody(name) {
  if (!artwork.has(name)) {
    const svg = readFileSync(new URL(
      `../../assets/icons/game-icons/${name}.svg`, import.meta.url
    ), 'utf8');
    const body = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1];
    if (!body) throw new Error(`Invalid Game Icon: ${name}`);
    artwork.set(name, body);
  }
  return artwork.get(name);
}

/**
 * Replace every TypeDoc icon, including dynamic search-result symbols.
 * Preserve its SVG contract and localized labels; never fall back to
 * framework artwork when a new icon is introduced.
 * @param {object} defaults - TypeDoc's original icon builders.
 */
export function createGameIcons(defaults) {
  return Object.fromEntries(Object.entries(defaults).map(([ key, builder ]) => {
    const name = iconAssets[key];
    if (!name) throw new Error(`Unmapped TypeDoc icon: ${key}`);
    const body = iconBody(name);
    return [ key, () => {
      const { props } = builder.call(defaults);
      const rotate = key.startsWith('chevron') ? ' rotate(90 256 256)' : '';
      return element('svg', {
        ...props,
        viewBox: '0 0 24 24',
        'data-game-icon': name,
        ...(key === 'checkbox' ? { class: 'sf-api-checkbox' } : {}),
      }, element('g', {
        transform: `scale(0.046875)${rotate}`,
        ...(key === 'checkbox' ? { class: 'sf-api-checkmark' } : {}),
      }, element(JSX.Raw, { html: body })));
    } ];
  }));
}
