#ifndef SRC_RESIZABLE_BUFFER_H_
#define SRC_RESIZABLE_BUFFER_H_

#include <stdio.h>

#ifndef _WIN32
#include <unistd.h>
#endif

namespace node_sfml {

template <typename T>
struct ReleasedResizableBuffer {
  T* buffer;
  size_t length;
  size_t byte_length;
};

template <typename T>
class ResizableBuffer {
 public:
  inline ResizableBuffer()
      : _buff(nullptr),
        _length(0),
        _byte_length(0)
#ifndef _WIN32
        ,
        _page_size(getpagesize())
#endif
  {}

  explicit inline ResizableBuffer(size_t length) : ResizableBuffer() {
    this->Realloc(length);
  }

  inline ~ResizableBuffer() {
    if (_buff) {
      free(_buff);
      _buff = nullptr;
    }
  }

  inline void Realloc(size_t length) {
    if (length == _length) return;
    if (_buff != nullptr) {
      free(_buff);
      _buff = nullptr;
    }

    _length = length;
    _byte_length = _length * sizeof(T);
    if (!_length) return;

#ifndef _WIN32
    if (_byte_length >= _page_size) {
      posix_memalign(
          reinterpret_cast<void**>(&_buff), _page_size, _byte_length);
    } else {
      _buff = static_cast<T*>(valloc(_byte_length));
    }
#else
  _buff = static_cast<T*>(malloc(_byte_length));
#endif

    memset(_buff, 0, _byte_length);
  }

  inline T* operator*() { return _buff; }
  inline T* buffer() { return _buff; }

  inline size_t length() { return _length; }
  inline size_t byte_length() { return _byte_length; }

  inline char* byte_buffer() { return reinterpret_cast<char*>(_buff); }
  inline unsigned char* unsigned_byte_buffer() {
    return reinterpret_cast<unsigned char*>(_buff);
  }

  inline ReleasedResizableBuffer<T> Release() {
    T* buffer = _buff;
    size_t length = _length;
    size_t byte_length = _byte_length;

    _buff = nullptr;
    _length = _byte_length = 0;

    return {buffer, length, byte_length};
  }

 private:
  T* _buff;
  size_t _length;
  size_t _byte_length;

#ifndef _WIN32
  size_t _page_size;
#endif
};

}  // namespace node_sfml

#endif  // SRC_RESIZABLE_BUFFER_H_
