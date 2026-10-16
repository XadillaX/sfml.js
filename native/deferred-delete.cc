#include "deferred-delete.h"

#include <stdexcept>

namespace sfmljs {
namespace {
thread_local std::weak_ptr<DeferredDelete> current;
}

std::shared_ptr<DeferredDelete> DeferredDelete::Current() {
  auto queue = current.lock();
  if (!queue) throw std::logic_error("Missing environment deletion queue");
  return queue;
}

void DeferredDelete::Initialize(v8::Isolate* isolate) {
  auto queue = std::make_shared<DeferredDelete>();
  const int status = uv_async_init(node::GetCurrentEventLoop(isolate),
      &queue->async_, [](uv_async_t* handle) {
        auto& owner = *static_cast<std::shared_ptr<DeferredDelete>*>(handle->data);
        owner->Drain();
      });
  if (status != 0) throw std::runtime_error(uv_strerror(status));
  auto* retained = new std::shared_ptr<DeferredDelete>(queue);
  queue->async_.data = retained;
  // Resource cleanup must not keep Node running after application work ends.
  uv_unref(reinterpret_cast<uv_handle_t*>(&queue->async_));
  current = queue;
  node::AddEnvironmentCleanupHook(isolate, Cleanup, retained);
}

void DeferredDelete::Cleanup(void* data) {
  const auto queue = *static_cast<std::shared_ptr<DeferredDelete>*>(data);
  {
    std::lock_guard lock(queue->mutex_);
    // Pending releases and native windows finish before this thread exits.
    queue->closed_ = true;
    queue->Drain();
    for (const auto& [pointer, close] : queue->beforeExit_) close(pointer);
    queue->beforeExit_.clear();
  }
  current.reset();
  uv_close(reinterpret_cast<uv_handle_t*>(&queue->async_),
      [](uv_handle_t* handle) {
        delete static_cast<std::shared_ptr<DeferredDelete>*>(handle->data);
      });
}

}  // namespace sfmljs
