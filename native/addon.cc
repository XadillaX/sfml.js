#include <nan.h>
#include "deferred-delete.h"
#include "exception-boundary.h"
#include <SFML/Config.hpp>
#include <SFML/System/Clock.hpp>
#include <SFML/System/Time.hpp>

#include <string>

NAN_MODULE_INIT(InitializeSystem);
NAN_MODULE_INIT(InitializeAudio);
NAN_MODULE_INIT(InitializeAudioFiles);
NAN_MODULE_INIT(InitializeAudioDevices);
NAN_MODULE_INIT(InitializeAudioWorkers);
NAN_MODULE_INIT(InitializeAudioRecorders);
NAN_MODULE_INIT(InitializeAudioProbes);
NAN_MODULE_INIT(InitializeAudioStreams);
NAN_MODULE_INIT(InitializeAudioCodecs);
NAN_MODULE_INIT(InitializeErrorStream);
NAN_MODULE_INIT(InitializeSystemProbes);
NAN_MODULE_INIT(InitializeContext);
NAN_MODULE_INIT(InitializeGraphics);
NAN_MODULE_INIT(InitializeTexture);
NAN_MODULE_INIT(InitializeTextureProbes);
NAN_MODULE_INIT(InitializeRenderTextureProbes);
NAN_MODULE_INIT(InitializeVertexStorage);
NAN_MODULE_INIT(InitializeVertexBuffer);
NAN_MODULE_INIT(InitializeShader);
NAN_MODULE_INIT(InitializeShaderProbes);
NAN_MODULE_INIT(InitializeVertexBufferProbes);
NAN_MODULE_INIT(InitializeVertexArrayProbes);
NAN_MODULE_INIT(InitializeImage);
NAN_MODULE_INIT(InitializeStream);
NAN_MODULE_INIT(InitializeWindow);
NAN_MODULE_INIT(InitializeRenderWindow);
NAN_MODULE_INIT(InitializeInput);
NAN_MODULE_INIT(InitializeWindowProbes);
NAN_MODULE_INIT(InitializeDeletionProbes);
NAN_MODULE_INIT(InitializeImageProbes);
NAN_MODULE_INIT(InitializeValues);
NAN_MODULE_INIT(InitializeValueProbes);
NAN_MODULE_INIT(InitializeTimeProbes);
NAN_MODULE_INIT(InitializeTransformProbes);
NAN_MODULE_INIT(InitializeMatrixProbes);
NAN_MODULE_INIT(InitializeTransformable);
NAN_MODULE_INIT(InitializeTransformableProbes);
NAN_MODULE_INIT(InitializeSpriteProbes);
NAN_MODULE_INIT(InitializeShape);
NAN_MODULE_INIT(InitializeFont);
NAN_MODULE_INIT(InitializeText);
NAN_MODULE_INIT(InitializeTextProbes);
NAN_MODULE_INIT(InitializeShapeProbes);
NAN_MODULE_INIT(InitializeDrawableProbes);
NAN_MODULE_INIT(InitializeViewProbes);
NAN_MODULE_INIT(InitializeExceptionProbes);

namespace {

NAN_METHOD(SystemElapsedMicroseconds) {
  // Calling a non-inline SFML method verifies the downloaded dynamic library.
  sf::Clock clock;
  info.GetReturnValue().Set(
      Nan::New(static_cast<double>(clock.getElapsedTime().asMicroseconds())));
}

NAN_MODULE_INIT(InitializeModule) {
  sfmljs::DeferredDelete::Initialize(v8::Isolate::GetCurrent());
  sfmljs::InitializeErrors(target);
  InitializeErrorStream(target);
  InitializeSystem(target);
  InitializeAudio(target);
  InitializeAudioFiles(target);
  InitializeAudioDevices(target);
  InitializeAudioWorkers(target);
  InitializeAudioRecorders(target);
  InitializeAudioProbes(target);
  InitializeAudioStreams(target);
  InitializeAudioCodecs(target);
  InitializeSystemProbes(target);
  InitializeContext(target);
  InitializeDeletionProbes(target);
  InitializeValues(target);
  InitializeValueProbes(target);
  InitializeTimeProbes(target);
  InitializeTransformProbes(target);
  InitializeMatrixProbes(target);
  InitializeTransformable(target);
  InitializeTransformableProbes(target);
  InitializeSpriteProbes(target);
  InitializeShape(target);
  InitializeFont(target);
  InitializeText(target);
  InitializeTextProbes(target);
  InitializeShapeProbes(target);
  InitializeDrawableProbes(target);
  InitializeViewProbes(target);
  InitializeGraphics(target);
  InitializeTexture(target);
  InitializeTextureProbes(target);
  InitializeRenderTextureProbes(target);
  InitializeVertexStorage(target);
  InitializeVertexBuffer(target);
  InitializeShader(target);
  InitializeShaderProbes(target);
  InitializeVertexBufferProbes(target);
  InitializeVertexArrayProbes(target);
  InitializeImage(target);
  InitializeStream(target);
  InitializeWindow(target);
  InitializeRenderWindow(target);
  InitializeInput(target);
  InitializeWindowProbes(target);
  InitializeImageProbes(target);
  InitializeExceptionProbes(target);
  sfmljs::SetMethod<SystemElapsedMicroseconds>(target, "systemElapsedMicroseconds");
  Nan::Set(target, Nan::New("sfmlVersion").ToLocalChecked(),
           Nan::New(std::to_string(SFML_VERSION_MAJOR) + "." +
                    std::to_string(SFML_VERSION_MINOR) + "." +
                    std::to_string(SFML_VERSION_PATCH)).ToLocalChecked()).FromJust();
}

NAN_MODULE_INIT(Initialize) {
  sfmljs::GuardExceptions([&] { InitializeModule(target); },
                          [](const char* message) { sfmljs::ThrowError(message); });
}

}  // namespace

NAN_MODULE_WORKER_ENABLED(sfml, Initialize)
