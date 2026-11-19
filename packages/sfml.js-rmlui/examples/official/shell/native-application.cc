// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "examples/official/shell/native-application.h"

#include <RmlUi/Core.h>
#include <nan.h>

#include <cstdio>
#include <cstring>
#include <filesystem>

#include "GameDetails.h"
#include "HighScores.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-host.h"

// This exact symbol is consumed by the unchanged upstream application sources.
Rml::Context* context = nullptr;

namespace official {
namespace {

bool exit_requested = false;

class ApplicationHost final : public Rml::Plugin {
 public:
  int GetEventClasses() override { return EVT_BASIC | EVT_DATA_MODEL; }

  void OnDataModelDestroy(Rml::Context* owner,
                          const Rml::String& name) override {
    if (owner == context && name == "high_scores" && scores_alive_) {
      // Context destruction unloads documents before destroying its models.
      // Lua unload handlers can therefore still submit the final player name.
      scores_alive_ = false;
      HighScores::Shutdown();
      ReleaseApplicationHandlers();
      context = nullptr;
    }
  }

  void OnShutdown() override { context = nullptr; }

  bool Start(Rml::Context* owner, const Rml::String& file, lua_State* state) {
    if (!sfmlrmlui::ClaimOfficialApplication()) {
      Nan::ThrowError("Run one original game application per runtime");
      return false;
    }

    scores_file_ = file;
    context = owner;
    exit_requested = false;
    Rml::RegisterPlugin(this);

    // Match the original process-level defaults after a runtime restart.
    GameDetails::SetDifficulty(GameDetails::EASY);
    GameDetails::SetDefenderColour(Rml::Colourb(255, 0, 0));
    GameDetails::ResetScore();
    GameDetails::SetWave(0);
    GameDetails::SetPaused(false);
    GameDetails::SetGraphicsQuality(GameDetails::OK);
    GameDetails::SetReverb(true);
    GameDetails::Set3DSpatialisation(false);

    HighScores::Initialise(context);
    scores_alive_ = true;
    InitialiseApplication(state);
    return true;
  }

  bool Close() {
    if (!context || !scores_alive_) {
      return false;
    }

    Rml::ElementList documents;
    for (int index = 0; index < context->GetNumDocuments(); ++index) {
      auto* document = context->GetDocument(index);
      if (document->GetSourceURL().starts_with(ApplicationDirectory())) {
        documents.push_back(document);
      }
    }
    for (auto* element : documents) {
      rmlui_static_cast<Rml::ElementDocument*>(element)->Close();
    }
    context->Update();
    // NotifyDataModelDestroy saves the scores before freeing the native list.
    context->RemoveDataModel("high_scores");
    return true;
  }

  const Rml::String& scores_file() const { return scores_file_; }

 private:
  bool scores_alive_{false};
  Rml::String scores_file_;
};

ApplicationHost& Host() {
  static ApplicationHost host;
  return host;
}

NAN_METHOD(Start) {
  auto* owner = sfmlrmlui::ContextOf(info[0]);
  if (!owner) {
    return;
  }

  if (!info[1]->IsString()) {
    Nan::ThrowTypeError("Expected an absolute scores file path");
    return;
  }

  Nan::Utf8String file(info[1]);
  Rml::String path(*file, file.length());
  if (path.empty() || !std::filesystem::u8path(path).is_absolute() ||
      path.find('\0') != Rml::String::npos) {
    Nan::ThrowTypeError("Expected an absolute scores file path");
    return;
  }

  std::shared_ptr<sfmlrmlui::LuaHost> lua_host;
  if (info.Length() > 2 && !info[2]->IsNullOrUndefined()) {
    lua_host = sfmlrmlui::LuaHostOf(info[2]);
    if (!lua_host) {
      return;
    }
  }

  sfmlrmlui::LuaStateScope selected(lua_host ? lua_host->state : nullptr);
  Host().Start(owner, path, lua_host ? lua_host->state : nullptr);
}

NAN_METHOD(Close) {
  info.GetReturnValue().Set(Host().Close());
}

NAN_METHOD(ReadState) {
  if (!context) {
    Nan::ThrowError("Original game application is closed");
    return;
  }

  auto state = Nan::New<v8::Object>();
  Nan::Set(state,
           Nan::New("exitRequested").ToLocalChecked(),
           Nan::New(exit_requested));
  Nan::Set(state,
           Nan::New("difficulty").ToLocalChecked(),
           Nan::New(static_cast<int>(GameDetails::GetDifficulty())));
  Nan::Set(state,
           Nan::New("score").ToLocalChecked(),
           Nan::New(GameDetails::GetScore()));
  Nan::Set(state,
           Nan::New("wave").ToLocalChecked(),
           Nan::New(GameDetails::GetWave()));
  Nan::Set(state,
           Nan::New("paused").ToLocalChecked(),
           Nan::New(GameDetails::GetPaused()));
  const auto& colour = GameDetails::GetDefenderColour();
  auto channels = Nan::New<v8::Array>(4);
  for (uint32_t index = 0; index < 4; ++index) {
    Nan::Set(channels, index, Nan::New(colour[index]));
  }
  Nan::Set(state, Nan::New("colour").ToLocalChecked(), channels);
  info.GetReturnValue().Set(state);
}

NAN_MODULE_INIT(Initialize) {
  sfmlrmlui::SetRuntimeMethod<Start>(target, "start");
  sfmlrmlui::SetRuntimeMethod<Close>(target, "close");
  sfmlrmlui::SetRuntimeMethod<ReadState>(target, "readState");
}

}  // namespace
}  // namespace official

namespace Backend {

void RequestExit() {
  official::exit_requested = true;
}

}  // namespace Backend

// Only the HighScores.cpp wrapper redirects fopen to OfficialOpenScoresFile.
// Its unchanged parser and serializer keep using FILE*, but the application's
// explicit storage path replaces the original process-relative scores.txt.
extern "C" FILE* OfficialOpenScoresFile(const char* file, const char* mode) {
  if (std::strcmp(file, "scores.txt") != 0) {
    return nullptr;
  }
#if defined(_WIN32)
  const auto path = std::filesystem::u8path(official::Host().scores_file());
  const std::wstring wide_mode(mode, mode + std::strlen(mode));
  return _wfopen(path.c_str(), wide_mode.c_str());
#else
  return std::fopen(official::Host().scores_file().c_str(), mode);
#endif
}

NAN_MODULE_WORKER_ENABLED(official_native_application, official::Initialize)
