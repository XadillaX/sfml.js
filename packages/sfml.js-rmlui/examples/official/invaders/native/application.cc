// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core.h>

#include <memory>
#include <stdexcept>

#include "DecoratorDefender.h"
#include "DecoratorStarfield.h"
#include "ElementGame.h"
#include "EventHandlerHighScore.h"
#include "EventHandlerOptions.h"
#include "EventHandlerStartGame.h"
#include "EventListenerInstancer.h"
#include "EventManager.h"
#include "examples/official/shell/native-application.h"

namespace official {
namespace {

std::unique_ptr<Rml::ElementInstancerGeneric<ElementGame>> game;
std::unique_ptr<DecoratorInstancerStarfield> starfield;
std::unique_ptr<DecoratorInstancerDefender> defender;
std::unique_ptr<EventListenerInstancer> listeners;

}  // namespace

void InitialiseApplication(lua_State* /*state*/) {
  // Keep the original application's registrations independent of Lua Invaders.
  // Decorator property definitions refer to this runtime's parser registry.
  // The previous factory is already gone when a new runtime starts; retain
  // each instancer through shutdown, then reconstruct its property records.
  game = std::make_unique<Rml::ElementInstancerGeneric<ElementGame>>();
  starfield = std::make_unique<DecoratorInstancerStarfield>();
  defender = std::make_unique<DecoratorInstancerDefender>();
  listeners = std::make_unique<EventListenerInstancer>();
  Rml::Factory::RegisterElementInstancer("game", game.get());
  Rml::Factory::RegisterDecoratorInstancer("starfield", starfield.get());
  Rml::Factory::RegisterDecoratorInstancer("defender", defender.get());
  Rml::Factory::RegisterEventListenerInstancer(listeners.get());

  EventManager::RegisterEventHandler("start_game",
                                     Rml::MakeUnique<EventHandlerStartGame>());
  EventManager::RegisterEventHandler("high_score",
                                     Rml::MakeUnique<EventHandlerHighScore>());
  EventManager::RegisterEventHandler("options",
                                     Rml::MakeUnique<EventHandlerOptions>());
  if (!EventManager::LoadWindow("background") ||
      !EventManager::LoadWindow("main_menu")) {
    throw std::runtime_error("Could not load original Invaders menus");
  }
}

void ReleaseApplicationHandlers() {
  EventManager::Shutdown();
}

const char* ApplicationDirectory() {
  return "invaders/data/";
}

}  // namespace official
