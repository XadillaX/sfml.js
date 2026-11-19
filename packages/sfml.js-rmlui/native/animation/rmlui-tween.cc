// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/animation/rmlui-tween.h"

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/runtime/rmlui-callback-leases.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

using TweenHandle = sfmljs::SharedHandle<Rml::Tween>;

struct CallbackRecord {
  ~CallbackRecord();
  v8::Global<v8::Function> function;
  uint64_t generation;
  uint32_t native_roots{0};
  int identity_hash{0};
};

class CallbackLease;

// Only the runtime owner accesses these weak registries. Neither registry
// roots JS closures. Attached native animations selectively root their
// callback.
std::vector<std::weak_ptr<CallbackRecord>>& Callbacks() {
  static std::vector<std::weak_ptr<CallbackRecord>> records;
  return records;
}

auto& CallbackIndex() {
  static std::unordered_map<int, std::vector<std::weak_ptr<CallbackRecord>>>
      records;
  return records;
}

CallbackRecord::~CallbackRecord() {
  const auto found = CallbackIndex().find(identity_hash);
  if (found != CallbackIndex().end()) {
    std::erase_if(found->second,
                  [](const auto& weak) { return weak.expired(); });
    if (found->second.empty()) {
      CallbackIndex().erase(found);
    }
  }
}

using TweenOwners = CallbackLeaseOwners<CallbackRecord,
                                        v8::Function,
                                        &CallbackRecord::function>;

TweenOwners& Owners() {
  static TweenOwners owners("rml.detached.tweens");
  return owners;
}

class ValueCallbackScope final {
 public:
  ValueCallbackScope() {
    ++State().callback_depth;
    ++State().value_callback_depth;
  }
  ~ValueCallbackScope() {
    --State().value_callback_depth;
    --State().callback_depth;
  }
};

class CallbackLease final : public Rml::Tween::OwnedCallback {
 public:
  explicit CallbackLease(std::shared_ptr<CallbackRecord> record)
      : record(std::move(record)) {}

  const void* Identity() const override { return record.get(); }

  float Evaluate(float t) const override {
    if (!CanInvokeCallback() || record->function.IsEmpty()) {
      return t;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    ValueCallbackScope callback_scope;
    v8::Local<v8::Value> argument = Nan::New(t);
    v8::Local<v8::Value> returned;
    float result = t;
    RecordDiagnosticCallback(DiagnosticCallback::kTween);
    if (record->function.Get(v8::Isolate::GetCurrent())
            ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 1, &argument)
            .ToLocal(&returned)) {
      ReadFiniteNumericFloat(returned, &result);
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
      return t;
    }
    return result;
  }

  std::shared_ptr<CallbackRecord> record;
  std::shared_ptr<TweenOwners::Lease> ownership;
};

}  // namespace

bool CheckTween(const Rml::Tween& tween) {
  const auto owner =
      std::static_pointer_cast<CallbackLease>(tween.GetCallbackOwner());
  if (owner &&
      (!RuntimeReady() || owner->record->generation != State().generation ||
       owner->record->function.IsEmpty())) {
    if (State().initialized) {
      Nan::ThrowError("Tween callback is no longer valid");
    }
    return false;
  }
  return true;
}

v8::Local<v8::Object> WrapTween(Rml::Tween value) {
  DetachTween(&value);
  auto result = TweenHandle::Create(std::make_shared<Rml::Tween>(value));
  if (auto owner =
          std::static_pointer_cast<CallbackLease>(value.GetCallbackOwner())) {
    Nan::SetPrivate(result,
                    Nan::New("rml.tween.callback").ToLocalChecked(),
                    owner->record->function.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return result;
}

void DetachTween(Rml::Tween* tween) {
  if (auto owner =
          std::static_pointer_cast<CallbackLease>(tween->GetCallbackOwner())) {
    tween->SetCallbackOwner(std::make_shared<CallbackLease>(owner->record));
  }
}

namespace {

bool ReadType(v8::Local<v8::Value> value, Rml::Tween::Type* result) {
  if (!value->IsInt32() || Nan::To<int>(value).FromJust() < 0 ||
      Nan::To<int>(value).FromJust() >= Rml::Tween::Count) {
    Nan::ThrowRangeError("Expected a TweenType below Count");
    return false;
  }
  *result = static_cast<Rml::Tween::Type>(Nan::To<int>(value).FromJust());
  return true;
}

bool ReadDirection(v8::Local<v8::Value> value, Rml::Tween::Direction* result) {
  if (!value->IsInt32() || Nan::To<int>(value).FromJust() < Rml::Tween::In ||
      Nan::To<int>(value).FromJust() > Rml::Tween::InOut) {
    Nan::ThrowRangeError("Expected a TweenDirection");
    return false;
  }
  *result = static_cast<Rml::Tween::Direction>(Nan::To<int>(value).FromJust());
  return true;
}

NAN_METHOD(CreateTween) {
  Rml::Tween::Type type = Rml::Tween::Linear;
  Rml::Tween::Direction direction =
      info[0]->IsFunction() ? Rml::Tween::In : Rml::Tween::Out;
  if (info[2]->IsTrue()) {
    Rml::Tween::Type out;
    if (ReadType(info[0], &type) && ReadType(info[1], &out)) {
      info.GetReturnValue().Set(WrapTween(Rml::Tween(type, out)));
    }
    return;
  }
  if (!info[1]->IsUndefined() && !ReadDirection(info[1], &direction)) {
    return;
  }
  if (info[0]->IsFunction()) {
    if (!RuntimeReady()) {
      return;
    }
    std::shared_ptr<CallbackRecord> record;
    const auto function = info[0].As<v8::Function>();
    const auto identity_hash = function->GetIdentityHash();
    auto& bucket = CallbackIndex()[identity_hash];
    std::erase_if(bucket, [](const auto& weak) { return weak.expired(); });
    for (const auto& weak : bucket) {
      if (auto entry = weak.lock();
          entry && !entry->function.IsEmpty() &&
          entry->function.Get(v8::Isolate::GetCurrent()) == function) {
        record = std::move(entry);
        break;
      }
    }
    if (!record) {
      record = std::make_shared<CallbackRecord>();
      record->identity_hash = identity_hash;
      record->generation = State().generation;
      record->function.Reset(v8::Isolate::GetCurrent(), function);
      record->function.SetWeak();
      bucket.push_back(record);
      static size_t sweep_threshold = 64;
      if (Callbacks().size() >= sweep_threshold) {
        std::erase_if(Callbacks(),
                      [](const auto& weak) { return weak.expired(); });
        sweep_threshold = std::max<size_t>(64, Callbacks().size() * 2);
      }
      Callbacks().push_back(record);
    }
    info.GetReturnValue().Set(WrapTween(
        Rml::Tween(std::make_shared<CallbackLease>(record), direction)));
  } else if (info[0]->IsUndefined() || ReadType(info[0], &type)) {
    info.GetReturnValue().Set(WrapTween(Rml::Tween(type, direction)));
  }
}

NAN_METHOD(CloneTween) {
  Rml::Tween value;
  if (CopyTween(info[0], &value)) {
    info.GetReturnValue().Set(WrapTween(value));
  }
}

NAN_METHOD(EvaluateTween) {
  float t;
  Rml::Tween value;
  if (!ReadFiniteNumericFloat(info[1], &t)) {
    return;
  }
  if (t < 0 || t > 1) {
    return Nan::ThrowRangeError("Tween input must be in [0, 1]");
  }
  if (CopyTween(info[0], &value)) {
    info.GetReturnValue().Set(value(t));
  }
}

NAN_METHOD(ReverseTween) {
  auto* handle = TweenHandle::From(info[0]);
  if (handle && CheckTween(*handle->owner())) {
    handle->owner()->reverse();
  }
}

NAN_METHOD(TweenToString) {
  Rml::Tween value;
  if (CopyTween(info[0], &value)) {
    info.GetReturnValue().Set(Nan::New(value.to_string()).ToLocalChecked());
  }
}

template <bool negate>
NAN_METHOD(CompareTween) {
  Rml::Tween value;
  Rml::Tween other;
  if (CopyTween(info[0], &value) && CopyTween(info[1], &other)) {
    info.GetReturnValue().Set(negate ? value != other : value == other);
  }
}

}  // namespace

bool CopyTween(v8::Local<v8::Value> handle, Rml::Tween* result) {
  auto* checked = TweenHandle::From(handle);
  if (!checked || !CheckTween(*checked->owner())) {
    return false;
  }
  *result = *checked->owner();
  return true;
}

void AttachTween(Rml::Tween* tween, Rml::Element* element) {
  if (auto owner =
          std::static_pointer_cast<CallbackLease>(tween->GetCallbackOwner())) {
    auto lease = std::make_shared<CallbackLease>(owner->record);
    lease->ownership = Owners().Add(owner->record, element);
    tween->SetCallbackOwner(std::move(lease));
  }
}

void RetainNativeTween(Rml::Tween* tween) {
  if (auto owner =
          std::static_pointer_cast<CallbackLease>(tween->GetCallbackOwner())) {
    auto lease = std::make_shared<CallbackLease>(owner->record);
    lease->ownership = Owners().Add(owner->record, nullptr, true);
    tween->SetCallbackOwner(std::move(lease));
  }
}

void RefreshTweenOwnership() {
  Owners().Refresh(DiagnosticOwnership::kTween);
}

void ReleaseTweenCallbacks() {
  Owners().Clear();
  for (const auto& weak : Callbacks()) {
    if (auto record = weak.lock()) {
      record->function.Reset();
    }
  }
  Callbacks().clear();
  CallbackIndex().clear();
}

NAN_MODULE_INIT(InitializeRmlTween) {
  SetRuntimeMethod<CreateTween, true, false>(target, "createTween");
  SetRuntimeMethod<CloneTween, true, false>(target, "cloneTween");
  SetRuntimeMethod<EvaluateTween, true, false>(target, "evaluateTween");
  SetRuntimeMethod<ReverseTween, true, false>(target, "reverseTween");
  SetRuntimeMethod<TweenToString, true, false>(target, "tweenToString");
  SetRuntimeMethod<CompareTween<false>, true, false>(target, "tweenEquals");
  SetRuntimeMethod<CompareTween<true>, true, false>(target, "tweenNotEquals");
}

}  // namespace sfmlrmlui
