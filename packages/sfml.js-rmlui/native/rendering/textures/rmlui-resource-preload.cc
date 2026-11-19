// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/textures/rmlui-resource-preload.h"

#include <RmlUi/Core/Core.h>
#include <nan.h>

#include <atomic>
#include <cstdio>
#include <exception>
#include <memory>
#include <mutex>  // NOLINT(build/c++11)
#include <string>
#include <thread>  // NOLINT(build/c++11)
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/io/rmlui-file-interface.h"
#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/textures/rmlui-resources.h"
#include "native/runtime/rmlui-state.h"
#include <SFML/Graphics/Image.hpp>

namespace sfmlrmlui {
namespace {

struct PreparedResource {
  std::mutex mutex;
  std::string source;
  std::string family;
  int style{0};
  int weight{0};
  int face_index{0};
  bool fallback{false};
  bool font{false};
  bool prepared{false};
  bool committed{false};
  bool diagnostics_reported{false};
  bool image_decoded{false};
  // Owner-thread custom provider snapshot; workers only consume these bytes.
  bool provider_snapshot{false};
  std::thread::id preparation_thread;
  std::string error;
  std::vector<Rml::byte> bytes;
  std::unique_ptr<sf::Image> image;
  // Owner-only. Execute never reads or dereferences this pointer.
  RenderInterfaceSFML* renderer{nullptr};
};

struct PreloadRequest {
  uint32_t id{0};
  std::atomic<bool> cancelled{false};
  Nan::Persistent<v8::Promise::Resolver> resolver;
  std::vector<std::shared_ptr<PreparedResource>> resources;
};

uint32_t next_request_id = 0;

// No JS callbacks are invoked by settling. Promise handlers run after the
// current native boundary has returned and released its runtime lock.
void Settle(const std::shared_ptr<PreloadRequest>& request,
            const char* error = nullptr,
            bool abort = false) {
  if (request->resolver.IsEmpty()) {
    return;
  }
  if (!State().cleaning_up) {
    const auto context = Nan::GetCurrentContext();
    const auto resolver = Nan::New(request->resolver);
    if (error) {
      auto value = Nan::Error(error).As<v8::Object>();
      if (abort) {
        Nan::Set(value,
                 Nan::New("name").ToLocalChecked(),
                 Nan::New("AbortError").ToLocalChecked())
            .FromJust();
      }
      resolver->Reject(context, value).FromMaybe(false);
    } else {
      resolver->Resolve(context, Nan::Undefined()).FromMaybe(false);
    }
  }
  request->resolver.Reset();
}

bool ReadString(v8::Local<v8::Value> value, std::string* result) {
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a resource source or font family string");
    return false;
  }
  Nan::Utf8String text(value);
  result->assign(*text, text.length());
  if (result->empty() || result->find('\0') != std::string::npos) {
    Nan::ThrowTypeError("Resource strings must be nonempty without NUL");
    return false;
  }
  return true;
}

// Length-prefix variable strings so path/family separators cannot collide.
std::string ResourceKey(const PreparedResource& resource) {
  const auto prefix = resource.font ? "f" : "t";
  return std::string(prefix) + std::to_string(resource.source.size()) + ":" +
         resource.source + std::to_string(resource.family.size()) + ":" +
         resource.family + ":" + std::to_string(resource.style) + ":" +
         std::to_string(resource.weight) + ":" +
         std::to_string(resource.face_index) + ":" +
         std::to_string(resource.fallback) + ":" +
         std::to_string(reinterpret_cast<uintptr_t>(resource.renderer));
}

void Prepare(PreparedResource* resource,
             const std::string& root,
             bool use_root) {
  std::lock_guard lock(resource->mutex);
  if (resource->prepared) {
    return;
  }
  resource->preparation_thread = std::this_thread::get_id();
  // This is the root shell's exact root-first then original-path policy.
  if (!resource->provider_snapshot) {
    const auto first = resource->source.find_first_not_of("/\\");
    const auto relative =
        first == std::string::npos ? "" : resource->source.substr(first);
    std::string rooted = root;
    if (!rooted.empty() && rooted.back() != '/' && rooted.back() != '\\') {
      rooted += '/';
    }
    using File = std::unique_ptr<FILE, decltype(&std::fclose)>;
    const auto first_path = use_root ? rooted + relative : resource->source;
    File file(std::fopen(first_path.c_str(), "rb"), &std::fclose);
    if (!file) {
      file.reset(std::fopen(resource->source.c_str(), "rb"));
    }
    if (!file || std::fseek(file.get(), 0, SEEK_END) != 0) {
      resource->error = "Cannot read resource: " + resource->source;
    } else {
      const auto length = std::ftell(file.get());
      if (length <= 0 || std::fseek(file.get(), 0, SEEK_SET) != 0) {
        resource->error = "Empty or unreadable resource: " + resource->source;
      } else {
        resource->bytes.resize(static_cast<size_t>(length));
        if (std::fread(resource->bytes.data(),
                       1,
                       resource->bytes.size(),
                       file.get()) != resource->bytes.size()) {
          resource->error = "Incomplete resource read: " + resource->source;
        }
      }
    }
  }
  if (resource->error.empty() && !resource->font) {
    resource->image_decoded = true;
    resource->image = std::make_unique<sf::Image>();
    if (!resource->image->loadFromMemory(resource->bytes.data(),
                                         resource->bytes.size())) {
      resource->error = "Cannot decode texture: " + resource->source;
    } else {
      const auto size = resource->image->getSize();
      for (unsigned int y = 0; y < size.y; ++y) {
        for (unsigned int x = 0; x < size.x; ++x) {
          auto color = resource->image->getPixel({x, y});
          color.r = static_cast<uint8_t>(color.r * color.a / 255);
          color.g = static_cast<uint8_t>(color.g * color.a / 255);
          color.b = static_cast<uint8_t>(color.b * color.a / 255);
          resource->image->setPixel({x, y}, color);
        }
      }
    }
    std::vector<Rml::byte>().swap(resource->bytes);
  }
  resource->prepared = true;
}

}  // namespace

struct ResourcePreloadState {
  std::unordered_map<std::string, std::shared_ptr<PreparedResource>> resources;
  std::unordered_map<uint32_t, std::shared_ptr<PreloadRequest>> requests;
};

namespace {

class PreloadWorker final : public Nan::AsyncWorker {
 public:
  PreloadWorker(std::shared_ptr<ResourcePreloadState> manager,
                std::shared_ptr<PreloadRequest> request,
                std::string root,
                bool use_root)
      : Nan::AsyncWorker(nullptr, "sfml.js-rmlui:preload"),
        manager_(std::move(manager)),
        request_(std::move(request)),
        root_(std::move(root)),
        use_root_(use_root) {}

  void Execute() override {
    try {
      for (const auto& resource : request_->resources) {
        if (request_->cancelled.load()) {
          break;
        }
        Prepare(resource.get(), root_, use_root_);
      }
    } catch (const std::exception& error) {
      SetErrorMessage(error.what());
    } catch (...) {
      SetErrorMessage("Native resource preparation failed");
    }
  }

  void HandleOKCallback() override { Complete(nullptr); }
  void HandleErrorCallback() override { Complete(ErrorMessage()); }

 private:
  void Complete(const char* worker_error) {
    // Shutdown/cancel settles and resets the resolver on the owner thread.
    // An old completion must not even enter a newly claimed runtime.
    if (request_->resolver.IsEmpty()) {
      return;
    }
    RuntimeScope scope;
    if (!scope) {
      return;
    }
    std::string failure = worker_error ? worker_error : "";
    try {
      for (const auto& resource : request_->resources) {
        if (!failure.empty()) {
          break;
        }
        std::lock_guard lock(resource->mutex);
        if (!resource->diagnostics_reported && resource->prepared) {
          auto& counts = State().data_diagnostics;
          counts.Record(&DataDiagnostics::preload_file_reads,
                        resource->provider_snapshot ? 0 : 1);
          counts.Record(&DataDiagnostics::preload_image_decodes,
                        resource->image_decoded ? 1 : 0);
          counts.Record(
              &DataDiagnostics::preload_main_thread_preparations,
              resource->preparation_thread == State().owner_thread ? 1 : 0);
          resource->diagnostics_reported = true;
        }
        failure = resource->error;
        if (!failure.empty() || resource->committed) {
          continue;
        }
        bool committed;
        if (resource->font) {
          State().data_diagnostics.Record(
              &DataDiagnostics::preload_font_commits);
          // Font engines borrow bytes even after a partially failed load.
          auto& bytes = State().font_data.emplace_back();
          bytes.swap(resource->bytes);
          committed = Rml::LoadFontFace(
              {bytes.data(), bytes.size()},
              resource->family,
              static_cast<Rml::Style::FontStyle>(resource->style),
              static_cast<Rml::Style::FontWeight>(resource->weight),
              resource->fallback,
              resource->face_index);
        } else {
          committed = resource->renderer->PreloadTexture(resource->source,
                                                         *resource->image);
          resource->image.reset();
        }
        if (!committed) {
          failure = "Cannot commit " +
                    std::string(resource->font ? "font: " : "texture: ") +
                    resource->source;
          resource->error = failure;
        } else {
          resource->committed = true;
        }
      }
    } catch (const std::exception& error) {
      failure = error.what();
    } catch (...) {
      failure = "Native resource commit failed";
    }
    // Failed/aborted preparations do not poison subsequent retries.
    for (const auto& resource : request_->resources) {
      if (!resource->committed) {
        const auto key = ResourceKey(*resource);
        const auto found = manager_->resources.find(key);
        if (found != manager_->resources.end() && found->second == resource) {
          manager_->resources.erase(found);
        }
      }
    }
    Settle(request_, failure.empty() ? nullptr : failure.c_str());
    manager_->requests.erase(request_->id);
  }

  std::shared_ptr<ResourcePreloadState> manager_;
  std::shared_ptr<PreloadRequest> request_;
  std::string root_;
  bool use_root_;
};

bool ReadResources(v8::Local<v8::Value> textures,
                   v8::Local<v8::Value> fonts,
                   RenderInterfaceSFML* renderer,
                   PreloadRequest* request) {
  if (!textures->IsArray() || !fonts->IsArray()) {
    Nan::ThrowTypeError("Expected texture and font arrays");
    return false;
  }
  const auto texture_array = textures.As<v8::Array>();
  for (uint32_t i = 0; i < texture_array->Length(); ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(texture_array, i).ToLocal(&value)) {
      return false;
    }
    auto resource = std::make_shared<PreparedResource>();
    if (!ReadString(value, &resource->source)) {
      return false;
    }
    resource->renderer = renderer;
    request->resources.push_back(std::move(resource));
  }
  const auto font_array = fonts.As<v8::Array>();
  for (uint32_t i = 0; i < font_array->Length(); ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(font_array, i).ToLocal(&value)) {
      return false;
    }
    if (!value->IsArray() || value.As<v8::Array>()->Length() != 6) {
      Nan::ThrowTypeError("Expected a normalized font descriptor");
      return false;
    }
    const auto array = value.As<v8::Array>();
    v8::Local<v8::Value> fields[6];
    for (uint32_t field = 0; field < 6; ++field) {
      if (!Nan::Get(array, field).ToLocal(&fields[field])) {
        return false;
      }
    }
    auto resource = std::make_shared<PreparedResource>();
    resource->font = true;
    if (!ReadString(fields[0], &resource->source) ||
        !ReadString(fields[1], &resource->family)) {
      return false;
    }
    if (!fields[2]->IsInt32() || !fields[3]->IsInt32() ||
        !fields[4]->IsBoolean() || !fields[5]->IsInt32()) {
      Nan::ThrowTypeError("Expected font style, weight, fallback and index");
      return false;
    }
    resource->style = Nan::To<int>(fields[2]).FromJust();
    resource->weight = Nan::To<int>(fields[3]).FromJust();
    resource->fallback = fields[4]->IsTrue();
    resource->face_index = Nan::To<int>(fields[5]).FromJust();
    if (resource->style < 0 || resource->style > 1 || resource->weight < 0 ||
        resource->weight > 1000 || resource->face_index < 0) {
      Nan::ThrowRangeError("Invalid font style, weight or face index");
      return false;
    }
    request->resources.push_back(std::move(resource));
  }
  return true;
}

NAN_METHOD(PreloadResources) {
  auto* renderer = State().render_interface.get();
  if (!info[2]->IsUndefined()) {
    auto* selected = RenderInterfaceOf(info[2]);
    if (!selected) {
      return;
    }
    renderer = static_cast<RenderInterfaceSFML*>(selected);
  }
  auto request = std::make_shared<PreloadRequest>();
  if (!ReadResources(info[0], info[1], renderer, request.get())) {
    return;
  }
  if (!RetainRenderInterface(renderer)) {
    return;
  }
  if (next_request_id == UINT32_MAX) {
    return Nan::ThrowRangeError("Preload request identity space exhausted");
  }
  request->id = ++next_request_id;
  auto& manager = State().resource_preloads;
  if (!manager) {
    manager = std::make_shared<ResourcePreloadState>();
  }
  std::vector<std::string> inserted_keys;
  for (auto& resource : request->resources) {
    const auto key = ResourceKey(*resource);
    const auto [found, inserted] = manager->resources.emplace(key, resource);
    if (inserted) {
      inserted_keys.push_back(key);
    }
    if (!inserted) {
      resource = found->second;
    } else if (HasCustomFileInterface()) {
      // JS providers are bound to their Node environment. Obtain their
      // immutable snapshot here; never replace them with worker filesystem I/O.
      // This runs once per deduplicated source, before any worker sees it.
      Rml::String bytes;
      resource->provider_snapshot = true;
      State().data_diagnostics.Record(
          &DataDiagnostics::preload_provider_snapshots);
      if (!Rml::GetFileInterface()->LoadFile(resource->source, bytes)) {
        resource->error = "Cannot read custom resource: " + resource->source;
      } else if (bytes.empty()) {
        resource->error = "Empty custom resource: " + resource->source;
      } else {
        resource->bytes.assign(bytes.begin(), bytes.end());
      }
      if (!State().callback_exception.IsEmpty()) {
        // Failed callbacks must not leave a reusable poisoned cache entry.
        for (const auto& inserted_key : inserted_keys) {
          manager->resources.erase(inserted_key);
        }
        return;
      }
    }
  }
  const auto resolver =
      v8::Promise::Resolver::New(Nan::GetCurrentContext()).ToLocalChecked();
  request->resolver.Reset(resolver);
  manager->requests.emplace(request->id, request);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("id").ToLocalChecked(), Nan::New(request->id))
      .FromJust();
  Nan::Set(result, Nan::New("promise").ToLocalChecked(), resolver->GetPromise())
      .FromJust();
  Nan::AsyncQueueWorker(new PreloadWorker(
      manager, request, State().file_root, HasRootFileInterface()));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(CancelResourcePreload) {
  if (!info[0]->IsUint32()) {
    return Nan::ThrowTypeError("Expected a preload request identity");
  }
  const auto& manager = State().resource_preloads;
  if (!manager) {
    return;
  }
  const auto found =
      manager->requests.find(Nan::To<uint32_t>(info[0]).FromJust());
  if (found == manager->requests.end()) {
    return;
  }
  const auto request = found->second;
  request->cancelled.store(true);
  Settle(request, "Resource preload aborted", true);
  manager->requests.erase(found);
  // Keep only entries referenced by another live request or committed cache.
  for (const auto& resource : request->resources) {
    bool shared = false;
    for (const auto& [id, other] : manager->requests) {
      for (const auto& item : other->resources) {
        shared = shared || item == resource;
      }
    }
    if (!shared && !resource->committed) {
      manager->resources.erase(ResourceKey(*resource));
    }
  }
}

}  // namespace

void InvalidateResourcePreloads(RenderInterfaceSFML* renderer,
                                const std::string* source,
                                bool fonts) {
  const auto matches = [&](const PreparedResource& resource) {
    return fonts ? resource.font
                 : !resource.font &&
                       (!renderer || resource.renderer == renderer) &&
                       (!source || resource.source == *source);
  };
  const auto& manager = State().resource_preloads;
  if (manager) {
    std::erase_if(manager->requests, [&](const auto& item) {
      for (const auto& resource : item.second->resources) {
        if (matches(*resource)) {
          item.second->cancelled.store(true);
          Settle(item.second, "Resource preload invalidated");
          return true;
        }
      }
      return false;
    });
    std::erase_if(manager->resources,
                  [&](const auto& item) { return matches(*item.second); });
  }
  if (!fonts) {
    for (const auto& [pointer, state] : State().render_interfaces) {
      if (!renderer || pointer == renderer) {
        static_cast<RenderInterfaceSFML*>(pointer)->ClearPreloadedTextures(
            source);
      }
    }
  }
}

void ShutdownResourcePreloads() {
  const auto& manager = State().resource_preloads;
  if (manager) {
    for (const auto& [id, request] : manager->requests) {
      request->cancelled.store(true);
      Settle(request, "Resource preload invalidated by runtime shutdown");
    }
    manager->requests.clear();
    manager->resources.clear();
    State().resource_preloads.reset();
  }
}

NAN_MODULE_INIT(InitializeRmlResourcePreload) {
  SetRuntimeMethod<PreloadResources>(target, "preloadResources");
  SetRuntimeMethod<CancelResourcePreload, false, false>(
      target, "cancelResourcePreload");
}

}  // namespace sfmlrmlui
