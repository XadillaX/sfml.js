// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>
#include <sfml-js-interop.h>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
NAN_MODULE_INIT(InitializeNativeModuleSymbols);
NAN_MODULE_INIT(InitializeRmlCore);
NAN_MODULE_INIT(InitializeRmlCapabilities);
NAN_MODULE_INIT(InitializeRmlDebugger);
NAN_MODULE_INIT(InitializeRmlStrings);
NAN_MODULE_INIT(InitializeRmlStringFormatting);
NAN_MODULE_INIT(InitializeRmlLog);
NAN_MODULE_INIT(InitializeRmlURL);
NAN_MODULE_INIT(InitializeRmlPlugins);
NAN_MODULE_INIT(InitializeRmlSystemInterface);
NAN_MODULE_INIT(InitializeRmlFileInterface);
NAN_MODULE_INIT(InitializeRmlStream);
NAN_MODULE_INIT(InitializeRmlFactory);
NAN_MODULE_INIT(InitializeRmlElementInstancers);
NAN_MODULE_INIT(InitializeRmlContextInstancers);
NAN_MODULE_INIT(InitializeRmlTextInput);
NAN_MODULE_INIT(InitializeRmlEventInstancers);
NAN_MODULE_INIT(InitializeRmlListenerInstancers);
NAN_MODULE_INIT(InitializeRmlFonts);
NAN_MODULE_INIT(InitializeRmlFontEngine);
NAN_MODULE_INIT(InitializeRmlVectorElements);
NAN_MODULE_INIT(InitializeRmlFontGlyph);
NAN_MODULE_INIT(InitializeRmlFontEffect);
NAN_MODULE_INIT(InitializeRmlResources);
NAN_MODULE_INIT(InitializeRmlResourcePreload);
NAN_MODULE_INIT(InitializeRmlContext);
NAN_MODULE_INIT(InitializeRmlContextDocuments);
NAN_MODULE_INIT(InitializeRmlDataModel);
NAN_MODULE_INIT(InitializeRmlDataAddress);
NAN_MODULE_INIT(InitializeRmlDataFactory);
NAN_MODULE_INIT(InitializeRmlDataBatch);
NAN_MODULE_INIT(InitializeRmlDataCallbacks);
NAN_MODULE_INIT(InitializeRmlDataRegister);
NAN_MODULE_INIT(InitializeRmlDataStorage);
NAN_MODULE_INIT(InitializeRmlDataDiagnostics);
NAN_MODULE_INIT(InitializeRmlDocument);
NAN_MODULE_INIT(InitializeRmlScriptHosts);
NAN_MODULE_INIT(InitializeRmlLuaHosts);
NAN_MODULE_INIT(InitializeRmlLuaFunctions);
NAN_MODULE_INIT(InitializeRmlDocumentHeader);
NAN_MODULE_INIT(InitializeRmlElement);
NAN_MODULE_INIT(InitializeRmlElementScroll);
NAN_MODULE_INIT(InitializeRmlElementBackgroundBorder);
NAN_MODULE_INIT(InitializeRmlElementStyle);
NAN_MODULE_INIT(InitializeRmlElementUtilities);
NAN_MODULE_INIT(InitializeRmlElementState);
NAN_MODULE_INIT(InitializeRmlLayout);
NAN_MODULE_INIT(InitializeRmlBox);
NAN_MODULE_INIT(InitializeRmlElementBox);
NAN_MODULE_INIT(InitializeRmlNumericValue);
NAN_MODULE_INIT(InitializeRmlTransform);
NAN_MODULE_INIT(InitializeRmlTransformState);
NAN_MODULE_INIT(InitializeRmlElementNumeric);
NAN_MODULE_INIT(InitializeRmlProperty);
NAN_MODULE_INIT(InitializeRmlOwnedVariant);
NAN_MODULE_INIT(InitializeRmlPropertyDefinition);
NAN_MODULE_INIT(InitializeRmlPropertyDictionary);
NAN_MODULE_INIT(InitializeRmlPropertySpecification);
NAN_MODULE_INIT(InitializeRmlPropertyParser);
NAN_MODULE_INIT(InitializeRmlXML);
NAN_MODULE_INIT(InitializeRmlElementProperty);
NAN_MODULE_INIT(InitializeRmlElementCommands);
NAN_MODULE_INIT(InitializeRmlTween);
NAN_MODULE_INIT(InitializeRmlAnimation);
NAN_MODULE_INIT(InitializeRmlAnimationValues);
NAN_MODULE_INIT(InitializeRmlEffectValues);
NAN_MODULE_INIT(InitializeRmlEffectInstancers);
NAN_MODULE_INIT(InitializeRmlFilter);
NAN_MODULE_INIT(InitializeRmlDecorator);
NAN_MODULE_INIT(InitializeRmlStyleSheet);
NAN_MODULE_INIT(InitializeRmlMesh);
NAN_MODULE_INIT(InitializeRmlMeshUtilities);
NAN_MODULE_INIT(InitializeRmlConvolution);
NAN_MODULE_INIT(InitializeRmlGeometry);
NAN_MODULE_INIT(InitializeRmlTextureSource);
NAN_MODULE_INIT(InitializeRmlCallbackTexture);
NAN_MODULE_INIT(InitializeRmlSpritesheet);
NAN_MODULE_INIT(InitializeRmlRenderManager);
NAN_MODULE_INIT(InitializeRmlRenderState);
NAN_MODULE_INIT(InitializeRmlRenderLayers);
NAN_MODULE_INIT(InitializeRmlStyleValues);
NAN_MODULE_INIT(InitializeRmlStyleStructs);
NAN_MODULE_INIT(InitializeRmlComputedValues);
NAN_MODULE_INIT(InitializeRmlDom);
NAN_MODULE_INIT(InitializeRmlEvents);
NAN_MODULE_INIT(InitializeRmlInput);
NAN_MODULE_INIT(InitializeRmlForms);
NAN_MODULE_INIT(InitializeRmlSelect);
NAN_MODULE_INIT(InitializeRmlText);
NAN_MODULE_INIT(InitializeRmlPanels);
NAN_MODULE_INIT(InitializeRmlRtti);
NAN_MODULE_INIT(InitializeRmlScriptObjects);
}  // namespace sfmlrmlui

namespace {

NAN_MODULE_INIT(InitializeModule) {
  sfmlrmlui::RegisterRuntimeCleanup();
  sfmljs::InitializeErrors(target);
  sfmlrmlui::InitializeNativeModuleSymbols(target);
  sfmlrmlui::InitializeRmlCore(target);
  sfmlrmlui::InitializeRmlCapabilities(target);
  sfmlrmlui::InitializeRmlDebugger(target);
  sfmlrmlui::InitializeRmlStrings(target);
  sfmlrmlui::InitializeRmlStringFormatting(target);
  sfmlrmlui::InitializeRmlLog(target);
  sfmlrmlui::InitializeRmlURL(target);
  sfmlrmlui::InitializeRmlPlugins(target);
  sfmlrmlui::InitializeRmlSystemInterface(target);
  sfmlrmlui::InitializeRmlFileInterface(target);
  sfmlrmlui::InitializeRmlResourcePreload(target);
  sfmlrmlui::InitializeRmlStream(target);
  sfmlrmlui::InitializeRmlFactory(target);
  sfmlrmlui::InitializeRmlElementInstancers(target);
  sfmlrmlui::InitializeRmlContextInstancers(target);
  sfmlrmlui::InitializeRmlTextInput(target);
  sfmlrmlui::InitializeRmlEventInstancers(target);
  sfmlrmlui::InitializeRmlListenerInstancers(target);
  sfmlrmlui::InitializeRmlFonts(target);
  sfmlrmlui::InitializeRmlFontEngine(target);
  sfmlrmlui::InitializeRmlVectorElements(target);
  sfmlrmlui::InitializeRmlFontGlyph(target);
  sfmlrmlui::InitializeRmlFontEffect(target);
  sfmlrmlui::InitializeRmlResources(target);
  sfmlrmlui::InitializeRmlContext(target);
  sfmlrmlui::InitializeRmlContextDocuments(target);
  sfmlrmlui::InitializeRmlDataModel(target);
  sfmlrmlui::InitializeRmlDataAddress(target);
  sfmlrmlui::InitializeRmlDataFactory(target);
  sfmlrmlui::InitializeRmlDataBatch(target);
  sfmlrmlui::InitializeRmlDataCallbacks(target);
  sfmlrmlui::InitializeRmlDataRegister(target);
  sfmlrmlui::InitializeRmlDataStorage(target);
  sfmlrmlui::InitializeRmlDataDiagnostics(target);
  sfmlrmlui::InitializeRmlDocument(target);
  sfmlrmlui::InitializeRmlScriptHosts(target);
  sfmlrmlui::InitializeRmlLuaHosts(target);
  sfmlrmlui::InitializeRmlLuaFunctions(target);
  sfmlrmlui::InitializeRmlDocumentHeader(target);
  sfmlrmlui::InitializeRmlElement(target);
  sfmlrmlui::InitializeRmlElementScroll(target);
  sfmlrmlui::InitializeRmlElementBackgroundBorder(target);
  sfmlrmlui::InitializeRmlElementStyle(target);
  sfmlrmlui::InitializeRmlElementUtilities(target);
  sfmlrmlui::InitializeRmlElementState(target);
  sfmlrmlui::InitializeRmlLayout(target);
  sfmlrmlui::InitializeRmlBox(target);
  sfmlrmlui::InitializeRmlElementBox(target);
  sfmlrmlui::InitializeRmlNumericValue(target);
  sfmlrmlui::InitializeRmlTransform(target);
  sfmlrmlui::InitializeRmlTransformState(target);
  sfmlrmlui::InitializeRmlElementNumeric(target);
  sfmlrmlui::InitializeRmlProperty(target);
  sfmlrmlui::InitializeRmlOwnedVariant(target);
  sfmlrmlui::InitializeRmlPropertyDefinition(target);
  sfmlrmlui::InitializeRmlPropertyDictionary(target);
  sfmlrmlui::InitializeRmlPropertySpecification(target);
  sfmlrmlui::InitializeRmlPropertyParser(target);
  sfmlrmlui::InitializeRmlXML(target);
  sfmlrmlui::InitializeRmlElementProperty(target);
  sfmlrmlui::InitializeRmlElementCommands(target);
  sfmlrmlui::InitializeRmlTween(target);
  sfmlrmlui::InitializeRmlAnimation(target);
  sfmlrmlui::InitializeRmlAnimationValues(target);
  sfmlrmlui::InitializeRmlEffectValues(target);
  sfmlrmlui::InitializeRmlEffectInstancers(target);
  sfmlrmlui::InitializeRmlFilter(target);
  sfmlrmlui::InitializeRmlDecorator(target);
  sfmlrmlui::InitializeRmlStyleSheet(target);
  sfmlrmlui::InitializeRmlMesh(target);
  sfmlrmlui::InitializeRmlMeshUtilities(target);
  sfmlrmlui::InitializeRmlConvolution(target);
  sfmlrmlui::InitializeRmlGeometry(target);
  sfmlrmlui::InitializeRmlTextureSource(target);
  sfmlrmlui::InitializeRmlCallbackTexture(target);
  sfmlrmlui::InitializeRmlSpritesheet(target);
  sfmlrmlui::InitializeRmlRenderManager(target);
  sfmlrmlui::InitializeRmlRenderState(target);
  sfmlrmlui::InitializeRmlRenderLayers(target);
  sfmlrmlui::InitializeRmlStyleValues(target);
  sfmlrmlui::InitializeRmlStyleStructs(target);
  sfmlrmlui::InitializeRmlComputedValues(target);
  sfmlrmlui::InitializeRmlDom(target);
  sfmlrmlui::InitializeRmlEvents(target);
  sfmlrmlui::InitializeRmlInput(target);
  sfmlrmlui::InitializeRmlForms(target);
  sfmlrmlui::InitializeRmlSelect(target);
  sfmlrmlui::InitializeRmlText(target);
  sfmlrmlui::InitializeRmlPanels(target);
  sfmlrmlui::InitializeRmlRtti(target);
  sfmlrmlui::InitializeRmlScriptObjects(target);
}

NAN_MODULE_INIT(Initialize) {
  sfmljs::GuardExceptions(
      [&] { InitializeModule(target); },
      [](const char* message) { sfmljs::ThrowError(message); });
}

}  // namespace

NAN_MODULE_WORKER_ENABLED(rmlui, Initialize)
