// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-draw-callbacks.h"

#include <imgui_internal.h>

#include <cstdint>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/imgui-args.h"

namespace sfmlimgui {
namespace {

struct DrawCallbackEntry : std::enable_shared_from_this<DrawCallbackEntry> {
  ~DrawCallbackEntry() { callback.Reset(); }

  Nan::Persistent<v8::Function> callback;
  void* userData = nullptr;
};

struct DrawListClone {
  ~DrawListClone();

  cimgui::ImDrawList* list = nullptr;
  std::vector<std::shared_ptr<DrawCallbackEntry>> callbacks;
};

std::unordered_map<const cimgui::ImDrawList*, std::weak_ptr<DrawListClone>>
    clones;

DrawListClone::~DrawListClone() {
  clones.erase(list);
  IM_DELETE(reinterpret_cast<::ImDrawList*>(list));
}

struct DrawContext {
  ImGuiID newFrameHook = 0;
  ImGuiID shutdownHook = 0;
  std::vector<std::shared_ptr<DrawCallbackEntry>> callbacks;
  std::unordered_map<cimgui::ImDrawData*,
                     std::vector<std::shared_ptr<cimgui::ImDrawList>>>
      drawData;
};

std::unordered_map<ImGuiContext*, DrawContext> contexts;
Nan::Persistent<v8::Value> pendingException;

std::shared_ptr<DrawListClone> FindClone(const cimgui::ImDrawList* list) {
  const auto found = clones.find(list);
  return found == clones.end() ? nullptr : found->second.lock();
}

void OnDrawContextReset(ImGuiContext* context, ImGuiContextHook* hook) {
  const auto found = contexts.find(context);
  if (found == contexts.end()) return;
  if (hook->Type == ImGuiContextHookType_Shutdown) {
    contexts.erase(found);
    return;
  }
  // NewFrame has invalidated the previous draw data. Other contexts are live.
  found->second.callbacks.clear();
  for (auto& entry : found->second.drawData) entry.second.clear();
}

DrawContext& CurrentDrawContext() {
  auto* context = ImGui::GetCurrentContext();
  auto [found, inserted] = contexts.try_emplace(context);
  if (inserted) {
    ImGuiContextHook hook;
    hook.Callback = OnDrawContextReset;
    hook.Type = ImGuiContextHookType_NewFramePost;
    found->second.newFrameHook = ImGui::AddContextHook(context, &hook);
    hook.Type = ImGuiContextHookType_Shutdown;
    found->second.shutdownHook = ImGui::AddContextHook(context, &hook);
  }
  return found->second;
}

void CleanupDrawLifetimes(void*) {
  for (auto& entry : contexts) {
    ImGui::RemoveContextHook(entry.first, entry.second.newFrameHook);
    ImGui::RemoveContextHook(entry.first, entry.second.shutdownHook);
  }
  // Release V8 persistents before the environment is torn down.
  for (auto& entry : clones) {
    if (auto clone = entry.second.lock()) clone->callbacks.clear();
  }
  contexts.clear();
  pendingException.Reset();
}

v8::Local<v8::Value> UserDataValue(void* data) {
  if (!data) return Nan::Null();
  return v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(),
                                     reinterpret_cast<std::uintptr_t>(data));
}

void DrawCallback(const cimgui::ImDrawList* list,
                  const cimgui::ImDrawCmd* cmd) {
  if (!pendingException.IsEmpty()) return;
  auto* entry = static_cast<DrawCallbackEntry*>(cmd->UserCallbackData);
  if (!entry) return;

  Nan::HandleScope scope;
  auto clone = FindClone(list);
  auto listOwner = clone
                       ? std::shared_ptr<cimgui::ImDrawList>(clone, clone->list)
                       : std::shared_ptr<cimgui::ImDrawList>(
                             const_cast<cimgui::ImDrawList*>(list),
                             [](cimgui::ImDrawList*) {});
  auto commandOwner = std::shared_ptr<cimgui::ImDrawCmd>(
      listOwner, const_cast<cimgui::ImDrawCmd*>(cmd));
  auto callback = Nan::New(entry->callback);
  v8::Local<v8::Value> argv[] = {
      sfmljs::SharedHandle<cimgui::ImDrawList>::Create(listOwner),
      sfmljs::SharedHandle<cimgui::ImDrawCmd>::Create(commandOwner),
      UserDataValue(entry->userData),
  };
  Nan::TryCatch tryCatch;
  Nan::Call(callback, Nan::GetCurrentContext()->Global(), 3, argv);
  if (tryCatch.HasCaught()) {
    pendingException.Reset(tryCatch.Exception());
  }
}

NAN_METHOD(AddCallbackEx) {
  auto* list = ReadStruct<cimgui::ImDrawList>(info, 0);
  if (!list) return;
  if (!info[1]->IsFunction()) {
    Nan::ThrowTypeError("Expected a draw callback");
    return;
  }
  void* userData = nullptr;
  if (!ReadPointer(info, 2, &userData)) return;

  auto entry = std::make_shared<DrawCallbackEntry>();
  entry->callback.Reset(info[1].As<v8::Function>());
  entry->userData = userData;

  DrawCallbackEntry* raw = entry.get();
  if (auto clone = FindClone(list)) {
    clone->callbacks.push_back(std::move(entry));
  } else {
    CurrentDrawContext().callbacks.push_back(std::move(entry));
  }
  ::cimgui::ImDrawList_AddCallbackEx(list, DrawCallback, raw, 0);
}

}  // namespace

std::shared_ptr<cimgui::ImDrawList> OwnImGuiDrawListClone(
    cimgui::ImDrawList* list) {
  auto clone = std::make_shared<DrawListClone>();
  clone->list = list;
  for (int i = 0; i < list->CmdBuffer.Size; ++i) {
    const auto& command = list->CmdBuffer.Data[i];
    if (command.UserCallback != DrawCallback || !command.UserCallbackData) {
      continue;
    }
    auto* entry = static_cast<DrawCallbackEntry*>(command.UserCallbackData);
    clone->callbacks.push_back(entry->shared_from_this());
  }
  clones.emplace(list, clone);
  return std::shared_ptr<cimgui::ImDrawList>(clone, list);
}

void ClearImGuiDrawListCallbacks(cimgui::ImDrawList* list) {
  if (auto clone = FindClone(list)) clone->callbacks.clear();
}

void TrackImGuiDrawData(cimgui::ImDrawData* data) {
  if (data) CurrentDrawContext().drawData.try_emplace(data);
}

void RetainImGuiDrawList(cimgui::ImDrawData* data,
                         const std::shared_ptr<cimgui::ImDrawList>& list) {
  // GetDrawData recorded the owner; the current context may have since changed.
  for (auto& entry : contexts) {
    const auto found = entry.second.drawData.find(data);
    if (found == entry.second.drawData.end()) continue;
    found->second.push_back(list);
    return;
  }
}

void ClearImGuiDrawDataOwners(cimgui::ImDrawData* data) {
  for (auto& entry : contexts) {
    const auto found = entry.second.drawData.find(data);
    if (found != entry.second.drawData.end()) found->second.clear();
  }
}

void ThrowPendingImGuiDrawCallbackException(
    const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (pendingException.IsEmpty()) return;
  info.GetIsolate()->ThrowException(Nan::New(pendingException));
  pendingException.Reset();
}

NAN_MODULE_INIT(InitializeImGuiDrawCallbacks) {
  node::AddEnvironmentCleanupHook(
      v8::Isolate::GetCurrent(), CleanupDrawLifetimes, nullptr);
  sfmljs::SetMethod<AddCallbackEx>(target, "AddCallbackEx");
}
}  // namespace sfmlimgui
