#pragma once

#include "../../Include/RmlUi/Core/DataTypes.h"
#include "../../Include/RmlUi/Core/Header.h"
#include "../../Include/RmlUi/Core/Traits.h"
#include "../../Include/RmlUi/Core/Types.h"

namespace Rml {

class Element;
class DataModel;

class DataViewInstancer : public NonCopyMoveable {
public:
	DataViewInstancer() {}
	virtual ~DataViewInstancer() {}
	virtual DataViewPtr InstanceView(Element* element) = 0;
};

template <typename T>
class DataViewInstancerDefault final : public DataViewInstancer {
public:
	DataViewPtr InstanceView(Element* element) override { return DataViewPtr(new T(element)); }
};

/**
    Data view.

    Data views are used to present a data variable in the document by different means.
    A data view is declared in the document by the element attribute:

        data-[type]-[modifier]="[expression]"

    The modifier may or may not be required depending on the data view.
 */

class DataView : public Releasable {
public:
	virtual ~DataView();

	// Initialize the data view.
	// @param[in] model The data model the view will be attached to.
	// @param[in] element The element which spawned the view.
	// @param[in] expression The value of the element's 'data-' attribute which spawned the view (see class documentation).
	// @param[in] modifier The modifier for the given view type (see class documentation).
	// @return True on success.
	virtual bool Initialize(DataModel& model, Element* element, const String& expression, const String& modifier) = 0;

	// Update the data view.
	// Returns true if the update resulted in a document change.
	virtual bool Update(DataModel& model) = 0;

	// sfml.js: explicit groups only; legacy views remain per-instance.
	virtual const void* GetBatchKeyForBinding() const { return nullptr; }
	virtual bool UpdateBatchForBinding(DataModel& model, DataView* const* batch, size_t count)
	{
		bool result = false;
		for (size_t i = 0; i < count; ++i)
			if (batch[i]->IsValid())
				result |= batch[i]->Update(model);
		return result;
	}

	// Returns the list of data variable name(s) which can modify this view.
	virtual StringList GetVariableNameList() const = 0;

	// Returns the attached element if it still exists.
	Element* GetElement() const;

	// Data views are first sorted by the depth of the attached element in the
	// document tree, then optionally by an offset specified for each data view.
	int GetSortOrder() const;

	// Returns true if the element still exists.
	bool IsValid() const;

protected:
	// @param[in] element The element this data view is attached to.
	// @param[in] sort_offset A number [-1000, 999] specifying the update order of this
	//            data view at the same tree depth, negative numbers are updated first.
	DataView(Element* element, int sort_offset);
	// sfml.js: an observing relay preserves the delegated cached order.
	void SetSortOrderForBinding(int order) { sort_order = order; }

private:
	ObserverPtr<Element> attached_element;
	int sort_order;
};

class DataViews : NonCopyMoveable {
public:
	DataViews();
	~DataViews();

	void Add(DataViewPtr view);

	void OnElementRemove(Element* element);
	void RemoveForBinding(const Vector<DataView*>& removed);

	bool Update(DataModel& model, const DirtyVariables& dirty_variables);

private:
	using DataViewList = Vector<DataViewPtr>;

	DataViewList views;

	DataViewList views_to_add;
	DataViewList views_to_remove;

	// sfml.js: avoid duplicate-key insertion scans.
	using NameViewMap = UnorderedMap<String, Vector<DataView*>>;
	NameViewMap name_view_map;
};

} // namespace Rml
