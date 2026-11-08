// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>
#include <vector>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(TreeNode) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  auto result = ::cimgui::ImGui_TreeNode(label);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TreeNodeStrUnformatted) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 1, &text_utf8, &text, true)) return;
  auto result = ::cimgui::ImGui_TreeNodeStrUnformatted(string_id, text);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TreeNodePtrUnformatted) {
  void* pointer_id = nullptr;
  if (!ReadPointer(info, 0, &pointer_id)) return;
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 1, &text_utf8, &text, true)) return;
  auto result = ::cimgui::ImGui_TreeNodePtrUnformatted(pointer_id, text);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TreeNodeEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiTreeNodeFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  auto result = ::cimgui::ImGui_TreeNodeEx(label, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TreeNodeExStrUnformatted) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiTreeNodeFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 2, &text_utf8, &text, true)) return;
  auto result =
      ::cimgui::ImGui_TreeNodeExStrUnformatted(string_id, flags, text);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TreeNodeExPtrUnformatted) {
  void* pointer_id = nullptr;
  if (!ReadPointer(info, 0, &pointer_id)) return;
  ImGuiTreeNodeFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 2, &text_utf8, &text, true)) return;
  auto result =
      ::cimgui::ImGui_TreeNodeExPtrUnformatted(pointer_id, flags, text);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TreePush) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ::cimgui::ImGui_TreePush(string_id);
}

NAN_METHOD(TreePushPtr) {
  void* pointer_id = nullptr;
  if (!ReadPointer(info, 0, &pointer_id)) return;
  ::cimgui::ImGui_TreePushPtr(pointer_id);
}

NAN_METHOD(TreePop) {
  ::cimgui::ImGui_TreePop();
}

NAN_METHOD(GetTreeNodeToLabelSpacing) {
  auto result = ::cimgui::ImGui_GetTreeNodeToLabelSpacing();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(CollapsingHeader) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiTreeNodeFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  auto result = ::cimgui::ImGui_CollapsingHeader(label, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(CollapsingHeaderBoolPtr) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  bool* visible = ReadBoolArray(info, 1, 1);
  if (!visible) return;
  ImGuiTreeNodeFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_CollapsingHeaderBoolPtr(label, visible, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SetNextItemOpen) {
  bool is_open = false;
  if (!ReadBool(info, 0, &is_open)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 1, &condition)) return;
  ::cimgui::ImGui_SetNextItemOpen(is_open, condition);
}

NAN_METHOD(SetNextItemStorageID) {
  ImGuiID storage_id = {};
  if (!ReadScalar(info, 0, &storage_id)) return;
  ::cimgui::ImGui_SetNextItemStorageID(storage_id);
}

NAN_METHOD(Selectable) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  auto result = ::cimgui::ImGui_Selectable(label);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SelectableEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  bool selected = false;
  if (!ReadBool(info, 1, &selected)) return;
  ImGuiSelectableFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 3, &size)) return;
  auto result = ::cimgui::ImGui_SelectableEx(label, selected, flags, size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SelectableBoolPtr) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  bool* selected = ReadBoolArray(info, 1, 1);
  if (!selected) return;
  ImGuiSelectableFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_SelectableBoolPtr(label, selected, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SelectableBoolPtrEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  bool* selected = ReadBoolArray(info, 1, 1);
  if (!selected) return;
  ImGuiSelectableFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 3, &size)) return;
  auto result =
      ::cimgui::ImGui_SelectableBoolPtrEx(label, selected, flags, size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginMultiSelect) {
  ImGuiMultiSelectFlags flags = {};
  if (!ReadScalar(info, 0, &flags)) return;
  auto result = ::cimgui::ImGui_BeginMultiSelect(flags);
  ReturnStruct<cimgui::ImGuiMultiSelectIO>(info, result);
}

NAN_METHOD(BeginMultiSelectEx) {
  ImGuiMultiSelectFlags flags = {};
  if (!ReadScalar(info, 0, &flags)) return;
  int selection_size = {};
  if (!ReadScalar(info, 1, &selection_size)) return;
  int items_count = {};
  if (!ReadScalar(info, 2, &items_count)) return;
  auto result =
      ::cimgui::ImGui_BeginMultiSelectEx(flags, selection_size, items_count);
  ReturnStruct<cimgui::ImGuiMultiSelectIO>(info, result);
}

NAN_METHOD(EndMultiSelect) {
  auto result = ::cimgui::ImGui_EndMultiSelect();
  ReturnStruct<cimgui::ImGuiMultiSelectIO>(info, result);
}

NAN_METHOD(SetNextItemSelectionUserData) {
  ImGuiSelectionUserData selection_user_data = 0;
  if (!ReadSelectionUserData(info, 0, &selection_user_data)) return;
  ::cimgui::ImGui_SetNextItemSelectionUserData(selection_user_data);
}

NAN_METHOD(IsItemToggledSelection) {
  auto result = ::cimgui::ImGui_IsItemToggledSelection();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginListBox) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  auto result = ::cimgui::ImGui_BeginListBox(label, size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndListBox) {
  ::cimgui::ImGui_EndListBox();
}

NAN_METHOD(ListBox) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* current_item = ReadInt32Array(info, 1, 1);
  if (!current_item) return;
  std::vector<std::string> items_storage;
  std::vector<const char*> items_pointers;
  if (!ReadStringArray(info, 2, &items_storage, &items_pointers)) return;
  const char* const* items = items_pointers.data();
  int items_count = {};
  if (!ReadScalar(info, 3, &items_count)) return;
  int height_in_items = {};
  if (!ReadScalar(info, 4, &height_in_items)) return;
  auto result = ::cimgui::ImGui_ListBox(
      label, current_item, items, items_count, height_in_items);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SelectionBasicStorageApplyRequests) {
  cimgui::ImGuiSelectionBasicStorage* selection = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    selection = ReadStruct<cimgui::ImGuiSelectionBasicStorage>(info, 0);
    if (!selection) return;
  }
  cimgui::ImGuiMultiSelectIO* multi_select_io = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    multi_select_io = ReadStruct<cimgui::ImGuiMultiSelectIO>(info, 1);
    if (!multi_select_io) return;
  }
  ::cimgui::ImGuiSelectionBasicStorage_ApplyRequests(selection,
                                                     multi_select_io);
}

NAN_METHOD(SelectionBasicStorageContains) {
  cimgui::ImGuiSelectionBasicStorage* selection = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    selection = ReadStruct<cimgui::ImGuiSelectionBasicStorage>(info, 0);
    if (!selection) return;
  }
  ImGuiID id = {};
  if (!ReadScalar(info, 1, &id)) return;
  auto result = ::cimgui::ImGuiSelectionBasicStorage_Contains(selection, id);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SelectionBasicStorageClear) {
  cimgui::ImGuiSelectionBasicStorage* selection = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    selection = ReadStruct<cimgui::ImGuiSelectionBasicStorage>(info, 0);
    if (!selection) return;
  }
  ::cimgui::ImGuiSelectionBasicStorage_Clear(selection);
}

NAN_METHOD(SelectionBasicStorageSwap) {
  cimgui::ImGuiSelectionBasicStorage* selection = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    selection = ReadStruct<cimgui::ImGuiSelectionBasicStorage>(info, 0);
    if (!selection) return;
  }
  cimgui::ImGuiSelectionBasicStorage* other_selection = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    other_selection = ReadStruct<cimgui::ImGuiSelectionBasicStorage>(info, 1);
    if (!other_selection) return;
  }
  ::cimgui::ImGuiSelectionBasicStorage_Swap(selection, other_selection);
}

NAN_METHOD(SelectionBasicStorageSetItemSelected) {
  cimgui::ImGuiSelectionBasicStorage* selection = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    selection = ReadStruct<cimgui::ImGuiSelectionBasicStorage>(info, 0);
    if (!selection) return;
  }
  ImGuiID id = {};
  if (!ReadScalar(info, 1, &id)) return;
  bool selected = false;
  if (!ReadBool(info, 2, &selected)) return;
  ::cimgui::ImGuiSelectionBasicStorage_SetItemSelected(selection, id, selected);
}

NAN_METHOD(SelectionBasicStorageGetStorageIdFromIndex) {
  cimgui::ImGuiSelectionBasicStorage* selection = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    selection = ReadStruct<cimgui::ImGuiSelectionBasicStorage>(info, 0);
    if (!selection) return;
  }
  int index = {};
  if (!ReadScalar(info, 1, &index)) return;
  auto result = ::cimgui::ImGuiSelectionBasicStorage_GetStorageIdFromIndex(
      selection, index);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SelectionExternalStorageApplyRequests) {
  cimgui::ImGuiSelectionExternalStorage* selection = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    selection = ReadStruct<cimgui::ImGuiSelectionExternalStorage>(info, 0);
    if (!selection) return;
  }
  cimgui::ImGuiMultiSelectIO* multi_select_io = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    multi_select_io = ReadStruct<cimgui::ImGuiMultiSelectIO>(info, 1);
    if (!multi_select_io) return;
  }
  ::cimgui::ImGuiSelectionExternalStorage_ApplyRequests(selection,
                                                        multi_select_io);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiSelection) {
  sfmljs::SetMethod<TreeNode>(target, "TreeNode");
  sfmljs::SetMethod<TreeNodeStrUnformatted>(target, "TreeNodeStrUnformatted");
  sfmljs::SetMethod<TreeNodePtrUnformatted>(target, "TreeNodePtrUnformatted");
  sfmljs::SetMethod<TreeNodeEx>(target, "TreeNodeEx");
  sfmljs::SetMethod<TreeNodeExStrUnformatted>(target,
                                              "TreeNodeExStrUnformatted");
  sfmljs::SetMethod<TreeNodeExPtrUnformatted>(target,
                                              "TreeNodeExPtrUnformatted");
  sfmljs::SetMethod<TreePush>(target, "TreePush");
  sfmljs::SetMethod<TreePushPtr>(target, "TreePushPtr");
  sfmljs::SetMethod<TreePop>(target, "TreePop");
  sfmljs::SetMethod<GetTreeNodeToLabelSpacing>(target,
                                               "GetTreeNodeToLabelSpacing");
  sfmljs::SetMethod<CollapsingHeader>(target, "CollapsingHeader");
  sfmljs::SetMethod<CollapsingHeaderBoolPtr>(target, "CollapsingHeaderBoolPtr");
  sfmljs::SetMethod<SetNextItemOpen>(target, "SetNextItemOpen");
  sfmljs::SetMethod<SetNextItemStorageID>(target, "SetNextItemStorageID");
  sfmljs::SetMethod<Selectable>(target, "Selectable");
  sfmljs::SetMethod<SelectableEx>(target, "SelectableEx");
  sfmljs::SetMethod<SelectableBoolPtr>(target, "SelectableBoolPtr");
  sfmljs::SetMethod<SelectableBoolPtrEx>(target, "SelectableBoolPtrEx");
  sfmljs::SetMethod<BeginMultiSelect>(target, "BeginMultiSelect");
  sfmljs::SetMethod<BeginMultiSelectEx>(target, "BeginMultiSelectEx");
  sfmljs::SetMethod<EndMultiSelect>(target, "EndMultiSelect");
  sfmljs::SetMethod<SetNextItemSelectionUserData>(
      target, "SetNextItemSelectionUserData");
  sfmljs::SetMethod<IsItemToggledSelection>(target, "IsItemToggledSelection");
  sfmljs::SetMethod<BeginListBox>(target, "BeginListBox");
  sfmljs::SetMethod<EndListBox>(target, "EndListBox");
  sfmljs::SetMethod<ListBox>(target, "ListBox");
  sfmljs::SetMethod<SelectionBasicStorageApplyRequests>(
      target, "SelectionBasicStorage_ApplyRequests");
  sfmljs::SetMethod<SelectionBasicStorageContains>(
      target, "SelectionBasicStorage_Contains");
  sfmljs::SetMethod<SelectionBasicStorageClear>(target,
                                                "SelectionBasicStorage_Clear");
  sfmljs::SetMethod<SelectionBasicStorageSwap>(target,
                                               "SelectionBasicStorage_Swap");
  sfmljs::SetMethod<SelectionBasicStorageSetItemSelected>(
      target, "SelectionBasicStorage_SetItemSelected");
  sfmljs::SetMethod<SelectionBasicStorageGetStorageIdFromIndex>(
      target, "SelectionBasicStorage_GetStorageIdFromIndex");
  sfmljs::SetMethod<SelectionExternalStorageApplyRequests>(
      target, "SelectionExternalStorage_ApplyRequests");
}

}  // namespace sfmlimgui
