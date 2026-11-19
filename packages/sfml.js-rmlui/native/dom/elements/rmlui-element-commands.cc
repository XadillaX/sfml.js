// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/dom/elements/rmlui-element-commands.h"

#include <RmlUi/Core/Property.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <limits>
#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "native/runtime/rmlui-state.h"
#include "third_party/rmlui/Source/Core/ElementStyle.h"

namespace sfmlrmlui {
namespace {

enum class Opcode : uint8_t {
  kSetNumeric = 1,
  kRemoveProperty,
  kGetNumeric,
  kGetLocalNumeric,
  kResolveNumeric,
  kResolveLength,
  kStyleSetNumeric,
  kStyleRemoveProperty,
  kStyleGetNumeric,
  kStyleGetLocalNumeric,
  kStyleResolveNumeric,
  kStyleResolveRelativeLength
};

enum class Status : uint8_t { kNone, kNumeric, kMissing, kNonNumeric };

// ArrayBuffer deleters retain this object only, never element/context leases.
struct CommandStorage {
  explicit CommandStorage(uint32_t capacity)
      : opcodes(capacity),
        elements(capacity),
        properties(capacity),
        units(capacity),
        numbers(capacity),
        bases(capacity),
        output_numbers(capacity),
        output_units(capacity),
        output_status(capacity) {
    auto& counts = State().data_diagnostics;
    counts.Record(&DataDiagnostics::element_command_storage_allocations);
    counts.Record(&DataDiagnostics::element_command_storage_bytes,
                  capacity * (2 * sizeof(uint8_t) + 7 * sizeof(uint32_t)));
  }

  std::vector<uint8_t> opcodes;
  std::vector<uint32_t> elements;
  std::vector<uint32_t> properties;
  std::vector<int32_t> units;
  std::vector<float> numbers;
  std::vector<float> bases;
  std::vector<float> output_numbers;
  std::vector<int32_t> output_units;
  std::vector<uint8_t> output_status;
};

struct ElementSlot {
  std::weak_ptr<ElementState> token;
  Rml::ObserverPtr<Rml::Element> element;
  uint64_t active_serial{0};
};

struct Command {
  Opcode opcode;
  uint32_t slot;
  Rml::PropertyId property;
  Rml::NumericValue numeric;
  float base;
};

struct CommandProgress {
  uint32_t consumed{0};
};

struct CommandState {
  std::weak_ptr<ContextState> context;
  std::vector<ElementSlot> elements;
  std::shared_ptr<CommandStorage> storage;
  // Reused per submit; snapshot semantics require one bounded numeric copy.
  std::vector<Command> scratch;
  std::array<v8::Global<v8::ArrayBuffer>, 9> buffers;
  std::shared_ptr<CommandProgress> progress =
      std::make_shared<CommandProgress>();
  uint64_t generation{0};
  uint64_t serial{0};
  bool busy{false};
};

using CommandHandle = sfmljs::SharedHandle<CommandState>;

class BusyScope final {
 public:
  explicit BusyScope(CommandState* state) : state_(state) {
    state_->busy = true;
  }
  ~BusyScope() { state_->busy = false; }

 private:
  CommandState* state_;
};

bool ReadCount(v8::Local<v8::Value> value, uint32_t* count) {
  if (!value->IsUint32()) {
    Nan::ThrowRangeError("Expected an unsigned command count or capacity");
    return false;
  }
  *count = Nan::To<uint32_t>(value).FromJust();
  // V8 typed arrays and native allocations must share a checked upper bound.
  if (*count > (1u << 26)) {
    Nan::ThrowRangeError("Element command capacity exceeds the storage limit");
    return false;
  }
  return true;
}

CommandState* CheckedState(v8::Local<v8::Value> value) {
  auto* handle = CommandHandle::From(value);
  if (!handle) {
    return nullptr;
  }
  auto* state = handle->owner().get();
  const auto context = state->context.lock();
  if (state->generation != State().generation || !context ||
      !context->context) {
    Nan::ThrowError("Element command context is no longer valid");
    return nullptr;
  }
  if (state->busy) {
    Nan::ThrowError("Element command buffer is already being consumed");
    return nullptr;
  }
  return state;
}

void Own(v8::Local<v8::Object> object,
         const char* name,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

template <class View, class T>
void MapPlane(v8::Local<v8::Object> result,
              const char* name,
              const std::shared_ptr<CommandStorage>& storage,
              std::vector<T>* values,
              v8::Global<v8::ArrayBuffer>* retained) {
  auto* isolate = v8::Isolate::GetCurrent();
  auto buffer = sfmljs::MapShared(
      isolate, storage, values->data(), values->size() * sizeof(T));
  retained->Reset(isolate, buffer);
  retained->SetWeak();
  Own(result, name, View::New(buffer, 0, values->size()));
}

v8::Local<v8::Object> Mapping(CommandState* state) {
  auto result = Nan::New<v8::Object>();
  auto& storage = state->storage;
  MapPlane<v8::Uint8Array>(
      result, "opcodes", storage, &storage->opcodes, &state->buffers[0]);
  MapPlane<v8::Uint32Array>(
      result, "elements", storage, &storage->elements, &state->buffers[1]);
  MapPlane<v8::Uint32Array>(
      result, "properties", storage, &storage->properties, &state->buffers[2]);
  MapPlane<v8::Int32Array>(
      result, "units", storage, &storage->units, &state->buffers[3]);
  MapPlane<v8::Float32Array>(
      result, "numbers", storage, &storage->numbers, &state->buffers[4]);
  MapPlane<v8::Float32Array>(
      result, "bases", storage, &storage->bases, &state->buffers[5]);
  MapPlane<v8::Float32Array>(result,
                             "outputNumbers",
                             storage,
                             &storage->output_numbers,
                             &state->buffers[6]);
  MapPlane<v8::Int32Array>(result,
                           "outputUnits",
                           storage,
                           &storage->output_units,
                           &state->buffers[7]);
  MapPlane<v8::Uint8Array>(result,
                           "outputStatus",
                           storage,
                           &storage->output_status,
                           &state->buffers[8]);
  Own(result,
      "capacity",
      Nan::New(static_cast<uint32_t>(storage->opcodes.size())));
  return result;
}

void RetainBuffers(v8::Local<v8::Object> handle, CommandState* state) {
  auto roots = Nan::New<v8::Array>(state->buffers.size());
  for (uint32_t i = 0; i < state->buffers.size(); ++i) {
    roots
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             i,
                             state->buffers[i].Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  // Retain original buffer identities even after hostile input transfer and GC.
  // The edge belongs to the opaque handle, so old views retain bytes only.
  Nan::SetPrivate(
      handle, Nan::New("rml.commands.buffers").ToLocalChecked(), roots)
      .FromJust();
}

bool ReplaceElements(v8::Local<v8::Object> handle,
                     CommandState* state,
                     v8::Local<v8::Value> input) {
  if (!input->IsArray()) {
    Nan::ThrowTypeError("Expected an array of element handles");
    return false;
  }
  const auto context = state->context.lock();
  auto array = input.As<v8::Array>();
  const uint32_t length = array->Length();
  std::vector<ElementSlot> slots;
  slots.reserve(length);
  auto roots = Nan::New<v8::Array>(length);
  for (uint32_t i = 0; i < length; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(array, i).ToLocal(&value)) {
      return false;
    }
    auto* element = ElementOf(value);
    if (!element) {
      return false;
    }
    if (!context || element->GetContext() != context->context) {
      Nan::ThrowError("Element command slot belongs to another context");
      return false;
    }
    const auto* checked = ElementHandle::From(value);
    slots.push_back({checked->owner(), element->GetObserverPtr(), 0});
    roots->CreateDataProperty(Nan::GetCurrentContext(), i, value).FromJust();
  }
  // Accessors may have reparented earlier slots. Recheck before publishing.
  for (const auto& slot : slots) {
    if (!slot.element || !context->context ||
        slot.element->GetContext() != context->context) {
      Nan::ThrowError(
          "Element command slot changed context during registration");
      return false;
    }
  }
  Nan::SetPrivate(
      handle, Nan::New("rml.commands.elements").ToLocalChecked(), roots)
      .FromJust();
  state->elements = std::move(slots);
  return true;
}

bool NumericUnit(int32_t unit) {
  const int numeric = static_cast<int>(Rml::Unit::NUMERIC);
  return unit > 0 && (unit & ~numeric) == 0 && (unit & (unit - 1)) == 0;
}

bool BuffersAttached(CommandState* state) {
  for (const auto& buffer : state->buffers) {
    if (!buffer.IsEmpty() &&
        buffer.Get(v8::Isolate::GetCurrent())->WasDetached()) {
      Nan::ThrowTypeError("Element command mapped buffer was detached");
      return false;
    }
  }
  return true;
}

bool Validate(CommandState* state, uint32_t count) {
  if (count > state->storage->opcodes.size()) {
    Nan::ThrowRangeError("Element command count exceeds capacity");
    return false;
  }
  if (!BuffersAttached(state)) {
    return false;
  }
  auto& storage = *state->storage;
  const auto context = state->context.lock();
  ++state->serial;
  if (count) {
    State().data_diagnostics.Record(&DataDiagnostics::element_command_copies);
  }
  for (uint32_t i = 0; i < count; ++i) {
    const auto opcode = static_cast<Opcode>(storage.opcodes[i]);
    if (opcode < Opcode::kSetNumeric ||
        opcode > Opcode::kStyleResolveRelativeLength ||
        storage.properties[i] >=
            static_cast<uint32_t>(Rml::PropertyId::MaxNumIds) ||
        (opcode == Opcode::kStyleResolveRelativeLength &&
         storage.properties[i] > 5) ||
        storage.elements[i] >= state->elements.size()) {
      Nan::ThrowRangeError("Invalid element command opcode, property or slot");
      return false;
    }
    auto& slot = state->elements[storage.elements[i]];
    const auto token = slot.token.lock();
    if (!token || token->generation != state->generation || !slot.element ||
        token->element != slot.element) {
      Nan::ThrowError("Element command slot is no longer valid");
      return false;
    }
    if (slot.element->GetContext() != context->context) {
      Nan::ThrowError("Element command slot belongs to another context");
      return false;
    }
    if (opcode == Opcode::kSetNumeric || opcode == Opcode::kResolveNumeric ||
        opcode == Opcode::kResolveLength ||
        opcode == Opcode::kStyleSetNumeric ||
        opcode == Opcode::kStyleResolveNumeric ||
        opcode == Opcode::kStyleResolveRelativeLength) {
      if (!std::isfinite(storage.numbers[i]) ||
          !NumericUnit(storage.units[i]) ||
          (opcode == Opcode::kResolveLength &&
           !Rml::Any(static_cast<Rml::Unit>(storage.units[i]) &
                     Rml::Unit::LENGTH)) ||
          ((opcode == Opcode::kResolveNumeric ||
            opcode == Opcode::kStyleResolveNumeric) &&
           !std::isfinite(storage.bases[i]))) {
        Nan::ThrowRangeError(
            "Element command requires a finite number and single numeric unit");
        return false;
      }
    }
    state->scratch[i] = {
        opcode,
        storage.elements[i],
        static_cast<Rml::PropertyId>(storage.properties[i]),
        {storage.numbers[i], static_cast<Rml::Unit>(storage.units[i])},
        storage.bases[i]};
    State().data_diagnostics.Record(
        &DataDiagnostics::element_command_copied_bytes, sizeof(Command));
    if (slot.active_serial != state->serial) {
      slot.active_serial = state->serial;
      State().active_elements.push_back(slot.element.get());
    }
  }
  return true;
}

bool Consume(CommandState* state, uint32_t index) {
  const auto& command = state->scratch[index];
  const auto& slot = state->elements[command.slot];
  auto* element = slot.element.get();
  const auto context = state->context.lock();
  if (!element || !context || !context->context ||
      element->GetContext() != context->context) {
    Nan::ThrowError("Element command slot changed context during consumption");
    return false;
  }
  auto& storage = *state->storage;
  auto& status = storage.output_status[index];
  auto& number = storage.output_numbers[index];
  auto& unit = storage.output_units[index];
  status = static_cast<uint8_t>(Status::kNone);
  number = std::numeric_limits<float>::quiet_NaN();
  unit = static_cast<int32_t>(Rml::Unit::UNKNOWN);
  switch (command.opcode) {
    case Opcode::kSetNumeric:
    case Opcode::kStyleSetNumeric: {
      const Rml::Property value(command.numeric.number, command.numeric.unit);
      const bool accepted =
          command.opcode == Opcode::kStyleSetNumeric
              ? element->GetStyle()->SetProperty(command.property, value)
              : element->SetProperty(command.property, value);
      if (!accepted) {
        Nan::ThrowError("Element command SetProperty was rejected");
        return false;
      }
      break;
    }
    case Opcode::kRemoveProperty:
      element->RemoveProperty(command.property);
      break;
    case Opcode::kStyleRemoveProperty:
      element->GetStyle()->RemoveProperty(command.property);
      break;
    case Opcode::kGetNumeric:
    case Opcode::kGetLocalNumeric:
    case Opcode::kStyleGetNumeric:
    case Opcode::kStyleGetLocalNumeric: {
      const bool local = command.opcode == Opcode::kGetLocalNumeric ||
                         command.opcode == Opcode::kStyleGetLocalNumeric;
      const bool style = command.opcode == Opcode::kStyleGetNumeric ||
                         command.opcode == Opcode::kStyleGetLocalNumeric;
      const auto* property =
          style
              ? (local ? element->GetStyle()->GetLocalProperty(command.property)
                       : element->GetStyle()->GetProperty(command.property))
              : (local ? element->GetLocalProperty(command.property)
                       : element->GetProperty(command.property));
      if (!property) {
        status = static_cast<uint8_t>(Status::kMissing);
      } else if (!Rml::Any(property->unit & Rml::Unit::NUMERIC)) {
        status = static_cast<uint8_t>(Status::kNonNumeric);
      } else {
        const auto value = property->GetNumericValue();
        number = value.number;
        unit = static_cast<int32_t>(value.unit);
        status = static_cast<uint8_t>(Status::kNumeric);
      }
      break;
    }
    case Opcode::kResolveNumeric:
    case Opcode::kResolveLength:
      number = command.opcode == Opcode::kResolveNumeric
                   ? element->ResolveNumericValue(command.numeric, command.base)
                   : element->ResolveLength(command.numeric);
      unit = static_cast<int32_t>(command.opcode == Opcode::kResolveLength
                                      ? Rml::Unit::PX
                                      : Rml::Unit::NUMBER);
      status = static_cast<uint8_t>(Status::kNumeric);
      break;
    case Opcode::kStyleResolveNumeric:
    case Opcode::kStyleResolveRelativeLength:
      number = command.opcode == Opcode::kStyleResolveNumeric
                   ? element->GetStyle()->ResolveNumericValue(command.numeric,
                                                              command.base)
                   : element->GetStyle()->ResolveRelativeLength(
                         command.numeric,
                         static_cast<Rml::RelativeTarget>(command.property));
      unit = static_cast<int32_t>(command.opcode ==
                                          Opcode::kStyleResolveRelativeLength
                                      ? Rml::Unit::PX
                                      : Rml::Unit::NUMBER);
      status = static_cast<uint8_t>(Status::kNumeric);
      break;
  }
  if (status == static_cast<uint8_t>(Status::kNumeric) &&
      !std::isfinite(number)) {
    status = static_cast<uint8_t>(Status::kNone);
    Nan::ThrowRangeError("Element command numeric resolution overflow");
    return false;
  }
  return State().callback_exception.IsEmpty();
}

NAN_METHOD(CreateElementCommands) {
  uint32_t capacity = 0;
  if (!ReadCount(info[2], &capacity)) {
    return;
  }
  v8::Local<v8::Object> result;
  if (CreateElementCommandMapping(info[0], info[1], capacity)
          .ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(SubmitElementCommands) {
  auto* state = CheckedState(info[0]);
  if (!state) {
    return;
  }
  state->progress->consumed = 0;
  uint32_t count = 0;
  if (ReadCount(info[1], &count) && ConsumeElementCommands(info[0], count)) {
    info.GetReturnValue().Set(Nan::New(count));
  }
}

NAN_METHOD(ReserveElementCommands) {
  auto* state = CheckedState(info[0]);
  uint32_t capacity = 0;
  if (!state || !ReadCount(info[1], &capacity)) {
    return;
  }
  if (!BuffersAttached(state)) {
    return;
  }
  BusyScope busy(state);
  auto previous = state->storage;
  if (capacity > previous->opcodes.size()) {
    auto next = std::make_shared<CommandStorage>(capacity);
    const auto copy = [](const auto& from, auto* to) {
      std::copy(from.begin(), from.end(), to->begin());
    };
    copy(previous->opcodes, &next->opcodes);
    copy(previous->elements, &next->elements);
    copy(previous->properties, &next->properties);
    copy(previous->units, &next->units);
    copy(previous->numbers, &next->numbers);
    copy(previous->bases, &next->bases);
    copy(previous->output_numbers, &next->output_numbers);
    copy(previous->output_units, &next->output_units);
    copy(previous->output_status, &next->output_status);
    state->scratch.resize(capacity);
    state->storage = std::move(next);
  }
  auto result = Mapping(state);
  RetainBuffers(info[0].As<v8::Object>(), state);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ReplaceCommandElements) {
  auto* state = CheckedState(info[0]);
  if (!state) {
    return;
  }
  if (!BuffersAttached(state)) {
    return;
  }
  BusyScope busy(state);
  ReplaceElements(info[0].As<v8::Object>(), state, info[1]);
}

}  // namespace

v8::MaybeLocal<v8::Object> CreateElementCommandMapping(
    v8::Local<v8::Value> context,
    v8::Local<v8::Value> elements,
    uint32_t capacity) {
  if (!ContextOf(context)) {
    return {};
  }
  auto state = std::make_shared<CommandState>();
  state->context = ContextHandle::From(context)->owner();
  state->generation = State().generation;
  state->storage = std::make_shared<CommandStorage>(capacity);
  state->scratch.resize(capacity);
  auto handle = CommandHandle::Create(state);
  Nan::SetPrivate(
      handle, Nan::New("rml.commands.context").ToLocalChecked(), context)
      .FromJust();
  if (!ReplaceElements(handle, state.get(), elements)) {
    return {};
  }
  auto result = Mapping(state.get());
  RetainBuffers(handle, state.get());
  Own(result, "handle", handle);
  // Progress backing owns a separate scalar; it must not retain DOM tokens.
  auto consumed = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                    state->progress,
                                    &state->progress->consumed,
                                    sizeof(state->progress->consumed));
  Own(result, "progress", v8::Uint32Array::New(consumed, 0, 1));
  return result;
}

bool PrepareElementCommands(v8::Local<v8::Value> handle) {
  auto* state = CheckedState(handle);
  if (!state) {
    return false;
  }
  state->progress->consumed = 0;
  return BuffersAttached(state);
}

bool ConsumeElementCommands(v8::Local<v8::Value> handle, uint32_t count) {
  auto* state = CheckedState(handle);
  if (!state) {
    return false;
  }
  state->progress->consumed = 0;
  BusyScope busy(state);
  if (!Validate(state, count)) {
    return false;
  }
  for (uint32_t i = 0; i < count; ++i) {
    if (!Consume(state, i)) {
      return false;
    }
    state->progress->consumed = i + 1;
    State().data_diagnostics.Record(
        &DataDiagnostics::element_commands_consumed);
  }
  return true;
}

NAN_MODULE_INIT(InitializeRmlElementCommands) {
  SetRuntimeMethod<CreateElementCommands, true>(target,
                                                "createElementCommands");
  SetRuntimeMethod<SubmitElementCommands, true>(target,
                                                "submitElementCommands");
  SetRuntimeMethod<ReserveElementCommands, true>(target,
                                                 "reserveElementCommands");
  SetRuntimeMethod<ReplaceCommandElements, true>(target,
                                                 "replaceCommandElements");
}

}  // namespace sfmlrmlui
