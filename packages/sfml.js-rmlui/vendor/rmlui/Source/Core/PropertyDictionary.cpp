#include "../../Include/RmlUi/Core/PropertyDictionary.h"
#include "../../Include/RmlUi/Core/ID.h"
#include "../../Include/RmlUi/Core/PropertyDefinition.h"

namespace Rml {

namespace {
std::uint64_t callback_resource_version = 0;

bool PropertyHasCallbackResources(const Property* property)
{
	return property && (HasCallbackResourcesForBinding(property->value)
		|| (property->definition && HasCallbackResourcesForBinding(
			property->definition->GetDefaultValue()->value)));
}

void InvalidatePropertyCallbacks(const Property* previous,
	const Property& next)
{
	if (PropertyHasCallbackResources(previous) ||
		PropertyHasCallbackResources(&next))
		InvalidateCallbackResourcesForBinding();
}
}

std::uint64_t GetCallbackResourceVersionForBinding()
{
	return callback_resource_version;
}

void InvalidateCallbackResourcesForBinding()
{
	++callback_resource_version;
}

bool HasCallbackResourcesForBinding(const Variant& value)
{
	return value.GetType() == Variant::FONTEFFECTSPTR ||
		value.GetType() == Variant::DECORATORSPTR ||
		value.GetType() == Variant::FILTERSPTR ||
		value.HasGuardedScriptInterfaceForBinding() ||
		value.HasGuardedOpaquePointerForBinding();
}

bool PropertyDictionary::HasCallbackResourcesForBinding() const
{
	for (const auto& entry : properties)
		if (PropertyHasCallbackResources(&entry.second)) return true;
	for (const auto& entry : custom_properties)
		if (PropertyHasCallbackResources(&entry.second)) return true;
	for (const auto& entry : var_shorthands)
		if (PropertyHasCallbackResources(&entry.second)) return true;
	return false;
}

PropertyDictionary::PropertyDictionary() {}

void PropertyDictionary::SetProperty(PropertyId id, const Property& property)
{
	RMLUI_ASSERT(id != PropertyId::Invalid);
	InvalidatePropertyCallbacks(GetProperty(id), property);
	properties[id] = property;
}

void PropertyDictionary::RemoveProperty(PropertyId id)
{
	RMLUI_ASSERT(id != PropertyId::Invalid);
	if (PropertyHasCallbackResources(GetProperty(id)))
		InvalidateCallbackResourcesForBinding();
	properties.erase(id);
}

const Property* PropertyDictionary::GetProperty(PropertyId id) const
{
	PropertyMap::const_iterator iterator = properties.find(id);
	if (iterator == properties.end())
		return nullptr;

	return &(*iterator).second;
}

void PropertyDictionary::SetCustomProperty(String name, Property property)
{
	InvalidatePropertyCallbacks(GetCustomProperty(name), property);
	custom_properties.insert_or_assign(std::move(name), std::move(property));
}

bool PropertyDictionary::RemoveCustomProperty(const String& name)
{
	if (PropertyHasCallbackResources(GetCustomProperty(name)))
		InvalidateCallbackResourcesForBinding();
	return custom_properties.erase(name) > 0;
}

const Property* PropertyDictionary::GetCustomProperty(const String& name) const
{
	auto it = custom_properties.find(name);
	if (it == custom_properties.end())
		return nullptr;

	return &it->second;
}

void PropertyDictionary::SetVarShorthand(ShorthandId id, Property property)
{
	RMLUI_ASSERT(property.unit == Unit::VAR_EXPRESSION);
	InvalidatePropertyCallbacks(GetVarShorthand(id), property);
	var_shorthands.insert_or_assign(id, std::move(property));
}

bool PropertyDictionary::RemoveVarShorthand(ShorthandId id)
{
	if (PropertyHasCallbackResources(GetVarShorthand(id)))
		InvalidateCallbackResourcesForBinding();
	return var_shorthands.erase(id) > 0;
}

const Property* PropertyDictionary::GetVarShorthand(ShorthandId id) const
{
	auto it = var_shorthands.find(id);
	if (it == var_shorthands.end())
		return nullptr;

	return &it->second;
}

const UnorderedMap<ShorthandId, Property>& PropertyDictionary::GetVarShorthands() const
{
	return var_shorthands;
}

bool PropertyDictionary::Empty() const
{
	return properties.empty() && custom_properties.empty() && var_shorthands.empty();
}

int PropertyDictionary::GetNumProperties() const
{
	return (int)properties.size();
}

const PropertyMap& PropertyDictionary::GetProperties() const
{
	return properties;
}

const UnorderedMap<String, Property>& PropertyDictionary::GetCustomProperties() const
{
	return custom_properties;
}

void PropertyDictionary::Import(const PropertyDictionary& other, int property_specificity)
{
	for (const auto& [id, property] : other.properties)
		SetProperty(id, property, property_specificity > 0 ? property_specificity : property.specificity);

	for (const auto& [name, property] : other.custom_properties)
		SetCustomProperty(name, property, property_specificity > 0 ? property_specificity : property.specificity);

	for (const auto& [id, property] : other.var_shorthands)
		SetVarShorthand(id, property, property_specificity > 0 ? property_specificity : property.specificity);
}

void PropertyDictionary::Merge(const PropertyDictionary& other, int specificity_offset)
{
	for (const auto& [id, property] : other.properties)
		SetProperty(id, property, property.specificity + specificity_offset);

	for (const auto& [name, property] : other.custom_properties)
		SetCustomProperty(name, property, property.specificity + specificity_offset);

	for (const auto& [id, property] : other.var_shorthands)
		SetVarShorthand(id, property, property.specificity + specificity_offset);
}

void PropertyDictionary::Clear()
{
	if (HasCallbackResourcesForBinding())
		InvalidateCallbackResourcesForBinding();
	properties.clear();
	custom_properties.clear();
	var_shorthands.clear();
}

void PropertyDictionary::SetSourceOfAllProperties(const SharedPtr<const PropertySource>& property_source)
{
	for (auto& p : properties)
		p.second.source = property_source;
	for (auto& p : custom_properties)
		p.second.source = property_source;
	for (auto& p : var_shorthands)
		p.second.source = property_source;
}

void PropertyDictionary::SetProperty(PropertyId id, const Property& property, int specificity)
{
	PropertyMap::iterator iterator = properties.find(id);
	if (iterator != properties.end() && iterator->second.specificity > specificity)
		return;

	InvalidatePropertyCallbacks(GetProperty(id), property);
	Property& new_property = (properties[id] = property);
	new_property.specificity = specificity;
}

void PropertyDictionary::SetCustomProperty(const String& name, const Property& property, int specificity)
{
	const auto it = custom_properties.find(name);
	if (it != custom_properties.end() && it->second.specificity > specificity)
		return;

	InvalidatePropertyCallbacks(GetCustomProperty(name), property);
	Property& new_property = custom_properties.insert_or_assign(name, property).first->second;
	new_property.specificity = specificity;
}

void PropertyDictionary::SetVarShorthand(ShorthandId id, const Property& property, int specificity)
{
	RMLUI_ASSERT(id != ShorthandId::Invalid);
	const auto it = var_shorthands.find(id);
	if (it != var_shorthands.end() && it->second.specificity > specificity)
		return;

	InvalidatePropertyCallbacks(GetVarShorthand(id), property);
	Property& new_property = var_shorthands.insert_or_assign(id, property).first->second;
	new_property.specificity = specificity;
}

} // namespace Rml
