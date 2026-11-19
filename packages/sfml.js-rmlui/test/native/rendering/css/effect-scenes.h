// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_CSS_EFFECT_SCENES_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_CSS_EFFECT_SCENES_H_

#include <RmlUi/Core.h>

#include <array>
#include <cassert>
#include <iostream>

namespace css_scenes {

constexpr unsigned kWidth = 161;
constexpr unsigned kHeight = 121;

struct Scene {
  const char* name;
  bool foreground;
  bool backdrop;
  bool mask;
  bool transformed;
};

inline constexpr std::array<Scene, 10> kScenes{{
    {"baseline", false, false, false, false},
    {"foreground", true, false, false, false},
    {"backdrop", false, true, false, false},
    {"mask", false, false, true, false},
    {"foreground-backdrop", true, true, false, false},
    {"foreground-mask", true, false, true, false},
    {"backdrop-mask", false, true, true, false},
    {"foreground-backdrop-mask", true, true, true, false},
    {"transformed-baseline", false, false, false, true},
    {"transformed-foreground-backdrop-mask", true, true, true, true},
}};

class System final : public Rml::SystemInterface {
 public:
  unsigned errors{0};

  double GetElapsedTime() override { return 0; }

  bool LogMessage(Rml::Log::Type type, const Rml::String& message) override {
    if (type == Rml::Log::LT_ERROR || type == Rml::Log::LT_WARNING) {
      ++errors;
      std::cerr << message << "\n";
    }
    return true;
  }
};

inline Rml::ElementDocument* Load(Rml::Context* context, const Scene& scene) {
  auto* document = context->LoadDocumentFromMemory(R"(
    <rml>
      <head>
        <style>
          body { margin: 0; width: 161px; height: 121px; }
          #clip {
            position: absolute; left: 9px; top: 7px;
            width: 125px; height: 93px; overflow: hidden;
            border-radius: 7px;
          }
          #background {
            position: absolute; left: 6px; top: 3px;
            width: 95px; height: 72px;
            decorator: repeating-linear-gradient(25deg, #168bc9 0px 7px,
                                                #3ddd83 7px 14px);
          }
          #target {
            position: absolute; left: 23px; top: 17px;
            width: 63px; height: 41px; background-color: #e42e4380;
            border-radius: 5px;
          }
          #child {
            position: absolute; left: 11px; top: 5px;
            width: 24px; height: 13px; background-color: #ffca3480;
          }
        </style>
      </head>
      <body>
        <div id="clip">
          <div id="background"/>
          <div id="target"><div id="child"/></div>
        </div>
      </body>
    </rml>
  )");
  assert(document);
  auto* target = document->GetElementById("target");
  assert(target);
  if (scene.foreground) {
    assert(target->SetProperty(
        "filter",
        "brightness(0.7) blur(3px) drop-shadow(#268cff80 9px 15px 3px)"));
  }
  if (scene.backdrop) {
    assert(target->SetProperty("backdrop-filter", "blur(8px) invert(0.6)"));
  }
  if (scene.mask) {
    assert(
        target->SetProperty("mask-image", "horizontal-gradient(#0000 #000f)"));
  }
  if (scene.transformed) {
    auto* clip = document->GetElementById("clip");
    assert(
        clip->SetProperty("transform", "rotate(11deg) skewX(7deg) scale(0.9)"));
  }
  document->Show();
  assert(context->Update());
  return document;
}

}  // namespace css_scenes

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_CSS_EFFECT_SCENES_H_
