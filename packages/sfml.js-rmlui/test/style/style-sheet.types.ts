import {
  type Context, type RenderManager, StyleSheet, StyleSheetContainer,
  DecoratorInstancerInterface,
  ElementDefinition, type Document, type Property, PropertyId,
  DecoratorList, FilterList, type Decorator,
} from '../../src';

declare const context: Context;
declare const manager: RenderManager;
declare const document: Document;
const container = new StyleSheetContainer();
document.setStyleSheetContainer(container);
document.setStyleSheetContainer(null);
document.getStyleSheet()?.getSprite('icon');
document.getStyleSheetContainer()?.getCompiledStyleSheet();
document.reloadStyleSheet();
// @ts-expect-error Attachment needs a checked container.
document.setStyleSheetContainer({});
const parsed: boolean = container.loadStyleSheetContainer(
  'body {}', 'a.rcss', 2);
const updated: boolean = container.updateCompiledStyleSheet(context);
const sheet: StyleSheet | null = container.getCompiledStyleSheet();
container.mergeStyleSheetContainer(new StyleSheetContainer());
const combined: StyleSheetContainer =
  container.combineStyleSheetContainer(container);
if (sheet) {
  const decorators: Decorator[] = sheet.instanceDecorators(
    manager, new DecoratorList('horizontal-gradient(red blue)'));
  sheet.instanceDecorators(manager, new DecoratorList(), {
    path: 'theme.rcss', lineNumber: 1, ruleName: '',
  });
  // @ts-expect-error Requires a decorator declaration list.
  sheet.instanceDecorators(manager, new FilterList());
  void decorators;
  const definition: ElementDefinition | null =
    sheet.getElementDefinition(document);
  const width: Property | null =
    definition?.getProperty(PropertyId.Width) ?? null;
  const ids: PropertyId[] = definition?.getPropertyIds() ?? [];
  definition?.getCustomProperty('--accent');
  definition?.getProperties().clear();
  // @ts-expect-error Element matching needs a checked element.
  sheet.getElementDefinition({});
  // @ts-expect-error Property IDs are numeric native IDs.
  definition?.getProperty('width');
  void width;
  void ids;
  const owned: StyleSheet = sheet.combineStyleSheet(sheet);
  const keyframes = sheet.getKeyframes('fade');
  const named = sheet.getNamedDecorator('tint');
  keyframes?.blocks[0].properties.getNumProperties();
  named?.instancer?.getPropertySpecification();
  owned.mergeStyleSheet(sheet);
  owned.buildNodeIndex();
  const active = new DecoratorInstancerInterface(manager, sheet, {
    path: 'a.rcss', lineNumber: 2, ruleName: 'body',
  });
  active.getSprite('icon');
  new DecoratorInstancerInterface(manager, owned);
  // @ts-expect-error Stylesheets have checked native provenance.
  new DecoratorInstancerInterface(manager, {});
}
// @ts-expect-error Native StyleSheet construction is private.
new StyleSheet();
// @ts-expect-error Definitions are produced by native selector matching.
new ElementDefinition();
// @ts-expect-error Media compilation requires a context.
container.updateCompiledStyleSheet('context');
// @ts-expect-error Source line must be numeric.
container.loadStyleSheetContainer('', '', '2');
void parsed;
void updated;
void combined;
