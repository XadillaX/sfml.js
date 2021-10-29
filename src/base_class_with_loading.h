#ifndef SRC_BASE_CLASS_WITH_LOADING_H_
#define SRC_BASE_CLASS_WITH_LOADING_H_

namespace node_sfml {

class BaseClassWithLoading {
 public:
  inline BaseClassWithLoading() : _loading(false), _saving(false) {}
  inline ~BaseClassWithLoading() {}

  inline void SetLoading(bool loading) { _loading = loading; }
  inline void SetSaving(bool saving) { _saving = saving; }

 protected:
  bool _loading;
  bool _saving;
};

}  // namespace node_sfml

#endif  // SRC_BASE_CLASS_WITH_LOADING_H_
