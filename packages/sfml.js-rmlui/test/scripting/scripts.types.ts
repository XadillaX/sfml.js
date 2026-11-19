import {
  Context, Document, NodeScriptHost, RmlEvent,
  type NodeScriptHostOptions, type ScriptHandler,
} from '../../src';

declare const context: Context;
declare const document: Document;
const callback: ScriptHandler = (event, owner, host) => {
  const checkedEvent: RmlEvent = event;
  const checkedDocument: Document = owner;
  const checkedContext: Context = host;
  void [ checkedEvent, checkedDocument, checkedContext ];
};
const options: NodeScriptHostOptions = {
  allowInline: true,
  allowExternal: true,
  handlers: { save: callback },
  globals: { count: 3 },
};
context.setScriptHost(new NodeScriptHost(options));
context.setScriptHost(null);
document.loadInlineScript('document.title = "loaded";', 'source.rml', 4);
document.loadExternalScript('source.js');
// @ts-expect-error Host identity is nominal and requires captured callbacks.
context.setScriptHost({});
// @ts-expect-error Source policy requires a boolean.
new NodeScriptHost({ allowInline: 1 });
// @ts-expect-error Named handlers must be functions.
new NodeScriptHost({ handlers: { save: 'save()' } });
// @ts-expect-error Inline script source is a string.
document.loadInlineScript(1, 'source.rml');
