#include <map>

#include "keyboard.h"
#include "mouse.h"
#include "joystick.h"
#include "sensor.h"
#include "poll_event.h"

namespace node_sfml {
namespace poll_event {

using std::map;
using std::string;
using v8::EscapableHandleScope;
using v8::Isolate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;

#define EVENT_TYPES(V)                                                         \
  V(Closed)                                                                    \
  V(Resized)                                                                   \
  V(LostFocus)                                                                 \
  V(GainedFocus)                                                               \
  V(TextEntered)                                                               \
  V(KeyPressed)                                                                \
  V(KeyReleased)                                                               \
  V(MouseWheelMoved)                                                           \
  V(MouseWheelScrolled)                                                        \
  V(MouseButtonPressed)                                                        \
  V(MouseButtonReleased)                                                       \
  V(MouseMoved)                                                                \
  V(MouseEntered)                                                              \
  V(MouseLeft)                                                                 \
  V(JoystickButtonPressed)                                                     \
  V(JoystickButtonReleased)                                                    \
  V(JoystickMoved)                                                             \
  V(JoystickConnected)                                                         \
  V(JoystickDisconnected)                                                      \
  V(TouchBegan)                                                                \
  V(TouchMoved)                                                                \
  V(TouchEnded)                                                                \
  V(SensorChanged)                                                             \
  V(Count)

map<string, Nan::Persistent<String>> persistent_strings;

inline Local<String> GetCachedColumn(Isolate* isolate, const string name) {
  auto it = persistent_strings.find(name);
  if (it == persistent_strings.end()) {
    Local<String> ret = Nan::New(name).ToLocalChecked();
    persistent_strings[name].Reset(ret);
    return ret;
  }

  return it->second.Get(isolate);
}

void ConvertUTF32ToUTF16(sf::Uint32 utf32,
                         sf::Uint16* utf16,
                         size_t* out_length) {
  if (utf32 < 0x10000) {
    *utf16 = utf32;
    *out_length = 1;
    return;
  }

  sf::Uint32 t = utf32 - 0x10000;
  utf16[0] = (((t << 12) >> 22) + 0xd800);
  utf16[1] = (((t << 22) >> 22) + 0xdc00);
  *out_length = 2;
}

MaybeLocal<Object> EventToV8Object(Isolate* isolate, const sf::Event& event) {
  EscapableHandleScope scope(isolate);
  Local<Object> ret = Nan::New<Object>();
  Local<String> type_column = GetCachedColumn(isolate, "type");

#define SET_RET_EVENT_TYPE(name)                                               \
  case sf::Event::name: {                                                      \
    Nan::Set(ret, type_column, Nan::New(#name).ToLocalChecked());              \
    break;                                                                     \
  }

  // Set event type
  switch (event.type) {
    EVENT_TYPES(SET_RET_EVENT_TYPE)
    default: {
      Local<Object> empty;
      char message[48];
      snprintf(
          message, sizeof(message), "Unsupport event type %d.", event.type);
      Nan::ThrowTypeError(message);
      return scope.Escape(empty);
    }
  }

  // Set event union
  // TODO(XadillaX): Merge with `Set event type`.
  switch (event.type) {
    case sf::Event::Resized: {
      Local<Object> size = Nan::New<Object>();
      Nan::Set(
          size, GetCachedColumn(isolate, "width"), Nan::New(event.size.width));
      Nan::Set(size,
               GetCachedColumn(isolate, "height"),
               Nan::New(event.size.height));
      Nan::Set(ret, GetCachedColumn(isolate, "size"), size);
      break;
    }

    case sf::Event::KeyPressed:
    case sf::Event::KeyReleased: {
      Local<Object> key = Nan::New<Object>();
      Nan::Set(key, GetCachedColumn(isolate, "code"), Nan::New(event.key.code));
      Nan::Set(key,
               GetCachedColumn(isolate, "codeStr"),
               Nan::New(node_sfml::gen::keycode_itoa[event.key.code])
                   .ToLocalChecked());

      Nan::Set(key, GetCachedColumn(isolate, "alt"), Nan::New(event.key.alt));
      Nan::Set(
          key, GetCachedColumn(isolate, "shift"), Nan::New(event.key.shift));
      Nan::Set(key,
               GetCachedColumn(isolate, "control"),
               Nan::New(event.key.control));
      Nan::Set(
          key, GetCachedColumn(isolate, "system"), Nan::New(event.key.system));

      Nan::Set(ret, GetCachedColumn(isolate, "key"), key);
      break;
    }

    case sf::Event::TextEntered: {
      Local<Object> text = Nan::New<Object>();
      sf::Uint32 unicode = event.text.unicode;
      uint16_t utf16[3] = {0, 0, 0};
      size_t utf16_length;
      ConvertUTF32ToUTF16(unicode, utf16, &utf16_length);

      Local<String> str =
          String::NewFromTwoByte(
              isolate, utf16, v8::NewStringType::kNormal, utf16_length)
              .ToLocalChecked();

      Nan::Set(text,
               GetCachedColumn(isolate, "unicode"),
               Nan::New(event.text.unicode));
      Nan::Set(text, GetCachedColumn(isolate, "content"), str);
      Nan::Set(ret, GetCachedColumn(isolate, "text"), text);

      break;
    }

    case sf::Event::MouseMoved: {
      Local<Object> mouse_move = Nan::New<Object>();
      Nan::Set(mouse_move,
               GetCachedColumn(isolate, "x"),
               Nan::New(event.mouseMove.x));
      Nan::Set(mouse_move,
               GetCachedColumn(isolate, "y"),
               Nan::New(event.mouseMove.y));
      Nan::Set(ret, GetCachedColumn(isolate, "mouseMove"), mouse_move);
      break;
    }

    case sf::Event::MouseButtonPressed:
    case sf::Event::MouseButtonReleased: {
      Local<Object> mouse_button = Nan::New<Object>();
      Nan::Set(mouse_button,
               GetCachedColumn(isolate, "x"),
               Nan::New(event.mouseButton.x));
      Nan::Set(mouse_button,
               GetCachedColumn(isolate, "y"),
               Nan::New(event.mouseButton.y));
      Nan::Set(mouse_button,
               GetCachedColumn(isolate, "button"),
               Nan::New(event.mouseButton.button));
      Nan::Set(mouse_button,
               GetCachedColumn(isolate, "buttonStr"),
               GetCachedColumn(
                   isolate, gen::mouse_button_itoa[event.mouseButton.button]));

      Nan::Set(ret, GetCachedColumn(isolate, "mouseButton"), mouse_button);

      break;
    }

    // Deprecated
    case sf::Event::MouseWheelMoved: {
      Local<Object> mouse_wheel = Nan::New<Object>();
      Nan::Set(mouse_wheel,
               GetCachedColumn(isolate, "x"),
               Nan::New(event.mouseWheel.x));
      Nan::Set(mouse_wheel,
               GetCachedColumn(isolate, "y"),
               Nan::New(event.mouseWheel.y));
      Nan::Set(mouse_wheel,
               GetCachedColumn(isolate, "delta"),
               Nan::New(event.mouseWheel.delta));
      Nan::Set(ret, GetCachedColumn(isolate, "mouseWheel"), mouse_wheel);
      break;
    }

    case sf::Event::MouseWheelScrolled: {
      Local<Object> mouse_wheel_scroll = Nan::New<Object>();
      Nan::Set(mouse_wheel_scroll,
               GetCachedColumn(isolate, "x"),
               Nan::New(event.mouseWheelScroll.x));
      Nan::Set(mouse_wheel_scroll,
               GetCachedColumn(isolate, "y"),
               Nan::New(event.mouseWheelScroll.y));
      Nan::Set(mouse_wheel_scroll,
               GetCachedColumn(isolate, "delta"),
               Nan::New(event.mouseWheelScroll.delta));
      Nan::Set(mouse_wheel_scroll,
               GetCachedColumn(isolate, "wheel"),
               Nan::New(event.mouseWheelScroll.wheel));
      Nan::Set(mouse_wheel_scroll,
               GetCachedColumn(isolate, "wheelStr"),
               Nan::New(gen::mouse_wheel_itoa[event.mouseWheelScroll.wheel])
                   .ToLocalChecked());
      Nan::Set(ret,
               GetCachedColumn(isolate, "mouseWheelScroll"),
               mouse_wheel_scroll);
      break;
    }

    case sf::Event::JoystickButtonPressed:
    case sf::Event::JoystickButtonReleased: {
      Local<Object> joystickButton = Nan::New<Object>();
      Nan::Set(joystickButton,
               GetCachedColumn(isolate, "joystickId"),
               Nan::New(event.joystickButton.joystickId));
      Nan::Set(joystickButton,
               GetCachedColumn(isolate, "button"),
               Nan::New(event.joystickButton.button));
      Nan::Set(ret,
               GetCachedColumn(isolate, "joystickButton"),
               joystickButton);
      break;
    }

    case sf::Event::JoystickConnected:
    case sf::Event::JoystickDisconnected: {
      Local<Object> joystickConnect = Nan::New<Object>();
      Nan::Set(joystickConnect,
               GetCachedColumn(isolate, "joystickId"),
               Nan::New(event.joystickConnect.joystickId));
      Nan::Set(ret,
               GetCachedColumn(isolate, "joystickConnect"),
               joystickConnect);
      break;
    }

    case sf::Event::JoystickMoved: {
      Local<Object> joystickMove = Nan::New<Object>();
      Nan::Set(joystickMove,
               GetCachedColumn(isolate, "joystickId"),
               Nan::New(event.joystickMove.joystickId));
      Nan::Set(joystickMove,
               GetCachedColumn(isolate, "axis"),
               Nan::New(event.joystickMove.axis));
      Nan::Set(joystickMove,
               GetCachedColumn(isolate, "axisStr"),
               Nan::New(gen::joystick_axis_itoa[event.joystickMove.axis])
                   .ToLocalChecked());
      Nan::Set(joystickMove,
               GetCachedColumn(isolate, "position"),
               Nan::New(event.joystickMove.position));
      Nan::Set(ret,
               GetCachedColumn(isolate, "joystickMove"),
               joystickMove);
      break;
    }

    case sf::Event::TouchBegan:
    case sf::Event::TouchMoved:
    case sf::Event::TouchEnded: {
      Local<Object> touch = Nan::New<Object>();
      Nan::Set(touch,
               GetCachedColumn(isolate, "finger"),
               Nan::New(event.touch.finger));
      Nan::Set(touch,
               GetCachedColumn(isolate, "x"),
               Nan::New(event.touch.x));
      Nan::Set(touch,
               GetCachedColumn(isolate, "y"),
               Nan::New(event.touch.y));
      Nan::Set(ret,
               GetCachedColumn(isolate, "touch"),
               touch);
      break;
    }

    case sf::Event::SensorChanged: {
      Local<Object> sensor = Nan::New<Object>();
      Nan::Set(sensor,
               GetCachedColumn(isolate, "type"),
               Nan::New(event.sensor.type));
      Nan::Set(sensor,
               GetCachedColumn(isolate, "typeStr"),
               Nan::New(gen::sensor_type_itoa[event.sensor.type])
                   .ToLocalChecked());
      Nan::Set(sensor,
               GetCachedColumn(isolate, "x"),
               Nan::New(event.sensor.x));
      Nan::Set(sensor,
               GetCachedColumn(isolate, "y"),
               Nan::New(event.sensor.x));
      Nan::Set(sensor,
               GetCachedColumn(isolate, "z"),
               Nan::New(event.sensor.x));
      Nan::Set(ret,
               GetCachedColumn(isolate, "sensor"),
               sensor);
      break;
    }

    default:
      break;
  }

  return scope.Escape(ret);
}

NAN_MODULE_INIT(Init) {
#define SET_PER_EVENT_TYPE(name)                                               \
  Nan::Set(event_type,                                                         \
           Nan::New(#name).ToLocalChecked(),                                   \
           Nan::New(#name).ToLocalChecked());

  {
    Local<Object> event_type = Nan::New<Object>();
    EVENT_TYPES(SET_PER_EVENT_TYPE)
    Nan::Set(target, Nan::New("EventType").ToLocalChecked(), event_type);
  }

#undef SET_PER_EVENT_TYPE
}

}  // namespace poll_event
}  // namespace node_sfml
