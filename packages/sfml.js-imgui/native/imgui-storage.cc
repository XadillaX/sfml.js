// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(SetStateStorage) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ::cimgui::ImGui_SetStateStorage(storage);
}

NAN_METHOD(GetStateStorage) {
  auto result = ::cimgui::ImGui_GetStateStorage();
  ReturnStruct<cimgui::ImGuiStorage>(info, result);
}

NAN_METHOD(StorageClear) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ::cimgui::ImGuiStorage_Clear(storage);
}

NAN_METHOD(StorageGetInt) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ImGuiID key = {};
  if (!ReadScalar(info, 1, &key)) return;
  int default_value = {};
  if (!ReadScalar(info, 2, &default_value)) return;
  auto result = ::cimgui::ImGuiStorage_GetInt(storage, key, default_value);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(StorageSetInt) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ImGuiID key = {};
  if (!ReadScalar(info, 1, &key)) return;
  int value = {};
  if (!ReadScalar(info, 2, &value)) return;
  ::cimgui::ImGuiStorage_SetInt(storage, key, value);
}

NAN_METHOD(StorageGetBool) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ImGuiID key = {};
  if (!ReadScalar(info, 1, &key)) return;
  bool default_value = false;
  if (!ReadBool(info, 2, &default_value)) return;
  auto result = ::cimgui::ImGuiStorage_GetBool(storage, key, default_value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(StorageSetBool) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ImGuiID key = {};
  if (!ReadScalar(info, 1, &key)) return;
  bool value = false;
  if (!ReadBool(info, 2, &value)) return;
  ::cimgui::ImGuiStorage_SetBool(storage, key, value);
}

NAN_METHOD(StorageGetFloat) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ImGuiID key = {};
  if (!ReadScalar(info, 1, &key)) return;
  float default_value = {};
  if (!ReadScalar(info, 2, &default_value)) return;
  auto result = ::cimgui::ImGuiStorage_GetFloat(storage, key, default_value);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(StorageSetFloat) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ImGuiID key = {};
  if (!ReadScalar(info, 1, &key)) return;
  float value = {};
  if (!ReadScalar(info, 2, &value)) return;
  ::cimgui::ImGuiStorage_SetFloat(storage, key, value);
}

NAN_METHOD(StorageGetVoidPtr) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ImGuiID key = {};
  if (!ReadScalar(info, 1, &key)) return;
  auto result = ::cimgui::ImGuiStorage_GetVoidPtr(storage, key);
  ReturnPointer(info, result);
}

NAN_METHOD(StorageSetVoidPtr) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ImGuiID key = {};
  if (!ReadScalar(info, 1, &key)) return;
  void* value = nullptr;
  if (!ReadPointer(info, 2, &value)) return;
  ::cimgui::ImGuiStorage_SetVoidPtr(storage, key, value);
}

NAN_METHOD(StorageBuildSortByKey) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  ::cimgui::ImGuiStorage_BuildSortByKey(storage);
}

NAN_METHOD(StorageSetAllInt) {
  cimgui::ImGuiStorage* storage = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
    if (!storage) return;
  }
  int value = {};
  if (!ReadScalar(info, 1, &value)) return;
  ::cimgui::ImGuiStorage_SetAllInt(storage, value);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiStorage) {
  sfmljs::SetMethod<SetStateStorage>(target, "SetStateStorage");
  sfmljs::SetMethod<GetStateStorage>(target, "GetStateStorage");
  sfmljs::SetMethod<StorageClear>(target, "Storage_Clear");
  sfmljs::SetMethod<StorageGetInt>(target, "Storage_GetInt");
  sfmljs::SetMethod<StorageSetInt>(target, "Storage_SetInt");
  sfmljs::SetMethod<StorageGetBool>(target, "Storage_GetBool");
  sfmljs::SetMethod<StorageSetBool>(target, "Storage_SetBool");
  sfmljs::SetMethod<StorageGetFloat>(target, "Storage_GetFloat");
  sfmljs::SetMethod<StorageSetFloat>(target, "Storage_SetFloat");
  sfmljs::SetMethod<StorageGetVoidPtr>(target, "Storage_GetVoidPtr");
  sfmljs::SetMethod<StorageSetVoidPtr>(target, "Storage_SetVoidPtr");
  sfmljs::SetMethod<StorageBuildSortByKey>(target, "Storage_BuildSortByKey");
  sfmljs::SetMethod<StorageSetAllInt>(target, "Storage_SetAllInt");
}

}  // namespace sfmlimgui
