// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_DIAGNOSTICS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_DIAGNOSTICS_H_

#include <array>
#include <cstddef>
#include <cstdint>

namespace sfmlrmlui {

enum class DiagnosticCallback : size_t {
  kDataGetter,
  kDataSetter,
  kDataTransform,
  kDataEvent,
  kDataDefinition,
  kDataFactory,
  kFontEffect,
  kDecorator,
  kFilter,
  kTexture,
  kEvent,
  kInstancer,
  kParser,
  kTween,
  kStream,
  kTextInput,
  kSystem,
  kFile,
  kFontEngine,
  kPlugin,
  kCount,
};

enum class DiagnosticOwnership : size_t {
  kTween,
  kFilter,
  kDecorator,
  kFontEffect,
  kElementInstancer,
  kContextInstancer,
  kEventInstancer,
  kTextInput,
  kScriptObject,
  kCount,
};

// Internal, opt-in counters. Storage/copy counters have explicit scopes.
// All access requires the owning runtime scope, including callbacks.
struct DataDiagnostics {
  bool active{false};
  uint64_t runtime_entries{0};
  uint64_t storage_nodes{0};
  uint64_t backing_allocations{0};
  uint64_t backing_bytes{0};
  uint64_t resize_copies{0};
  uint64_t resize_copied_bytes{0};
  uint64_t scalar_reads{0};
  uint64_t scalar_writes{0};
  uint64_t native_numeric_writes{0};
  uint64_t native_callbacks{0};
  std::array<uint64_t, static_cast<size_t>(DiagnosticCallback::kCount)>
      callbacks{};
  uint64_t variant_to_js{0};
  uint64_t data_variant_from_js{0};
  uint64_t ownership_passes{0};
  uint64_t ownership_instance_visits{0};
  uint64_t element_ownership_passes{0};
  uint64_t element_ownership_visits{0};
  uint64_t listener_lookup_comparisons{0};
  uint64_t listener_ownership_passes{0};
  uint64_t listener_ownership_visits{0};
  uint64_t typed_listener_ownership_visits{0};
  uint64_t callback_parent_node_visits{0};
  uint64_t callback_parent_notifications{0};
  std::array<uint64_t, static_cast<size_t>(DiagnosticOwnership::kCount)>
      callback_ownership_passes{};
  std::array<uint64_t, static_cast<size_t>(DiagnosticOwnership::kCount)>
      callback_lease_visits{};
  uint64_t callback_snapshot_visits{0};
  uint64_t lua_variant_owner_passes{0};
  uint64_t lua_variant_owner_lookups{0};
  uint64_t lua_variant_owner_comparisons{0};
  uint64_t lua_variant_snapshot_values{0};
  uint64_t element_command_copies{0};
  uint64_t element_command_copied_bytes{0};
  uint64_t element_commands_consumed{0};
  uint64_t element_command_storage_allocations{0};
  uint64_t element_command_storage_bytes{0};
  uint64_t transform_buffer_allocations{0};
  uint64_t transform_state_allocations{0};
  uint64_t transform_buffer_bytes{0};
  uint64_t transform_buffer_elements{0};
  uint64_t transform_matrix_copied_bytes{0};
  uint64_t string_index_builds{0};
  uint64_t string_index_bytes{0};
  uint64_t string_offset_rows{0};
  uint64_t string_input_copied_bytes{0};
  uint64_t string_output_allocations{0};
  uint64_t string_output_bytes{0};
  uint64_t data_batch_storage_allocations{0};
  uint64_t data_batch_storage_bytes{0};
  uint64_t data_batch_input_rows{0};
  uint64_t data_batch_intervals{0};
  uint64_t font_measure_storage_allocations{0};
  uint64_t font_measure_copied_bytes{0};
  uint64_t font_measure_rows{0};
  uint64_t utility_entries{0};
  uint64_t utility_commands{0};
  uint64_t utility_kernel_weights{0};
  uint64_t utility_negative_preflight_pixels{0};
  uint64_t utility_allocations{0};
  uint64_t utility_allocated_bytes{0};
  uint64_t utility_mesh_prefix_copies{0};
  uint64_t utility_mesh_prefix_copied_bytes{0};
  uint64_t utility_mesh_reallocations{0};
  uint64_t utility_mesh_reserved_bytes{0};
  uint64_t geometry_compiles{0};
  uint64_t geometry_uploads{0};
  uint64_t geometry_upload_bytes{0};
  uint64_t geometry_expansion_bytes{0};
  uint64_t geometry_draws{0};
  uint64_t geometry_batch_commands{0};
  uint64_t geometry_batch_copied_bytes{0};
  uint64_t geometry_batch_cache_hits{0};
  uint64_t geometry_batch_cache_misses{0};
  uint64_t geometry_batch_cache_bytes{0};
  uint64_t mask_draws{0};
  uint64_t fullscreen_draws{0};
  uint64_t composite_draws{0};
  uint64_t capture_draws{0};
  uint64_t texture_uploads{0};
  uint64_t texture_upload_bytes{0};
  uint64_t preload_file_reads{0};
  uint64_t preload_provider_snapshots{0};
  uint64_t preload_image_decodes{0};
  uint64_t preload_font_commits{0};
  uint64_t preload_main_thread_preparations{0};
  uint64_t preload_texture_cache_hits{0};
  uint64_t resource_main_thread_reads{0};
  uint64_t layer_allocations{0};
  uint64_t post_target_allocations{0};
  uint64_t glyph_copies{0};
  uint64_t glyph_copied_bytes{0};
  bool malloc_tracking{false};
  uint64_t malloc_allocations{0};
  uint64_t malloc_deallocations{0};
  uint64_t malloc_reallocations{0};
  uint64_t malloc_requested_bytes{0};

  void Record(uint64_t DataDiagnostics::*field, uint64_t count = 1) {
    if (active) {
      this->*field += count;
    }
  }
};

// Counts actual calls, after validity/recursion checks and before entering V8.
void RecordDiagnosticCallback(DiagnosticCallback category);
// Counts actual registry refreshes, including an empty registry sweep.
void RecordDiagnosticOwnership(DiagnosticOwnership category);
void RecordDiagnosticLeaseVisit(DiagnosticOwnership category);
// Copies of owned glyph snapshots and effect scratch rows, not engine totals.
void RecordDiagnosticGlyphCopy(size_t bytes);
// Value conversion APIs can also run without a global runtime lock.
void RecordDiagnosticVariantToJs();
// Immutable string operations bypass runtime ownership scopes. Record only
// the current thread's active diagnostic interval, without acquiring owners.
void RecordDiagnosticString(uint64_t DataDiagnostics::*field,
                            uint64_t count = 1);
// Native-owned utility values use the active thread's interval without a
// runtime ownership scope. Counts exclude V8 view/control-block allocations.
void RecordDiagnosticUtility(uint64_t DataDiagnostics::*field,
                             uint64_t count = 1);
// Restore the process logger if shutdown interrupts a diagnostic interval.
void CancelDataDiagnostics();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_DIAGNOSTICS_H_
