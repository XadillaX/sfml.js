// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/data/rmlui-data-diagnostics.h"

#include <RmlUi/Core/Property.h>

#include <algorithm>
#include <atomic>
#include <cstdlib>
#include <string>

#ifdef __APPLE__
#include <dlfcn.h>
#include <pthread.h>
#endif

#include "native/data/rmlui-data-schema.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

thread_local DataDiagnostics* active_counts = nullptr;

#ifdef __APPLE__
// libmalloc's logger reports malloc-family operations on the calling thread.
// Install only for a counted interval, never during timing. Do not replace an
// existing profiler. VM allocations and V8 objects within arenas are excluded.
using MallocLogger =
    void (*)(uint32_t, uintptr_t, uintptr_t, uintptr_t, uintptr_t, uint32_t);
// Accessing dynamic TLS for the first time can itself call calloc on macOS.
// The logger must filter background threads before any TLS or allocation.
std::atomic<DataDiagnostics*> malloc_counts{nullptr};
std::atomic<pthread_t> malloc_thread{nullptr};
MallocLogger* logger_slot = nullptr;
constexpr uint32_t kAllocate = 2;
constexpr uint32_t kDeallocate = 4;
// Apple libmalloc private/stack_logging.h: stack_logging_flag_zone = 8.
constexpr uint32_t kZone = 8;

void LogMalloc(uint32_t type,
               uintptr_t arg1,
               uintptr_t arg2,
               uintptr_t arg3,
               uintptr_t result,
               uint32_t) {
  auto* counts = malloc_counts.load(std::memory_order_acquire);
  if (!counts ||
      pthread_self() != malloc_thread.load(std::memory_order_relaxed)) {
    return;
  }
  const bool allocate = type & kAllocate;
  const bool deallocate = type & kDeallocate;
  if (allocate && result) {
    ++counts->malloc_allocations;
    counts->malloc_requested_bytes +=
        deallocate ? arg3 : ((type & kZone) ? arg2 : arg1);
  }
  if (deallocate) {
    ++counts->malloc_deallocations;
  }
  if (allocate && deallocate) {
    ++counts->malloc_reallocations;
  }
}

bool StartMallocTracking(DataDiagnostics* counts) {
  logger_slot =
      reinterpret_cast<MallocLogger*>(dlsym(RTLD_DEFAULT, "malloc_logger"));
  if (!logger_slot || *logger_slot) {
    Nan::ThrowError(
        "libmalloc logger unavailable or already used by a profiler");
    return false;
  }
  counts->malloc_tracking = true;
  malloc_thread.store(pthread_self(), std::memory_order_relaxed);
  malloc_counts.store(counts, std::memory_order_release);
  *logger_slot = LogMalloc;
  return true;
}

void StopMallocTracking() {
  malloc_counts.store(nullptr, std::memory_order_release);
  if (logger_slot && *logger_slot == LogMalloc) {
    *logger_slot = nullptr;
  }
  logger_slot = nullptr;
}
#else
bool StartMallocTracking(DataDiagnostics*) {
  Nan::ThrowError("Malloc tracking is supported only by macOS libmalloc");
  return false;
}
void StopMallocTracking() {}
#endif

NAN_METHOD(BeginDiagnostics) {
  bool ready = false;
  {
    Nan::TryCatch caught;
    {
      RuntimeScope scope;
      if (scope) {
        auto& counts = State().data_diagnostics;
        if (counts.active) {
          Nan::ThrowError("Data diagnostics are already active");
        } else {
          counts = {};
          ready = true;
        }
      }
    }
    if (caught.HasCaught()) {
      caught.ReThrow();
      return;
    }
  }
  if (!ready) {
    return;
  }
  auto& counts = State().data_diagnostics;
  if (info[0]->IsTrue() && !StartMallocTracking(&counts)) {
    return;
  }
  counts.active = true;
  active_counts = &counts;
}

NAN_METHOD(EndDiagnostics) {
  auto& counts = State().data_diagnostics;
  if (!counts.active) {
    return Nan::ThrowError("Data diagnostics are not active");
  }
  counts.active = false;
  active_counts = nullptr;
  StopMallocTracking();
  // The begin method resets its own entry; exclude the end method as well.
  --counts.runtime_entries;
  auto result = Nan::New<v8::Object>();
  const auto set = [&](const char* name, uint64_t value) {
    Nan::Set(result,
             Nan::New(name).ToLocalChecked(),
             Nan::New(static_cast<double>(value)))
        .FromJust();
  };
  set("runtimeEntries", counts.runtime_entries);
  set("storageNodes", counts.storage_nodes);
  set("backingAllocations", counts.backing_allocations);
  set("backingBytes", counts.backing_bytes);
  set("resizeCopies", counts.resize_copies);
  set("resizeCopiedBytes", counts.resize_copied_bytes);
  set("elementCommandCopies", counts.element_command_copies);
  set("elementCommandCopiedBytes", counts.element_command_copied_bytes);
  set("elementCommandsConsumed", counts.element_commands_consumed);
  set("elementCommandStorageAllocations",
      counts.element_command_storage_allocations);
  set("elementCommandStorageBytes", counts.element_command_storage_bytes);
  set("transformBufferAllocations", counts.transform_buffer_allocations);
  set("transformStateAllocations", counts.transform_state_allocations);
  set("transformBufferBytes", counts.transform_buffer_bytes);
  set("transformBufferElements", counts.transform_buffer_elements);
  set("transformMatrixCopiedBytes", counts.transform_matrix_copied_bytes);
  set("stringIndexBuilds", counts.string_index_builds);
  set("stringIndexBytes", counts.string_index_bytes);
  set("stringOffsetRows", counts.string_offset_rows);
  set("stringInputCopiedBytes", counts.string_input_copied_bytes);
  set("stringOutputAllocations", counts.string_output_allocations);
  set("stringOutputBytes", counts.string_output_bytes);
  set("dataBatchStorageAllocations", counts.data_batch_storage_allocations);
  set("dataBatchStorageBytes", counts.data_batch_storage_bytes);
  set("dataBatchInputRows", counts.data_batch_input_rows);
  set("dataBatchIntervals", counts.data_batch_intervals);
  set("fontMeasureStorageAllocations", counts.font_measure_storage_allocations);
  set("fontMeasureCopiedBytes", counts.font_measure_copied_bytes);
  set("fontMeasureRows", counts.font_measure_rows);
  set("utilityEntries", counts.utility_entries);
  set("utilityCommands", counts.utility_commands);
  set("utilityKernelWeights", counts.utility_kernel_weights);
  set("utilityNegativePreflightPixels",
      counts.utility_negative_preflight_pixels);
  set("utilityAllocations", counts.utility_allocations);
  set("utilityAllocatedBytes", counts.utility_allocated_bytes);
  set("utilityMeshPrefixCopies", counts.utility_mesh_prefix_copies);
  set("utilityMeshPrefixCopiedBytes", counts.utility_mesh_prefix_copied_bytes);
  set("utilityMeshReallocations", counts.utility_mesh_reallocations);
  set("utilityMeshReservedBytes", counts.utility_mesh_reserved_bytes);
  set("scalarReads", counts.scalar_reads);
  set("scalarWrites", counts.scalar_writes);
  set("nativeNumericWrites", counts.native_numeric_writes);
  set("nativeCallbacks", counts.native_callbacks);
  auto callbacks = Nan::New<v8::Object>();
  const char* names[] = {
      "dataGetter",     "dataSetter",  "dataTransform", "dataEvent",
      "dataDefinition", "dataFactory", "fontEffect",    "decorator",
      "filter",         "texture",     "event",         "instancer",
      "parser",         "tween",       "stream",        "textInput",
      "system",         "file",        "fontEngine",    "plugin"};
  static_assert(std::size(names) ==
                static_cast<size_t>(DiagnosticCallback::kCount));
  for (size_t i = 0; i < counts.callbacks.size(); ++i) {
    Nan::Set(callbacks,
             Nan::New(names[i]).ToLocalChecked(),
             Nan::New(static_cast<double>(counts.callbacks[i])))
        .FromJust();
  }
  Nan::Set(result, Nan::New("callbacks").ToLocalChecked(), callbacks)
      .FromJust();
  set("variantToJs", counts.variant_to_js);
  set("dataVariantFromJs", counts.data_variant_from_js);
  set("ownershipPasses", counts.ownership_passes);
  set("ownershipInstanceVisits", counts.ownership_instance_visits);
  set("elementOwnershipPasses", counts.element_ownership_passes);
  set("elementOwnershipVisits", counts.element_ownership_visits);
  set("listenerLookupComparisons", counts.listener_lookup_comparisons);
  set("listenerOwnershipPasses", counts.listener_ownership_passes);
  set("listenerOwnershipVisits", counts.listener_ownership_visits);
  set("typedListenerOwnershipVisits", counts.typed_listener_ownership_visits);
  set("callbackParentNodeVisits", counts.callback_parent_node_visits);
  set("callbackParentNotifications", counts.callback_parent_notifications);
  auto ownership = Nan::New<v8::Object>();
  auto lease_visits = Nan::New<v8::Object>();
  const char* ownership_names[] = {"tween",
                                   "filter",
                                   "decorator",
                                   "fontEffect",
                                   "elementInstancer",
                                   "contextInstancer",
                                   "eventInstancer",
                                   "textInput",
                                   "scriptObject"};
  for (size_t i = 0; i < counts.callback_ownership_passes.size(); ++i) {
    Nan::Set(ownership,
             Nan::New(ownership_names[i]).ToLocalChecked(),
             Nan::New(static_cast<double>(counts.callback_ownership_passes[i])))
        .FromJust();
    Nan::Set(lease_visits,
             Nan::New(ownership_names[i]).ToLocalChecked(),
             Nan::New(static_cast<double>(counts.callback_lease_visits[i])))
        .FromJust();
  }
  Nan::Set(
      result, Nan::New("callbackOwnershipPasses").ToLocalChecked(), ownership)
      .FromJust();
  Nan::Set(
      result, Nan::New("callbackLeaseVisits").ToLocalChecked(), lease_visits)
      .FromJust();
  set("callbackSnapshotVisits", counts.callback_snapshot_visits);
  set("luaVariantOwnerPasses", counts.lua_variant_owner_passes);
  set("luaVariantOwnerLookups", counts.lua_variant_owner_lookups);
  set("luaVariantOwnerComparisons", counts.lua_variant_owner_comparisons);
  set("luaVariantSnapshotValues", counts.lua_variant_snapshot_values);
  set("geometryCompiles", counts.geometry_compiles);
  set("geometryUploads", counts.geometry_uploads);
  set("geometryUploadBytes", counts.geometry_upload_bytes);
  set("geometryExpansionBytes", counts.geometry_expansion_bytes);
  set("geometryDraws", counts.geometry_draws);
  set("geometryBatchCommands", counts.geometry_batch_commands);
  set("geometryBatchCopiedBytes", counts.geometry_batch_copied_bytes);
  set("geometryBatchCacheHits", counts.geometry_batch_cache_hits);
  set("geometryBatchCacheMisses", counts.geometry_batch_cache_misses);
  set("geometryBatchCacheBytes", counts.geometry_batch_cache_bytes);
  set("maskDraws", counts.mask_draws);
  set("fullscreenDraws", counts.fullscreen_draws);
  set("compositeDraws", counts.composite_draws);
  set("captureDraws", counts.capture_draws);
  set("textureUploads", counts.texture_uploads);
  set("textureUploadBytes", counts.texture_upload_bytes);
  set("preloadFileReads", counts.preload_file_reads);
  set("preloadProviderSnapshots", counts.preload_provider_snapshots);
  set("preloadImageDecodes", counts.preload_image_decodes);
  set("preloadFontCommits", counts.preload_font_commits);
  set("preloadMainThreadPreparations", counts.preload_main_thread_preparations);
  set("preloadTextureCacheHits", counts.preload_texture_cache_hits);
  set("resourceMainThreadReads", counts.resource_main_thread_reads);
  set("layerAllocations", counts.layer_allocations);
  set("postTargetAllocations", counts.post_target_allocations);
  set("glyphCopies", counts.glyph_copies);
  set("glyphCopiedBytes", counts.glyph_copied_bytes);
  Nan::Set(result,
           Nan::New("mallocTracking").ToLocalChecked(),
           Nan::New(counts.malloc_tracking))
      .FromJust();
  set("mallocAllocations", counts.malloc_allocations);
  set("mallocDeallocations", counts.malloc_deallocations);
  set("mallocReallocations", counts.malloc_reallocations);
  set("mallocRequestedBytes", counts.malloc_requested_bytes);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(FillDiagnosticArrays) {
  auto model = DataModelOf(info[0]);
  if (!model) {
    return;
  }
  if (!info[1]->IsNumber() || !info[2]->IsUint32()) {
    return Nan::ThrowTypeError("Expected numeric fill and root count");
  }
  const auto value = Nan::To<double>(info[1]).FromJust();
  const auto roots = Nan::To<uint32_t>(info[2]).FromJust();
  // Validate the entire fixture before mutating any storage.
  for (uint32_t i = 0; i < roots; ++i) {
    const auto found = model->storage.find("values" + std::to_string(i));
    if (found == model->storage.end() || !found->second->backing ||
        !found->second->schema->underlying ||
        found->second->schema->underlying->scalar != DataScalarKind::kFloat64) {
      return Nan::ThrowTypeError("Expected named float64 diagnostic arrays");
    }
  }
  for (uint32_t i = 0; i < roots; ++i) {
    const auto& node = model->storage.at("values" + std::to_string(i));
    auto* data = static_cast<double*>(node->backing->Data());
    std::fill_n(data, node->count, value);
    State().data_diagnostics.Record(&DataDiagnostics::native_numeric_writes,
                                    node->count);
  }
}

NAN_METHOD(CheckDiagnosticRows) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!info[1]->IsUint32() || !info[2]->IsNumber() || !info[3]->IsUint32()) {
    return Nan::ThrowTypeError("Expected row count, value and changed prefix");
  }
  const auto expected_count = Nan::To<uint32_t>(info[1]).FromJust();
  const auto value = Nan::To<double>(info[2]).FromJust();
  const auto changed = Nan::To<uint32_t>(info[3]).FromJust();
  const bool check_width = info[4]->IsTrue();
  Rml::ElementList rows;
  element->QuerySelectorAll(rows, "i[data-value]");
  bool valid = rows.size() == expected_count;
  for (size_t i = 0; valid && i < rows.size(); ++i) {
    const auto* attribute = rows[i]->GetAttribute("data-value");
    const double expected = i < changed ? value : 0;
    valid = attribute && attribute->Get<double>() == expected;
    if (valid && check_width) {
      const auto* width = rows[i]->GetProperty(Rml::PropertyId::Width);
      valid = width && width->unit == Rml::Unit::PX &&
              width->value.Get<double>() == expected + 1;
    }
  }
  info.GetReturnValue().Set(valid);
}

NAN_METHOD(ProbeDiagnosticMalloc) {
  const auto& counts = State().data_diagnostics;
  if (!counts.malloc_tracking || !counts.active) {
    return Nan::ThrowError("Start malloc diagnostics before the ABI probe");
  }
  const auto before = counts.malloc_requested_bytes;
  auto* bytes = static_cast<volatile unsigned char*>(std::malloc(4096));
  if (!bytes) {
    return Nan::ThrowError("Diagnostic allocation failed");
  }
  bytes[0] = 1;
  // malloc's compiler builtin does not model the installed logger's writes.
  std::atomic_signal_fence(std::memory_order_seq_cst);
  const auto requested = counts.malloc_requested_bytes - before;
  std::free(const_cast<unsigned char*>(bytes));
  info.GetReturnValue().Set(Nan::New(static_cast<double>(requested)));
}

}  // namespace

void RecordDiagnosticCallback(DiagnosticCallback category) {
  if (active_counts) {
    ++active_counts->native_callbacks;
    ++active_counts->callbacks[static_cast<size_t>(category)];
  }
}

void RecordDiagnosticOwnership(DiagnosticOwnership category) {
  if (active_counts) {
    ++active_counts->callback_ownership_passes[static_cast<size_t>(category)];
  }
}

void RecordDiagnosticLeaseVisit(DiagnosticOwnership category) {
  if (active_counts) {
    ++active_counts->callback_lease_visits[static_cast<size_t>(category)];
  }
}

void RecordDiagnosticGlyphCopy(size_t bytes) {
  if (bytes && active_counts) {
    active_counts->Record(&DataDiagnostics::glyph_copies);
    active_counts->Record(&DataDiagnostics::glyph_copied_bytes, bytes);
  }
}

void RecordDiagnosticVariantToJs() {
  if (active_counts) {
    active_counts->Record(&DataDiagnostics::variant_to_js);
  }
}

void RecordDiagnosticString(uint64_t DataDiagnostics::*field, uint64_t count) {
  if (active_counts) {
    active_counts->Record(field, count);
  }
}

void RecordDiagnosticUtility(uint64_t DataDiagnostics::*field, uint64_t count) {
  if (active_counts) {
    active_counts->Record(field, count);
  }
}

void CancelDataDiagnostics() {
  active_counts = nullptr;
  StopMallocTracking();
  State().data_diagnostics = {};
}

NAN_MODULE_INIT(InitializeRmlDataDiagnostics) {
  // Deliberately absent from public TS exports and NativeBinding.
  sfmljs::SetMethod<BeginDiagnostics>(target, "beginDataDiagnostics");
  SetRuntimeMethod<EndDiagnostics>(target, "endDataDiagnostics");
  SetRuntimeMethod<FillDiagnosticArrays>(target, "fillDiagnosticArrays");
  SetRuntimeMethod<CheckDiagnosticRows>(target, "checkDiagnosticRows");
  SetRuntimeMethod<ProbeDiagnosticMalloc>(target, "probeDiagnosticMalloc");
}

}  // namespace sfmlrmlui
