#include <SFML/Network/Packet.hpp>
#include <SFML/Network/IpAddress.hpp>
#include <SFML/System/String.hpp>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <limits>

int main() {
  sf::Packet packet;
  packet << true << std::int8_t(-8) << std::uint8_t(255)
         << std::int16_t(-32768) << std::uint16_t(65535)
         << std::int32_t(-2147483647 - 1) << std::uint32_t(0xffffffff)
         << std::numeric_limits<std::int64_t>::min()
         << std::numeric_limits<std::uint64_t>::max()
         << 1.5f << -3.141592653589793;
  sf::String unicode;
  unicode += U'\u97f3';
  unicode += U'\u9891';
  unicode += U'\U0001f31f';
  unicode += char32_t(0);
  packet << unicode << std::string("UTF8\xf0\x9f\x8c\x9f\0", 9)
         << std::string("\xff\0\xfe", 3);
  const auto* bytes = static_cast<const unsigned char*>(packet.getData());
  for (std::size_t i = 0; i < packet.getDataSize(); ++i)
    std::cout << std::hex << std::setfill('0') << std::setw(2) << unsigned(bytes[i]);
  std::cout << '\n';
  for (const auto* text : {"127.0.0.1", "2001:db8::1", "::ffff:127.0.0.1",
                            "::192.168.1.1", "::1", "2001:0:0:1:0:0:1:1"}) {
    std::cout << sf::IpAddress::fromString(text)->toString() << '\n';
  }
}
