#ifndef SRC_BASE_CLASS_WITH_LOADING_H_
#define SRC_BASE_CLASS_WITH_LOADING_H_

namespace node_sfml {

class BaseClassWithLoading {
 public:
  inline BaseClassWithLoading() : _loading(false) {}
  inline ~BaseClassWithLoading() {}

  inline void SetLoading(bool loading) { _loading = loading; }

 protected:
  bool _loading;
};

}  // namespace node_sfml

#endif  // SRC_BASE_CLASS_WITH_LOADING_H_
