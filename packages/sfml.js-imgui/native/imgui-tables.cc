// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(BeginTable) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  int columns = {};
  if (!ReadScalar(info, 1, &columns)) return;
  ImGuiTableFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_BeginTable(string_id, columns, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginTableEx) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  int columns = {};
  if (!ReadScalar(info, 1, &columns)) return;
  ImGuiTableFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  cimgui::ImVec2 outer_size;
  if (!ReadImVec2(info, 3, &outer_size)) return;
  float inner_width = {};
  if (!ReadScalar(info, 4, &inner_width)) return;
  auto result = ::cimgui::ImGui_BeginTableEx(
      string_id, columns, flags, outer_size, inner_width);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndTable) {
  ::cimgui::ImGui_EndTable();
}

NAN_METHOD(TableNextRow) {
  ::cimgui::ImGui_TableNextRow();
}

NAN_METHOD(TableNextRowEx) {
  ImGuiTableRowFlags row_flags = {};
  if (!ReadScalar(info, 0, &row_flags)) return;
  float min_row_height = {};
  if (!ReadScalar(info, 1, &min_row_height)) return;
  ::cimgui::ImGui_TableNextRowEx(row_flags, min_row_height);
}

NAN_METHOD(TableNextColumn) {
  auto result = ::cimgui::ImGui_TableNextColumn();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TableSetColumnIndex) {
  int column_index = {};
  if (!ReadScalar(info, 0, &column_index)) return;
  auto result = ::cimgui::ImGui_TableSetColumnIndex(column_index);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TableSetupColumn) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiTableColumnFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  ::cimgui::ImGui_TableSetupColumn(label, flags);
}

NAN_METHOD(TableSetupColumnEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiTableColumnFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  float init_width_or_weight = {};
  if (!ReadScalar(info, 2, &init_width_or_weight)) return;
  ImGuiID user_id = {};
  if (!ReadScalar(info, 3, &user_id)) return;
  ::cimgui::ImGui_TableSetupColumnEx(
      label, flags, init_width_or_weight, user_id);
}

NAN_METHOD(TableSetupScrollFreeze) {
  int columns = {};
  if (!ReadScalar(info, 0, &columns)) return;
  int rows = {};
  if (!ReadScalar(info, 1, &rows)) return;
  ::cimgui::ImGui_TableSetupScrollFreeze(columns, rows);
}

NAN_METHOD(TableHeader) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ::cimgui::ImGui_TableHeader(label);
}

NAN_METHOD(TableHeadersRow) {
  ::cimgui::ImGui_TableHeadersRow();
}

NAN_METHOD(TableAngledHeadersRow) {
  ::cimgui::ImGui_TableAngledHeadersRow();
}

NAN_METHOD(TableGetSortSpecs) {
  auto result = ::cimgui::ImGui_TableGetSortSpecs();
  ReturnStruct<cimgui::ImGuiTableSortSpecs>(info, result);
}

NAN_METHOD(TableGetColumnCount) {
  auto result = ::cimgui::ImGui_TableGetColumnCount();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(TableGetColumnIndex) {
  auto result = ::cimgui::ImGui_TableGetColumnIndex();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(TableGetRowIndex) {
  auto result = ::cimgui::ImGui_TableGetRowIndex();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(TableGetColumnName) {
  int column_index = {};
  if (!ReadScalar(info, 0, &column_index)) return;
  auto result = ::cimgui::ImGui_TableGetColumnName(column_index);
  ReturnString(info, result);
}

NAN_METHOD(TableGetColumnFlags) {
  int column_index = {};
  if (!ReadScalar(info, 0, &column_index)) return;
  auto result = ::cimgui::ImGui_TableGetColumnFlags(column_index);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(TableSetColumnEnabled) {
  int column_index = {};
  if (!ReadScalar(info, 0, &column_index)) return;
  bool enabled = false;
  if (!ReadBool(info, 1, &enabled)) return;
  ::cimgui::ImGui_TableSetColumnEnabled(column_index, enabled);
}

NAN_METHOD(TableGetHoveredColumn) {
  auto result = ::cimgui::ImGui_TableGetHoveredColumn();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(TableSetBgColor) {
  ImGuiTableBgTarget target = {};
  if (!ReadScalar(info, 0, &target)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 1, &color)) return;
  int column_index = {};
  if (!ReadScalar(info, 2, &column_index)) return;
  ::cimgui::ImGui_TableSetBgColor(target, color, column_index);
}

NAN_METHOD(Columns) {
  ::cimgui::ImGui_Columns();
}

NAN_METHOD(ColumnsEx) {
  int count = {};
  if (!ReadScalar(info, 0, &count)) return;
  std::string id_utf8;
  const char* id = nullptr;
  if (!ReadUtf8(info, 1, &id_utf8, &id, true)) return;
  bool borders = false;
  if (!ReadBool(info, 2, &borders)) return;
  ::cimgui::ImGui_ColumnsEx(count, id, borders);
}

NAN_METHOD(NextColumn) {
  ::cimgui::ImGui_NextColumn();
}

NAN_METHOD(GetColumnIndex) {
  auto result = ::cimgui::ImGui_GetColumnIndex();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetColumnWidth) {
  int column_index = {};
  if (!ReadScalar(info, 0, &column_index)) return;
  auto result = ::cimgui::ImGui_GetColumnWidth(column_index);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SetColumnWidth) {
  int column_index = {};
  if (!ReadScalar(info, 0, &column_index)) return;
  float width = {};
  if (!ReadScalar(info, 1, &width)) return;
  ::cimgui::ImGui_SetColumnWidth(column_index, width);
}

NAN_METHOD(GetColumnOffset) {
  int column_index = {};
  if (!ReadScalar(info, 0, &column_index)) return;
  auto result = ::cimgui::ImGui_GetColumnOffset(column_index);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SetColumnOffset) {
  int column_index = {};
  if (!ReadScalar(info, 0, &column_index)) return;
  float offset_x = {};
  if (!ReadScalar(info, 1, &offset_x)) return;
  ::cimgui::ImGui_SetColumnOffset(column_index, offset_x);
}

NAN_METHOD(GetColumnsCount) {
  auto result = ::cimgui::ImGui_GetColumnsCount();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiTables) {
  sfmljs::SetMethod<BeginTable>(target, "BeginTable");
  sfmljs::SetMethod<BeginTableEx>(target, "BeginTableEx");
  sfmljs::SetMethod<EndTable>(target, "EndTable");
  sfmljs::SetMethod<TableNextRow>(target, "TableNextRow");
  sfmljs::SetMethod<TableNextRowEx>(target, "TableNextRowEx");
  sfmljs::SetMethod<TableNextColumn>(target, "TableNextColumn");
  sfmljs::SetMethod<TableSetColumnIndex>(target, "TableSetColumnIndex");
  sfmljs::SetMethod<TableSetupColumn>(target, "TableSetupColumn");
  sfmljs::SetMethod<TableSetupColumnEx>(target, "TableSetupColumnEx");
  sfmljs::SetMethod<TableSetupScrollFreeze>(target, "TableSetupScrollFreeze");
  sfmljs::SetMethod<TableHeader>(target, "TableHeader");
  sfmljs::SetMethod<TableHeadersRow>(target, "TableHeadersRow");
  sfmljs::SetMethod<TableAngledHeadersRow>(target, "TableAngledHeadersRow");
  sfmljs::SetMethod<TableGetSortSpecs>(target, "TableGetSortSpecs");
  sfmljs::SetMethod<TableGetColumnCount>(target, "TableGetColumnCount");
  sfmljs::SetMethod<TableGetColumnIndex>(target, "TableGetColumnIndex");
  sfmljs::SetMethod<TableGetRowIndex>(target, "TableGetRowIndex");
  sfmljs::SetMethod<TableGetColumnName>(target, "TableGetColumnName");
  sfmljs::SetMethod<TableGetColumnFlags>(target, "TableGetColumnFlags");
  sfmljs::SetMethod<TableSetColumnEnabled>(target, "TableSetColumnEnabled");
  sfmljs::SetMethod<TableGetHoveredColumn>(target, "TableGetHoveredColumn");
  sfmljs::SetMethod<TableSetBgColor>(target, "TableSetBgColor");
  sfmljs::SetMethod<Columns>(target, "Columns");
  sfmljs::SetMethod<ColumnsEx>(target, "ColumnsEx");
  sfmljs::SetMethod<NextColumn>(target, "NextColumn");
  sfmljs::SetMethod<GetColumnIndex>(target, "GetColumnIndex");
  sfmljs::SetMethod<GetColumnWidth>(target, "GetColumnWidth");
  sfmljs::SetMethod<SetColumnWidth>(target, "SetColumnWidth");
  sfmljs::SetMethod<GetColumnOffset>(target, "GetColumnOffset");
  sfmljs::SetMethod<SetColumnOffset>(target, "SetColumnOffset");
  sfmljs::SetMethod<GetColumnsCount>(target, "GetColumnsCount");
}

}  // namespace sfmlimgui
