// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CALLBACK_LEASES_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CALLBACK_LEASES_H_

#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/runtime/rmlui-callback-owners.h"
#include "native/runtime/rmlui-parent-observers.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {

// Native leases own records, never detached JS wrappers. A record supplies
// native_roots and a weak callback handle; only attached leases keep it strong.
// Destructors enqueue old slots and cannot allocate V8 objects.
template <typename Record,
          typename Value,
          v8::Global<Value> Record::*callback_member>
class CallbackLeaseOwners {
 public:
  struct Lease final : ElementOwnershipObserver {
    ~Lease() {
      UnbindElementOwnershipObserver(this);
      if (registry) {
        registry->Retire(this);
      }
    }
    void OnOwnershipChange(bool destroying) override {
      if (registry) {
        if (auto lease = registry->leases_.at(this).lock()) {
          // A detached wrapper may collect between native transfer and its
          // next V8 owner edge. Hold existing callbacks across that interval.
          if (!destroying) {
            Promote(lease->record);
          }
          registry->Queue(lease);
        }
      }
    }
    std::shared_ptr<Record> record;
    Rml::ObserverPtr<Rml::Element> element;
    CallbackRootSlot slot;
    bool native_owned{false};
    bool assigned{false};
    bool rooted{false};
    bool pending{false};
    CallbackLeaseOwners* registry{nullptr};
  };

  explicit CallbackLeaseOwners(const char* key) : roots_(key) {}

  std::shared_ptr<Lease> Add(std::shared_ptr<Record> record,
                             Rml::Element* element,
                             bool native_owned = false) {
    auto lease = std::make_shared<Lease>();
    lease->record = std::move(record);
    lease->native_owned = native_owned;
    lease->assigned = element != nullptr;
    if (element) {
      lease->element = element->GetObserverPtr();
    }
    lease->registry = this;
    leases_.emplace(lease.get(), lease);
    BindElementOwnershipObserver(element, lease.get());
    Queue(lease);
    // Bridge nested callbacks before the outer runtime boundary establishes
    // the detached owner edge or confirms an attached native root.
    Promote(lease->record);
    return lease;
  }

  void Bind(const std::shared_ptr<Lease>& lease, Rml::Element* element) {
    if (!lease->assigned || lease->element.get() != element) {
      lease->assigned = true;
      lease->element = element->GetObserverPtr();
      BindElementOwnershipObserver(element, lease.get());
      Queue(lease);
    }
  }

  void Detach(const std::shared_ptr<Lease>& lease) {
    lease->assigned = true;
    lease->native_owned = false;
    lease->element.reset();
    UnbindElementOwnershipObserver(lease.get());
    Queue(lease);
  }

  void Refresh(DiagnosticOwnership category) {
    if (State().cleaning_up) {
      return;
    }
    if (pending_.empty() && retired_.empty()) {
      return;
    }
    RecordDiagnosticOwnership(category);
    std::vector<std::shared_ptr<Lease>> changed;
    // Resolve pending weak leases before V8 allocations. New notifications
    // raised by GC during this pass remain queued for the next boundary.
    changed.reserve(pending_.size());
    for (const auto& weak : pending_) {
      if (auto lease = weak.lock()) {
        changed.push_back(std::move(lease));
      }
    }
    pending_.clear();
    auto retired = std::move(retired_);
    retired_.clear();
    std::unordered_map<Record*, std::shared_ptr<Record>> records;
    for (const auto& lease : changed) {
      lease->pending = false;
      Promote(lease->record);
      records.emplace(lease->record.get(), lease->record);
    }
    for (const auto& old : retired) {
      Promote(old.record);
      records.emplace(old.record.get(), old.record);
    }
    for (auto& old : retired) {
      roots_.Remove(&old.slot);
      if (old.rooted) {
        --old.record->native_roots;
      }
    }
    for (const auto& lease : changed) {
      RecordDiagnosticLeaseVisit(category);
      RefreshLease(lease);
    }
    // Finish all new owner edges before making a shared record weak.
    for (const auto& [pointer, record] : records) {
      auto& callback = record.get()->*callback_member;
      if (!record->native_roots && !callback.IsEmpty() && !callback.IsWeak()) {
        callback.SetWeak();
      }
    }
  }

  void Clear() {
    for (const auto& [pointer, weak] : leases_) {
      if (auto lease = weak.lock()) {
        UnbindElementOwnershipObserver(lease.get());
        lease->registry = nullptr;
        lease->slot = {};
        lease->rooted = false;
        lease->record->native_roots = 0;
      }
    }
    roots_.Clear();
    leases_.clear();
    pending_.clear();
    retired_.clear();
  }

 private:
  struct Retired {
    std::shared_ptr<Record> record;
    CallbackRootSlot slot;
    bool rooted;
  };

  static void Promote(const std::shared_ptr<Record>& record) {
    auto& callback = record.get()->*callback_member;
    if (!callback.IsEmpty() && callback.IsWeak()) {
      callback.ClearWeak();
    }
  }

  void Queue(const std::shared_ptr<Lease>& lease) {
    if (!lease->pending) {
      lease->pending = true;
      pending_.push_back(lease);
    }
  }

  void Retire(Lease* lease) {
    retired_.push_back({lease->record, std::move(lease->slot), lease->rooted});
    leases_.erase(lease);
  }

  void RefreshLease(const std::shared_ptr<Lease>& lease) {
    auto& callback = lease->record.get()->*callback_member;
    Rml::Element* owner = nullptr;
    v8::Local<v8::Object> handle;
    if (lease->element) {
      owner = DetachedOwnerOf(lease->element.get());
      if (owner && roots_.HasOwner(lease->slot, owner)) {
        return;
      }
      if (owner) {
        handle = WrapElement(owner);
      }
    }
    // The local handle keeps the owner alive while removing its old slot.
    roots_.Remove(&lease->slot);
    if (lease->rooted) {
      --lease->record->native_roots;
      lease->rooted = false;
    }
    if (callback.IsEmpty()) {
      return;
    }
    if (!handle.IsEmpty()) {
      lease->slot = roots_.Add(owner, callback.Get(v8::Isolate::GetCurrent()));
    } else if (lease->native_owned || !lease->assigned || lease->element) {
      ++lease->record->native_roots;
      lease->rooted = true;
    }
  }

  CallbackRootSlots roots_;
  std::unordered_map<Lease*, std::weak_ptr<Lease>> leases_;
  std::vector<std::weak_ptr<Lease>> pending_;
  std::vector<Retired> retired_;
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CALLBACK_LEASES_H_
