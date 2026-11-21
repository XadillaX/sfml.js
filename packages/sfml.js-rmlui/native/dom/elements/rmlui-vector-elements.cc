// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Lottie/ElementLottie.h>
#include <RmlUi/SVG/ElementSVG.h>
#include <nan.h>

#include "native/dom/elements/rmlui-element-access.h"
#include "native/runtime/rmlui-state.h"
#include "vendor/rmlui/Source/Lottie/LottiePlugin.h"
#include "vendor/rmlui/Source/SVG/SVGPlugin.h"

namespace sfmlrmlui {
namespace {

template <typename ElementType>
NAN_METHOD(EnsureSourceLoaded) {
  if (auto* element = ElementAs<ElementType>(info[0])) {
    element->EnsureSourceLoaded();
  }
}

}  // namespace

void InitialiseVectorModules() {
  Rml::SVG::Initialise();
  Rml::Lottie::Initialise();
}

NAN_MODULE_INIT(InitializeRmlVectorElements) {
  SetRuntimeMethod<EnsureSourceLoaded<Rml::ElementSVG>>(
      target, "svgEnsureSourceLoaded");
  SetRuntimeMethod<EnsureSourceLoaded<Rml::ElementLottie>>(
      target, "lottieEnsureSourceLoaded");
}

}  // namespace sfmlrmlui
