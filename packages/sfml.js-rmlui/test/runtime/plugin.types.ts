import {
  Plugin, PluginEventClasses, registerPlugin, unregisterPlugin,
  type PluginCallbacks, type PluginContextCallback, type PluginElementCallback,
  type PluginDataModelCallback, type PluginDocumentOpenCallback,
} from '../../src';

const contextNotice: PluginContextCallback = context => {
  const name: string = context.name;
  void name;
};
const elementNotice: PluginElementCallback = element => {
  const tag: string = element.tagName;
  void tag;
};
const modelNotice: PluginDataModelCallback = (context, name) => {
  context.getDataModel(name);
};
const openNotice: PluginDocumentOpenCallback = (context, documentPath) => {
  void [ context.name, documentPath ];
};
const callbacks: PluginCallbacks = {
  getEventClasses: () => PluginEventClasses.Basic + PluginEventClasses.Document,
  onContextCreate: contextNotice,
  onElementDestroy: elementNotice,
  onDataModelDestroy: modelNotice,
  onDocumentOpen: openNotice,
};
const plugin = new Plugin(callbacks);
registerPlugin(plugin);
const removed: boolean = unregisterPlugin(plugin);
void removed;

// @ts-expect-error A mask callback must return a number synchronously.
new Plugin({ getEventClasses: () => Promise.resolve(1) });
// @ts-expect-error Notification methods must be callable.
new Plugin({ onShutdown: true });
// @ts-expect-error Registry operations require an adapter.
registerPlugin({});
new Plugin({
  // @ts-expect-error Context notification receives a Context.
  onContextCreate: (name: string) => {
    void name;
  },
});
