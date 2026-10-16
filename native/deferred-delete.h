#pragma once

#include <nan.h>
#include <uv.h>

#include <memory>
#include <mutex>
#include <thread>
#include <unordered_map>
#include <utility>
#include <vector>

namespace sfmljs {

// A last shared_ptr may be released by V8's ArrayBuffer sweeper. Registries
// and live GL resources belong to the environment thread, not that sweeper.
class DeferredDelete {
 public:
  struct Entry {
    void* pointer;
    void (*destroy)(void*);
  };

  static std::shared_ptr<DeferredDelete> Current();
  static void Initialize(v8::Isolate* isolate);

  void Dispose(Entry entry) {
    std::lock_guard lock(mutex_);
    if (!closed_ && std::this_thread::get_id() != thread_) {
      pending_.push_back(entry);
      uv_async_send(&async_);
      return;
    }
    beforeExit_.erase(entry.pointer);
    entry.destroy(entry.pointer);
  }

  void BeforeExit(void* pointer, void (*close)(void*)) {
    std::lock_guard lock(mutex_);
    beforeExit_.emplace(pointer, close);
  }

 private:
  void Drain() {
    std::lock_guard lock(mutex_);
    auto pending = std::move(pending_);
    pending_.clear();
    for (const auto entry : pending) {
      beforeExit_.erase(entry.pointer);
      entry.destroy(entry.pointer);
    }
  }

  static void Cleanup(void* data);

  // Nested resource destruction can release dependencies on this same queue.
  // After environment shutdown, surviving backing stores no longer have a
  // JS loop; serialize their final destruction with all other resource drops.
  std::recursive_mutex mutex_;
  std::vector<Entry> pending_;
  std::unordered_map<void*, void (*)(void*)> beforeExit_;
  const std::thread::id thread_ = std::this_thread::get_id();
  bool closed_{};
  uv_async_t async_{};
};

template <typename T, typename... Args>
std::shared_ptr<T> MakeThreadOwned(Args&&... args) {
  auto queue = DeferredDelete::Current();
  auto object = std::shared_ptr<T>(new T(std::forward<Args>(args)...),
      [queue](T* value) {
        queue->Dispose({value, [](void* pointer) {
          delete static_cast<T*>(pointer);
        }});
      });
  if constexpr (requires(T& value) { value.CloseBeforeThreadExit(); }) {
    queue->BeforeExit(object.get(), [](void* pointer) {
      static_cast<T*>(pointer)->CloseBeforeThreadExit();
    });
  }
  return object;
}

}  // namespace sfmljs
