// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Use actual native arithmetic, not copies of it in the host language.
#include <RmlUi/Core/Types.h>

#include <cassert>
#include <cmath>
#include <iostream>
#include <type_traits>

namespace {

void Near(float actual, float expected) {
  assert(std::abs(actual - expected) < 0.0001f);
}

template <typename Vector, typename Component, int size>
void CheckVectorArithmetic() {
  Vector zero;
  Vector first(Component{6});
  const Vector second(Component{2});
  const Vector sum = first + second;
  const Vector difference = first - second;
  const Vector scaled = first * Component{2};
  const Vector divided = first / Component{2};
  const Component* read = first;
  Component* write = first;

  for (int i = 0; i < size; ++i) {
    assert(static_cast<const Component*>(zero)[i] == 0);
    assert(static_cast<const Component*>(sum)[i] == 8);
    assert(static_cast<const Component*>(difference)[i] == 4);
    assert(static_cast<const Component*>(scaled)[i] == 12);
    assert(static_cast<const Component*>(divided)[i] == 3);
    assert(read[i] == 6);
  }
  assert(write == &first.x);
  write[size - 1] = 9;
  assert(read[size - 1] == 9);
  first = Vector(Component{6});

  assert(first.SquaredMagnitude() == Component{36 * size});
  Near(first.Magnitude(), std::sqrt(36.f * size));
  assert(first.DotProduct(second) == Component{12 * size});
  assert(Component{2} * first == scaled);
  assert(-(-first) == first);
  assert(first != second && !(first == second));

  Vector changed = first;
  changed += second;
  assert(changed == sum);
  changed -= second;
  assert(changed == first);
  changed *= Component{2};
  assert(changed == scaled);
  changed /= Component{2};
  assert(changed == first);

  if constexpr (std::is_same_v<Component, float>) {
    const Vector normal = first.Normalise();
    Near(normal.Magnitude(), 1);
    assert(zero.Normalise() == zero);
    const Vector tiny(0.000001f);
    assert(tiny.Normalise() == tiny);
  }
}

void CheckVectors() {
  CheckVectorArithmetic<Rml::Vector2f, float, 2>();
  CheckVectorArithmetic<Rml::Vector2i, int, 2>();
  CheckVectorArithmetic<Rml::Vector3f, float, 3>();
  CheckVectorArithmetic<Rml::Vector3i, int, 3>();
  CheckVectorArithmetic<Rml::Vector4f, float, 4>();
  CheckVectorArithmetic<Rml::Vector4i, int, 4>();
  std::cout << "PASS six-native-vector-arithmetic-and-pointer-layout-types\n";

  const Rml::Vector2f vector(6, -9);
  assert(vector * Rml::Vector2f(2, 3) == Rml::Vector2f(12, -27));
  assert(vector / Rml::Vector2f(2, 3) == Rml::Vector2f(3, -3));
  Rml::Vector2f changed = vector;
  changed *= Rml::Vector2f(2, 3);
  changed /= Rml::Vector2f(2, 3);
  assert(changed == vector);
  const Rml::Vector2i integers(-7, 9);
  assert(integers * Rml::Vector2i(2, 3) == Rml::Vector2i(-14, 27));
  assert(integers / Rml::Vector2i(2, 3) == Rml::Vector2i(-3, 3));
  Rml::Vector2i changed_integer = integers;
  changed_integer *= Rml::Vector2i(2, 3);
  changed_integer /= Rml::Vector2i(2, 3);
  assert(changed_integer == integers);

  assert(Rml::Vector2f(-1.5f, 2.5f).Round() == Rml::Vector2f(-1, 3));
  assert(Rml::Vector2i(-2, 3).Round() == Rml::Vector2i(-2, 3));
  const auto rotated = Rml::Vector2f(1, 0).Rotate(Rml::Math::RMLUI_PI / 2);
  Near(rotated.x, 0);
  Near(rotated.y, 1);
  assert(Rml::Vector2i(2, 0).Rotate(Rml::Math::RMLUI_PI / 4) ==
         Rml::Vector2i(1, 1));
  assert(Rml::Vector2i(-7, 7) / 2 == Rml::Vector2i(-3, 3));
  assert(static_cast<Rml::Vector2i>(Rml::Vector2f(-7.75f, 7.75f)) ==
         Rml::Vector2i(-7, 7));

  assert(Rml::Vector3i(1, 0, 0).CrossProduct(Rml::Vector3i(0, 1, 0)) ==
         Rml::Vector3i(0, 0, 1));
  assert(Rml::Vector3f(1, 2, 3).CrossProduct(Rml::Vector3f(4, 5, 6)) ==
         Rml::Vector3f(-3, 6, -3));
  assert(static_cast<Rml::Vector3i>(Rml::Vector3f(1.75f, -2.75f, 3.75f)) ==
         Rml::Vector3i(1, -2, 3));
  assert(static_cast<Rml::Vector2i>(Rml::Vector3i(1, 2, 3)) ==
         Rml::Vector2i(1, 2));
  assert(Rml::Vector4f(Rml::Vector3f(2, 4, 6), 2).PerspectiveDivide() ==
         Rml::Vector3f(1, 2, 3));
  assert(Rml::Vector4i(3, -3, 5, 2).PerspectiveDivide() ==
         Rml::Vector3i(1, -1, 2));
  assert(static_cast<Rml::Vector4i>(Rml::Vector4f(1.75f, -2.75f, 3.75f, 4)) ==
         Rml::Vector4i(1, -2, 3, 4));
  assert(static_cast<Rml::Vector3f>(Rml::Vector4f(1, 2, 3, 4)) ==
         Rml::Vector3f(1, 2, 3));
  assert(static_cast<Rml::Vector2f>(Rml::Vector4f(1, 2, 3, 4)) ==
         Rml::Vector2f(1, 2));
  assert(Rml::Vector4i(Rml::Vector3i(2, 4, 6), 2).PerspectiveDivide() ==
         Rml::Vector3i(1, 2, 3));
  std::cout << "PASS vector-rounding-cross-product-and-dimensional-casts\n";
}

void CheckColours() {
  assert(Rml::Colourb() == Rml::Colourb(0, 0, 0, 255));
  assert(Rml::Colourf() == Rml::Colourf(0, 0, 0, 1));
  assert(Rml::Colourb(12, 34) == Rml::Colourb(12, 12, 12, 34));
  assert(Rml::Colourb(250) + Rml::Colourb(10) == Rml::Colourb(4, 254));
  assert(Rml::Colourb(2) - Rml::Colourb(5) == Rml::Colourb(253, 0));
  assert(Rml::Colourb(7, 9, 11, 13) * 0.5f == Rml::Colourb(3, 4, 5, 6));
  assert(Rml::Colourb(7, 9, 11, 13) / 2.f == Rml::Colourb(3, 4, 5, 6));

  Rml::Colourb changed(7, 9, 11, 13);
  changed += Rml::Colourb(2, 2, 2, 2);
  changed -= Rml::Colourb(2, 2, 2, 2);
  changed *= 2.f;
  changed /= 2.f;
  assert(changed == Rml::Colourb(7, 9, 11, 13));
  Rml::byte* write = changed;
  const Rml::byte* read = changed;
  assert(write == &changed.red && read[3] == 13);
  write[1] = 18;
  assert(changed.green == 18 && changed != Rml::Colourb());

  const Rml::Colourb source(101, 51, 255, 128);
  const auto premultiplied = source.ToPremultiplied();
  assert(premultiplied == Rml::ColourbPremultiplied(50, 25, 128, 128));
  assert(source.ToPremultiplied(0.5f) ==
         Rml::ColourbPremultiplied(25, 12, 64, 64));
  assert(premultiplied.ToNonPremultiplied() == Rml::Colourb(99, 49, 255, 128));
  assert(Rml::ColourbPremultiplied(100, 50, 20, 0).ToNonPremultiplied() ==
         Rml::Colourb(0, 0, 0, 0));
  assert(source.ToPremultiplied(0) == Rml::ColourbPremultiplied(0, 0, 0, 0));
  assert(Rml::Math::RoundedLerp(0.5f,
                                Rml::ColourbPremultiplied(0, 0, 0, 0),
                                Rml::ColourbPremultiplied(1, 3, 5, 7)) ==
         Rml::ColourbPremultiplied(1, 2, 3, 4));
  std::cout << "PASS byte-colour-wrap-truncation-and-premultiplied-alpha\n";

  const Rml::Colourf floats(0.25f, 0.5f, 0.75f, 1);
  assert(floats + floats == Rml::Colourf(0.5f, 1, 1.5f, 2));
  assert(floats - floats == Rml::Colourf(0, 0, 0, 0));
  assert(floats * 2.f == Rml::Colourf(0.5f, 1, 1.5f, 2));
  assert(floats / 0.5f == Rml::Colourf(0.5f, 1, 1.5f, 2));
  Rml::Colourf changed_float = floats;
  changed_float += floats;
  changed_float -= floats;
  changed_float *= 2.f;
  changed_float /= 2.f;
  assert(changed_float == floats && changed_float != Rml::Colourf());
  const float* float_read = changed_float;
  float* float_write = changed_float;
  assert(float_write == &changed_float.red && float_read[2] == 0.75f);
  float_write[0] = 0.125f;
  assert(changed_float.red == 0.125f);
  std::cout << "PASS float-colour-arithmetic-and-channel-layout\n";
}

template <typename Rectangle, typename Vector>
void CheckRectangle() {
  const Rectangle rectangle =
      Rectangle::FromPositionSize(Vector(2, 3), Vector(4, 6));
  assert(rectangle.Position() == Vector(2, 3));
  assert(rectangle.Size() == Vector(4, 6));
  assert(rectangle.TopLeft() == Vector(2, 3));
  assert(rectangle.TopRight() == Vector(6, 3));
  assert(rectangle.BottomLeft() == Vector(2, 9));
  assert(rectangle.BottomRight() == Vector(6, 9));
  assert(rectangle.p0 == Vector(2, 3) && rectangle.p1 == Vector(6, 9));
  assert(rectangle.Center() == Vector(4, 6));
  assert(rectangle.Left() == 2 && rectangle.Right() == 6);
  assert(rectangle.Top() == 3 && rectangle.Bottom() == 9);
  assert(rectangle.Width() == 4 && rectangle.Height() == 6);
  assert(rectangle.Contains(Vector(6, 9)));
  assert(!rectangle.Contains(Vector(7, 9)));

  const Rectangle touching =
      Rectangle::FromPositionSize(Vector(6, 3), Vector(2, 6));
  assert(!rectangle.Intersects(touching));
  assert(rectangle.Intersect(touching) ==
         Rectangle::FromCorners(Vector(6, 3), Vector(6, 9)));
  const Rectangle overlapping =
      Rectangle::FromCorners(Vector(5, 2), Vector(8, 5));
  assert(rectangle.Intersects(overlapping));
  assert(rectangle.Intersect(overlapping) ==
         Rectangle::FromCorners(Vector(5, 3), Vector(6, 5)));

  const Rectangle invalid = Rectangle::MakeInvalid();
  assert(!invalid.Valid());
  assert(rectangle.IntersectIfValid(invalid) == rectangle);
  assert(invalid.IntersectIfValid(rectangle) == invalid);
  assert(Rectangle().Valid());
  assert(Rectangle::FromPosition(Vector(2, 3)).Size() == Vector(0));
  assert(Rectangle::FromSize(Vector(4, 6)).Position() == Vector(0));
  assert(rectangle.Extend(1) ==
         Rectangle::FromCorners(Vector(1, 2), Vector(7, 10)));
  assert(rectangle.Extend(Vector(1, 2)) ==
         Rectangle::FromCorners(Vector(1, 1), Vector(7, 11)));
  assert(rectangle.Extend(Vector(1, 2), Vector(3, 4)) ==
         Rectangle::FromCorners(Vector(1, 1), Vector(9, 13)));
  assert(rectangle.Translate(Vector(1, 2)) ==
         Rectangle::FromCorners(Vector(3, 5), Vector(7, 11)));
  assert(rectangle.Join(Vector(0, 0)) ==
         Rectangle::FromCorners(Vector(0, 0), Vector(6, 9)));
  assert(rectangle.Join(overlapping) ==
         Rectangle::FromCorners(Vector(2, 2), Vector(8, 9)));
  assert(rectangle != invalid && !(rectangle == invalid));
}

void CheckRectangles() {
  CheckRectangle<Rml::Rectanglef, Rml::Vector2f>();
  CheckRectangle<Rml::Rectanglei, Rml::Vector2i>();
  const auto floats = Rml::Rectanglef::FromCorners(Rml::Vector2f(-1.75f, 2.75f),
                                                   Rml::Vector2f(3.75f, 4.75f));
  assert(
      static_cast<Rml::Rectanglei>(floats) ==
      Rml::Rectanglei::FromCorners(Rml::Vector2i(-1, 2), Rml::Vector2i(3, 4)));
  std::cout << "PASS integer-float-rectangle-edges-invalidity-and-casts\n";
}

void CheckMath() {
  namespace math = Rml::Math;
  assert(math::Max(2, 3) == 3 && math::Min(2, 3) == 2);
  assert(math::Clamp(-1, 0, 2) == 0 && math::Clamp(3, 0, 2) == 2);
  assert(math::Lerp(0.25f, 2.f, 6.f) == 3);
  assert(math::Max(Rml::Vector2i(1, 4), Rml::Vector2i(3, 2)) ==
         Rml::Vector2i(3, 4));
  assert(math::Min(Rml::Vector2i(1, 4), Rml::Vector2i(3, 2)) ==
         Rml::Vector2i(1, 2));
  assert(math::Clamp(Rml::Vector2i(-1, 4),
                     Rml::Vector2i(0, 0),
                     Rml::Vector2i(2, 2)) == Rml::Vector2i(0, 2));
  assert(math::Max(Rml::Vector2f(1, 4), Rml::Vector2f(3, 2)) ==
         Rml::Vector2f(3, 4));
  assert(math::Min(Rml::Vector2f(1, 4), Rml::Vector2f(3, 2)) ==
         Rml::Vector2f(1, 2));
  assert(math::Clamp(Rml::Vector2f(-1, 4),
                     Rml::Vector2f(0, 0),
                     Rml::Vector2f(2, 2)) == Rml::Vector2f(0, 2));

  assert(math::Absolute(-3) == 3 && math::Absolute(-3.f) == 3);
  assert(math::Absolute(Rml::Vector2f(-2, 3)) == Rml::Vector2f(2, 3));
  assert(math::IsCloseToZero(0.000099f));
  assert(!math::IsCloseToZero(0.0001f));
  Near(math::Cos(0), 1);
  Near(math::ACos(1), 0);
  Near(math::Sin(math::RMLUI_PI / 2), 1);
  Near(math::ASin(1), math::RMLUI_PI / 2);
  Near(math::Tan(0), 0);
  Near(math::ATan2(1, 0), math::RMLUI_PI / 2);
  Near(math::Exp(0), 1);
  assert(math::Log2(0) == 0 && math::Log2(1) == 0);
  assert(math::Log2(7) == 2 && math::Log2(8) == 3);
  Near(math::DegreesToRadians(180), math::RMLUI_PI);
  Near(math::RadiansToDegrees(math::RMLUI_PI), 180);
  Near(math::NormaliseAngle(-math::RMLUI_PI), math::RMLUI_PI);
  Near(math::NormaliseAngle(math::RMLUI_PI * 2), 0);
  Near(math::SquareRoot(9), 3);

  assert(math::Round(-1.5f) == -1 && math::Round(-1.5) == -1);
  assert(math::RoundToInteger(-1.5f) == -2);
  assert(math::RoundUp(-1.75f) == -1 && math::RoundDown(-1.25f) == -2);
  assert(math::RoundUpToInteger(-1.75f) == -1);
  assert(math::RoundDownToInteger(-1.25f) == -2);
  float integral = 0;
  assert(math::DecomposeFractionalIntegral(-1.75f, &integral) == -0.75f);
  assert(integral == -1);
  assert(math::ToPowerOfTwo(0) == 0 && math::ToPowerOfTwo(9) == 16);
  assert(math::HexToDecimal('F') == 15 && math::HexToDecimal('a') == 10);
  assert(math::HexToDecimal('9') == 9 && math::HexToDecimal('g') == -1);
  std::cout << "PASS native-math-functions-and-distinct-negative-rounding\n";

  float x = 0.6f;
  float width = 1.6f;
  math::SnapToPixelGrid(x, width);
  assert(x == 1 && width == 1);
  Rml::Vector2f position(0.6f, -0.6f);
  Rml::Vector2f size(1.6f, 1.6f);
  math::SnapToPixelGrid(position, size);
  assert(position == Rml::Vector2f(1, -1));
  assert(size == Rml::Vector2f(1, 2));
  auto rectangle = Rml::Rectanglef::FromPositionSize(Rml::Vector2f(0.6f, -0.6f),
                                                     Rml::Vector2f(1.6f, 1.6f));
  math::SnapToPixelGrid(rectangle);
  assert(rectangle.Position() == position && rectangle.Size() == size);

  position = Rml::Vector2f(0.6f, -0.6f);
  size = Rml::Vector2f(1.6f, 1.6f);
  math::ExpandToPixelGrid(position, size);
  assert(position == Rml::Vector2f(0, -1));
  assert(size == Rml::Vector2f(3, 2));
  rectangle = Rml::Rectanglef::FromPositionSize(Rml::Vector2f(0.6f, -0.6f),
                                                Rml::Vector2f(1.6f, 1.6f));
  math::ExpandToPixelGrid(rectangle);
  assert(rectangle.Position() == position && rectangle.Size() == size);
  std::cout << "PASS native-pixel-grid-snap-and-expansion-overloads\n";
}

}  // namespace

int main() {
  CheckVectors();
  CheckColours();
  CheckRectangles();
  CheckMath();
}
