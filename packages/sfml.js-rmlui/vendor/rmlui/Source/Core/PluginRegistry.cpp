#include "PluginRegistry.h"
#include "../../Include/RmlUi/Core/Plugin.h"
#include "ControlledLifetimeResource.h"
#include <algorithm>

namespace Rml {

struct PluginVectors {
	Vector<Plugin*> basic;
	Vector<Plugin*> document;
	Vector<Plugin*> element;
	Vector<Plugin*> data_model;
	unsigned notification_depth = 0;
	bool removed = false;
};

static ControlledLifetimeResource<PluginVectors> plugin_vectors;

static void EnsurePluginVectorsInitialized()
{
	if (!plugin_vectors)
	{
		plugin_vectors.Initialize();
	}
}

// Callback edits must not invalidate the active traversal. Removed entries are
// tombstoned until its outermost return; additions start at the next notice.
class PluginNotificationScope {
public:
	PluginNotificationScope() { ++plugin_vectors->notification_depth; }
	~PluginNotificationScope()
	{
		if (--plugin_vectors->notification_depth == 0 && plugin_vectors->removed)
		{
			auto compact = [](Vector<Plugin*>& values) {
				values.erase(std::remove(values.begin(), values.end(), nullptr), values.end());
			};
			compact(plugin_vectors->basic);
			compact(plugin_vectors->document);
			compact(plugin_vectors->element);
			compact(plugin_vectors->data_model);
			plugin_vectors->removed = false;
		}
	}
};

template <typename Callback>
static void NotifyPlugins(Vector<Plugin*>& plugins, Callback callback)
{
	PluginNotificationScope scope;
	const size_t count = plugins.size();
	for (size_t i = 0; i < count; ++i)
		if (Plugin* plugin = plugins[i])
			callback(plugin);
}

void PluginRegistry::RegisterPlugin(Plugin* plugin)
{
	EnsurePluginVectorsInitialized();

	int event_classes = plugin->GetEventClasses();

	if (event_classes & Plugin::EVT_BASIC)
		plugin_vectors->basic.push_back(plugin);
	if (event_classes & Plugin::EVT_DOCUMENT)
		plugin_vectors->document.push_back(plugin);
	if (event_classes & Plugin::EVT_ELEMENT)
		plugin_vectors->element.push_back(plugin);
	if (event_classes & Plugin::EVT_DATA_MODEL)
		plugin_vectors->data_model.push_back(plugin);
}

void PluginRegistry::UnregisterPlugin(Plugin* plugin)
{
	// Safe to call after NotifyShutdown() (e.g. from a plugin destructor): the backing storage has been released
	// and there is nothing left to unregister.
	if (!plugin_vectors)
		return;

	auto erase_value = [](Vector<Plugin*>& container, Plugin* value) {
		if (plugin_vectors->notification_depth)
		{
			std::replace(container.begin(), container.end(), value, static_cast<Plugin*>(nullptr));
			plugin_vectors->removed = true;
		}
		else
			container.erase(std::remove(container.begin(), container.end(), value), container.end());
	};

	int event_classes = plugin->GetEventClasses();
	if (event_classes & Plugin::EVT_BASIC)
		erase_value(plugin_vectors->basic, plugin);
	if (event_classes & Plugin::EVT_DOCUMENT)
		erase_value(plugin_vectors->document, plugin);
	if (event_classes & Plugin::EVT_ELEMENT)
		erase_value(plugin_vectors->element, plugin);
	if (event_classes & Plugin::EVT_DATA_MODEL)
		erase_value(plugin_vectors->data_model, plugin);
}

void PluginRegistry::NotifyInitialise()
{
	EnsurePluginVectorsInitialized();

	NotifyPlugins(plugin_vectors->basic, [](Plugin* plugin) { plugin->OnInitialise(); });
}

void PluginRegistry::NotifyShutdown()
{
	while (!plugin_vectors->basic.empty())
	{
		Plugin* plugin = plugin_vectors->basic.back();
		PluginRegistry::UnregisterPlugin(plugin);
		plugin->OnShutdown();
	}

	plugin_vectors.Shutdown();
}

void PluginRegistry::NotifyContextCreate(Context* context)
{
	NotifyPlugins(plugin_vectors->basic, [context](Plugin* plugin) { plugin->OnContextCreate(context); });
}

void PluginRegistry::NotifyContextDestroy(Context* context)
{
	NotifyPlugins(plugin_vectors->basic, [context](Plugin* plugin) { plugin->OnContextDestroy(context); });
}

void PluginRegistry::NotifyDocumentOpen(Context* context, const String& document_path)
{
	NotifyPlugins(plugin_vectors->document, [&](Plugin* plugin) { plugin->OnDocumentOpen(context, document_path); });
}

void PluginRegistry::NotifyDocumentLoad(ElementDocument* document)
{
	NotifyPlugins(plugin_vectors->document, [document](Plugin* plugin) { plugin->OnDocumentLoad(document); });
}

void PluginRegistry::NotifyDocumentUnload(ElementDocument* document)
{
	NotifyPlugins(plugin_vectors->document, [document](Plugin* plugin) { plugin->OnDocumentUnload(document); });
}

void PluginRegistry::NotifyElementCreate(Element* element)
{
	NotifyPlugins(plugin_vectors->element, [element](Plugin* plugin) { plugin->OnElementCreate(element); });
}

void PluginRegistry::NotifyElementDestroy(Element* element)
{
	NotifyPlugins(plugin_vectors->element, [element](Plugin* plugin) { plugin->OnElementDestroy(element); });
}

void PluginRegistry::NotifyDataModelCreate(Context* context, const String& name)
{
	NotifyPlugins(plugin_vectors->data_model, [&](Plugin* plugin) { plugin->OnDataModelCreate(context, name); });
}

void PluginRegistry::NotifyDataModelDestroy(Context* context, const String& name)
{
	NotifyPlugins(plugin_vectors->data_model, [&](Plugin* plugin) { plugin->OnDataModelDestroy(context, name); });
}

} // namespace Rml
