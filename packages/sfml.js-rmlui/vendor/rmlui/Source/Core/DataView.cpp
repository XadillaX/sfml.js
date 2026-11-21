#include "DataView.h"
#include "../../Include/RmlUi/Core/Element.h"
#include <algorithm>

namespace Rml {

DataView::~DataView() {}

Element* DataView::GetElement() const
{
	Element* result = attached_element.get();
	if (!result)
		Log::Message(Log::LT_WARNING, "Could not retrieve element in view, was it destroyed?");
	return result;
}

int DataView::GetSortOrder() const
{
	return sort_order;
}

bool DataView::IsValid() const
{
	return static_cast<bool>(attached_element);
}

DataView::DataView(Element* element, int bias) : attached_element(element->GetObserverPtr()), sort_order(bias + 1000)
{
	RMLUI_ASSERT(bias >= -1000 && bias <= 999);

	if (element)
	{
		for (Element* parent = element->GetParentNode(); parent; parent = parent->GetParentNode())
			sort_order += 2000;
	}
}

DataViews::DataViews() {}

DataViews::~DataViews() {}

void DataViews::Add(DataViewPtr view)
{
	views_to_add.push_back(std::move(view));
}

void DataViews::OnElementRemove(Element* element)
{
	for (auto it = views.begin(); it != views.end();)
	{
		auto& view = *it;
		if (view && view->GetElement() == element)
		{
			views_to_remove.push_back(std::move(view));
			it = views.erase(it);
		}
		else
			++it;
	}
}

void DataViews::RemoveForBinding(const Vector<DataView*>& removed)
{
	const UnorderedSet<DataView*> targets(removed.begin(), removed.end());
	for (auto* list : {&views, &views_to_add})
	{
		auto end = std::remove_if(list->begin(), list->end(), [&](DataViewPtr& view) {
			if (targets.count(view.get()))
			{
				views_to_remove.push_back(std::move(view));
				return true;
			}
			return false;
		});
		list->erase(end, list->end());
	}
}

bool DataViews::Update(DataModel& model, const DirtyVariables& dirty_variables)
{
	bool result = false;
	size_t num_dirty_variables_prev = 0;

	// View updates may result in newly added views, or even new dirty variables. Thus, we do the
	// update recursively but with an upper limit. Without the loop, newly added views won't be
	// updated until the next Update() call.
	for (int i = 0; (i == 0 || !views_to_add.empty() || num_dirty_variables_prev != dirty_variables.size()) && i < 10; i++)
	{
		num_dirty_variables_prev = dirty_variables.size();

		Vector<DataView*> dirty_views;

		if (!views_to_add.empty())
		{
			views.reserve(views.size() + views_to_add.size());
			for (auto&& view : views_to_add)
			{
				dirty_views.push_back(view.get());
				for (const String& variable_name : view->GetVariableNameList())
					name_view_map[variable_name].push_back(view.get());

				views.push_back(std::move(view));
			}
			views_to_add.clear();
		}

		for (const String& variable_name : dirty_variables)
		{
			auto found = name_view_map.find(variable_name);
			if (found != name_view_map.end())
				dirty_views.insert(dirty_views.end(),
					found->second.begin(), found->second.end());
		}

		// Remove duplicate entries
		std::sort(dirty_views.begin(), dirty_views.end());
		auto it_remove = std::unique(dirty_views.begin(), dirty_views.end());
		dirty_views.erase(it_remove, dirty_views.end());

		// Sort by the element's depth in the document tree so that any structural changes due to a changed variable are reflected in the element's
		// children. Eg. the 'data-for' view will remove children if any of its data variable array size is reduced.
		std::sort(dirty_views.begin(), dirty_views.end(), [](auto&& left, auto&& right) { return left->GetSortOrder() < right->GetSortOrder(); });

		for (size_t index = 0; index < dirty_views.size();)
		{
			DataView* view = dirty_views[index];
			RMLUI_ASSERT(view);
			if (!view || !view->IsValid())
			{
				++index;
				continue;
			}
			const void* key = view->GetBatchKeyForBinding();
			size_t end = index + 1;
			if (key)
			{
				while (end < dirty_views.size() && dirty_views[end] &&
					dirty_views[end]->GetBatchKeyForBinding() == key &&
					dirty_views[end]->GetSortOrder() == view->GetSortOrder())
					++end;
				result |= view->UpdateBatchForBinding(model, dirty_views.data() + index, end - index);
			}
			else
				result |= view->Update(model);
			index = end;
		}

		// Destroy views marked for destruction
		// @performance: Horrible...
		if (!views_to_remove.empty())
		{
			UnorderedSet<DataView*> removed;
			for (const auto& view : views_to_remove)
				removed.insert(view.get());
			for (auto it = name_view_map.begin(); it != name_view_map.end();)
			{
				auto& dependents = it->second;
				dependents.erase(std::remove_if(dependents.begin(),
					dependents.end(), [&](DataView* view) {
						return removed.count(view) != 0;
					}), dependents.end());
				if (dependents.empty())
					it = name_view_map.erase(it);
				else
					++it;
			}

			views_to_remove.clear();
		}
	}

	return result;
}

} // namespace Rml
