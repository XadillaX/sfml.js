// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Link the actual upstream DemoWindow.cpp and DemoEventListener.cpp. This
// driver supplies only the clock, renderer and Backend::RequestExit boundary.
#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Elements/ElementFormControl.h>
#include <RmlUi/Core/Elements/ElementFormControlSelect.h>
#include <RmlUi/Core/Factory.h>
#include <RmlUi/Core/RenderInterface.h>
#include <RmlUi/Core/SystemInterface.h>

#include <cassert>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>

#include "third_party/rmlui/Samples/basic/demo/src/DemoEventListener.h"
#include "third_party/rmlui/Samples/basic/demo/src/DemoWindow.h"

namespace Backend {

int exit_requests = 0;

void RequestExit() {
  ++exit_requests;
}

}  // namespace Backend

namespace sfmlrmlui {

void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  assert(false && "This original application does not use data models");
}

void ReleaseLuaContextModels(Rml::Context*) {}

}  // namespace sfmlrmlui

namespace {

class ReferenceSystem : public Rml::SystemInterface {
 public:
  double time{0};

  double GetElapsedTime() override { return time; }

  bool LogMessage(Rml::Log::Type, const Rml::String&) override { return true; }
};

class ReferenceRenderer : public Rml::RenderInterface {
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

Rml::ElementFormControl* Control(Rml::ElementDocument* document,
                                 const Rml::String& query) {
  auto* element = document->QuerySelector(query);
  auto* control = rmlui_dynamic_cast<Rml::ElementFormControl*>(element);
  assert(control);
  return control;
}

}  // namespace

int main(int argc, char** argv) {
  assert(argc == 2);
  ReferenceRenderer renderer;
  ReferenceSystem system;
  Rml::SetRenderInterface(&renderer);
  Rml::SetSystemInterface(&system);
  assert(Rml::Initialise());
  assert(Rml::LoadFontFace("assets/LatoLatin-Regular.ttf"));
  assert(Rml::LoadFontFace("assets/NotoEmoji-Regular.ttf", true));
  auto* context = Rml::CreateContext("original-demo-reference", {1600, 890});
  assert(context);

  DemoWindow application;
  DemoEventListenerInstancer listeners(&application);
  Rml::Factory::RegisterEventListenerInstancer(&listeners);
  assert(application.Initialize("Demo sample", context));
  auto* document = application.GetDocument();
  document->AddEventListener("keydown", &application);
  document->AddEventListener("keyup", &application);
  document->AddEventListener("animationend", &application);
  context->Update();

  auto* target = document->GetElementById("sandbox_target");
  auto* iframe =
      rmlui_dynamic_cast<Rml::ElementDocument*>(target->GetFirstChild());
  assert(iframe && iframe->GetContext() == context);
  assert(context->GetNumDocuments() == 1);
  Control(document, "#sandbox_rml_source")
      ->SetValue("<p id=\"inside\">Hello &amp; native sandbox</p>");
  Control(document, "#sandbox_rml_source")->DispatchEvent("change", {});
  Control(document, "#sandbox_rcss_source")
      ->SetValue("body { color: #fea; background: #224; } "
                 "#inside { font-size: 21px; }");
  Control(document, "#sandbox_rcss_source")->DispatchEvent("change", {});
  application.Update();
  context->Update();
  assert(iframe->GetElementById("inside"));
  assert(iframe->GetElementById("inside")
             ->GetProperty("font-size")
             ->Get<float>() == 21);
  std::cout << "PASS original-demo-sandbox-change-listeners\n";

  Control(document, "input[name='name']")->SetValue("<N & M>");
  Control(document, "textarea[name='message']")
      ->SetValue("<script>& \"hello\"</script>");
  document->QuerySelector("input[type='submit']")->Click();
  std::ofstream output(argv[1]);
  assert(output);
  output << std::setprecision(std::numeric_limits<float>::max_digits10);
  output << "{\"frames\":[";
  bool first = true;
  for (const double time : {0., 0.25, 0.7, 1., 1.999, 2., 2.5, 3., 3.999, 4.}) {
    system.time = time;
    application.Update();
    context->Update();
    auto* gauge = document->GetElementById("gauge");
    auto* horizontal = document->GetElementById("progress_horizontal");
    output << (first ? "[" : ",[") << time << ","
           << gauge->GetAttribute<float>("value", 0) << ","
           << horizontal->GetAttribute<float>("value", 0) << ","
           << std::quoted(
                  document->GetElementById("gauge_value")->GetInnerRML())
           << ","
           << std::quoted(
                  document->GetElementById("progress_value")->GetInnerRML())
           << ","
           << std::quoted(
                  document->GetElementById("progress_label")->GetInnerRML())
           << "]";
    first = false;
  }
  output << "],\"formOutput\":";
  auto* form_output = document->GetElementById("form_output");
  output << std::quoted(form_output->GetInnerRML()) << "}\n";
  assert(output.good());
  assert(form_output->QuerySelector("script") == nullptr);
  assert(form_output->GetInnerRML().find("&lt;N &amp; M&gt;") !=
         Rml::String::npos);
  assert(form_output->GetInnerRML().find("<strong>message</strong>: <br />") !=
         Rml::String::npos);
  std::cout << "PASS original-demo-form-encoding-and-clock-reference\n";

  auto* select = rmlui_dynamic_cast<Rml::ElementFormControlSelect*>(
      document->QuerySelector("select[name='subject']"));
  assert(select);
  select->ShowSelectBox();
  assert(select->IsSelectBoxVisible());
  Rml::Dictionary escape_parameters;
  escape_parameters["key_identifier"] = static_cast<int>(Rml::Input::KI_ESCAPE);
  select->DispatchEvent("keydown", escape_parameters);
  assert(!select->IsSelectBoxVisible());
  assert(Backend::exit_requests == 0);
  select->DispatchEvent("keydown", escape_parameters);
  assert(Backend::exit_requests == 1);
  std::cout << "PASS original-demo-select-cancel-before-document-exit\n";

  const auto observer = iframe->GetObserverPtr();
  application.Shutdown();
  context->Update();
  assert(!observer && context->GetNumDocuments() == 0);
  Rml::Shutdown();
  std::cout << "PASS original-demo-outer-shutdown-destroys-sandbox\n";
}
