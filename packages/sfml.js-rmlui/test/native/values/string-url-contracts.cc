// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/StringUtilities.h>
#include <RmlUi/Core/URL.h>

#include <cassert>
#include <iostream>
#include <string>

namespace {

namespace strings = Rml::StringUtilities;

void CheckUrlEncoding() {
  assert(Rml::URL::UrlEncode("a b+c/&") == "a%20b%2Bc%2F%26");
  assert(Rml::URL::UrlEncode("\xc3\xa9") == "%C3%A9");
  assert(Rml::URL::UrlEncode(Rml::String("a\0b", 3)) == "a%00b");
  assert(Rml::URL::UrlDecode("a+%2B%2F%C3%A9") == "a +/\xc3\xa9");
  assert(Rml::URL::UrlDecode("a%00b") == Rml::String("a\0b", 3));
  assert(Rml::URL::UrlEncode("AZaz09-._~") == "AZaz09-._~");

  // These are the pinned RmlUi decoder rules, including malformed escapes.
  assert(Rml::URL::UrlDecode("%GG") == "GG");
  assert(Rml::URL::UrlDecode("%A") == Rml::String("\x0a", 1));
  std::cout << "PASS native-url-byte-codec\n";
}

void CheckUrlState() {
  Rml::URL url("https://user:secret@example.test:8123/a/b.rml?mode=full");
  assert(url.GetProtocol() == "https");
  assert(url.GetLogin() == "user");
  assert(url.GetPassword() == "secret");
  assert(url.GetHost() == "example.test");
  assert(url.GetPort() == 8123);
  assert(url.GetPath() == "a/");
  assert(url.GetFileName() == "b");
  assert(url.GetExtension() == "rml");
  assert(url.GetPathedFileName() == "a/b.rml");
  assert(url.GetParameters().at("mode") == "full");

  url.ClearParameters();
  assert(url.GetURL() == "https://user:secret@example.test:8123/a/b.rml");
  assert(url.SetURL("panel.rml"));
  assert(url.GetURL() == "panel.rml");
  assert(url.GetProtocol() == "file");
  assert(url.GetLogin().empty());
  assert(url.GetPassword().empty());
  assert(url.GetHost().empty());
  assert(url.GetPort() == 0);
  assert(url.GetParameters().empty());

  url.SetParameter("old", "1");
  assert(url.SetURL(""));
  assert(url.GetURL().empty());
  assert(url.GetQueryString().empty());
  assert(url.GetProtocol().empty());
  assert(url.GetPathedFileName().empty());
  std::cout << "PASS native-url-replacement-and-cache\n";
}

void CheckUrlMutation() {
  Rml::URL url;
  assert(url.SetProtocol("https"));
  assert(url.SetLogin("user"));
  assert(url.SetPassword("secret"));
  assert(url.SetHost("example.test"));
  assert(url.SetPort(8123));
  assert(url.SetPath("a/"));
  assert(url.PrefixPath("root"));
  assert(url.SetFileName("panel"));
  assert(url.SetExtension("rml"));
  url.SetParameters({{"a b", "\xc3\xa9"}});
  assert(url.GetQueryString() == "a%20b=%C3%A9");
  assert(url.GetURL() ==
         "https://user:secret@example.test:8123/root/a/panel.rml?a%20b=%C3%A9");

  url.SetParameter("a b", "new");
  assert(url.GetQueryString() == "a%20b=new");
  assert(url.SetURL(url.GetURL()));
  assert(url.GetParameters().at("a b") == "new");
  assert(url.PrefixPath(""));

  Rml::URL first(Rml::String("a.rml"));
  Rml::URL second("b.rml");
  assert(first < second);
  assert(first.SetFileName("z"));
  assert(!(first < second));
  assert(!first.SetURL("broken:protocol"));

  Rml::URL normalized("a/b/../c.rml");
  assert(normalized.GetURL() == "a/c.rml");
  std::cout << "PASS native-url-component-mutations\n";
}

void CheckStringRules() {
  assert(strings::ToLower("AZ\xc3\x89") == "az\xc3\x89");
  assert(strings::ToUpper("az\xc3\xa9") == "AZ\xc3\xa9");
  assert(strings::IsWhitespace('\t'));
  assert(!strings::IsWhitespace('\v'));
  assert(strings::StripWhitespace(Rml::String(" \tvalue\r\n")) == "value");
  assert(strings::StripWhitespace(Rml::StringView(" \tvalue\r\n")) == "value");

  assert(strings::EncodeRml("<>&\"'") == "&lt;&gt;&amp;&quot;'");
  assert(strings::DecodeRml("&lt;&gt;&amp;&quot;&#233;&#x1F600;") ==
         "<>&\"\xc3\xa9\xf0\x9f\x98\x80");
  assert(strings::DecodeRml("&amp;lt;") == "&lt;");
  assert(strings::DecodeRml("&apos;") == "&apos;");
  for (const auto* partial : {"&",
                              "&l",
                              "&lt",
                              "&a",
                              "&am",
                              "&amp",
                              "&q",
                              "&qu",
                              "&quo",
                              "&quot",
                              "&#",
                              "&#x",
                              "&#12345678",
                              "&#x12345678"}) {
    assert(strings::DecodeRml(partial) == partial);
  }
  assert(strings::Replace("aaa", "a", "aa") == "aaaaaa");
  assert(strings::Replace("abc", 'b', 'x') == "axc");
  assert(strings::StartsWith("abcd", "ab"));
  assert(strings::EndsWith("abcd", "cd"));
  assert(!strings::StartsWith("a", "ab"));
  assert(!strings::EndsWith("a", "ab"));
  assert(strings::StringCompareCaseInsensitive("Ab", "aB"));
  assert(!strings::StringCompareCaseInsensitive("\xc3\x89", "\xc3\xa9"));

  Rml::String decimal = "1.2300";
  strings::TrimTrailingDotZeros(decimal);
  assert(decimal == "1.23");
  Rml::String output;
  assert(Rml::FormatString(output, "%s %d", "value", 7) == 7);
  assert(output == "value 7");
  assert(Rml::CreateString("%.2f", 1.25) == "1.25");
  const Rml::String long_text(300, 'x');
  assert(Rml::FormatString(output, "%s", long_text.c_str()) == 300);
  assert(output == long_text);

  // Observe the real variadic formatter independently of the managed adapter.
  assert(Rml::FormatString(output, "%*.*f", 8, 2, 1.25) == 8);
  assert(output == "    1.25");
  assert(Rml::FormatString(output, "%*s", -5, "x") == 5);
  assert(output == "x    ");
  assert(Rml::FormatString(output, "%.*s", 2, "\xc3\xa9\xe4\xb8\xad") == 2);
  assert(output == "\xc3\xa9");
  assert(Rml::FormatString(output, "%.*f", -1, 1.25) == 8);
  assert(output == "1.250000");
  assert(Rml::FormatString(output, "%cZ", 0) == 2);
  assert(output.empty());
  assert(Rml::FormatString(output, "%260s%cZ", "", 0) == 262);
  assert(output == Rml::String(260, ' ') + Rml::String("\0Z", 2));

  std::cout << "PASS native-string-rml-ascii-and-format\n";
}

void CheckListsAndViews() {
  Rml::StringList list{"prefix"};
  strings::ExpandString(list, " a, 'b,c',, d,");
  assert((list == Rml::StringList{"prefix", "a", "b,c", "", "d"}));
  list.clear();
  strings::ExpandString(list, ",a,,b,", ',', true);
  assert((list == Rml::StringList{"a", "b"}));
  list.clear();
  strings::ExpandString(list, "a,(b,c), d", ',', '(', ')');
  assert((list == Rml::StringList{"a", "(b,c)", "d"}));

  Rml::String joined = "prefix:";
  strings::JoinString(joined, list, '|');
  assert(joined == "prefix:a|(b,c)|d");
  joined.clear();
  strings::JoinString(joined, list, '\0');
  assert(joined == "a(b,c)d");

  const Rml::String bytes("a\0b", 3);
  const Rml::String other("a\0c", 3);
  assert(Rml::StringView(bytes) != Rml::StringView(other));
  assert(Rml::StringView(bytes).size() == 3);
  assert(static_cast<Rml::String>(Rml::StringView(bytes, 1)) ==
         Rml::String("\0b", 2));
  assert(static_cast<Rml::String>(Rml::StringView(bytes, 1, 1)) ==
         Rml::String("\0", 1));
  assert(Rml::StringView().empty());
  assert(Rml::StringView("literal") == Rml::StringView("literal"));
  const Rml::StringView range(bytes.data() + 1, bytes.data() + 3);
  assert(range.begin() == bytes.data() + 1);
  assert(range.end() == bytes.data() + 3);
  assert(range.size() == 2);
  assert(static_cast<Rml::String>(range) == Rml::String("\0b", 2));
  assert(!strings::StartsWith(bytes, other));
  assert(!strings::EndsWith(bytes, other));
  std::cout << "PASS native-string-list-and-byte-view\n";
}

void CheckUnicodeOffsets() {
  const Rml::String text("A\xc3\xa9\xe4\xb8\xad\xf0\x9f\x98\x80Z");
  const int offsets[] = {0, 1, 3, 6, 10, 11};
  const Rml::Character characters[] = {
      static_cast<Rml::Character>('A'),
      static_cast<Rml::Character>(0xe9),
      static_cast<Rml::Character>(0x4e2d),
      static_cast<Rml::Character>(0x1f600),
      static_cast<Rml::Character>('Z'),
  };

  assert(strings::LengthUTF8(text) == 5);
  for (int index = 0; index < 6; ++index) {
    assert(strings::ConvertCharacterOffsetToByteOffset(text, index) ==
           offsets[index]);
    assert(strings::ConvertByteOffsetToCharacterOffset(text, offsets[index]) ==
           index);
  }
  assert(strings::ConvertByteOffsetToCharacterOffset(text, 2) == 2);
  assert(strings::ConvertCharacterOffsetToByteOffset(text, -1) == 0);
  assert(strings::ConvertCharacterOffsetToByteOffset(text, 99) == 11);
  assert(strings::ConvertByteOffsetToCharacterOffset(text, 99) == 5);
  assert(strings::ToUTF8(characters, 5) == text);
  assert(strings::ToUTF8(characters[3]) == "\xf0\x9f\x98\x80");
  assert(strings::BytesUTF8(characters[3]) == 4);
  assert(strings::BytesUTF8(static_cast<Rml::Character>(0x110000)) == 0);
  assert(strings::ToCharacter(text.data() + 6, text.data() + 10) ==
         characters[3]);
  assert(strings::ToCharacter(text.data() + 6, text.data() + 7) ==
         Rml::Character::Null);

  Rml::StringIteratorU8 iterator(text);
  for (int index = 0; index < 5; ++index) {
    assert(iterator);
    assert(iterator.offset() == offsets[index]);
    assert(*iterator == characters[index]);
    ++iterator;
  }
  assert(!iterator);
  --iterator;
  assert(iterator.offset() == 10);
  assert(*iterator == characters[4]);
  assert(iterator == Rml::StringIteratorU8(text, 10));
  assert(iterator != Rml::StringIteratorU8(text, 6, 4));
  Rml::StringIteratorU8 range(text.data(), text.data() + 6, text.data() + 10);
  assert(range.get() == text.data() + 6);
  assert(range.offset() == 6);
  assert(*range == characters[3]);
  ++range;
  assert(!range);
  --range;
  assert(range.offset() == 6);
  assert(strings::SeekForwardUTF8(text.data() + 2, text.data() + text.size()) ==
         text.data() + 3);
  assert(strings::SeekBackwardUTF8(text.data() + 2, text.data()) ==
         text.data() + 1);
  std::cout << "PASS native-string-unicode-offsets-and-iterator\n";
}

}  // namespace

int main(int argc, char** argv) {
  if (argc > 1 && std::string(argv[1]) == "empty-replace") {
    assert(strings::Replace("abc", "", "") == "abc");
    std::cout << "PASS native-string-empty-search-noop\n";
    return 0;
  }

  const std::string selected = argc > 1 ? argv[1] : "all";
  if (selected == "all" || selected == "url-codec") {
    CheckUrlEncoding();
  }

  if (selected == "all" || selected == "url-state") {
    CheckUrlState();
  }

  if (selected == "all" || selected == "url-mutation") {
    CheckUrlMutation();
  }

  if (selected == "all" || selected == "string-rules") {
    CheckStringRules();
  }

  if (selected == "all" || selected == "string-views") {
    CheckListsAndViews();
  }

  if (selected == "all" || selected == "unicode") {
    CheckUnicodeOffsets();
  }
}
