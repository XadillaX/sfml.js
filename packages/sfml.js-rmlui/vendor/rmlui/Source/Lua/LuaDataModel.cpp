#include "LuaDataModel.h"
#include <native/scripting/lua/rmlui-lua-model.h>

namespace Rml {
namespace Lua {
bool OpenLuaDataModel(lua_State* L, Context* context,
	int name_index, int table_index)
{
	return sfmlrmlui::OpenLuaModel(L, context, name_index, table_index);
}
void CloseLuaDataModel(lua_State* L, Context* context, int name_index)
{
	sfmlrmlui::CloseLuaModel(L, context, name_index);
}
} // namespace Lua
} // namespace Rml
