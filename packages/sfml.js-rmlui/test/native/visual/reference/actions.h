// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_ACTIONS_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_ACTIONS_H_

#include <RmlUi/Core.h>

#include <cassert>
#include <cmath>
#include <fstream>
#include <functional>
#include <sstream>
#include <unordered_map>
#include <vector>

#include "test/native/visual/reference/environment.h"

namespace visual_reference {

using Action = std::vector<Rml::String>;
using ActionMap = std::unordered_map<Rml::String, std::vector<Action>>;

inline Action Split(const Rml::String& line, char delimiter) {
  Action result;
  std::istringstream stream(line);
  Rml::String field;
  while (std::getline(stream, field, delimiter)) result.push_back(field);
  return result;
}

inline ActionMap LoadActions(const char* filename) {
  std::ifstream input(filename);
  assert(input);
  ActionMap result;
  Rml::String line;
  while (std::getline(input, line)) {
    auto fields = Split(line, '\t');
    assert(fields.size() >= 2);
    const auto name = fields.front();
    fields.erase(fields.begin());
    result[name].push_back(std::move(fields));
  }
  return result;
}

inline Rml::Element* Target(Rml::ElementDocument* document,
                            const Rml::String& path) {
  Rml::Element* element = document;
  const auto indices = Split(path, '/');
  assert(!indices.empty() && indices[0] == "0");
  for (std::size_t index = 1; index < indices.size(); ++index) {
    element = element->GetChild(std::stoi(indices[index]));
    assert(element);
  }
  return element;
}

inline void RunActions(
    Rml::Context* context,
    Rml::ElementDocument* document,
    System* system,
    const std::vector<Action>& actions,
    const std::function<void(const Rml::String&, Rml::Vector2i)>& capture) {
  Rml::Vector2i pointer(-1, -1);
  for (const auto& action : actions) {
    const auto& verb = action[0];
    const auto number = [&](std::size_t index) {
      return std::stof(action.at(index));
    };
    const auto integer = [&](std::size_t index) {
      return static_cast<int>(number(index));
    };
    if (verb == "hover") {
      auto* element = Target(document, action.at(1));
      const auto offset = element->GetAbsoluteOffset(Rml::BoxArea::Border);
      const auto size = element->GetBox().GetSize(Rml::BoxArea::Border);
      const auto center = offset + size * 0.5f;
      pointer = {static_cast<int>(std::floor(center.x)),
                 static_cast<int>(std::floor(center.y))};
      context->ProcessMouseMove(pointer.x, pointer.y, 0);
    } else if (verb == "hit") {
      auto* element = Target(document, action.at(1));
      bool found = false;
      for (int y = 4; y < 768 && !found; y += 4) {
        for (int x = 4; x < 1024; x += 4) {
          const Rml::Vector2f point(static_cast<float>(x),
                                    static_cast<float>(y));
          if (context->GetElementAtPoint(point) == element) {
            pointer = {x, y};
            found = true;
            break;
          }
        }
      }
      assert(found);
      context->ProcessMouseMove(pointer.x, pointer.y, 0);
    } else if (verb == "mouse") {
      pointer = {integer(1), integer(2)};
      context->ProcessMouseMove(pointer.x, pointer.y, 0);
    } else if (verb == "move-by") {
      pointer += Rml::Vector2i(integer(1), integer(2));
      context->ProcessMouseMove(pointer.x, pointer.y, 0);
    } else if (verb == "down") {
      context->ProcessMouseButtonDown(0, 0);
    } else if (verb == "up") {
      context->ProcessMouseButtonUp(0, 0);
    } else if (verb == "wheel") {
      context->ProcessMouseWheel({number(1), number(2)}, 0);
    } else if (verb == "advance") {
      const double endpoint = std::stod(action.at(1));
      while (system->seconds < endpoint) {
        system->seconds = std::min(system->seconds + 1.0 / 60.0, endpoint);
        assert(context->Update());
      }
    } else if (verb == "scroll") {
      auto* element = Target(document, action.at(1));
      element->SetScrollLeft(number(2));
      element->SetScrollTop(number(3));
    } else if (verb == "size") {
      context->SetDimensions({integer(1), integer(2)});
    } else if (verb == "density") {
      context->SetDensityIndependentPixelRatio(number(1));
    } else if (verb == "focus") {
      assert(Target(document, action.at(1))->Focus());
    } else if (verb == "key") {
      const auto key = static_cast<Rml::Input::KeyIdentifier>(integer(1));
      context->ProcessKeyDown(key, 0);
      context->ProcessKeyUp(key, 0);
    } else if (verb == "property") {
      assert(Target(document, action.at(1))
                 ->SetProperty(action.at(2), action.at(3)));
    } else if (verb == "capture") {
      capture(action.at(1), pointer);
    } else {
      assert(false && "Unknown visual input operation");
    }
    assert(context->Update());
  }
}

}  // namespace visual_reference

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_ACTIONS_H_
