// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// This standalone executable links unchanged upstream game sources and the
// existing vendor objects. It has no Node or sfml.js runtime dependency.
#include <RmlUi/Core.h>

#include <cassert>
#include <cstdio>
#include <cstring>
#include <fstream>
#include <iostream>

#include "Game.h"
#include "GameDetails.h"
#include "HighScores.h"
#include "Invader.h"

#if !defined(REFERENCE_LUA_INVADERS)
#include "EventListenerInstancer.h"
#include "EventManager.h"
#endif

Rml::Context* context = nullptr;

namespace Backend {
void RequestExit() {}
}  // namespace Backend

// These patched vendor boundaries are unused without a Lua VM.
namespace sfmlrmlui {
void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {}
void ReleaseLuaModel(Rml::Context*, Rml::DataModel*) {}
void ReleaseLuaContextModels(Rml::Context*) {}
}  // namespace sfmlrmlui

namespace {

const char* scores_path = nullptr;

class ReferenceSystem final : public Rml::SystemInterface {
 public:
  double time{0};
  double GetElapsedTime() override { return time; }
  bool LogMessage(Rml::Log::Type, const Rml::String&) override { return true; }
};

class ReferenceRenderer final : public Rml::RenderInterface {
 public:
  Rml::CompiledGeometryHandle CompileGeometry(Rml::Span<const Rml::Vertex>,
                                              Rml::Span<const int>) override {
    return 1;
  }
  void RenderGeometry(Rml::CompiledGeometryHandle,
                      Rml::Vector2f,
                      Rml::TextureHandle) override {}
  void ReleaseGeometry(Rml::CompiledGeometryHandle) override {}
  Rml::TextureHandle LoadTexture(Rml::Vector2i&, const Rml::String&) override {
    return 0;
  }
  Rml::TextureHandle GenerateTexture(Rml::Span<const Rml::byte>,
                                     Rml::Vector2i) override {
    return 0;
  }
  void ReleaseTexture(Rml::TextureHandle) override {}
  void EnableScissorRegion(bool) override {}
  void SetScissorRegion(Rml::Rectanglei) override {}
};

Rml::String Hud(const char* id) {
  return context->GetDocument("game_window")->GetElementById(id)->GetInnerRML();
}

void CheckInitial(Game* game) {
  assert(game->GetNumInvaders() == 56);
  assert(game->GetNumShields() == 40);
  assert(Hud("score") == "0");
  assert(Hud("lives") == "3");
  assert(Hud("waves") == "1");
  assert(game->GetInvader(0)->GetPosition() == Rml::Vector2f(160, 96));
  assert(game->GetInvader(54)->GetPosition() == Rml::Vector2f(800, 288));
}

}  // namespace

extern "C" FILE* OfficialOpenScoresFile(const char* file, const char* mode) {
  assert(std::strcmp(file, "scores.txt") == 0);
  return std::fopen(scores_path, mode);
}

int main(int argc, char** argv) {
  assert(argc == 4);
  scores_path = argv[3];
  std::remove(scores_path);
  ReferenceSystem system;
  ReferenceRenderer renderer;
  Rml::SetSystemInterface(&system);
  Rml::SetRenderInterface(&renderer);
  assert(Rml::Initialise());
  assert(Rml::LoadFontFace("assets/LatoLatin-Regular.ttf"));
  context = Rml::CreateContext("original-game", {1024, 768});
  assert(context);
  HighScores::Initialise(context);
#if !defined(REFERENCE_LUA_INVADERS)
  EventListenerInstancer listeners;
  Rml::Factory::RegisterEventListenerInstancer(&listeners);
#endif
  auto* document =
      context->LoadDocument(Rml::String(argv[1]) + "/data/game.rml");
  assert(document);
  document->Show();
  context->Update();
  GameDetails::SetPaused(false);
  GameDetails::SetDifficulty(GameDetails::EASY);
  {
    Game game;
    game.Initialise();
    CheckInitial(&game);
    std::cout << "PASS original-initial-formation-shields-and-hud\n";

    const auto initial = game.GetInvader(0)->GetPosition();
    GameDetails::SetPaused(true);
    game.Update(1);
    assert(game.GetInvader(0)->GetPosition() == initial);
    GameDetails::SetPaused(false);
    game.Update(1);
    assert(game.GetInvader(0)->GetPosition() == initial + Rml::Vector2f(10, 0));
    std::cout << "PASS original-pause-and-native-movement\n";

    // Use the public collision API, not private field access or copied logic.
    for (int index = 0; index < 55; ++index) {
      auto* invader = game.GetInvader(index);
      assert(
          invader->CheckHit(1, invader->GetPosition() + Rml::Vector2f(24, 4)));
      assert(invader->GetState() == Invader::EXPLODING);
    }
    assert(GameDetails::GetScore() == 1100);
    game.Update(1.3);
    for (int index = 0; index < 55; ++index) {
      assert(game.GetInvader(index)->GetState() == Invader::DEAD);
    }
    game.Update(2);
    assert(GameDetails::GetWave() == 2);
    assert(Hud("waves") == "2");
    assert(Hud("score") == "1100");
    for (int index = 0; index < 55; ++index) {
      assert(game.GetInvader(index)->GetState() == Invader::ALIVE);
    }
    std::cout << "PASS original-collision-score-and-next-wave\n";

    game.RemoveLife();
    assert(Hud("lives") == "2");
    game.RemoveLife();
    assert(Hud("lives") == "1");
    game.RemoveLife();
    assert(Hud("lives") == "0");
#if defined(REFERENCE_LUA_INVADERS)
    assert(game.IsGameOver());
#else
    bool high_score_open = false;
    for (int index = 0; index < context->GetNumDocuments(); ++index) {
      high_score_open |=
          context->GetDocument(index)->GetTitle() == "High Scores";
    }
    assert(high_score_open);
#endif
    std::cout << "PASS original-life-loss-and-game-over\n";
    HighScores::SubmitScore("Original reference",
                            Rml::Colourb(255, 0, 0),
                            GameDetails::GetWave(),
                            GameDetails::GetScore());
  }
  {
    Game restarted;
    restarted.Initialise();
    CheckInitial(&restarted);
    assert(Hud("hiscore") == "1100");
    std::cout << "PASS original-restart-keeps-high-score\n";
  }
  std::ofstream reference(argv[2]);
  reference << "{\"initial\":{\"score\":0,\"wave\":1,\"lives\":3,"
               "\"invaders\":55,\"shields\":40},\"nextWave\":2,"
               "\"formationScore\":1100,\"highScoreAfterRestart\":1100}\n";
  reference.close();
  context->UnloadAllDocuments();
  context->Update();
  context->RemoveDataModel("high_scores");
  HighScores::Shutdown();
#if !defined(REFERENCE_LUA_INVADERS)
  EventManager::Shutdown();
#endif
  Rml::RemoveContext("original-game");
  context = nullptr;
  Rml::Shutdown();
}
