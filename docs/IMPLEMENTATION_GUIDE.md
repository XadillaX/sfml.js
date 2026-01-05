# SFML.js 实现指南：共享内存技术详解

## 📋 目录

- [核心概念](#核心概念)
- [C++ 实现细节](#c-实现细节)
- [TypeScript 实现细节](#typescript-实现细节)
- [类型转换机制](#类型转换机制)
- [生命周期管理](#生命周期管理)
- [错误处理](#错误处理)
- [测试策略](#测试策略)

---

## 核心概念

### V8 External ArrayBuffer

External ArrayBuffer 是 V8 提供的机制，允许 JavaScript 代码访问由原生代码管理的内存。

```
┌────────────────────────────────────────┐
│ JavaScript Heap                        │
│                                        │
│  ┌────────────────┐                   │
│  │ TypedArray     │                   │
│  │  buffer: AB ───┼───┐               │
│  └────────────────┘   │               │
│                       │               │
└───────────────────────┼───────────────┘
                        │
                        │ 指向外部内存
                        │
┌───────────────────────┼───────────────┐
│ Native Memory         ↓               │
│                                        │
│  ┌────────────────────────────┐       │
│  │ sf::Color {                │       │
│  │   uint8_t r;  // offset 0  │       │
│  │   uint8_t g;  // offset 1  │       │
│  │   uint8_t b;  // offset 2  │       │
│  │   uint8_t a;  // offset 3  │       │
│  │ }                          │       │
│  └────────────────────────────┘       │
└────────────────────────────────────────┘
```

关键特性：
1. **零拷贝**: JavaScript 直接读写原生内存
2. **生命周期解耦**: 内存由原生代码管理，不受 V8 GC 控制
3. **类型安全**: 通过 TypedArray 提供类型化访问

---

## C++ 实现细节

### 1. Color 完整实现

**src/graphics/color.h**:
```cpp
#pragma once
#include <nan.h>
#include <SFML/Graphics/Color.hpp>

namespace node_sfml {
namespace color {

class Color : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);
  static NAN_METHOD(New);

  // 工具方法
  static NAN_METHOD(ToInteger);
  static NAN_METHOD(FromInteger);

  // 获取底层 sf::Color
  sf::Color* GetColor() { return color_; }
  const sf::Color* GetColor() const { return color_; }

  // 从 sf::Color 创建 JS 对象
  static v8::Local<v8::Object> NewInstance(const sf::Color& color);

  // 从 JS Value 获取 sf::Color（支持多种格式）
  static sf::Color FromJS(v8::Local<v8::Value> value);

 private:
  Color(uint8_t r, uint8_t g, uint8_t b, uint8_t a);
  explicit Color(uint32_t rgba);
  Color();
  ~Color();

  // 禁止拷贝
  Color(const Color&) = delete;
  Color& operator=(const Color&) = delete;

  sf::Color* color_;  // 实际的 SFML Color 对象
  Nan::Persistent<v8::Uint8Array> typed_array_;  // 防止 GC

  static Nan::Persistent<v8::Function> constructor;
};

}  // namespace color
}  // namespace node_sfml
```

**src/graphics/color.cc**:
```cpp
#include "color.h"
#include <cassert>

namespace node_sfml {
namespace color {

using v8::ArrayBuffer;
using v8::BackingStore;
using v8::Context;
using v8::Function;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Uint8Array;
using v8::Value;
using v8::Uint32;

Nan::Persistent<Function> Color::constructor;

NAN_MODULE_INIT(Color::Init) {
  Local<String> name = Nan::New("Color").ToLocalChecked();
  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // 实例方法
  Nan::SetPrototypeMethod(tpl, "toInteger", ToInteger);

  // 静态方法
  Nan::SetMethod(tpl, "fromInteger", FromInteger);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  // 导出内存布局信息（供 JS 侧适配）
  Local<Object> layout = Nan::New<Object>();
  Nan::Set(layout, Nan::New("r").ToLocalChecked(),
           Nan::New<Uint32>(offsetof(sf::Color, r)));
  Nan::Set(layout, Nan::New("g").ToLocalChecked(),
           Nan::New<Uint32>(offsetof(sf::Color, g)));
  Nan::Set(layout, Nan::New("b").ToLocalChecked(),
           Nan::New<Uint32>(offsetof(sf::Color, b)));
  Nan::Set(layout, Nan::New("a").ToLocalChecked(),
           Nan::New<Uint32>(offsetof(sf::Color, a)));
  Nan::Set(layout, Nan::New("size").ToLocalChecked(),
           Nan::New<Uint32>(sizeof(sf::Color)));
  Nan::Set(layout, Nan::New("componentSize").ToLocalChecked(),
           Nan::New<Uint32>(sizeof(sf::Uint8)));

  Nan::Set(func, Nan::New("LAYOUT").ToLocalChecked(), layout);

  // 导出预定义颜色
  Local<Object> colors = Nan::New<Object>();
  Nan::Set(colors, Nan::New("Black").ToLocalChecked(),
           NewInstance(sf::Color::Black));
  Nan::Set(colors, Nan::New("White").ToLocalChecked(),
           NewInstance(sf::Color::White));
  Nan::Set(colors, Nan::New("Red").ToLocalChecked(),
           NewInstance(sf::Color::Red));
  Nan::Set(colors, Nan::New("Green").ToLocalChecked(),
           NewInstance(sf::Color::Green));
  Nan::Set(colors, Nan::New("Blue").ToLocalChecked(),
           NewInstance(sf::Color::Blue));
  Nan::Set(colors, Nan::New("Yellow").ToLocalChecked(),
           NewInstance(sf::Color::Yellow));
  Nan::Set(colors, Nan::New("Magenta").ToLocalChecked(),
           NewInstance(sf::Color::Magenta));
  Nan::Set(colors, Nan::New("Cyan").ToLocalChecked(),
           NewInstance(sf::Color::Cyan));
  Nan::Set(colors, Nan::New("Transparent").ToLocalChecked(),
           NewInstance(sf::Color::Transparent));

  Nan::Set(func, Nan::New("Colors").ToLocalChecked(), colors);
  Nan::Set(target, name, func);
}

Color::Color(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
  color_ = new sf::Color(r, g, b, a);
}

Color::Color(uint32_t rgba) {
  color_ = new sf::Color(rgba);
}

Color::Color() {
  color_ = new sf::Color();
}

Color::~Color() {
  // 清理 TypedArray 引用
  typed_array_.Reset();

  // 释放 sf::Color
  if (color_) {
    delete color_;
    color_ = nullptr;
  }
}

NAN_METHOD(Color::New) {
  if (!info.IsConstructCall()) {
    Nan::ThrowError("Color() must be called with new");
    return;
  }

  Color* color = nullptr;

  // 解析参数
  if (info.Length() == 0) {
    // new Color() - 默认黑色
    color = new Color();
  } else if (info.Length() == 1) {
    // new Color(0xRRGGBBAA) - 从整数创建
    if (!info[0]->IsNumber()) {
      Nan::ThrowTypeError("Expected number");
      return;
    }
    uint32_t rgba = Nan::To<uint32_t>(info[0]).FromJust();
    color = new Color(rgba);
  } else if (info.Length() >= 3) {
    // new Color(r, g, b, [a]) - 从分量创建
    if (!info[0]->IsNumber() || !info[1]->IsNumber() || !info[2]->IsNumber()) {
      Nan::ThrowTypeError("Expected numbers for r, g, b");
      return;
    }

    uint32_t r = Nan::To<uint32_t>(info[0]).FromJust();
    uint32_t g = Nan::To<uint32_t>(info[1]).FromJust();
    uint32_t b = Nan::To<uint32_t>(info[2]).FromJust();
    uint32_t a = 255;

    if (info.Length() >= 4) {
      if (!info[3]->IsNumber()) {
        Nan::ThrowTypeError("Expected number for a");
        return;
      }
      a = Nan::To<uint32_t>(info[3]).FromJust();
    }

    // 验证范围
    if (r > 255 || g > 255 || b > 255 || a > 255) {
      Nan::ThrowRangeError("Color components must be 0-255");
      return;
    }

    color = new Color(r, g, b, a);
  } else {
    Nan::ThrowError("Invalid arguments");
    return;
  }

  // 包装到 JS 对象
  color->Wrap(info.This());

  // 创建 External ArrayBuffer 指向 sf::Color 内存
  Isolate* isolate = info.GetIsolate();

  void* data = reinterpret_cast<void*>(color->color_);
  size_t byte_length = sizeof(sf::Color);  // 不假设大小，使用实际值

  // 创建不拥有内存的 BackingStore
  std::unique_ptr<BackingStore> backing_store =
    ArrayBuffer::NewBackingStore(
      data,
      byte_length,
      [](void* data, size_t length, void* deleter_data) {
        // 空的 deleter - 内存由 Color 对象管理
        // 当 ArrayBuffer 被 GC 时会调用，但我们不做任何操作
      },
      nullptr  // deleter_data
    );

  // 创建 ArrayBuffer
  Local<ArrayBuffer> array_buffer =
    ArrayBuffer::New(isolate, std::move(backing_store));

  // 创建 Uint8Array 视图（覆盖整个结构）
  Local<Uint8Array> typed_array = Uint8Array::New(array_buffer, 0, byte_length);

  // 将 TypedArray 设置为对象的属性
  Nan::Set(info.This(), Nan::New("_data").ToLocalChecked(), typed_array);

  // 保持引用防止 GC
  color->typed_array_.Reset(typed_array);

  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Color::ToInteger) {
  Color* color = Nan::ObjectWrap::Unwrap<Color>(info.Holder());
  uint32_t rgba = color->color_->toInteger();
  info.GetReturnValue().Set(Nan::New(rgba));
}

NAN_METHOD(Color::FromInteger) {
  if (info.Length() < 1 || !info[0]->IsNumber()) {
    Nan::ThrowTypeError("Expected number");
    return;
  }

  uint32_t rgba = Nan::To<uint32_t>(info[0]).FromJust();
  info.GetReturnValue().Set(NewInstance(sf::Color(rgba)));
}

Local<Object> Color::NewInstance(const sf::Color& sfColor) {
  Isolate* isolate = Isolate::GetCurrent();
  Local<Function> cons = Nan::New(constructor);

  Local<Value> argv[] = {
    Nan::New(sfColor.r),
    Nan::New(sfColor.g),
    Nan::New(sfColor.b),
    Nan::New(sfColor.a)
  };

  Local<Object> instance =
    Nan::NewInstance(cons, 4, argv).ToLocalChecked();
  return instance;
}

sf::Color Color::FromJS(Local<Value> value) {
  if (value->IsObject()) {
    Local<Object> obj = Nan::To<Object>(value).ToLocalChecked();

    // 检查是否是 Color 对象
    if (Nan::New(constructor)->HasInstance(obj)) {
      Color* color = Nan::ObjectWrap::Unwrap<Color>(obj);
      return *color->GetColor();
    }

    // 检查是否是普通对象 { r, g, b, a }
    Local<Value> r_val = Nan::Get(obj, Nan::New("r").ToLocalChecked()).ToLocalChecked();
    Local<Value> g_val = Nan::Get(obj, Nan::New("g").ToLocalChecked()).ToLocalChecked();
    Local<Value> b_val = Nan::Get(obj, Nan::New("b").ToLocalChecked()).ToLocalChecked();

    if (r_val->IsNumber() && g_val->IsNumber() && b_val->IsNumber()) {
      uint8_t r = Nan::To<uint32_t>(r_val).FromJust();
      uint8_t g = Nan::To<uint32_t>(g_val).FromJust();
      uint8_t b = Nan::To<uint32_t>(b_val).FromJust();

      Local<Value> a_val = Nan::Get(obj, Nan::New("a").ToLocalChecked()).ToLocalChecked();
      uint8_t a = a_val->IsNumber() ? Nan::To<uint32_t>(a_val).FromJust() : 255;

      return sf::Color(r, g, b, a);
    }
  } else if (value->IsNumber()) {
    // 从整数创建
    uint32_t rgba = Nan::To<uint32_t>(value).FromJust();
    return sf::Color(rgba);
  }

  Nan::ThrowTypeError("Expected Color object, plain object, or number");
  return sf::Color();
}

}  // namespace color
}  // namespace node_sfml
```

### 2. Vector2f 实现

**src/system/vector2.h**:
```cpp
#pragma once
#include <nan.h>
#include <SFML/System/Vector2.hpp>

namespace node_sfml {
namespace vector2 {

class Vector2f : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);
  static NAN_METHOD(New);

  // 向量运算
  static NAN_METHOD(Add);
  static NAN_METHOD(Subtract);
  static NAN_METHOD(Multiply);
  static NAN_METHOD(Length);
  static NAN_METHOD(Normalize);

  sf::Vector2f* GetVector() { return vector_; }
  const sf::Vector2f* GetVector() const { return vector_; }

  static v8::Local<v8::Object> NewInstance(const sf::Vector2f& vec);
  static sf::Vector2f FromJS(v8::Local<v8::Value> value);

 private:
  Vector2f(float x, float y);
  Vector2f();
  ~Vector2f();

  Vector2f(const Vector2f&) = delete;
  Vector2f& operator=(const Vector2f&) = delete;

  sf::Vector2f* vector_;
  Nan::Persistent<v8::Float32Array> typed_array_;

  static Nan::Persistent<v8::Function> constructor;
};

class Vector2i : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);
  static NAN_METHOD(New);

  sf::Vector2i* GetVector() { return vector_; }
  static v8::Local<v8::Object> NewInstance(const sf::Vector2i& vec);
  static sf::Vector2i FromJS(v8::Local<v8::Value> value);

 private:
  Vector2i(int32_t x, int32_t y);
  Vector2i();
  ~Vector2i();

  Vector2i(const Vector2i&) = delete;
  Vector2i& operator=(const Vector2i&) = delete;

  sf::Vector2i* vector_;
  Nan::Persistent<v8::Int32Array> typed_array_;

  static Nan::Persistent<v8::Function> constructor;
};

}  // namespace vector2
}  // namespace node_sfml
```

**src/system/vector2.cc**:
```cpp
#include "vector2.h"
#include <cmath>

namespace node_sfml {
namespace vector2 {

using v8::ArrayBuffer;
using v8::BackingStore;
using v8::Float32Array;
using v8::Function;
using v8::FunctionTemplate;
using v8::Int32Array;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

// 验证内存布局
static_assert(sizeof(sf::Vector2f) == 8, "sf::Vector2f must be 8 bytes");
static_assert(offsetof(sf::Vector2f, x) == 0, "x at offset 0");
static_assert(offsetof(sf::Vector2f, y) == 4, "y at offset 4");

// ============================================================
// Vector2f 实现
// ============================================================

Nan::Persistent<Function> Vector2f::constructor;

NAN_MODULE_INIT(Vector2f::Init) {
  Local<String> name = Nan::New("Vector2f").ToLocalChecked();
  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // 方法
  Nan::SetPrototypeMethod(tpl, "add", Add);
  Nan::SetPrototypeMethod(tpl, "subtract", Subtract);
  Nan::SetPrototypeMethod(tpl, "multiply", Multiply);
  Nan::SetPrototypeMethod(tpl, "length", Length);
  Nan::SetPrototypeMethod(tpl, "normalize", Normalize);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  // 导出内存布局信息
  Local<Object> layout = Nan::New<Object>();
  Nan::Set(layout, Nan::New("x").ToLocalChecked(),
           Nan::New<Uint32>(offsetof(sf::Vector2f, x)));
  Nan::Set(layout, Nan::New("y").ToLocalChecked(),
           Nan::New<Uint32>(offsetof(sf::Vector2f, y)));
  Nan::Set(layout, Nan::New("size").ToLocalChecked(),
           Nan::New<Uint32>(sizeof(sf::Vector2f)));
  Nan::Set(layout, Nan::New("componentSize").ToLocalChecked(),
           Nan::New<Uint32>(sizeof(float)));

  Nan::Set(func, Nan::New("LAYOUT").ToLocalChecked(), layout);
  Nan::Set(target, name, func);
}

Vector2f::Vector2f(float x, float y) {
  vector_ = new sf::Vector2f(x, y);
}

Vector2f::Vector2f() {
  vector_ = new sf::Vector2f(0.0f, 0.0f);
}

Vector2f::~Vector2f() {
  typed_array_.Reset();
  if (vector_) {
    delete vector_;
    vector_ = nullptr;
  }
}

NAN_METHOD(Vector2f::New) {
  if (!info.IsConstructCall()) {
    Nan::ThrowError("Vector2f() must be called with new");
    return;
  }

  Vector2f* vec = nullptr;

  if (info.Length() == 0) {
    vec = new Vector2f();
  } else if (info.Length() == 2) {
    if (!info[0]->IsNumber() || !info[1]->IsNumber()) {
      Nan::ThrowTypeError("Expected numbers for x, y");
      return;
    }
    float x = Nan::To<double>(info[0]).FromJust();
    float y = Nan::To<double>(info[1]).FromJust();
    vec = new Vector2f(x, y);
  } else {
    Nan::ThrowError("Expected 0 or 2 arguments");
    return;
  }

  vec->Wrap(info.This());

  // 创建共享内存
  Isolate* isolate = info.GetIsolate();
  void* data = reinterpret_cast<void*>(vec->vector_);
  size_t byte_length = sizeof(sf::Vector2f);

  std::unique_ptr<BackingStore> backing_store =
    ArrayBuffer::NewBackingStore(
      data, byte_length,
      [](void* data, size_t length, void* deleter_data) {},
      nullptr
    );

  Local<ArrayBuffer> array_buffer =
    ArrayBuffer::New(isolate, std::move(backing_store));
  Local<Float32Array> typed_array =
    Float32Array::New(array_buffer, 0, byte_length / sizeof(float));

  Nan::Set(info.This(), Nan::New("_data").ToLocalChecked(), typed_array);
  vec->typed_array_.Reset(typed_array);

  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Vector2f::Add) {
  Vector2f* self = Nan::ObjectWrap::Unwrap<Vector2f>(info.Holder());

  if (info.Length() < 1) {
    Nan::ThrowError("Expected Vector2f argument");
    return;
  }

  sf::Vector2f other = FromJS(info[0]);
  sf::Vector2f result = *self->vector_ + other;

  info.GetReturnValue().Set(NewInstance(result));
}

NAN_METHOD(Vector2f::Subtract) {
  Vector2f* self = Nan::ObjectWrap::Unwrap<Vector2f>(info.Holder());
  sf::Vector2f other = FromJS(info[0]);
  sf::Vector2f result = *self->vector_ - other;
  info.GetReturnValue().Set(NewInstance(result));
}

NAN_METHOD(Vector2f::Multiply) {
  Vector2f* self = Nan::ObjectWrap::Unwrap<Vector2f>(info.Holder());

  if (!info[0]->IsNumber()) {
    Nan::ThrowTypeError("Expected number");
    return;
  }

  float scalar = Nan::To<double>(info[0]).FromJust();
  sf::Vector2f result = *self->vector_ * scalar;
  info.GetReturnValue().Set(NewInstance(result));
}

NAN_METHOD(Vector2f::Length) {
  Vector2f* self = Nan::ObjectWrap::Unwrap<Vector2f>(info.Holder());
  float x = self->vector_->x;
  float y = self->vector_->y;
  float length = std::sqrt(x * x + y * y);
  info.GetReturnValue().Set(Nan::New(length));
}

NAN_METHOD(Vector2f::Normalize) {
  Vector2f* self = Nan::ObjectWrap::Unwrap<Vector2f>(info.Holder());
  float x = self->vector_->x;
  float y = self->vector_->y;
  float length = std::sqrt(x * x + y * y);

  if (length > 0) {
    sf::Vector2f result(x / length, y / length);
    info.GetReturnValue().Set(NewInstance(result));
  } else {
    info.GetReturnValue().Set(NewInstance(sf::Vector2f(0, 0)));
  }
}

Local<Object> Vector2f::NewInstance(const sf::Vector2f& vec) {
  Local<Function> cons = Nan::New(constructor);
  Local<Value> argv[] = { Nan::New(vec.x), Nan::New(vec.y) };
  return Nan::NewInstance(cons, 2, argv).ToLocalChecked();
}

sf::Vector2f Vector2f::FromJS(Local<Value> value) {
  if (value->IsObject()) {
    Local<Object> obj = Nan::To<Object>(value).ToLocalChecked();

    // 检查是否是 Vector2f 对象
    if (Nan::New(constructor)->HasInstance(obj)) {
      Vector2f* vec = Nan::ObjectWrap::Unwrap<Vector2f>(obj);
      return *vec->GetVector();
    }

    // 检查普通对象 { x, y }
    Local<Value> x_val = Nan::Get(obj, Nan::New("x").ToLocalChecked()).ToLocalChecked();
    Local<Value> y_val = Nan::Get(obj, Nan::New("y").ToLocalChecked()).ToLocalChecked();

    if (x_val->IsNumber() && y_val->IsNumber()) {
      float x = Nan::To<double>(x_val).FromJust();
      float y = Nan::To<double>(y_val).FromJust();
      return sf::Vector2f(x, y);
    }
  }

  Nan::ThrowTypeError("Expected Vector2f object or plain object");
  return sf::Vector2f();
}

}  // namespace vector2
}  // namespace node_sfml
```

---

## TypeScript 实现细节

### 1. Color 类型定义和实现

**lib/graphics/color.ts**:
```typescript
// 从编译后的 binding 导入
const binding = require('../../build/Release/binding.node');
const { Color: NativeColor } = binding;

/**
 * RGBA 颜色类
 *
 * 底层使用共享内存，直接操作 C++ sf::Color 对象
 * 所有属性的读写都是零拷贝的内存操作
 *
 * @example
 * ```typescript
 * const red = new Color(255, 0, 0);
 * red.a = 128;  // 半透明
 *
 * const green = Color.fromInteger(0x00FF00FF);
 * ```
 */
export class Color {
  /** @internal NAN ObjectWrap - 管理 C++ 对象生命周期 */
  private readonly _native: any;

  /** @internal 指向 C++ sf::Color 内存的 TypedArray */
  private readonly _data: Uint8Array;

  /**
   * 创建颜色
   * @param r 红色分量 (0-255)
   * @param g 绿色分量 (0-255)
   * @param b 蓝色分量 (0-255)
   * @param a 透明度 (0-255)，默认 255
   */
  constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 255) {
    this._native = new NativeColor(r, g, b, a);
    this._data = this._native._data;

    // 验证共享内存
    if (!(this._data instanceof Uint8Array)) {
      throw new Error('Invalid Color internal data structure');
    }

    if (this._data.length < Color._layout.size) {
      throw new Error(
        `Color data size mismatch: expected ${Color._layout.size} bytes, ` +
        `got ${this._data.length}`
      );
    }
  }

  /**
   * 获取内存布局信息（用于调试和验证）
   */
  static getLayout(): Readonly<ColorLayout> {
    return { ...Color._layout };
  }

  /**
   * 从 32 位整数创建颜色
   * @param rgba 格式: 0xRRGGBBAA
   */
  static fromInteger(rgba: number): Color {
    const instance = Object.create(Color.prototype);
    instance._native = NativeColor.fromInteger(rgba);
    instance._data = instance._native._data;
    return instance;
  }

  /**
   * 红色分量 (0-255)
   *
   * 直接读写 C++ 内存，零拷贝！
   * 使用布局信息计算正确的偏移量
   */
  get r(): number {
    return this._data[Color._layout.r];
  }

  set r(value: number) {
    this._data[Color._layout.r] = this._clamp(value);
  }

  /**
   * 绿色分量 (0-255)
   */
  get g(): number {
    return this._data[Color._layout.g];
  }

  set g(value: number) {
    this._data[Color._layout.g] = this._clamp(value);
  }

  /**
   * 蓝色分量 (0-255)
   */
  get b(): number {
    return this._data[Color._layout.b];
  }

  set b(value: number) {
    this._data[Color._layout.b] = this._clamp(value);
  }

  /**
   * Alpha 通道 (0-255)
   */
  get a(): number {
    return this._data[Color._layout.a];
  }

  set a(value: number) {
    this._data[Color._layout.a] = this._clamp(value);
  }

  /**
   * 转换为 32 位整数
   * @returns 0xRRGGBBAA 格式
   */
  toInteger(): number {
    return this._native.toInteger();
  }

  /**
   * 克隆颜色
   */
  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }

  /**
   * 转换为普通对象
   */
  toJSON(): ColorJSON {
    return { r: this.r, g: this.g, b: this.b, a: this.a };
  }

  /**
   * 字符串表示
   */
  toString(): string {
    return `Color(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  /**
   * @internal 获取原生对象（供内部使用）
   */
  _getNative(): any {
    return this._native;
  }

  /**
   * @internal 获取共享内存数组
   */
  _getData(): Uint8Array {
    return this._data;
  }

  /**
   * @private 限制值在 0-255 范围内
   */
  private _clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.floor(value)));
  }

  // ====== 预定义颜色 ======
  static readonly Black = new Color(0, 0, 0);
  static readonly White = new Color(255, 255, 255);
  static readonly Red = new Color(255, 0, 0);
  static readonly Green = new Color(0, 255, 0);
  static readonly Blue = new Color(0, 0, 255);
  static readonly Yellow = new Color(255, 255, 0);
  static readonly Magenta = new Color(255, 0, 255);
  static readonly Cyan = new Color(0, 255, 255);
  static readonly Transparent = new Color(0, 0, 0, 0);
}

/**
 * 颜色的 JSON 表示
 */
export interface ColorJSON {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * 类型别名 - 接受多种颜色格式
 */
export type ColorLike =
  | Color           // Color 对象
  | ColorJSON       // 普通对象 { r, g, b, a }
  | number;         // 整数 0xRRGGBBAA

/**
 * 将各种格式转换为 Color 对象
 */
export function toColor(color: ColorLike): Color {
  if (color instanceof Color) {
    return color;
  }
  if (typeof color === 'number') {
    return Color.fromInteger(color);
  }
  return new Color(color.r, color.g, color.b, color.a ?? 255);
}
```

### 2. 单元测试示例

**test/color.test.ts**:
```typescript
import { Color } from '../lib/graphics/color';

describe('Color', () => {
  describe('constructor', () => {
    it('should create black color by default', () => {
      const color = new Color();
      expect(color.r).toBe(0);
      expect(color.g).toBe(0);
      expect(color.b).toBe(0);
      expect(color.a).toBe(255);
    });

    it('should create color with RGB', () => {
      const color = new Color(255, 128, 64);
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);
      expect(color.a).toBe(255);
    });

    it('should create color with RGBA', () => {
      const color = new Color(255, 128, 64, 32);
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);
      expect(color.a).toBe(32);
    });
  });

  describe('shared memory', () => {
    it('should modify C++ object when setting properties', () => {
      const color = new Color(255, 0, 0);

      // 修改属性
      color.r = 128;
      color.g = 255;

      // 验证修改立即生效
      expect(color.r).toBe(128);
      expect(color.g).toBe(255);

      // 验证 C++ 侧也看到了修改
      expect(color.toInteger()).toBe(0x80FF00FF);
    });

    it('should clamp values to 0-255', () => {
      const color = new Color();

      color.r = -10;
      expect(color.r).toBe(0);

      color.g = 300;
      expect(color.g).toBe(255);

      color.b = 128.7;
      expect(color.b).toBe(128);
    });
  });

  describe('fromInteger', () => {
    it('should create color from integer', () => {
      const color = Color.fromInteger(0xFF8040C0);
      expect(color.r).toBe(0xFF);
      expect(color.g).toBe(0x80);
      expect(color.b).toBe(0x40);
      expect(color.a).toBe(0xC0);
    });
  });

  describe('toInteger', () => {
    it('should convert to integer', () => {
      const color = new Color(255, 128, 64, 192);
      expect(color.toInteger()).toBe(0xFF8040C0);
    });
  });

  describe('predefined colors', () => {
    it('should have correct values', () => {
      expect(Color.Black.toInteger()).toBe(0x000000FF);
      expect(Color.White.toInteger()).toBe(0xFFFFFFFF);
      expect(Color.Red.toInteger()).toBe(0xFF0000FF);
      expect(Color.Green.toInteger()).toBe(0x00FF00FF);
      expect(Color.Blue.toInteger()).toBe(0x0000FFFF);
    });
  });

  describe('performance', () => {
    it('should handle rapid property changes efficiently', () => {
      const color = new Color();
      const iterations = 10000;

      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        color.r = i % 256;
        color.g = (i * 2) % 256;
        color.b = (i * 3) % 256;
      }
      const elapsed = Date.now() - start;

      // 应该非常快（<10ms for 10000 iterations）
      expect(elapsed).toBeLessThan(10);
    });
  });
});
```

---

## 生命周期管理

### 对象所有权

```
┌──────────────────────────────────────┐
│ JavaScript GC                        │
│                                      │
│  Color JS 对象被 GC ────┐            │
│                         │            │
└─────────────────────────┼────────────┘
                          │
                          ↓
┌─────────────────────────────────────┐
│ NAN ObjectWrap                      │
│                                     │
│  ~Color() 析构函数被调用             │
│    │                                │
│    ├─ typed_array_.Reset()          │
│    │  (释放 TypedArray 引用)        │
│    │                                │
│    └─ delete color_;                │
│       (释放 sf::Color 内存)         │
└─────────────────────────────────────┘
```

### 关键点

1. **sf::Color 内存由 C++ 管理**
   - 在 `Color::Color()` 中分配
   - 在 `Color::~Color()` 中释放

2. **TypedArray 不拥有内存**
   - External ArrayBuffer 的 deleter 是空的
   - 防止 V8 尝试释放已由 C++ 管理的内存

3. **避免悬空指针**
   - 保持 `Nan::Persistent<Uint8Array>` 引用
   - 确保 TypedArray 的生命周期不超过 C++ 对象

---

## 错误处理

### C++ 侧错误处理

```cpp
NAN_METHOD(Sprite::SetColor) {
  // 1. 验证参数数量
  if (info.Length() < 1) {
    Nan::ThrowError("Expected color argument");
    return;
  }

  // 2. 验证参数类型
  if (!info[0]->IsObject() && !info[0]->IsNumber()) {
    Nan::ThrowTypeError("Expected Color object or number");
    return;
  }

  // 3. 安全的类型转换
  Nan::TryCatch try_catch;
  sf::Color color = color::Color::FromJS(info[0]);

  if (try_catch.HasCaught()) {
    try_catch.ReThrow();
    return;
  }

  // 4. 执行操作
  Sprite* sprite = Nan::ObjectWrap::Unwrap<Sprite>(info.Holder());
  sprite->_sprite->setColor(color);
}
```

### TypeScript 侧错误处理

```typescript
export class Sprite {
  setColor(color: ColorLike): this {
    // 1. 参数验证
    if (color === null || color === undefined) {
      throw new TypeError('Color cannot be null or undefined');
    }

    // 2. 类型转换
    const colorObj = toColor(color);

    // 3. 调用 C++（可能抛出异常）
    try {
      this._native.setColor(colorObj._getNative());
    } catch (error) {
      // 4. 包装 C++ 异常
      throw new Error(`Failed to set color: ${error.message}`);
    }

    return this;
  }
}
```

---

## 测试策略

### 1. 单元测试

```typescript
// test/unit/color.test.ts
describe('Color unit tests', () => {
  // 构造函数测试
  // 属性访问测试
  // 方法测试
});
```

### 2. 集成测试

```typescript
// test/integration/sprite.test.ts
describe('Sprite integration tests', () => {
  it('should accept Color object', () => {
    const sprite = new Sprite();
    const color = new Color(255, 0, 0);
    sprite.setColor(color);

    const retrieved = sprite.getColor();
    expect(retrieved.r).toBe(255);
  });
});
```

### 3. 性能基准测试

```typescript
// test/benchmark/color.bench.ts
import { performance } from 'perf_hooks';

describe('Color performance', () => {
  it('property access should be fast', () => {
    const color = new Color();
    const iterations = 1000000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      color.r = i % 256;
    }
    const end = performance.now();

    const opsPerSec = iterations / ((end - start) / 1000);
    console.log(`Operations per second: ${opsPerSec.toFixed(0)}`);

    // 应该达到数百万次/秒
    expect(opsPerSec).toBeGreaterThan(1000000);
  });
});
```

### 4. 内存泄漏测试

```typescript
// test/memory/leak.test.ts
describe('Memory leak tests', () => {
  it('should not leak memory when creating many colors', () => {
    const initial = process.memoryUsage().heapUsed;

    for (let i = 0; i < 10000; i++) {
      const color = new Color(i % 256, i % 256, i % 256);
      // color 超出作用域，应该被 GC
    }

    global.gc();  // 强制 GC（需要 --expose-gc 标志）

    const final = process.memoryUsage().heapUsed;
    const leaked = final - initial;

    // 泄漏应该很小
    expect(leaked).toBeLessThan(1024 * 1024);  // < 1MB
  });
});
```

---

## 总结

共享内存架构的关键要点：

1. **C++ 分配和管理内存**
   - 使用 `new` 创建 SFML 对象
   - 在析构函数中 `delete`

2. **External ArrayBuffer 映射内存**
   - 使用空 deleter
   - 不拥有内存所有权

3. **TypeScript 通过 TypedArray 访问**
   - 直接读写共享内存
   - 零拷贝、高性能

4. **生命周期由 V8 GC 驱动**
   - JS 对象被 GC → ObjectWrap 析构 → 释放 C++ 内存

5. **类型安全和错误处理**
   - TypeScript 编译时检查
   - C++ 运行时验证
   - 清晰的错误消息
