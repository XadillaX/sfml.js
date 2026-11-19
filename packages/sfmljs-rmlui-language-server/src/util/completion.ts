'use strict';

/**
 * Pure completion logic.
 *
 * Providers translate these framework-neutral suggestions into
 * vscode.CompletionItem objects, keeping the decision logic testable
 * without an extension host.
 */

import {
  AT_RULES,
  DECORATOR_TYPES,
  FILTER_FUNCTIONS,
  FONT_EFFECT_TYPES,
  LENGTH_UNITS,
  NAMED_COLORS,
  PSEUDO_CLASSES,
  RCSS_PROPERTIES,
  TRANSFORM_FUNCTIONS,
  type RcssPropertyMeta,
} from '../meta/rcss-meta';
import {
  ATTRIBUTE_VALUES,
  GLOBAL_ATTRIBUTES,
  LINK_TYPE_VALUES,
  RML_EVENTS,
  RML_TAGS,
} from '../meta/rml-meta';
import type { RcssCompletionContext } from './rcss-parser';
import type { RmlCompletionContext } from './rml-parser';

/** Suggestion kind mirroring the subset of vscode completion kinds. */
export type CompletionKind =
  | 'property'
  | 'value'
  | 'keyword'
  | 'function'
  | 'unit'
  | 'snippet'
  | 'tag'
  | 'attribute'
  | 'class'
  | 'id'
  | 'pseudo'
  | 'color'
  | 'variable';

/** Framework-neutral completion suggestion. */
export interface PureCompletion {
  /** Label shown in the completion widget. */
  label: string;
  /** Classification used by the provider mapping. */
  kind: CompletionKind;
  /** Short type annotation. */
  detail?: string;
  /** Long-form documentation. */
  documentation?: string;
  /** Snippet body using vscode tab-stop syntax. */
  snippet?: string;
}

/** Id and class symbols collected from workspace RML documents. */
export interface WorkspaceSymbols {
  /** Unique id values. */
  ids: string[];
  /** Unique class tokens. */
  classes: string[];
}

/**
 * Performs a case-insensitive prefix match.
 *
 * @param prefix Typed prefix.
 * @param label Candidate label.
 * @returns True when the label starts with the prefix.
 */
function matches(prefix: string, label: string): boolean {
  return label.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * Removes duplicate suggestions by label while preserving order.
 *
 * @param items Input suggestions.
 * @returns Deduplicated suggestions.
 */
function unique(items: PureCompletion[]): PureCompletion[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.label)) {
      return false;
    }
    seen.add(item.label);
    return true;
  });
}

/**
 * Builds RCSS suggestions for a completion context.
 *
 * @param context Caret context from the RCSS parser.
 * @param symbols Workspace id/class symbols.
 * @param customProperties Custom properties declared in the document.
 * @returns Filtered suggestion list.
 */
export function completeRcss(
  context: RcssCompletionContext,
  symbols: WorkspaceSymbols,
  customProperties: string[],
): PureCompletion[] {
  if (context.kind === 'none') {
    return [];
  }
  if (context.kind === 'at-rule') {
    return unique(AT_RULES.map(rule => ({
      label: `@${rule.name}`,
      kind: 'snippet' as const,
      detail: 'at-rule',
      documentation: rule.description,
      snippet: `@${rule.name}${rule.snippet}`,
    })).filter(item => matches(context.prefix, item.label)));
  }
  if (context.kind === 'selector') {
    return completeSelector(context.prefix, symbols);
  }
  if (context.kind === 'property') {
    return completeProperty(context.prefix, customProperties);
  }
  return completeValue(context.property, context.prefix, customProperties);
}

/**
 * Builds selector suggestions from tags, workspace symbols and pseudos.
 *
 * @param prefix Typed prefix.
 * @param symbols Workspace id/class symbols.
 * @returns Filtered selector suggestions.
 */
function completeSelector(
  prefix: string,
  symbols: WorkspaceSymbols,
): PureCompletion[] {
  const tags = RML_TAGS.map(tag => ({
    label: tag.name,
    kind: 'tag' as const,
    detail: tag.plugin ? 'plugin element' : 'element',
    documentation: tag.description,
  }));
  const ids = symbols.ids.map(id => ({
    label: `#${id}`,
    kind: 'id' as const,
    detail: 'id selector',
  }));
  const classes = symbols.classes.map(name => ({
    label: `.${name}`,
    kind: 'class' as const,
    detail: 'class selector',
  }));
  const pseudos = PSEUDO_CLASSES.map(pseudo => ({
    label: `:${pseudo.name}`,
    kind: 'pseudo' as const,
    detail: pseudo.functional ? 'functional pseudo-class' : 'pseudo-class',
    documentation: pseudo.description,
    snippet: pseudo.functional ? `:${pseudo.name}($0)` : `:${pseudo.name}`,
  }));
  return unique([ ...tags, ...ids, ...classes, ...pseudos ])
    .filter(item => matches(prefix, item.label));
}

/**
 * Builds property and custom-property suggestions for a declaration name.
 *
 * @param prefix Typed prefix.
 * @param customProperties Custom properties declared in the document.
 * @returns Filtered property suggestions.
 */
function completeProperty(
  prefix: string,
  customProperties: string[],
): PureCompletion[] {
  const properties = RCSS_PROPERTIES.map(property => ({
    label: property.name,
    kind: 'property' as const,
    detail: property.shorthand ? 'shorthand' : 'property',
    documentation: buildPropertyDoc(property),
  }));
  const customs = customProperties.map(name => ({
    label: name,
    kind: 'variable' as const,
    detail: 'custom property',
  }));
  return unique([ ...properties, ...customs ])
    .filter(item => matches(prefix, item.label));
}

/**
 * Builds value suggestions based on the property being edited.
 *
 * @param propertyName Name of the declaration property.
 * @param prefix Typed prefix.
 * @param customProperties Custom properties available for var().
 * @returns Filtered value suggestions.
 */
function completeValue(
  propertyName: string,
  prefix: string,
  customProperties: string[],
): PureCompletion[] {
  const property = RCSS_PROPERTIES.find(
    item => item.name === propertyName.toLowerCase(),
  );
  const suggestions: PureCompletion[] = [];

  if (property?.keywords) {
    for (const keyword of property.keywords) {
      suggestions.push({
        label: keyword,
        kind: 'keyword',
        detail: 'keyword',
      });
    }
  }

  if (isColorProperty(propertyName)) {
    for (const [ name, hex ] of Object.entries(NAMED_COLORS)) {
      suggestions.push({
        label: name,
        kind: 'color',
        detail: hex,
      });
    }
  }

  for (const fn of valueFunctions(propertyName)) {
    suggestions.push({
      label: `${fn}()`,
      kind: 'function',
      detail: 'function',
      snippet: `${fn}($0)`,
    });
  }

  if (/\d$/.test(prefix)) {
    for (const unit of LENGTH_UNITS) {
      suggestions.push({ label: unit, kind: 'unit', detail: 'length unit' });
    }
  }

  if (customProperties.length > 0) {
    suggestions.push({
      label: 'var()',
      kind: 'function',
      detail: 'custom property reference',
      snippet: `var(\${1:${customProperties[0]}})`,
    });
  }

  return unique(suggestions).filter(item => matches(prefix, item.label));
}

/**
 * Checks whether a property accepts color literals.
 *
 * @param name Property name.
 * @returns True for color-accepting properties.
 */
function isColorProperty(name: string): boolean {
  return /(^|-)(color|background)$/.test(name.toLowerCase()) ||
    name.toLowerCase() === 'caret-color' ||
    name.toLowerCase() === 'image-color' ||
    name.toLowerCase() === 'box-shadow';
}

/**
 * Returns function names valid for a function-valued property.
 *
 * @param propertyName Property name.
 * @returns Supported function names.
 */
function valueFunctions(propertyName: string): readonly string[] {
  const name = propertyName.toLowerCase();
  if (name === 'transform') {
    return TRANSFORM_FUNCTIONS;
  }
  if (name === 'filter' || name === 'backdrop-filter') {
    return FILTER_FUNCTIONS;
  }
  if (name === 'font-effect') {
    return FONT_EFFECT_TYPES;
  }
  if (name === 'decorator' || name === 'mask-image') {
    return DECORATOR_TYPES;
  }
  return [];
}

/**
 * Renders the markdown documentation block for a property.
 *
 * @param property Property metadata.
 * @returns Markdown documentation string.
 */
function buildPropertyDoc(property: RcssPropertyMeta): string {
  return [
    property.description,
    `Values: ${property.values}`,
    `Initial: ${property.initial} | Inherited: ${property.inherited}`,
  ].join('\n\n');
}

/**
 * Builds RML suggestions for a completion context.
 *
 * @param context Caret context from the RML parser.
 * @param symbols Workspace id/class symbols.
 * @returns Filtered suggestion list.
 */
export function completeRml(
  context: RmlCompletionContext,
  symbols: WorkspaceSymbols,
): PureCompletion[] {
  if (context.kind === 'none') {
    return [];
  }
  if (context.kind === 'tag') {
    return RML_TAGS
      .filter(tag => matches(context.prefix, tag.name))
      .map(tag => ({
        label: tag.name,
        kind: 'tag' as const,
        detail: tag.plugin ? 'plugin element' : 'element',
        documentation: tag.description,
        snippet: tag.void ? `${tag.name} $0/>` : `${tag.name}>$0</${tag.name}>`,
      }));
  }
  if (context.kind === 'attributeValue') {
    return completeAttributeValue(context, symbols);
  }
  return completeAttribute(context.tag, context.prefix);
}

/**
 * Builds attribute suggestions for the current RML tag.
 *
 * @param tag Current tag name or null when unresolved.
 * @param prefix Typed prefix.
 * @returns Filtered attribute suggestions.
 */
function completeAttribute(
  tag: string | null,
  prefix: string,
): PureCompletion[] {
  const tagMeta = RML_TAGS.find(item => item.name === tag);
  const names = new Set<string>(GLOBAL_ATTRIBUTES.map(item => item.name));
  if (tagMeta) {
    for (const name of tagMeta.attributes) {
      names.add(name);
    }
  }
  if (tag === 'link') {
    names.delete('src');
  }
  return Array.from(names)
    .filter(name => matches(prefix, name))
    .map(name => {
      const meta = GLOBAL_ATTRIBUTES.find(item => item.name === name);
      return {
        label: name,
        kind: 'attribute' as const,
        detail: 'attribute',
        documentation: meta?.description,
        snippet: `${name}="$0"`,
      };
    });
}

/**
 * Builds enumerated value suggestions for an attribute.
 *
 * @param context Attribute-value completion context.
 * @param symbols Workspace class symbols for class attributes.
 * @returns Filtered value suggestions.
 */
function completeAttributeValue(
  context: Extract<RmlCompletionContext, { kind: 'attributeValue' }>,
  symbols: WorkspaceSymbols,
): PureCompletion[] {
  const prefix = context.prefix;
  if (context.attribute === 'type' && context.tag === 'input') {
    return filterValues(ATTRIBUTE_VALUES.type ?? [], prefix);
  }
  if (context.attribute === 'type' && context.tag === 'link') {
    return filterValues(LINK_TYPE_VALUES, prefix);
  }
  if (context.attribute.startsWith('data-event-')) {
    return filterValues(RML_EVENTS, prefix);
  }
  if (context.attribute === 'class') {
    return symbols.classes
      .filter(name => matches(prefix, name))
      .map(name => ({ label: name, kind: 'class' as const }));
  }
  return [];
}

/**
 * Converts enumerated values into filtered completion suggestions.
 *
 * @param values Allowed value tokens.
 * @param prefix Typed prefix.
 * @returns Filtered value suggestions.
 */
function filterValues(
  values: readonly string[],
  prefix: string,
): PureCompletion[] {
  return values
    .filter(value => matches(prefix, value))
    .map(value => ({ label: value, kind: 'value' as const }));
}
