#include "../../native/deferred-delete.h"
#include "../../native/shared-handle.h"

#include <atomic>
#include <thread>

namespace {
struct Observation {
  std::atomic<unsigned> destroyed{};
  std::atomic<unsigned> wrongThread{};
};
using ObservationHandle = sfmljs::SharedHandle<Observation>;

struct Resource {
  explicit Resource(std::shared_ptr<Observation> observation)
      : observation(std::move(observation)) {}
  ~Resource() {
    if (std::this_thread::get_id() != thread) ++observation->wrongThread;
    ++observation->destroyed;
  }
  std::shared_ptr<Observation> observation;
  std::thread::id thread = std::this_thread::get_id();
  std::uint32_t value{42};
};

NAN_METHOD(CreateDeletionProbe) {
  auto observation = std::make_shared<Observation>();
  auto owner = sfmljs::MakeThreadOwned<Resource>(observation);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("observation").ToLocalChecked(),
           ObservationHandle::Create(observation)).FromJust();
  Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
           sfmljs::MapShared(info.GetIsolate(), owner, &owner->value,
                            sizeof(owner->value))).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ReleaseBackingOffThread) {
  if (!info[0]->IsArrayBuffer()) return Nan::ThrowTypeError("Expected buffer");
  auto buffer = info[0].As<v8::ArrayBuffer>();
  auto backing = buffer->GetBackingStore();
  buffer->Detach();
  std::thread([backing = std::move(backing)]() mutable {
    backing.reset();
  }).join();
}

NAN_METHOD(ReadDeletionProbe) {
  auto* observation = ObservationHandle::From(info[0]);
  if (!observation) return;
  auto result = Nan::New<v8::Array>(2);
  Nan::Set(result, 0, Nan::New(observation->owner()->destroyed.load())).FromJust();
  Nan::Set(result, 1, Nan::New(observation->owner()->wrongThread.load())).FromJust();
  info.GetReturnValue().Set(result);
}
}  // namespace

NAN_MODULE_INIT(InitializeDeletionProbes) {
  Nan::SetMethod(target, "createDeletionProbe", CreateDeletionProbe);
  Nan::SetMethod(target, "releaseBackingOffThread", ReleaseBackingOffThread);
  Nan::SetMethod(target, "readDeletionProbe", ReadDeletionProbe);
}
