// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/EventListener.h>
#include <RmlUi/Core/Factory.h>
#include <RmlUi/Core/RenderInterface.h>
#include <RmlUi/Core/SystemInterface.h>

#include <array>
#include <cassert>
#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace sfmlrmlui {

// The oracle links the package's vendor objects but never creates JS models.
void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  assert(false && "Event oracle must not create data models");
}

void ReleaseLuaContextModels(Rml::Context*) {}

}  // namespace sfmlrmlui

namespace {

class BasicRenderer : public Rml::RenderInterface {
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

struct Observation {
  explicit Observation(std::string name) : name(std::move(name)) {}

  std::string name;
  bool result = false;
  std::vector<std::pair<std::string, int>> calls;
};

struct Tree {
  Rml::Element root{"root"};
  Rml::Element* parent = root.AppendChild(
      Rml::Factory::InstanceElement(&root, "*", "section", {}));
  Rml::Element* child = parent->AppendChild(
      Rml::Factory::InstanceElement(parent, "*", "button", {}));
};

class Recorder : public Rml::EventListener {
 public:
  Recorder(Observation* observation,
           std::string label,
           Rml::Element* current,
           Rml::Element* target,
           std::function<void(Rml::Event&)> action = {})
      : observation_(observation),
        label_(std::move(label)),
        current_(current),
        target_(target),
        action_(std::move(action)) {}

  void ProcessEvent(Rml::Event& event) override {
    assert(event.GetCurrentElement() == current_);
    assert(event.GetTargetElement() == target_);
    observation_->calls.emplace_back(label_,
                                     static_cast<int>(event.GetPhase()));
    if (action_) {
      action_(event);
    }
  }

 private:
  Observation* observation_;
  std::string label_;
  Rml::Element* current_;
  Rml::Element* target_;
  std::function<void(Rml::Event&)> action_;
};

Observation Phases(bool duplicate_ids) {
  Tree tree;
  if (duplicate_ids) {
    tree.parent->SetId("duplicate");
    tree.child->SetId("duplicate");
  }

  Observation result{duplicate_ids ? "duplicate-id-phases"
                                   : "missing-id-phases"};
  Recorder root_capture{&result, "document-capture", &tree.root, tree.child};
  Recorder parent_capture{&result, "parent-capture", tree.parent, tree.child};
  Recorder target_capture{&result, "target-capture", tree.child, tree.child};
  Recorder target{&result, "target", tree.child, tree.child};
  Recorder parent{&result, "parent", tree.parent, tree.child};
  Recorder root{&result, "document", &tree.root, tree.child};

  struct Registration {
    Rml::Element* element;
    Recorder* listener;
    bool capture;
  };
  const std::array<Registration, 6> registrations{{
      {&tree.root, &root_capture, true},
      {tree.parent, &parent_capture, true},
      {tree.child, &target_capture, true},
      {tree.child, &target, false},
      {tree.parent, &parent, false},
      {&tree.root, &root, false},
  }};
  for (const auto& registration : registrations) {
    registration.element->AddEventListener(
        "phases", registration.listener, registration.capture);
  }
  // Duplicate tuples are native-deduplicated; wrong-phase removal is a no-op.
  tree.child->AddEventListener("phases", &target);
  tree.parent->RemoveEventListener("phases", &parent_capture, false);
  result.result = tree.child->DispatchEvent("phases", {});
  for (const auto& registration : registrations) {
    registration.element->RemoveEventListener(
        "phases", registration.listener, registration.capture);
  }
  assert(result.calls.size() == 6);
  return result;
}

Observation Stops(bool immediate, bool interruptible, bool bubbles) {
  Tree tree;
  Observation result{
      interruptible
          ? (immediate ? "stop-immediate" : "stop-propagation")
          : (bubbles ? "uninterruptible" : "uninterruptible-no-bubble")};
  const auto stop = [&](Rml::Event& event) {
    assert(event.IsInterruptible() == interruptible);
    if (immediate) {
      event.StopImmediatePropagation();
    } else {
      event.StopPropagation();
    }
    assert(event.IsPropagating() == !interruptible);
    assert(event.IsImmediatePropagating() == !(interruptible && immediate));
  };
  Recorder first{&result, "first", tree.parent, tree.child, stop};
  Recorder second{&result, "second", tree.parent, tree.child};
  Recorder target{&result, "target", tree.child, tree.child};
  Recorder bubble{&result, "bubble", tree.parent, tree.child};
  tree.parent->AddEventListener("stops", &first, true);
  tree.parent->AddEventListener("stops", &second, true);
  tree.child->AddEventListener("stops", &target);
  tree.parent->AddEventListener("stops", &bubble);

  result.result =
      tree.child->DispatchEvent("stops", {}, interruptible, bubbles);
  tree.parent->RemoveEventListener("stops", &first, true);
  tree.parent->RemoveEventListener("stops", &second, true);
  tree.child->RemoveEventListener("stops", &target);
  tree.parent->RemoveEventListener("stops", &bubble);
  return result;
}

Observation Removal() {
  Tree tree;
  Observation result{"remove-current-and-later"};
  auto later =
      std::make_unique<Recorder>(&result, "later", tree.child, tree.child);
  Recorder* current = nullptr;
  const auto remove = [&](Rml::Event&) {
    tree.child->RemoveEventListener("removal", current);
    tree.child->RemoveEventListener("removal", later.get());
    // Native dispatch snapshots observer pointers. The binding releases a
    // detached callback, so expire the unexecuted native listener as well.
    later.reset();
  };
  Recorder first{&result, "first", tree.child, tree.child, remove};
  current = &first;
  Recorder bubble{&result, "bubble", tree.parent, tree.child};
  tree.child->AddEventListener("removal", &first);
  tree.child->AddEventListener("removal", later.get());
  tree.parent->AddEventListener("removal", &bubble);

  result.result = tree.child->DispatchEvent("removal", {});
  tree.parent->RemoveEventListener("removal", &bubble);
  assert(result.calls.size() == 2);
  return result;
}

Observation Nested() {
  Tree tree;
  Observation result{"nested-dispatch"};
  Rml::Event* outer = nullptr;
  const auto check_inner = [&](Rml::Event& event) {
    assert(outer && &event != outer);
    assert(event.GetId() != outer->GetId());
    assert(outer->IsPropagating());
  };
  const auto dispatch_inner = [&](Rml::Event& event) {
    outer = &event;
    assert(tree.parent->DispatchEvent("inner", {}));
    assert(event.IsPropagating());
    event.StopPropagation();
    result.calls.emplace_back("after", static_cast<int>(event.GetPhase()));
  };
  Recorder inner{&result, "inner", tree.parent, tree.parent, check_inner};
  Recorder target{&result, "before", tree.child, tree.child, dispatch_inner};
  tree.parent->AddEventListener("inner", &inner);
  tree.child->AddEventListener("outer", &target);

  result.result = tree.child->DispatchEvent("outer", {});
  tree.parent->RemoveEventListener("inner", &inner);
  tree.child->RemoveEventListener("outer", &target);
  return result;
}

void Print(const std::vector<Observation>& observations) {
  std::cout << "{";
  for (size_t i = 0; i < observations.size(); ++i) {
    const auto& observation = observations[i];
    std::cout << (i ? "," : "") << "\"" << observation.name
              << "\":{\"result\":" << (observation.result ? "true" : "false")
              << ",\"calls\":[";
    for (size_t j = 0; j < observation.calls.size(); ++j) {
      const auto& call = observation.calls[j];
      std::cout << (j ? "," : "") << "[\"" << call.first << "\"," << call.second
                << "]";
    }
    std::cout << "]}";
  }
  std::cout << "}\n";
}

}  // namespace

int main(int argc, char** argv) {
  BasicRenderer renderer;
  Rml::SystemInterface system;
  Rml::SetRenderInterface(&renderer);
  Rml::SetSystemInterface(&system);
  assert(Rml::Initialise());

  const std::vector<Observation> observations{
      Phases(false),
      Phases(true),
      Stops(false, true, true),
      Stops(true, true, true),
      Stops(true, false, true),
      Stops(true, false, false),
      Removal(),
      Nested(),
  };
  Rml::Shutdown();
  if (argc == 2 && std::string(argv[1]) == "--json") {
    Print(observations);
  } else {
    for (const auto& observation : observations) {
      std::cout << "PASS native-event-" << observation.name << "\n";
    }
  }
}
