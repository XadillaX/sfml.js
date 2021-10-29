#ifndef SRC_WORKERS_SAVE_TO_FILE_WORKER_H_
#define SRC_WORKERS_SAVE_TO_FILE_WORKER_H_

#include <nan.h>

namespace node_sfml {
namespace save_to_file_worker {

typedef bool (*SaveToFileFunction)(void* target,
                                   const std::string& filename,
                                   void* context);

template <class T, typename CTX_TYPE>
class SaveToFileWorker : public Nan::AsyncWorker {
 public:
  SaveToFileWorker(v8::Local<v8::Object> object,
                   const std::string& filename,
                   SaveToFileFunction save_file,
                   std::shared_ptr<CTX_TYPE> context,
                   Nan::Callback* callback)
      : Nan::AsyncWorker(callback),
        _save_file(save_file),
        _core(Nan::ObjectWrap::Unwrap<T>(object)),
        _filename(filename),
        _context(context),
        _saved(false),
        _async_resource("save_to_file_worker") {
    _object.Reset(object);
  }

  ~SaveToFileWorker() {
    _object.Reset();
    _core = nullptr;
    _context = nullptr;
  }

  inline virtual void Execute() {
    _saved = _save_file(_core, _filename, _context.get());
    if (!_saved) {
      char error[1024];
      snprintf(
          error, sizeof error, "Failed to save %s.", this->_filename.c_str());
      SetErrorMessage(error);
    }
  }

  inline virtual void HandleOKCallback() {
    _core->SetSaving(false);

    Nan::HandleScope scope;
    callback->Call(0, nullptr, &_async_resource);
  }

  inline virtual void HandleErrorCallback() {
    _core->SetSaving(false);

    Nan::HandleScope scope;
    v8::Local<v8::Value> argv[1] = {Nan::Error(ErrorMessage())};
    callback->Call(1, argv, &_async_resource);
  }

  inline Nan::AsyncResource* async_resource() { return &_async_resource; }

 private:
  SaveToFileFunction _save_file;

  T* _core;
  std::string _filename;
  std::shared_ptr<CTX_TYPE> _context;

  Nan::Persistent<v8::Object> _object;
  bool _saved;
  Nan::AsyncResource _async_resource;
};

}  // namespace save_to_file_worker
}  // namespace node_sfml

#endif  // SRC_SAVE_TO_FILE_WORKER_H_
