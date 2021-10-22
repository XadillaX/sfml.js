#ifndef SRC_POLL_EVENT_H_
#define SRC_POLL_EVENT_H_

#include <nan.h>

#include <SFML/Window/Event.hpp>

namespace node_sfml {
namespace poll_event {

v8::MaybeLocal<v8::Object> EventToV8Object(v8::Isolate* isolate,
                                           const sf::Event& event);
NAN_MODULE_INIT(Init);

}  // namespace poll_event
}  // namespace node_sfml

#endif  // SRC_POLL_EVENT_H_
