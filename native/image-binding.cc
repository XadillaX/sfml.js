#include "image-state.h"
#include "exception-boundary.h"

#include <exception>
#include <filesystem>
#include <optional>
#include <string>
#include <vector>

namespace {

using sfmljs::ImageHandle;
using sfmljs::ImageState;

std::filesystem::path Utf8Path(const std::string& text) {
  return std::filesystem::path(std::u8string(text.begin(), text.end()));
}

std::shared_ptr<sf::Image> CreatePixels(
    const Nan::FunctionCallbackInfo<v8::Value>& info, int start) {
  sf::Vector2u size;
  if (!sfmljs::ReadImageSize(info[start], info[start + 1], size)) return {};
  const auto input = info[start + 2];
  if (input->IsUint32()) {
    return std::make_shared<sf::Image>(
        size, sf::Color(Nan::To<std::uint32_t>(input).FromJust()));
  }
  std::span<const std::uint8_t> pixels;
  if (!sfmljs::ReadImageBytes(input, pixels)) return {};
  const auto required = static_cast<std::size_t>(size.x) * size.y * 4;
  if (pixels.size() != required) {
    Nan::ThrowRangeError("Pixel length must equal width * height * 4");
    return {};
  }
  return std::make_shared<sf::Image>(size, pixels.data());
}

NAN_METHOD(CreateImage) {
  try {
    std::shared_ptr<sf::Image> image;
    if (info.Length() == 1) {
      auto* source = ImageHandle::From(info[0]);
      if (!source) return;
      image = std::make_shared<sf::Image>(*source->owner()->current);
    } else {
      image = CreatePixels(info, 0);
      if (!image) return;
    }
    info.GetReturnValue().Set(
        sfmljs::MapImageResource(info.GetIsolate(), std::move(image)));
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(ResizeImage) {
  auto* handle = ImageHandle::From(info[0]);
  if (!handle) return;
  try {
    auto image = CreatePixels(info, 1);
    if (!image) return;
    auto result = sfmljs::MapImage(info.GetIsolate(), image);
    handle->owner()->current = std::move(image);
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(MaskImage) {
  auto* handle = ImageHandle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint32() || !info[2]->IsUint32() ||
      Nan::To<std::uint32_t>(info[2]).FromJust() > 255) {
    return Nan::ThrowRangeError("Expected an RGBA integer and a byte alpha");
  }
  handle->owner()->current->createMaskFromColor(
      sf::Color(Nan::To<std::uint32_t>(info[1]).FromJust()),
      static_cast<std::uint8_t>(Nan::To<std::uint32_t>(info[2]).FromJust()));
}

NAN_METHOD(FlipImage) {
  auto* handle = ImageHandle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected flip axis");
  if (info[1]->IsTrue()) handle->owner()->current->flipHorizontally();
  else handle->owner()->current->flipVertically();
}

NAN_METHOD(CopyImage) {
  auto* dest = ImageHandle::From(info[0]);
  if (!dest) return;
  auto* source = ImageHandle::From(info[1]);
  if (!source) return;
  if (!info[2]->IsUint32() || !info[3]->IsUint32() ||
      !info[4]->IsInt32() || !info[5]->IsInt32() ||
      !info[6]->IsInt32() || !info[7]->IsInt32() || !info[8]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected image copy coordinates and alpha flag");
  }
  const sf::Vector2u position{Nan::To<std::uint32_t>(info[2]).FromJust(),
                              Nan::To<std::uint32_t>(info[3]).FromJust()};
  const sf::IntRect rect{
      {Nan::To<int>(info[4]).FromJust(), Nan::To<int>(info[5]).FromJust()},
      {Nan::To<int>(info[6]).FromJust(), Nan::To<int>(info[7]).FromJust()}};
  try {
    // SFML's memcpy path is undefined for overlap. Self-copy uses a snapshot,
    // also making alpha blending independent of the direction of traversal.
    auto input = source->owner()->current;
    if (input == dest->owner()->current) {
      input = std::make_shared<sf::Image>(*input);
    }
    info.GetReturnValue().Set(dest->owner()->current->copy(
        *input, position, rect, Nan::To<bool>(info[8]).FromJust()));
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

enum class ImageJob { LoadFile, LoadMemory, SaveFile, SaveMemory };

class ImageWorker final : public sfmljs::AsyncWorker {
 public:
  ImageWorker(Nan::Callback* callback, ImageJob job,
              std::shared_ptr<ImageState> state,
              std::shared_ptr<sf::Image> snapshot, std::string text,
              std::vector<std::uint8_t> input)
      : sfmljs::AsyncWorker(callback, "sfml:Image"), job_(job),
        state_(std::move(state)), image_(std::move(snapshot)),
        text_(std::move(text)), input_(std::move(input)) {}

  void ExecuteWork() override {
    // No V8, NAN object creation, or access to state_->current on this thread.
    try {
      switch (job_) {
        case ImageJob::LoadFile:
          image_ = std::make_shared<sf::Image>();
          ok_ = image_->loadFromFile(Utf8Path(text_));
          break;
        case ImageJob::LoadMemory:
          image_ = std::make_shared<sf::Image>();
          ok_ = image_->loadFromMemory(input_.data(), input_.size());
          break;
        case ImageJob::SaveFile:
          ok_ = image_->saveToFile(Utf8Path(text_));
          break;
        case ImageJob::SaveMemory:
          encoded_ = image_->saveToMemory(text_);
          ok_ = encoded_.has_value();
          break;
      }
    } catch (const std::exception& error) {
      SetErrorMessage(error.what());
    } catch (...) {
      SetErrorMessage("Unknown SFML image error");
    }
  }

  void CompleteWork() override {
    Nan::HandleScope scope;
    v8::Local<v8::Value> result = Nan::Undefined();
    try {
      if (job_ == ImageJob::LoadFile || job_ == ImageJob::LoadMemory) {
        if (ok_) {
          if (sfmljs::ImageBytes(*image_) > node::Buffer::kMaxLength) {
            SetErrorMessage("Decoded image exceeds the pixel buffer limit");
            return HandleErrorCallback();
          }
          result = sfmljs::MapImage(v8::Isolate::GetCurrent(), image_);
          state_->current = image_;
        }
      } else if (job_ == ImageJob::SaveFile) {
        result = Nan::New(ok_);
      } else if (ok_) {
        auto bytes = std::make_shared<std::vector<std::uint8_t>>(
            std::move(*encoded_));
        if (bytes->size() > node::Buffer::kMaxLength) {
          SetErrorMessage("Encoded image exceeds the byte buffer limit");
          return HandleErrorCallback();
        }
        auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(), bytes,
                                        bytes->data(), bytes->size());
        result = v8::Uint8Array::New(buffer, 0, bytes->size());
      }
    } catch (const std::exception& error) {
      SetErrorMessage(error.what());
      return HandleErrorCallback();
    }
    v8::Local<v8::Value> args[] = {Nan::Null(), result};
    callback->Call(2, args, async_resource);
  }

 private:
  ImageJob job_;
  std::shared_ptr<ImageState> state_;
  std::shared_ptr<sf::Image> image_;
  std::string text_;
  std::vector<std::uint8_t> input_;
  std::optional<std::vector<std::uint8_t>> encoded_;
  bool ok_{false};
};

template <ImageJob Job>
NAN_METHOD(QueueImageJob) {
  auto* handle = ImageHandle::From(info[0]);
  if (!handle) return;
  if (!info[2]->IsFunction()) return Nan::ThrowTypeError("Expected callback");
  try {
    std::string text;
    std::vector<std::uint8_t> input;
    if constexpr (Job == ImageJob::LoadMemory) {
      std::span<const std::uint8_t> bytes;
      if (!sfmljs::ReadImageBytes(info[1], bytes)) return;
      // Snapshot now: caller may mutate, detach, or release input after return.
      if (!bytes.empty()) input.assign(bytes.begin(), bytes.end());
    } else {
      if (!info[1]->IsString()) return Nan::ThrowTypeError("Expected a string");
      Nan::Utf8String string(info[1]);
      text.assign(*string, string.length());
      if (text.find('\0') != std::string::npos) {
        return Nan::ThrowTypeError("Image path or format contains a null byte");
      }
      if constexpr (Job == ImageJob::LoadFile || Job == ImageJob::SaveFile) {
        // Capture relative paths at invocation, before process.chdir can occur.
        if (!text.empty()) {
          const auto path = std::filesystem::absolute(
              Utf8Path(text)).u8string();
          text.assign(reinterpret_cast<const char*>(path.data()), path.size());
        }
      }
    }
    std::shared_ptr<sf::Image> snapshot;
    if constexpr (Job == ImageJob::SaveFile || Job == ImageJob::SaveMemory) {
      // A shared writable view makes background reads of current a data race.
      snapshot = std::make_shared<sf::Image>(*handle->owner()->current);
    }
    auto callback = std::make_unique<Nan::Callback>(info[2].As<v8::Function>());
    auto worker = std::make_unique<ImageWorker>(callback.get(), Job,
        handle->owner(), std::move(snapshot), std::move(text), std::move(input));
    callback.release();
    Nan::AsyncQueueWorker(worker.release());
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeImage) {
  sfmljs::SetMethod<CreateImage>(target, "createImage");
  sfmljs::SetMethod<ResizeImage>(target, "resizeImage");
  sfmljs::SetMethod<MaskImage>(target, "maskImage");
  sfmljs::SetMethod<FlipImage>(target, "flipImage");
  sfmljs::SetMethod<CopyImage>(target, "copyImage");
  sfmljs::SetMethod<QueueImageJob<ImageJob::LoadFile>>(target, "loadImageFile");
  sfmljs::SetMethod<QueueImageJob<ImageJob::LoadMemory>>(target, "loadImageMemory");
  sfmljs::SetMethod<QueueImageJob<ImageJob::SaveFile>>(target, "saveImageFile");
  sfmljs::SetMethod<QueueImageJob<ImageJob::SaveMemory>>(target, "saveImageMemory");
}
