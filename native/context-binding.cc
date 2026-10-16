#include "context-settings.h"
#include "deferred-delete.h"
#include "exception-boundary.h"
#include "shared-handle.h"

#include <SFML/Window/Context.hpp>
#include <SFML/Window/Vulkan.hpp>

#include <string>
#include <unordered_map>

namespace {

struct ContextState;
using Registry = std::unordered_map<const sf::Context*, std::weak_ptr<ContextState>>;
using Handle = sfmljs::SharedHandle<ContextState>;

struct ContextState {
  explicit ContextState(std::shared_ptr<Registry> registry)
      : registry(std::move(registry)), context(std::make_unique<sf::Context>()) {}
  ContextState(std::shared_ptr<Registry> registry,
               const sf::ContextSettings& settings, sf::Vector2u size)
      : registry(std::move(registry)),
        context(std::make_unique<sf::Context>(settings, size)) {}
  ~ContextState() { registry->erase(context.get()); }
  std::shared_ptr<Registry> registry;
  std::unique_ptr<sf::Context> context;
};

v8::Local<v8::String> RegistryKey() {
  return Nan::New("sfml.context.registry").ToLocalChecked();
}

std::shared_ptr<Registry> CurrentRegistry() {
  auto value = Nan::GetPrivate(Nan::GetCurrentContext()->Global(), RegistryKey())
      .ToLocalChecked();
  return sfmljs::SharedHandle<Registry>::From(value)->owner();
}

v8::Local<v8::BigInt> Key(const sf::Context* context) {
  return v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(),
      reinterpret_cast<std::uintptr_t>(context));
}

v8::Local<v8::Object> MapContext(const std::shared_ptr<ContextState>& state) {
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("handle").ToLocalChecked(),
           Handle::Create(state)).FromJust();
  Nan::Set(result, Nan::New("key").ToLocalChecked(), Key(state->context.get()))
      .FromJust();
  Nan::Set(result, Nan::New("settings").ToLocalChecked(),
      sfmljs::MapContextSettings(v8::Isolate::GetCurrent(), state,
                                 state->context->getSettings())).FromJust();
  return result;
}

NAN_METHOD(CreateContext) {
  const auto registry = CurrentRegistry();
  std::shared_ptr<ContextState> state;
  if (info[0]->IsUndefined()) {
    state = sfmljs::MakeThreadOwned<ContextState>(registry);
  } else {
    sf::ContextSettings settings;
    if (!sfmljs::ReadContextSettings(info[0], settings)) return;
    if (!info[1]->IsUint32() || !info[2]->IsUint32()) {
      return Nan::ThrowRangeError("Expected unsigned context dimensions");
    }
    state = sfmljs::MakeThreadOwned<ContextState>(registry, settings,
        sf::Vector2u{Nan::To<std::uint32_t>(info[1]).FromJust(),
                     Nan::To<std::uint32_t>(info[2]).FromJust()});
  }
  registry->emplace(state->context.get(), state);
  info.GetReturnValue().Set(MapContext(state));
}

NAN_METHOD(SetContextActive) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  info.GetReturnValue().Set(handle->owner()->context->setActive(info[1]->IsTrue()));
}

NAN_METHOD(GetActiveContextKey) {
  if (const auto* context = sf::Context::getActiveContext()) {
    info.GetReturnValue().Set(Key(context));
  }
}

NAN_METHOD(ReferenceActiveContext) {
  const auto* context = sf::Context::getActiveContext();
  if (!context) return;
  const auto registry = CurrentRegistry();
  const auto found = registry->find(context);
  if (found != registry->end()) {
    if (const auto state = found->second.lock()) {
      info.GetReturnValue().Set(MapContext(state));
      return;
    }
  }
  sfmljs::ThrowError("Active sf::Context is not owned by this binding");
}

NAN_METHOD(GetActiveContextId) {
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(info.GetIsolate(),
      sf::Context::getActiveContextId()));
}

bool Name(v8::Local<v8::Value> input, std::string& output) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a name");
    return false;
  }
  Nan::Utf8String name(input);
  output.assign(*name, name.length());
  if (output.empty() || output.find('\0') != std::string::npos) {
    Nan::ThrowTypeError("Expected a nonempty name without null bytes");
    return false;
  }
  return true;
}

NAN_METHOD(IsContextExtensionAvailable) {
  std::string name;
  if (Name(info[0], name)) {
    info.GetReturnValue().Set(sf::Context::isExtensionAvailable(name));
  }
}

NAN_METHOD(GetContextFunction) {
  std::string name;
  if (!Name(info[0], name)) return;
  if (const auto function = sf::Context::getFunction(name.c_str())) {
    info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(info.GetIsolate(),
        reinterpret_cast<std::uintptr_t>(function)));
  }
}

/** 查询当前 SFML 后端的 Vulkan 图形或计算支持。 */
NAN_METHOD(IsVulkanAvailable) {
  if (!info[0]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  info.GetReturnValue().Set(sf::Vulkan::isAvailable(info[0]->IsTrue()));
}

/** 返回函数地址，空指针保持为 JS undefined。 */
NAN_METHOD(GetVulkanFunction) {
  std::string name;
  if (!Name(info[0], name)) return;
  if (const auto function = sf::Vulkan::getFunction(name.c_str())) {
    info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(info.GetIsolate(),
        reinterpret_cast<std::uintptr_t>(function)));
  }
}

/** 复制扩展名，避免 JS 修改 SFML 的静态列表。 */
NAN_METHOD(GetVulkanGraphicsRequiredInstanceExtensions) {
  const auto& extensions = sf::Vulkan::getGraphicsRequiredInstanceExtensions();
  auto result = Nan::New<v8::Array>(static_cast<int>(extensions.size()));
  for (std::uint32_t i = 0; i < extensions.size(); ++i) {
    Nan::Set(result, i, Nan::New(extensions[i]).ToLocalChecked()).FromJust();
  }
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeContext) {
  Nan::SetPrivate(Nan::GetCurrentContext()->Global(), RegistryKey(),
      sfmljs::SharedHandle<Registry>::Create(std::make_shared<Registry>())).FromJust();
  sfmljs::SetMethod<CreateContext>(target, "createContext");
  sfmljs::SetMethod<SetContextActive>(target, "setContextActive");
  sfmljs::SetMethod<GetActiveContextKey>(target, "getActiveContextKey");
  sfmljs::SetMethod<ReferenceActiveContext>(target, "referenceActiveContext");
  sfmljs::SetMethod<GetActiveContextId>(target, "getActiveContextId");
  sfmljs::SetMethod<IsContextExtensionAvailable>(target, "isContextExtensionAvailable");
  sfmljs::SetMethod<GetContextFunction>(target, "getContextFunction");
  sfmljs::SetMethod<IsVulkanAvailable>(target, "isVulkanAvailable");
  sfmljs::SetMethod<GetVulkanFunction>(target, "getVulkanFunction");
  sfmljs::SetMethod<GetVulkanGraphicsRequiredInstanceExtensions>(
      target, "getVulkanGraphicsRequiredInstanceExtensions");
}
