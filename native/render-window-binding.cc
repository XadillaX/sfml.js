#include "render-window-state.h"
#include "exception-boundary.h"
#include "shared-handle.h"

namespace {

using Target = sfmljs::RenderWindowState;
using Handle = sfmljs::SharedHandle<Target>;

NAN_METHOD(CreateRenderWindow) {
  auto* context = sfmljs::SharedHandle<sfmljs::GraphicsContext>::From(info[0]);
  if (!context) return;
  try {
    auto target = sfmljs::MakeThreadOwned<Target>(context->owner());
    auto result = Nan::New<v8::Object>();
    Nan::Set(result, Nan::New("handle").ToLocalChecked(),
             Handle::Create(target)).FromJust();
    Nan::Set(result, Nan::New("window").ToLocalChecked(),
             sfmljs::MakeWindowHandle(target)).FromJust();
    const auto commands = target->batch.Commands();
    Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
             sfmljs::MapShared(info.GetIsolate(), target, commands.data(),
                              commands.size_bytes())).FromJust();
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(SubmitRenderWindow) {
  auto* target = Handle::From(info[0]);
  if (!target) return;
  if (!info[1]->IsUint32() ||
      Nan::To<std::uint32_t>(info[1]).FromJust() >
          target->owner()->batch.Commands().size()) {
    return Nan::ThrowRangeError("Invalid draw command count");
  }
  if (!info[2]->IsBoolean()) return Nan::ThrowTypeError("Expected display flag");
  try {
    if (!target->owner()->Submit(Nan::To<std::uint32_t>(info[1]).FromJust(),
                                 info[2]->IsTrue())) {
      Nan::ThrowTypeError("Invalid draw command or expired resource");
    }
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(AllocateRenderWindowVertices) {
  auto* target = Handle::From(info[0]);
  if (!target) return;
  if (!info[1]->IsUint32() ||
      Nan::To<std::uint32_t>(info[1]).FromJust() > sfmljs::kMaxVertices) {
    return Nan::ThrowRangeError("Vertex capacity exceeds the buffer limit");
  }
  try {
    const auto storage = target->owner()->batch.AllocateVertices(
        Nan::To<std::uint32_t>(info[1]).FromJust());
    info.GetReturnValue().Set(storage->empty()
        ? v8::ArrayBuffer::New(info.GetIsolate(), 0)
        : sfmljs::MapShared(info.GetIsolate(), storage, storage->data(),
                            storage->size() * sizeof(sf::Vertex)));
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(SetRenderWindowActive) {
  auto* target = Handle::From(info[0]);
  if (!target) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  info.GetReturnValue().Set(target->owner()->setActive(info[1]->IsTrue()));
}

NAN_METHOD(IsRenderWindowSrgb) {
  auto* target = Handle::From(info[0]);
  if (target) info.GetReturnValue().Set(
      target->owner()->isOpen() && target->owner()->isSrgb());
}

NAN_METHOD(ChangeRenderWindowGLStates) {
  auto* target = Handle::From(info[0]);
  if (!target) return;
  if (!info[1]->IsUint32() || Nan::To<std::uint32_t>(info[1]).FromJust() > 2) {
    return Nan::ThrowRangeError("Invalid OpenGL state operation");
  }
  if (!target->owner()->isOpen()) return;
  const auto operation = Nan::To<std::uint32_t>(info[1]).FromJust();
  if (operation == 0) target->owner()->pushGLStates();
  else if (operation == 1) target->owner()->popGLStates();
  else target->owner()->resetGLStates();
}

}  // namespace

NAN_MODULE_INIT(InitializeRenderWindow) {
  sfmljs::SetMethod<CreateRenderWindow>(target, "createRenderWindow");
  sfmljs::SetMethod<SubmitRenderWindow>(target, "submitRenderWindow");
  sfmljs::SetMethod<AllocateRenderWindowVertices>(target, "allocateRenderWindowVertices");
  sfmljs::SetMethod<SetRenderWindowActive>(target, "setRenderWindowActive");
  sfmljs::SetMethod<IsRenderWindowSrgb>(target, "isRenderWindowSrgb");
  sfmljs::SetMethod<ChangeRenderWindowGLStates>(target, "changeRenderWindowGLStates");
}
