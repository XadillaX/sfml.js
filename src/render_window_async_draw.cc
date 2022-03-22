#include "render_window.h"

namespace node_sfml {
namespace render_window {

AsyncRenderWindowDraw::AsyncRenderWindowDraw(sf::RenderWindow* window,
                                             sf::Mutex* displayDrawMutex,
                                             sf::Drawable* drawable,
                                             sf::RenderStates* renderStates,
                                             Nan::Callback* callback)
    : Nan::AsyncWorker(callback) {
  this->_window = window;
  this->_displayDrawMutex = displayDrawMutex;
  this->_drawable = drawable;
  this->_renderStates = renderStates;
}

void AsyncRenderWindowDraw::Execute() {
  if (this->_window == nullptr) {
    this->SetErrorMessage("No window provided!");
    return;
  }
  if (!this->_window->isOpen()) {
    this->SetErrorMessage("Closed window.");
    return;
  }

  this->_displayDrawMutex->lock();
  this->_window->setActive(true);
  if (this->_renderStates == nullptr) {
    this->_window->draw(*this->_drawable);
  } else {
    this->_window->draw(*this->_drawable, *this->_renderStates);
  }
  this->_window->setActive(false);
  this->_displayDrawMutex->unlock();
}

void AsyncRenderWindowDraw::HandleOKCallback() {
  Nan::HandleScope scope;
  v8::Local<v8::Value> argv[] = {Nan::Null(),  // no error occured
                                 Nan::Null()};
  Nan::Call(
      callback->GetFunction(), Nan::GetCurrentContext()->Global(), 2, argv);
}

void AsyncRenderWindowDraw::HandleErrorCallback() {
  Nan::HandleScope scope;
  v8::Local<v8::Value> argv[] = {
      Nan::New(this->ErrorMessage()).ToLocalChecked(),  // return error message
      Nan::Null()};
  Nan::Call(
      callback->GetFunction(), Nan::GetCurrentContext()->Global(), 2, argv);
}
}  // namespace render_window
}  // namespace node_sfml
