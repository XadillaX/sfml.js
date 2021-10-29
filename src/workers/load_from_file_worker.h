#ifndef SRC_WORKERS_LOAD_FROM_FILE_WORKER_H_
#define SRC_WORKERS_LOAD_FROM_FILE_WORKER_H_

#include <nan.h>

namespace node_sfml {
namespace load_from_file_worker {

typedef bool (*OpenFileFunction)(void* target,
                                 const std::string& filename,
                                 void* context);

template <class T, typename CTX_TYPE>
class LoadFromFileWorker : public Nan::AsyncWorker {
 public:
  LoadFromFileWorker(v8::Local<v8::Object> object,
                     const std::string& filename,
                     OpenFileFunction open_file,
                     std::shared_ptr<CTX_TYPE> context,
                     Nan::Callback* callback)
      : Nan::AsyncWorker(callback),
        _open_file(open_file),
        _core(Nan::ObjectWrap::Unwrap<T>(object)),
        _filename(filename),
        _context(context),
        _loaded(false),
        _async_resource("load_from_file_worker") {
    _object.Reset(object);
  }

  ~LoadFromFileWorker() {
    _object.Reset();
    _core = nullptr;
    _context = nullptr;
  }

  inline virtual void Execute() {
    _loaded = _open_file(_core, _filename, _context.get());
    if (!_loaded) {
      char error[1024];
      snprintf(
          error, sizeof error, "Failed to load %s.", this->_filename.c_str());
      SetErrorMessage(error);
    }
  }

  inline virtual void HandleOKCallback() {
    _core->SetLoading(false);

    Nan::HandleScope scope;
    callback->Call(0, nullptr, &_async_resource);
  }

  inline virtual void HandleErrorCallback() {
    _core->SetLoading(false);

    Nan::HandleScope scope;
    v8::Local<v8::Value> argv[1] = {Nan::Error(ErrorMessage())};
    callback->Call(1, argv, &_async_resource);
  }

  inline Nan::AsyncResource* async_resource() { return &_async_resource; }

 private:
  OpenFileFunction _open_file;

  T* _core;
  std::string _filename;
  std::shared_ptr<CTX_TYPE> _context;

  Nan::Persistent<v8::Object> _object;
  bool _loaded;
  Nan::AsyncResource _async_resource;
};

}  // namespace load_from_file_worker
}  // namespace node_sfml

#endif  // SRC_LOAD_FROM_FILE_WORKER_H_
