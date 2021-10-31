#include "render_window.h"
#include "color.h"
#include "drawable/drawable.h"
#include "image.h"
#include "poll_event.h"
#include "vector2-inl.h"
#include "video_mode.h"

namespace node_sfml {
namespace render_window {

using node_sfml::video_mode::VideoMode;
using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;

Nan::Persistent<Function> constructor;

NAN_MODULE_INIT(RenderWindow::Init) {
  Local<String> name = Nan::New("RenderWindow").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "capture", Capture);
  Nan::SetPrototypeMethod(tpl, "clear", Clear);
  Nan::SetPrototypeMethod(tpl, "close", Close);
  Nan::SetPrototypeMethod(tpl, "display", Display);
  Nan::SetPrototypeMethod(tpl, "drawDrawable", DrawDrawable);
  Nan::SetPrototypeMethod(tpl, "isOpen", IsOpen);
  Nan::SetPrototypeMethod(tpl, "pollEvent", PollEvent);
  Nan::SetPrototypeMethod(tpl, "getSize", GetSize);
  Nan::SetPrototypeMethod(tpl, "hasFocus", HasFocus);

#define PRIMITIVE_VALUE_PROTOTYPE_METHOD(name, _)                              \
  Nan::SetPrototypeMethod(tpl, "set" #name, Set##name);

  PRIMITIVE_VALUES(PRIMITIVE_VALUE_PROTOTYPE_METHOD);

#undef PRIMITIVE_VALUE_PROTOTYPE_METHOD

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);

  // Set RenderWindow's styles enumerations
  {
    Local<Object> style = Nan::New<Object>();

#define SET_STYLES(V)                                                          \
  V(None)                                                                      \
  V(Titlebar)                                                                  \
  V(Resize)                                                                    \
  V(Close)                                                                     \
  V(Fullscreen)                                                                \
  V(Default)

#define SET_PER_STYLE(name)                                                    \
  Nan::Set(style, Nan::New(#name).ToLocalChecked(), Nan::New(sf::Style::name));

    SET_STYLES(SET_PER_STYLE)

#undef SET_PER_STYLE
#undef SET_STYLES

    Nan::Set(func, Nan::New("Style").ToLocalChecked(), style);
  }

  // Set `EventType`
  {
    Local<Object> event = Nan::New<Object>();
    poll_event::Init(event);
    Nan::Set(func, Nan::New("Event").ToLocalChecked(), event);
  }
}

NAN_METHOD(RenderWindow::New) {
  RenderWindow* window = nullptr;
  VideoMode* mode = nullptr;
  Local<v8::Uint32> style;
  Local<String> title;

  switch (info.Length()) {
    case 0:
      window = new RenderWindow();
      break;

    case 3: {
      style = info[2].As<v8::Uint32>();
      // fallthrough
    }

    case 2: {
      mode = Nan::ObjectWrap::Unwrap<VideoMode>(info[0].As<Object>());
      title = info[1].As<String>();
      break;
    }

    default: {
      Nan::ThrowError("Invalid arguments count.");
      return;
    }
  }

  if (window == nullptr) {
    if (style.IsEmpty()) {
      window = new RenderWindow(mode->mode(), title);
    } else {
      window = new RenderWindow(
          mode->mode(), title, Nan::To<sf::Uint32>(style).FromJust());
    }
  }

  window->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(RenderWindow::Capture) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  sf::Image img = window->_window->capture();

  Nan::TryCatch try_catch;
  MaybeLocal<Object> maybe_img =
      image::Image::NewRealInstance(info.GetIsolate());
  if (maybe_img.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  Local<Object> img_obj = maybe_img.ToLocalChecked();
  image::Image* node_sfml_img = Nan::ObjectWrap::Unwrap<image::Image>(img_obj);
  node_sfml_img->SetInnerImage(img);

  info.GetReturnValue().Set(img_obj);
}

NAN_METHOD(RenderWindow::Clear) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  window->_window->clear(color->color());
}

NAN_METHOD(RenderWindow::Close) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  window->_window->close();
}

NAN_METHOD(RenderWindow::Display) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  window->_window->display();
}

NAN_METHOD(RenderWindow::DrawDrawable) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  drawable::Drawable* drawable =
      Nan::ObjectWrap::Unwrap<drawable::Drawable>(info[0].As<Object>());
  window->_window->draw(drawable->raw<sf::Drawable>());
}

NAN_METHOD(RenderWindow::IsOpen) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  info.GetReturnValue().Set(window->_window->isOpen());
}

NAN_METHOD(RenderWindow::PollEvent) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  bool polled = window->_window->pollEvent(window->_event);

  if (!polled) {
    info.GetReturnValue().Set(false);
    return;
  }

  MaybeLocal<Object> v8_event =
      poll_event::EventToV8Object(info.GetIsolate(), window->_event);
  if (v8_event.IsEmpty()) return;

  info.GetReturnValue().Set(v8_event.ToLocalChecked());
}

NAN_METHOD(RenderWindow::GetSize) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  sf::Vector2u vec = window->_window->getSize();

  Nan::TryCatch try_catch;
  MaybeLocal<Object> maybe_vec =
      vector2::Vector2U::NewRealInstance(info.GetIsolate(), vec);
  if (maybe_vec.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(maybe_vec.ToLocalChecked());
}

NAN_METHOD(RenderWindow::HasFocus) {
  RenderWindow* window = Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());
  info.GetReturnValue().Set(window->_window->hasFocus());
}

#define SET_PRIMITIVE_VALUE(name, type)                                        \
  NAN_METHOD(RenderWindow::Set##name) {                                        \
    RenderWindow* window =                                                     \
        Nan::ObjectWrap::Unwrap<RenderWindow>(info.Holder());                  \
    type val = Nan::To<type>(info[0]).FromJust();                              \
    window->_window->set##name(val);                                           \
  }

PRIMITIVE_VALUES(SET_PRIMITIVE_VALUE);

#undef SET_PRIMITIVE_VALUE

RenderWindow::RenderWindow() : _window(new sf::RenderWindow()) {}

RenderWindow::~RenderWindow() {
  delete _window;
}

RenderWindow::RenderWindow(sf::VideoMode mode,
                           v8::Local<v8::String> title,
                           sf::Uint32 style) {
  Nan::Utf8String utf8_title(title);
  std::string std_title(*utf8_title, utf8_title.length());
  _window = new sf::RenderWindow(mode, sf::String(std_title), style);
}

}  // namespace render_window
}  // namespace node_sfml
