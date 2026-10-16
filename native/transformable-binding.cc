#include "transformable-state.h"
#include "exception-boundary.h"

namespace {

NAN_METHOD(CreateTransformable) {
  const auto object = std::make_shared<sfmljs::TransformableObject>();
  const auto state = std::shared_ptr<sfmljs::TransformableState>(
      object, static_cast<sfmljs::TransformableState*>(object.get()));
  const auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("handle").ToLocalChecked(),
           sfmljs::TransformableHandle(state)).FromJust();
  Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
           sfmljs::MapShared(info.GetIsolate(), state, state->values.data(),
                            sizeof(state->values))).FromJust();
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeTransformable) {
  sfmljs::SetMethod<CreateTransformable>(target, "createTransformable");
}
