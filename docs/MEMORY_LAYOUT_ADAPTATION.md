# SFML.js 共享内存技术：JS 侧内存布局适配方案

## 核心思路

**不假设 C++ 的内存布局**，而是在运行时查询布局信息，让 TypeScript 侧根据实际布局计算正确的偏移量。

## 为什么这样设计？

### ❌ 旧方案的问题

```cpp
// 假设 sf::Color 是连续的 4 字节
static_assert(sizeof(sf::Color) == 4, "Must be 4 bytes");
static_assert(offsetof(sf::Color, r) == 0, "r at offset 0");
static_assert(offsetof(sf::Color, g) == 1, "g at offset 1");
// ...
```

问题：
1. **平台差异**：不同编译器可能有不同的 padding
2. **SFML 版本**：未来版本可能改变内存布局
3. **脆弱性**：假设失败就无法编译

### ✅ 新方案的优势

```typescript
// JS 侧查询布局，动态适配
const layout = color._native._layout;
// layout = { r: 0, g: 1, b: 2, a: 3, size: 4 }

get r() { return this._data[this._layout.r]; }
set r(v) { this._data[this._layout.r] = v; }
```

优势：
1. **跨平台兼容**：自动适配任何内存布局
2. **运行时检测**：实际测量，不是假设
3. **向后兼容**：SFML 更新也能工作

---

## 实现方案

### 1. C++ 侧暴露内存布局信息

**src/graphics/color.cc**:

```cpp
#include "color.h"

namespace node_sfml {
namespace color {

using v8::ArrayBuffer;
using v8::BackingStore;
using v8::Function;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Uint8Array;
using v8::Uint32;

Nan::Persistent<Function> Color::constructor;

NAN_MODULE_INIT(Color::Init) {
  Local<String> name = Nan::New("Color").ToLocalChecked();
  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // 实例方法
  Nan::SetPrototypeMethod(tpl, "toInteger", ToInteger);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  // 导出内存布局信息（静态属性）
  Local<Object> layout = Nan::New<Object>();

  // 使用 offsetof 获取实际偏移量
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

  // 每个字段的字节大小（通常都是 1）
  Nan::Set(layout, Nan::New("componentSize").ToLocalChecked(),
           Nan::New<Uint32>(sizeof(sf::Uint8)));

  Nan::Set(func, Nan::New("LAYOUT").ToLocalChecked(), layout);
  Nan::Set(target, name, func);
}

Color::Color(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
  color_ = new sf::Color(r, g, b, a);
}

Color::Color() {
  color_ = new sf::Color();
}

Color::~Color() {
  typed_array_.Reset();
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

  // 解析参数（同之前）
  if (info.Length() == 0) {
    color = new Color();
  } else if (info.Length() == 1) {
    uint32_t rgba = Nan::To<uint32_t>(info[0]).FromJust();
    // 注意：sf::Color 的整数构造函数可能有不同的解释
    // 这里创建后手动设置分量更安全
    color = new Color();
    color->color_->r = (rgba >> 24) & 0xFF;
    color->color_->g = (rgba >> 16) & 0xFF;
    color->color_->b = (rgba >> 8) & 0xFF;
    color->color_->a = rgba & 0xFF;
  } else if (info.Length() >= 3) {
    uint32_t r = Nan::To<uint32_t>(info[0]).FromJust();
    uint32_t g = Nan::To<uint32_t>(info[1]).FromJust();
    uint32_t b = Nan::To<uint32_t>(info[2]).FromJust();
    uint32_t a = info.Length() >= 4 ? Nan::To<uint32_t>(info[3]).FromJust() : 255;

    if (r > 255 || g > 255 || b > 255 || a > 255) {
      Nan::ThrowRangeError("Color components must be 0-255");
      return;
    }

    color = new Color(r, g, b, a);
  } else {
    Nan::ThrowError("Invalid arguments");
    return;
  }

  color->Wrap(info.This());

  // 创建 External ArrayBuffer 指向整个 sf::Color 结构
  Isolate* isolate = info.GetIsolate();
  void* data = reinterpret_cast<void*>(color->color_);
  size_t byte_length = sizeof(sf::Color);  // 可能不是 4！

  std::unique_ptr<BackingStore> backing_store =
    ArrayBuffer::NewBackingStore(
      data, byte_length,
      [](void* data, size_t length, void* deleter_data) {
        // 空 deleter
      },
      nullptr
    );

  Local<ArrayBuffer> array_buffer =
    ArrayBuffer::New(isolate, std::move(backing_store));

  // 创建 Uint8Array 覆盖整个结构
  Local<Uint8Array> typed_array =
    Uint8Array::New(array_buffer, 0, byte_length);

  // 暴露给 JS
  Nan::Set(info.This(), Nan::New("_data").ToLocalChecked(), typed_array);

  color->typed_array_.Reset(typed_array);
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Color::ToInteger) {
  Color* color = Nan::ObjectWrap::Unwrap<Color>(info.Holder());
  // 手动组合，不依赖 sf::Color::toInteger()
  uint32_t rgba =
    (static_cast<uint32_t>(color->color_->r) << 24) |
    (static_cast<uint32_t>(color->color_->g) << 16) |
    (static_cast<uint32_t>(color->color_->b) << 8) |
    static_cast<uint32_t>(color->color_->a);
  info.GetReturnValue().Set(Nan::New(rgba));
}

Local<Object> Color::NewInstance(const sf::Color& sfColor) {
  Local<Function> cons = Nan::New(constructor);
  Local<Value> argv[] = {
    Nan::New(sfColor.r),
    Nan::New(sfColor.g),
    Nan::New(sfColor.b),
    Nan::New(sfColor.a)
  };
  return Nan::NewInstance(cons, 4, argv).ToLocalChecked();
}

}  // namespace color
}  // namespace node_sfml
```

### 2. TypeScript 侧动态适配

**lib/graphics/color.ts**:

```typescript
const { Color: NativeColor } = require('../../build/Release/binding.node');

/**
 * 内存布局信息（从 C++ 获取）
 */
interface ColorLayout {
  r: number;      // r 的字节偏移量
  g: number;      // g 的字节偏移量
  b: number;      // b 的字节偏移量
  a: number;      // a 的字节偏移量
  size: number;   // 总字节大小
  componentSize: number;  // 每个分量的字节大小
}

/**
 * 颜色类 - 使用共享内存
 */
export class Color {
  /**
   * 静态布局信息 - 只在类加载时从 C++ 获取一次
   *
   * 重要：这是类级别的静态属性，所有 Color 实例共享
   * 内存布局由平台决定，但同一进程中所有 sf::Color 实例布局相同
   */
  private static readonly _layout: ColorLayout = NativeColor.LAYOUT;

  private readonly _native: any;
  private readonly _data: Uint8Array;

  constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 255) {
    this._native = new NativeColor(r, g, b, a);
    this._data = this._native._data;

    // 验证
    if (!(this._data instanceof Uint8Array)) {
      throw new Error('Invalid Color internal data');
    }

    if (this._data.length < Color._layout.size) {
      throw new Error(
        `Color data size mismatch: expected at least ${Color._layout.size} bytes, ` +
        `got ${this._data.length}`
      );
    }
  }

  /**
   * 从整数创建
   */
  static fromInteger(rgba: number): Color {
    return new Color(
      (rgba >>> 24) & 0xFF,
      (rgba >>> 16) & 0xFF,
      (rgba >>> 8) & 0xFF,
      rgba & 0xFF
    );
  }

  /**
   * 获取内存布局信息（用于调试）
   */
  static getLayout(): Readonly<ColorLayout> {
    return { ...Color._layout };
  }

  // 属性访问 - 使用布局信息计算偏移量
  // 注意：Color._layout 是静态的，访问它没有额外开销

  get r(): number {
    return this._data[Color._layout.r];  // _layout.r 在编译时已知，JIT 可以优化
  }

  set r(value: number) {
    this._data[Color._layout.r] = this._clamp(value);
  }

  get g(): number {
    return this._data[Color._layout.g];
  }

  set g(value: number) {
    this._data[Color._layout.g] = this._clamp(value);
  }

  get b(): number {
    return this._data[Color._layout.b];
  }

  set b(value: number) {
    this._data[Color._layout.b] = this._clamp(value);
  }

  get a(): number {
    return this._data[Color._layout.a];
  }

  set a(value: number) {
    this._data[Color._layout.a] = this._clamp(value);
  }

  /**
   * 转换为整数
   */
  toInteger(): number {
    return this._native.toInteger();
  }

  /**
   * 克隆
   */
  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }

  /**
   * 转为普通对象
   */
  toJSON(): { r: number; g: number; b: number; a: number } {
    return { r: this.r, g: this.g, b: this.b, a: this.a };
  }

  toString(): string {
    return `Color(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  /**
   * @internal
   */
  _getNative(): any {
    return this._native;
  }

  private _clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.floor(value)));
  }

  // 预定义颜色
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
```

### 3. Vector2f 同样的方案

**src/system/vector2.cc**:

```cpp
NAN_MODULE_INIT(Vector2f::Init) {
  Local<String> name = Nan::New("Vector2f").ToLocalChecked();
  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "add", Add);
  Nan::SetPrototypeMethod(tpl, "length", Length);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  // 导出布局信息
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

NAN_METHOD(Vector2f::New) {
  // ... 参数解析 ...

  vec->Wrap(info.This());

  // 创建共享内存
  Isolate* isolate = info.GetIsolate();
  void* data = reinterpret_cast<void*>(vec->vector_);
  size_t byte_length = sizeof(sf::Vector2f);

  std::unique_ptr<BackingStore> backing_store =
    ArrayBuffer::NewBackingStore(data, byte_length,
      [](void* data, size_t length, void* deleter_data) {}, nullptr);

  Local<ArrayBuffer> array_buffer =
    ArrayBuffer::New(isolate, std::move(backing_store));

  // 创建 Float32Array 视图
  Local<Float32Array> typed_array =
    Float32Array::New(array_buffer, 0, byte_length / sizeof(float));

  Nan::Set(info.This(), Nan::New("_data").ToLocalChecked(), typed_array);
  vec->typed_array_.Reset(typed_array);

  info.GetReturnValue().Set(info.This());
}
```

**lib/system/vector2.ts**:

```typescript
const { Vector2f: NativeVector2f } = require('../../build/Release/binding.node');

interface Vector2Layout {
  x: number;      // 偏移量（字节）
  y: number;      // 偏移量（字节）
  size: number;   // 总大小
  componentSize: number;  // float 大小（通常是 4）
}

export class Vector2f {
  private static readonly _layout: Vector2Layout = NativeVector2f.LAYOUT;

  private readonly _native: any;
  private readonly _data: Float32Array;

  constructor(x: number = 0, y: number = 0) {
    this._native = new NativeVector2f(x, y);
    this._data = this._native._data;

    if (!(this._data instanceof Float32Array)) {
      throw new Error('Invalid Vector2f internal data');
    }
  }

  static getLayout(): Readonly<Vector2Layout> {
    return { ...Vector2f._layout };
  }

  // 计算数组索引（字节偏移 / componentSize）
  private static _getIndex(byteOffset: number): number {
    return byteOffset / Vector2f._layout.componentSize;
  }

  get x(): number {
    return this._data[Vector2f._getIndex(Vector2f._layout.x)];
  }

  set x(value: number) {
    this._data[Vector2f._getIndex(Vector2f._layout.x)] = value;
  }

  get y(): number {
    return this._data[Vector2f._getIndex(Vector2f._layout.y)];
  }

  set y(value: number) {
    this._data[Vector2f._getIndex(Vector2f._layout.y)] = value;
  }

  add(other: Vector2f): Vector2f {
    return new Vector2f(this.x + other.x, this.y + other.y);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  _getNative(): any {
    return this._native;
  }
}
```

---

## 调试和验证

### 运行时检查布局

**test/layout.test.ts**:

```typescript
import { Color } from '../lib/graphics/color';
import { Vector2f } from '../lib/system/vector2';

describe('Memory layout', () => {
  it('should report Color layout', () => {
    const layout = Color.getLayout();

    console.log('Color layout:', layout);
    // 示例输出：
    // {
    //   r: 0,
    //   g: 1,
    //   b: 2,
    //   a: 3,
    //   size: 4,
    //   componentSize: 1
    // }

    expect(layout.size).toBeGreaterThanOrEqual(4);
    expect(layout.r).toBeGreaterThanOrEqual(0);
    expect(layout.g).toBeGreaterThanOrEqual(0);
    expect(layout.b).toBeGreaterThanOrEqual(0);
    expect(layout.a).toBeGreaterThanOrEqual(0);
  });

  it('should correctly access Color components', () => {
    const color = new Color(100, 150, 200, 250);

    expect(color.r).toBe(100);
    expect(color.g).toBe(150);
    expect(color.b).toBe(200);
    expect(color.a).toBe(250);

    // 修改
    color.r = 50;
    expect(color.r).toBe(50);

    // 验证 C++ 侧也看到了修改
    const integer = color.toInteger();
    expect((integer >>> 24) & 0xFF).toBe(50);
  });

  it('should report Vector2f layout', () => {
    const layout = Vector2f.getLayout();

    console.log('Vector2f layout:', layout);
    // 示例输出：
    // {
    //   x: 0,
    //   y: 4,
    //   size: 8,
    //   componentSize: 4
    // }

    expect(layout.size).toBe(8);
    expect(layout.componentSize).toBe(4);
  });

  it('should handle potential padding in structs', () => {
    const layout = Color.getLayout();

    // 即使有 padding，也能正常工作
    if (layout.size > 4) {
      console.warn(`Color has padding: ${layout.size} bytes instead of 4`);
    }

    // 测试仍然应该通过
    const color = new Color(1, 2, 3, 4);
    expect(color.r).toBe(1);
    expect(color.g).toBe(2);
    expect(color.b).toBe(3);
    expect(color.a).toBe(4);
  });
});
```

---

## 优势总结

### ✅ 跨平台兼容

```
Linux x64:    Color { r@0, g@1, b@2, a@3, size=4 }  ✓
macOS ARM:    Color { r@0, g@1, b@2, a@3, size=4 }  ✓
Windows x64:  Color { r@0, g@2, b@4, a@6, size=8 }  ✓ (假设有 padding)
```

所有平台都能正常工作！

### ✅ 零运行时开销

```typescript
// 1. 布局查询只在类加载时发生一次（模块初始化）
private static readonly _layout = NativeColor.LAYOUT;
// ↑ 这行代码只执行一次，不是每次 new Color() 都执行

// 2. 每次访问仍然是直接内存操作
get r() {
  return this._data[Color._layout.r];  // 单次数组访问
  // Color._layout.r 是常量，V8/JIT 会优化成直接偏移量
  // 相当于: return this._data[0];
}

// 3. 创建实例时不重新查询布局
const color1 = new Color(255, 0, 0);  // ✓ 不查询布局
const color2 = new Color(0, 255, 0);  // ✓ 不查询布局
// 布局信息已经在 Color._layout 中
```

### ✅ 调试友好

```typescript
// 可以随时检查内存布局
console.log('Current platform layout:', Color.getLayout());

// 帮助诊断跨平台问题
if (Color.getLayout().size !== 4) {
  console.warn('Unexpected Color size - possible alignment issues');
}
```

### ✅ 未来兼容

即使 SFML 未来版本改变内存布局，代码仍然能工作，无需修改！

---

## 总结

**核心改变**：
1. ❌ 不再用 `static_assert` 假设内存布局
2. ✅ C++ 导出 `offsetof()` 信息
3. ✅ TypeScript 运行时查询并适配
4. ✅ 仍然是零拷贝共享内存

**结果**：更灵活、更健壮、跨平台兼容！
