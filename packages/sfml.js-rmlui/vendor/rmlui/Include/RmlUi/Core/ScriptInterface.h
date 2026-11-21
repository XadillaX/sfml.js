#pragma once

#include "Header.h"
#include "Traits.h"
#include "Types.h"

#include <memory>
#include <utility>

namespace Rml {

/**
    Base class for all objects that hold a scriptable object.
 */

class RMLUICORE_API ScriptInterface : public Releasable {
public:
	RMLUI_RTTI_Declare(ScriptInterface)

	virtual ~ScriptInterface() {}

	virtual ScriptObject GetScriptObject() const
	{ return script_object_for_binding; }

	// The managed host owns the opaque value; native overrides remain
	// authoritative and must use their own registered adapter.
	ScriptObject GetScriptObjectForBinding() const
	{ return script_object_for_binding; }
	void SetScriptObjectForBinding(ScriptObject object,
		std::shared_ptr<void> lifetime)
	{
		script_object_for_binding = object;
		script_object_lifetime_for_binding = std::move(lifetime);
	}

private:
	ScriptObject script_object_for_binding = nullptr;
	std::shared_ptr<void> script_object_lifetime_for_binding;
};

} // namespace Rml
