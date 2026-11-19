// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <stdexcept>

namespace Rml {
class Context;
class DataModel;
}  // namespace Rml

namespace sfmlrmlui {

// The standalone executables do not construct binding-owned Lua models.
// Reject a future fixture that would silently escape that scope.
void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  throw std::logic_error("CSS renderer fixture unexpectedly created a model");
}

void ReleaseLuaModel(Rml::Context*, Rml::DataModel*) {
  throw std::logic_error("CSS renderer fixture unexpectedly released a model");
}

void ReleaseLuaContextModels(Rml::Context*) {}

}  // namespace sfmlrmlui
