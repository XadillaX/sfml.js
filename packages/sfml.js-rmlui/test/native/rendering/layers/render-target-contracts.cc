// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Vertex.h>

#include <algorithm>
#include <array>
#include <iostream>
#include <new>
#include <stdexcept>
#include <string>

#include "native/rendering/render-interface-sfml.h"
#include "test/native/rendering/layers/sfml-target-faults.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/System/Exception.hpp>
#include <SFML/Window/VideoMode.hpp>

namespace {

using Renderer = sfmlrmlui::RenderInterfaceSFML;

void Require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

void ExpectView(const sf::View& actual, const sf::View& expected) {
  Require(actual.getCenter() == expected.getCenter() &&
              actual.getSize() == expected.getSize() &&
              actual.getRotation() == expected.getRotation() &&
              actual.getViewport() == expected.getViewport() &&
              actual.getScissor() == expected.getScissor(),
          "Allocation failure changed the complete host view");
}

sf::Image HostPixels(sf::RenderWindow* window) {
  Require(window->setActive(true), "Cannot activate allocation fixture host");
  sf::Texture capture(window->getSize());
  capture.update(*window);
  return capture.copyToImage();
}

void ExpectIdentical(const sf::Image& actual, const sf::Image& expected) {
  const auto size = actual.getSize();
  Require(size == expected.getSize(), "Allocation changed capture dimensions");
  Require(std::equal(actual.getPixelsPtr(),
                     actual.getPixelsPtr() + size.x * size.y * 4,
                     expected.getPixelsPtr()),
          "Allocation failure changed host pixels");
}

Rml::CompiledGeometryHandle Triangle(Renderer* renderer) {
  const Rml::ColourbPremultiplied red(128, 0, 0, 128);
  const std::array<Rml::Vertex, 3> vertices{{
      {{3.f, 3.f}, red, {}},
      {{30.f, 3.f}, red, {}},
      {{3.f, 30.f}, red, {}},
  }};
  const std::array<int, 3> indices{0, 1, 2};
  return renderer->CompileGeometry({vertices.data(), vertices.size()},
                                   {indices.data(), indices.size()});
}

template <typename Action>
void ExpectAllocationFailure(Action action) {
  bool failed = false;
  try {
    action();
  } catch (const sf::Exception&) {
    failed = true;
  } catch (const std::runtime_error&) {
    failed = true;
  } catch (const std::bad_alloc&) {
    failed = true;
  }
  Require(failed, "Allocation failure exposed a successful operation");
}

enum class Operation { kBase, kLayer, kPost, kCapture, kMask };

void AllocationRollback(sf::RenderWindow* window,
                        Operation operation,
                        unsigned target_failure,
                        unsigned texture_failure = 0,
                        bool nested = false) {
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  Renderer renderer(&diagnostics);
  renderer.SetWindow(window);
  const auto host = HostPixels(window);
  const auto view = window->getView();
  const auto geometry = Triangle(&renderer);
  const auto filter = renderer.CompileFilter("brightness", {});
  Require(filter != 0, "Cannot compile allocation fixture filter");

  if (operation != Operation::kBase) {
    renderer.BeginFrame();
    renderer.RenderGeometry(geometry, {}, 0);
    renderer.FlushGeometry();
    if (nested) {
      renderer.PushLayer();
    }
  }
  const auto layer = renderer.GetActiveLayer();
  const auto allocations = diagnostics.layer_allocations;
  const auto composites = diagnostics.composite_draws;
  target_faults::Reset(target_failure, texture_failure);
  ExpectAllocationFailure([&] {
    switch (operation) {
      case Operation::kBase:
        renderer.BeginFrame();
        break;
      case Operation::kLayer:
        renderer.PushLayer();
        break;
      case Operation::kPost:
        renderer.CompositeLayers(0, 0, Rml::BlendMode::Replace, {&filter, 1});
        break;
      case Operation::kCapture:
      case Operation::kMask:
        renderer.SetScissorRegion(
            Rml::Rectanglei::FromPositionSize({3, 3}, {30, 30}));
        if (operation == Operation::kMask) {
          renderer.SaveLayerAsMaskImage();
        } else {
          renderer.SaveLayerAsTexture();
        }
        break;
    }
  });
  Require(
      (target_failure && target_faults::target_calls == target_failure) ||
          (texture_failure && target_faults::texture_calls == texture_failure),
      "Probe did not reach the configured allocation failure");
  Require(renderer.GetActiveLayer() == layer,
          "Failed allocation changed the layer stack");
  Require(diagnostics.layer_allocations == allocations,
          "Failed allocation recorded a usable layer");
  Require(diagnostics.composite_draws == composites,
          "Failed allocation presented a composite");
  if (operation == Operation::kPost) {
    Require(diagnostics.post_target_allocations == target_failure - 1,
            "Scratch count did not match successful allocations");
  }
  if (texture_failure) {
    Require(diagnostics.capture_draws == 1,
            "Capture output failure did not follow a real capture draw");
  }
  renderer.RollbackFrame();
  Require(!renderer.HasActiveFrame(), "Rollback retained a failed frame");
  ExpectView(window->getView(), view);
  target_faults::Reset();
  ExpectIdentical(HostPixels(window), host);

  renderer.BeginFrame();
  renderer.RenderGeometry(geometry, {}, 0);
  const auto next_layer = renderer.PushLayer();
  renderer.CompositeLayers(next_layer, 0, Rml::BlendMode::Blend, {});
  renderer.PopLayer();
  renderer.CompositeLayers(0, 0, Rml::BlendMode::Replace, {&filter, 1});
  renderer.SetScissorRegion(
      Rml::Rectanglei::FromPositionSize({0, 0}, {40, 40}));
  const auto saved = renderer.SaveLayerAsTexture();
  Require(saved != 0, "Retry could not capture a texture");
  renderer.ReleaseTexture(saved);
  const auto mask = renderer.SaveLayerAsMaskImage();
  Require(mask != 0, "Retry could not capture a mask");
  renderer.ReleaseFilter(mask);
  renderer.EndFrame();
  ExpectView(window->getView(), view);
  renderer.ReleaseGeometry(geometry);
  renderer.ReleaseFilter(filter);
}

void ResizedBaseFailure(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  renderer.BeginFrame();
  renderer.RollbackFrame();
  const auto original_size = window->getSize();
  const auto view = window->getView();
  window->setSize({original_size.x + 4, original_size.y + 6});
  const auto host = HostPixels(window);
  target_faults::Reset(1);
  ExpectAllocationFailure([&] { renderer.BeginFrame(); });
  Require(target_faults::target_calls == 1,
          "Resized base probe did not reach allocation");
  Require(!renderer.HasActiveFrame(), "Resized base retained a failed frame");
  ExpectView(window->getView(), view);
  target_faults::Reset();
  ExpectIdentical(HostPixels(window), host);
  renderer.BeginFrame();
  renderer.SetScissorRegion(Rml::Rectanglei::FromPositionSize(
      {},
      {static_cast<int>(window->getSize().x),
       static_cast<int>(window->getSize().y)}));
  const auto capture = renderer.SaveLayerAsTexture();
  Require(capture != 0, "Resized base retry could not capture");
  Require(
      reinterpret_cast<sf::Texture*>(capture)->getSize() == window->getSize(),
      "Resized base retry reused stale dimensions");
  renderer.ReleaseTexture(capture);
  renderer.EndFrame();
  window->setSize(original_size);
}

void MaskRecordOwnership(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto host = HostPixels(window);
  renderer.BeginFrame();
  renderer.SetScissorRegion(
      Rml::Rectanglei::FromPositionSize({3, 3}, {30, 30}));
  target_faults::Reset();
  target_faults::fail_mask_record = true;
  ExpectAllocationFailure([&] { renderer.SaveLayerAsMaskImage(); });
  Require(target_faults::captured_texture != nullptr,
          "Mask record probe did not reach a complete capture");
  Require(
      target_faults::failed_allocation_size == sizeof(sfmlrmlui::FilterRecord),
      "Mask record probe failed an unrelated allocation");
  const bool released = target_faults::captured_texture_deleted;
  if (!released) {
    // Bound the regression probe's leak when run against the old renderer.
    delete static_cast<sf::Texture*>(target_faults::captured_texture);
  }
  renderer.RollbackFrame();
  target_faults::Reset();
  ExpectIdentical(HostPixels(window), host);
  Require(released,
          "Failed mask record allocation leaked its captured texture");
  renderer.BeginFrame();
  renderer.SetScissorRegion(
      Rml::Rectanglei::FromPositionSize({3, 3}, {30, 30}));
  const auto mask = renderer.SaveLayerAsMaskImage();
  Require(mask != 0, "Mask record allocation did not recover");
  renderer.ReleaseFilter(mask);
  renderer.RollbackFrame();
}

}  // namespace

int main() {
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  sf::RenderWindow window(sf::VideoMode({80, 60}),
                          "Render target allocation transactions",
                          sf::Style::Default,
                          sf::State::Windowed,
                          settings);
  window.setVisible(false);
  sf::View view(sf::FloatRect({3.f, 7.f}, {61.f, 43.f}));
  view.setRotation(sf::degrees(17.f));
  view.setViewport(sf::FloatRect({0.1f, 0.2f}, {0.7f, 0.6f}));
  view.setScissor(sf::FloatRect({0.2f, 0.3f}, {0.5f, 0.4f}));
  window.setView(view);
  int failures = 0;
  const auto run = [&](const std::string& name, auto test) {
    target_faults::Reset();
    try {
      test();
      std::cout << "PASS native-target-" << name << "\n";
    } catch (const sf::Exception& error) {
      std::cout << "FAIL native-target-" << name << ": " << error.what()
                << "\n";
      ++failures;
    } catch (const std::exception& error) {
      std::cout << "FAIL native-target-" << name << ": " << error.what()
                << "\n";
      ++failures;
    }
    target_faults::Reset();
  };
  run("base", [&] { AllocationRollback(&window, Operation::kBase, 1); });
  run("layer", [&] { AllocationRollback(&window, Operation::kLayer, 1); });
  run("nested-layer",
      [&] { AllocationRollback(&window, Operation::kLayer, 1, 0, true); });
  for (unsigned stage = 1; stage <= 3; ++stage) {
    run("post-" + std::to_string(stage),
        [&] { AllocationRollback(&window, Operation::kPost, stage); });
  }
  run("capture-target",
      [&] { AllocationRollback(&window, Operation::kCapture, 1); });
  run("mask-target", [&] { AllocationRollback(&window, Operation::kMask, 1); });
  run("capture-output",
      [&] { AllocationRollback(&window, Operation::kCapture, 0, 1); });
  run("mask-output",
      [&] { AllocationRollback(&window, Operation::kMask, 0, 1); });
  run("resized-base", [&] { ResizedBaseFailure(&window); });
  run("mask-record-ownership", [&] { MaskRecordOwnership(&window); });
  return failures ? 1 : 0;
}
