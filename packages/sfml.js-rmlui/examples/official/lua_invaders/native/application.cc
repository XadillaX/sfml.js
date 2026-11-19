// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core.h>
#include <RmlUi/Lua/Interpreter.h>

#include <memory>
#include <stdexcept>

#include "DecoratorDefender.h"
#include "DecoratorStarfield.h"
#include "LuaInterface.h"
#include "examples/official/shell/native-application.h"

namespace official {
namespace {

std::unique_ptr<DecoratorInstancerStarfield> starfield;
std::unique_ptr<DecoratorInstancerDefender> defender;

}  // namespace

void InitialiseApplication(lua_State* state) {
  if (!state) {
    throw std::runtime_error("Lua Invaders requires a managed Lua host");
  }

  // Rebuild the original property definitions for this runtime's parsers.
  starfield = std::make_unique<DecoratorInstancerStarfield>();
  defender = std::make_unique<DecoratorInstancerDefender>();
  Rml::Factory::RegisterDecoratorInstancer("starfield", starfield.get());
  Rml::Factory::RegisterDecoratorInstancer("defender", defender.get());
  LuaInterface::Initialise(state);
  // JS explicitly executes the unchanged lua/start.lua after registration.
  // All later documents and listeners execute in this same managed VM.
}

void ReleaseApplicationHandlers() {}

const char* ApplicationDirectory() {
  return "lua_invaders/data/";
}

}  // namespace official
