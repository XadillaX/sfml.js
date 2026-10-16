#include "audio-state.h"

#include <deque>
#include <mutex>

namespace sfmljs::audio {

using DeviceData = std::array<std::uint32_t, 4>;

NAN_METHOD(CreateAudioDeviceState) {
  auto data = std::make_shared<DeviceData>();
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", SharedHandle<DeviceData>::Create(data));
  Set(result, "buffer", MapShared(info.GetIsolate(), data, data->data(), sizeof(*data)));
  info.GetReturnValue().Set(result);
}

v8::Local<v8::Array> Strings(const std::vector<std::string>& strings) {
  auto values = Nan::New<v8::Array>(strings.size());
  for (unsigned i = 0; i < strings.size(); ++i) {
    Nan::Set(values, i, Nan::New(strings[i]).ToLocalChecked()).FromJust();
  }
  return values;
}

NAN_METHOD(AudioDevice) {
  auto* handle = SharedHandle<DeviceData>::From(info[0]);
  unsigned command;
  if (!handle || !Unsigned(info[1], command)) return;
  auto& data = *handle->owner();
  std::string name;
  switch (command) {
    case 0: info.GetReturnValue().Set(Strings(sf::PlaybackDevice::getAvailableDevices())); break;
    case 1:
      if (const auto value = sf::PlaybackDevice::getDefaultDevice()) {
        info.GetReturnValue().Set(Nan::New(*value).ToLocalChecked());
      }
      break;
    case 2:
      if (!String(info[2], name)) return;
      data[3] = sf::PlaybackDevice::setDevice(name);
      break;
    case 3: data[3] = sf::PlaybackDevice::setDeviceToDefault(); break;
    case 4: data[3] = sf::PlaybackDevice::setDeviceToNull(); break;
    case 5:
      if (const auto value = sf::PlaybackDevice::getDevice()) {
        info.GetReturnValue().Set(Nan::New(*value).ToLocalChecked());
      }
      break;
    case 6: {
      const auto value = sf::PlaybackDevice::getDeviceSampleRate();
      data[0] = value.value_or(0); data[1] = value.has_value();
      break;
    }
    case 7: data[2] = sf::PlaybackDevice::isDefaultDevice(); break;
    default: return Nan::ThrowRangeError("Unknown playback device command");
  }
}

struct NotificationSink {
  uv_async_t async{};
  Nan::Persistent<v8::Function> callback;
  std::unique_ptr<Nan::AsyncResource> resource;
  std::deque<unsigned> pending;
  bool closing{};
};
std::mutex notificationMutex;
std::weak_ptr<NotificationSink> notificationTarget;
std::once_flag notificationInstalled;

void NotificationCleanup(void* pointer) {
  auto* retained = static_cast<std::shared_ptr<NotificationSink>*>(pointer);
  const auto sink = *retained;
  {
    std::lock_guard lock(notificationMutex);
    sink->closing = true;
    if (notificationTarget.lock() == sink) notificationTarget.reset();
  }
  sink->callback.Reset();
  sink->resource.reset();
  uv_close(reinterpret_cast<uv_handle_t*>(&sink->async), [](uv_handle_t* value) {
    delete static_cast<std::shared_ptr<NotificationSink>*>(value->data);
  });
}

NAN_METHOD(AudioDeviceNotifications) {
  if (!info[0]->IsFunction() && !info[0]->IsNullOrUndefined()) {
    return Nan::ThrowTypeError("Expected a notification callback or null");
  }
  if (info[0]->IsNullOrUndefined()) {
    std::lock_guard lock(notificationMutex);
    if (auto sink = notificationTarget.lock()) sink->pending.clear();
    notificationTarget.reset();
    return;
  }
  const auto key = Nan::New("sfml.audio.notifications").ToLocalChecked();
  auto global = Nan::GetCurrentContext()->Global();
  auto old = Nan::GetPrivate(global, key).ToLocalChecked();
  std::shared_ptr<NotificationSink> sink;
  if (old->IsObject()) {
    sink = SharedHandle<NotificationSink>::From(old)->owner();
  } else {
    sink = std::make_shared<NotificationSink>();
    sink->resource = std::make_unique<Nan::AsyncResource>("sfml:AudioDevice");
    const int status = uv_async_init(node::GetCurrentEventLoop(info.GetIsolate()),
      &sink->async, [](uv_async_t* async) {
        auto sink = *static_cast<std::shared_ptr<NotificationSink>*>(async->data);
        std::deque<unsigned> events;
        {
          std::lock_guard lock(notificationMutex);
          if (sink->closing || notificationTarget.lock() != sink) {
            sink->pending.clear();
            return;
          }
          events.swap(sink->pending);
        }
        Nan::HandleScope scope;
        for (const auto event : events) {
          {
            std::lock_guard lock(notificationMutex);
            if (notificationTarget.lock() != sink) break;
          }
          v8::Local<v8::Value> args[] = {Nan::New(event)};
          Nan::TryCatch caught;
          sink->resource->runInAsyncScope(Nan::GetCurrentContext()->Global(),
                                          Nan::New(sink->callback), 1, args);
          if (caught.HasCaught()) { Nan::FatalException(caught); break; }
        }
      });
    if (status != 0) return sfmljs::ThrowError(uv_strerror(status));
    sink->async.data = new std::shared_ptr<NotificationSink>(sink);
    uv_unref(reinterpret_cast<uv_handle_t*>(&sink->async));
    node::AddEnvironmentCleanupHook(info.GetIsolate(), NotificationCleanup, sink->async.data);
    Nan::SetPrivate(global, key, SharedHandle<NotificationSink>::Create(sink)).FromJust();
  }
  sink->callback.Reset(info[0].As<v8::Function>());
  {
    std::lock_guard lock(notificationMutex);
    sink->pending.clear();
    notificationTarget = sink;
  }
  std::call_once(notificationInstalled, [] {
    sf::PlaybackDevice::setNotificationCallback([](sf::PlaybackDevice::Notification event) {
      std::lock_guard lock(notificationMutex);
      if (auto target = notificationTarget.lock(); target && !target->closing) {
        target->pending.push_back(static_cast<unsigned>(event));
        uv_async_send(&target->async);
      }
    });
  });
}

} // namespace sfmljs::audio

NAN_MODULE_INIT(InitializeAudioDevices) {
  using namespace sfmljs::audio;
  sfmljs::SetMethod<CreateAudioDeviceState>(target, "createAudioDeviceState");
  sfmljs::SetMethod<AudioDevice>(target, "audioDevice");
  sfmljs::SetMethod<AudioDeviceNotifications>(target, "audioDeviceNotifications");
}
