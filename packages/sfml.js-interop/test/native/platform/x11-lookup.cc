// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <algorithm>
#include <array>
#include <cassert>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <string>
#include <vector>

#include "SFML/Window/platform/x11/utf8-lookup.h"
#include <SFML/System/Utf.hpp>
#include <SFML/Window/Event.hpp>

namespace {

// Execute the actual SFML lookup branch with only the unavailable Xlib call
// substituted. The generated include contains current prepared source bytes.
using Status = int;
enum {
  kXBufferOverflow = -1,
  kXLookupNone = 1,
  kXLookupKeySym = 2,
  kXLookupChars = 3,
  kXLookupBoth = 4
};
struct XKeyEvent {};
struct XEvent {
  XKeyEvent xkey;
};
struct XComposeStatus {};

const std::string* input_bytes = nullptr;
Status input_status = kXLookupChars;
int lookups = 0;
int focus_calls = 0;
XKeyEvent* original_key = nullptr;

void XSetICFocus(void*) {
  ++focus_calls;
}

void XUnsetICFocus(void*) {
  ++focus_calls;
}

int Xutf8LookupString(
    void*, XKeyEvent* key, char* buffer, int capacity, void*, Status* status) {
  assert(key == original_key && input_bytes);
  ++lookups;
  if (static_cast<int>(input_bytes->size()) > capacity) {
    *status = kXBufferOverflow;
    return static_cast<int>(input_bytes->size());
  }
  std::memcpy(buffer, input_bytes->data(), input_bytes->size());
  *status = input_status;
  return static_cast<int>(input_bytes->size());
}

int XLookupString(XKeyEvent*, char*, int, void*, XComposeStatus*) {
  assert(false && "The fixture must use the installed input context");
  return 0;
}

std::ostream& err() {
  return std::cerr;
}

class Host final {
 public:
  std::u32string emitted;
  void Focus(bool entering, bool input_current) {
#define inputCurrent input_current
#define m_inputContext input_context_
    if (entering) {
#include "x11-focus-in-body.inc"
    } else {
#include "x11-focus-out-body.inc"
    }
#undef m_inputContext
#undef inputCurrent
  }
  void Lookup(bool native_current) {
    using sf::Event;
    using sf::Utf8;
    bool filtered = false;
    bool input_current = native_current;
    XEvent window_event;
    original_key = &window_event.xkey;
    // Keep the imported SFML names confined to its original source bytes.
#define windowEvent window_event
#define inputCurrent input_current
#define m_inputContext input_context_
#define XBufferOverflow kXBufferOverflow
#define XLookupChars kXLookupChars
#define XLookupBoth kXLookupBoth
#include "x11-lookup-body.inc"
#undef XLookupBoth
#undef XLookupChars
#undef XBufferOverflow
#undef m_inputContext
#undef windowEvent
#undef inputCurrent
  }

 private:
  void* input_context_ = this;
  void pushEvent(sf::Event::TextEntered event) {
    emitted.push_back(event.unicode);
  }
};

void Expect(const std::string& bytes,
            const std::u32string& expected,
            Status status,
            int calls,
            bool native_current = true) {
  input_bytes = &bytes;
  input_status = status;
  lookups = 0;
  Host host;
  host.Lookup(native_current);
  assert(host.emitted == expected);
  assert(lookups == calls);
  input_bytes = nullptr;
}

}  // namespace

int main() {
  // 48 Chinese characters + one supplementary code point + one final character
  // require 151 bytes. A fixed 64-byte lookup loses this whole commit.
  std::string long_input;
  for (int index = 0; index < 48; ++index) {
    long_input += "中";
  }
  const auto expected = std::u32string(48, U'中') + U"😀尾";
  Expect(long_input + "😀尾", expected, kXLookupChars, 2);
  std::cout << "PASS long XIM UTF8 commits retry the original native event\n";

  Expect(std::string(64, 'a'), std::u32string(64, U'a'), kXLookupChars, 1);
  std::cout << "PASS exact-capacity commits emit every character once\n";

  Expect("A😀中", U"A😀中", kXLookupBoth, 1);
  std::cout << "PASS combined XIM character and keysym status delivers text\n";

  Expect("", U"", kXLookupNone, 1);
  Expect("", U"", kXLookupKeySym, 1);
  std::cout << "PASS nontext XIM lookup statuses emit no characters\n";

  Expect("旧", U"", kXLookupChars, 0, false);
  std::cout << "PASS retired raw deliveries never query a replacement XIC\n";

  Host host;
  focus_calls = 0;
  host.Focus(true, false);
  host.Focus(false, false);
  assert(focus_calls == 0 &&
         "retired focus delivery invoked a replacement input context");
  host.Focus(true, true);
  host.Focus(false, true);
  assert(focus_calls == 2);
  std::cout << "PASS retired focus deliveries never enter a replacement XIC\n";
}
