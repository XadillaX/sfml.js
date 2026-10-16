#include "graphics-state.h"
#include "exception-boundary.h"
#include "shared-handle.h"

#include <SFML/Window/Context.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>

#include <array>
#include <exception>
#include <filesystem>
#include <optional>
#include <string>
#include <vector>

namespace {

using State = sfmljs::ShaderState;
using Handle = sfmljs::SharedHandle<State>;
using ProgramHandle = sfmljs::SharedHandle<sf::Shader>;
using ContextHandle = sfmljs::SharedHandle<sfmljs::GraphicsContext>;

NAN_METHOD(CreateShader) {
  auto* context = ContextHandle::From(info[0]);
  if (!context) return;
  try {
    auto owner = context->owner();
    const auto id = owner->nextId++;
    auto state = sfmljs::MakeThreadOwned<State>(owner, id);
    owner->shaders.emplace(id, state);
    auto result = Nan::New<v8::Object>();
    Nan::Set(result, Nan::New("handle").ToLocalChecked(),
             Handle::Create(state)).FromJust();
    Nan::Set(result, Nan::New("id").ToLocalChecked(), Nan::New(id)).FromJust();
    Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
        sfmljs::MapShared(info.GetIsolate(), state, &state->programId,
                          sizeof(state->programId))).FromJust();
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

using Sources = std::array<std::optional<std::string>, 3>;

class CompileWorker final : public sfmljs::AsyncWorker {
 public:
  CompileWorker(Nan::Callback* callback, bool memory, Sources sources)
      : sfmljs::AsyncWorker(callback, "sfml:Shader"), memory_(memory),
        sources_(std::move(sources)) {}

  void ExecuteWork() override {
    // Compile a separate program. Only the JS thread may replace active state.
    try {
      program_ = std::make_shared<sf::Shader>();
      std::array<std::filesystem::path, 3> paths;
      if (!memory_) {
        for (std::size_t i = 0; i < paths.size(); ++i) {
          if (sources_[i]) {
            const auto& text = *sources_[i];
            paths[i] = std::filesystem::path(std::u8string(text.begin(), text.end()));
          }
        }
      }
      const auto count = static_cast<unsigned>(sources_[0].has_value()) +
          sources_[1].has_value() + sources_[2].has_value();
      if (count == 1) {
        const unsigned i = sources_[0] ? 0 : sources_[1] ? 1 : 2;
        const auto type = static_cast<sf::Shader::Type>(i);
        ok_ = memory_ ? program_->loadFromMemory(*sources_[i], type)
                      : program_->loadFromFile(paths[i], type);
      } else if (count == 2) {
        ok_ = memory_ ? program_->loadFromMemory(*sources_[0], *sources_[2])
                      : program_->loadFromFile(paths[0], paths[2]);
      } else {
        ok_ = memory_ ? program_->loadFromMemory(
                          *sources_[0], *sources_[1], *sources_[2])
                      : program_->loadFromFile(paths[0], paths[1], paths[2]);
      }
    } catch (const std::exception& error) {
      SetErrorMessage(error.what());
    } catch (...) {
      SetErrorMessage("Unknown SFML shader error");
    }
  }

  void CompleteWork() override {
    Nan::HandleScope scope;
    v8::Local<v8::Value> result = Nan::Undefined();
    if (ok_) result = ProgramHandle::Create(program_);
    v8::Local<v8::Value> args[] = {Nan::Null(), result};
    callback->Call(2, args, async_resource);
  }

 private:
  bool memory_;
  Sources sources_;
  std::shared_ptr<sf::Shader> program_;
  bool ok_{};
};

NAN_METHOD(CompileShader) {
  if (!info[0]->IsBoolean() || !info[1]->IsArray() || !info[2]->IsFunction()) {
    return Nan::ThrowTypeError("Expected shader sources and callback");
  }
  auto array = info[1].As<v8::Array>();
  if (array->Length() != 3) return Nan::ThrowTypeError("Expected three shader stages");
  try {
    Sources sources;
    for (unsigned i = 0; i < sources.size(); ++i) {
      v8::Local<v8::Value> value;
      if (!Nan::Get(array, i).ToLocal(&value)) return;
      if (value->IsNull()) continue;
      if (!value->IsString()) return Nan::ThrowTypeError("Expected shader source");
      Nan::Utf8String text(value);
      sources[i] = std::string(*text, text.length());
    }
    const unsigned count = static_cast<unsigned>(sources[0].has_value()) +
        sources[1].has_value() + sources[2].has_value();
    if (count == 0 || (count == 2 && (!sources[0] || !sources[2]))) {
      return Nan::ThrowTypeError("Invalid shader stage combination");
    }
    auto callback = std::make_unique<Nan::Callback>(info[2].As<v8::Function>());
    auto worker = std::make_unique<CompileWorker>(
        callback.get(), info[0]->IsTrue(), std::move(sources));
    callback.release();
    Nan::AsyncQueueWorker(worker.release());
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(CommitShader) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  auto* program = ProgramHandle::From(info[1]);
  if (!program) return;
  handle->owner()->current = program->owner();
  handle->owner()->programId = program->owner()->getNativeHandle();
  handle->owner()->textures.clear();
}

template <typename T, std::size_t Size>
void SetArray(sf::Shader& shader, const std::string& name, const float* data,
              std::size_t count) {
  std::vector<T> values;
  values.reserve(count);
  for (std::size_t i = 0; i < count; ++i, data += Size) {
    if constexpr (Size == 2) values.emplace_back(data[0], data[1]);
    else if constexpr (Size == 3) values.emplace_back(data[0], data[1], data[2]);
    else if constexpr (Size == 4) values.emplace_back(data[0], data[1], data[2], data[3]);
    else values.emplace_back(data);
  }
  shader.setUniformArray(name, values.data(), values.size());
}

NAN_METHOD(SetShaderUniform) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsString() || !info[2]->IsUint32() || !info[4]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected a uniform name, type, data and array flag");
  }
  const auto type = Nan::To<unsigned>(info[2]).FromJust();
  constexpr std::array<std::size_t, 14> sizes{1, 1, 1, 2, 3, 4, 2, 3, 4, 2, 3, 4, 9, 16};
  if (type >= sizes.size()) return Nan::ThrowRangeError("Invalid uniform type");
  const bool floating = type == 0 || (type >= 3 && type <= 5) || type >= 12;
  const bool array = info[4]->IsTrue();
  if ((floating && !info[3]->IsFloat32Array()) ||
      (!floating && !info[3]->IsInt32Array()) || (array && !floating)) {
    return Nan::ThrowTypeError("Uniform data type mismatch");
  }
  const auto length = info[3].As<v8::TypedArray>()->Length();
  if ((!array && length != sizes[type]) || length % sizes[type] != 0) {
    return Nan::ThrowRangeError("Invalid uniform data length");
  }
  if (array && length == 0) return;
  Nan::Utf8String text(info[1]);
  const std::string name(*text, text.length());
  auto& shader = *handle->owner()->current;
  try {
    if (floating) {
      Nan::TypedArrayContents<float> values(info[3]);
      const auto* v = *values;
      if (array) {
        const auto count = length / sizes[type];
        switch (type) {
          case 0: shader.setUniformArray(name, v, count); break;
          case 3: SetArray<sf::Glsl::Vec2, 2>(shader, name, v, count); break;
          case 4: SetArray<sf::Glsl::Vec3, 3>(shader, name, v, count); break;
          case 5: SetArray<sf::Glsl::Vec4, 4>(shader, name, v, count); break;
          case 12: SetArray<sf::Glsl::Mat3, 9>(shader, name, v, count); break;
          case 13: SetArray<sf::Glsl::Mat4, 16>(shader, name, v, count); break;
        }
      } else {
        switch (type) {
          case 0: shader.setUniform(name, v[0]); break;
          case 3: shader.setUniform(name, sf::Glsl::Vec2(v[0], v[1])); break;
          case 4: shader.setUniform(name, sf::Glsl::Vec3(v[0], v[1], v[2])); break;
          case 5: shader.setUniform(name, sf::Glsl::Vec4(v[0], v[1], v[2], v[3])); break;
          case 12: shader.setUniform(name, sf::Glsl::Mat3(v)); break;
          case 13: shader.setUniform(name, sf::Glsl::Mat4(v)); break;
        }
      }
    } else {
      Nan::TypedArrayContents<int> values(info[3]);
      const auto* v = *values;
      switch (type) {
        case 1: shader.setUniform(name, v[0]); break;
        case 2: shader.setUniform(name, v[0] != 0); break;
        case 6: shader.setUniform(name, sf::Glsl::Ivec2(v[0], v[1])); break;
        case 7: shader.setUniform(name, sf::Glsl::Ivec3(v[0], v[1], v[2])); break;
        case 8: shader.setUniform(name, sf::Glsl::Ivec4(v[0], v[1], v[2], v[3])); break;
        case 9: shader.setUniform(name, sf::Glsl::Bvec2(v[0] != 0, v[1] != 0)); break;
        case 10: shader.setUniform(name, sf::Glsl::Bvec3(v[0] != 0, v[1] != 0, v[2] != 0)); break;
        case 11: shader.setUniform(name, sf::Glsl::Bvec4(v[0] != 0, v[1] != 0, v[2] != 0, v[3] != 0)); break;
      }
    }
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(SetShaderTexture) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsString()) return Nan::ThrowTypeError("Expected a uniform name");
  Nan::Utf8String text(info[1]);
  const std::string name(*text, text.length());
  auto& state = *handle->owner();
  if (info[2]->IsNull()) {
    state.current->setUniform(name, sf::Shader::CurrentTexture);
    return;
  }
  auto texture = sfmljs::ReadTexture(info[2]);
  if (!texture) return;
  try {
    // Mirror SFML's accepted sampler locations, including aliases like a/a[0].
    // Keep its pointer table alive even when CurrentTexture or a scalar is set.
    const State::Lock lock;
#ifdef SFML_SYSTEM_WINDOWS
    using Location = int (__stdcall*)(unsigned, const char*);
#else
    using Location = int (*)(unsigned, const char*);
#endif
    const auto locationFunction = reinterpret_cast<Location>(
        sf::Context::getFunction("glGetUniformLocation"));
    const auto program = state.current->getNativeHandle();
    if (!program || !locationFunction) return;
    const int location = locationFunction(program, name.c_str());
    GLint maximum{};
    glGetIntegerv(0x8B4D /* GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS */, &maximum);
    const bool accepted = location >= 0 &&
        (state.textures.contains(location) ||
         state.textures.size() + 1 < static_cast<std::size_t>(maximum));
    state.current->setUniform(name, *texture);
    if (accepted) {
      state.textures[location] = std::move(texture);
      info.GetReturnValue().Set(Nan::New(location));
    }
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(GetShaderNativeHandle) {
  auto* handle = Handle::From(info[0]);
  if (handle) info.GetReturnValue().Set(Nan::New(handle->owner()->current->getNativeHandle()));
}

NAN_METHOD(BindShader) {
  if (info[0]->IsNull()) return sf::Shader::bind(nullptr);
  auto* handle = Handle::From(info[0]);
  if (handle) sf::Shader::bind(handle->owner()->current.get());
}

NAN_METHOD(IsShaderAvailable) {
  info.GetReturnValue().Set(info[0]->IsTrue()
      ? sf::Shader::isGeometryAvailable() : sf::Shader::isAvailable());
}

}  // namespace

NAN_MODULE_INIT(InitializeShader) {
  sfmljs::SetMethod<CreateShader>(target, "createShader");
  sfmljs::SetMethod<CompileShader>(target, "compileShader");
  sfmljs::SetMethod<CommitShader>(target, "commitShader");
  sfmljs::SetMethod<SetShaderUniform>(target, "setShaderUniform");
  sfmljs::SetMethod<SetShaderTexture>(target, "setShaderTexture");
  sfmljs::SetMethod<GetShaderNativeHandle>(target, "getShaderNativeHandle");
  sfmljs::SetMethod<BindShader>(target, "bindShader");
  sfmljs::SetMethod<IsShaderAvailable>(target, "isShaderAvailable");
}
