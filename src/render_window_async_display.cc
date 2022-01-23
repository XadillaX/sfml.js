#include "render_window.h"

namespace node_sfml {
namespace render_window {

AsyncRenderWindowDisplay::AsyncRenderWindowDisplay(sf::RenderWindow* window, Nan::Callback *callback) : Nan::AsyncWorker(callback) {
      this->window = window;
  }

  void AsyncRenderWindowDisplay::Execute() {  
    if (this->window == nullptr) {
        this->SetErrorMessage("No window provided!");
        return;
    }
    if (!this->window->isOpen()) {
        this->SetErrorMessage("Closed window.");
        return;
    }

    this->window->setActive(true);
    this->window->display();
    this->window->setActive(false);
  }

  void AsyncRenderWindowDisplay::HandleOKCallback() {  
    Nan::HandleScope scope;  v8::Local<v8::Value> argv[] = {
        Nan::Null(), // no error occured
        Nan::Null()
    };    
    Nan::Call(callback->GetFunction(), Nan::GetCurrentContext()->Global(), 2, argv); 
  }

  void AsyncRenderWindowDisplay::HandleErrorCallback() { 
      Nan::HandleScope scope;  v8::Local<v8::Value> argv[] = {
        Nan::New(this->ErrorMessage()).ToLocalChecked(), // return error message      
        Nan::Null()
      };     
        Nan::Call(callback->GetFunction(), Nan::GetCurrentContext()->Global(), 2, argv);  
  }
}
}
