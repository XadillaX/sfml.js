# SFML.js 重构方案：TypeScript + NAN + 共享内存架构

## 📋 目录

- [项目概述](#项目概述)
- [当前架构分析](#当前架构分析)
- [重构目标](#重构目标)
- [新架构设计](#新架构设计)
- [核心技术：共享内存映射](#核心技术共享内存映射)
- [API 设计](#api-设计)
- [性能优势](#性能优势)
- [实施计划](#实施计划)
- [迁移指南](#迁移指南)

---

## 项目概述

**SFML.js** 是 SFML (Simple and Fast Multimedia Library) 的 Node.js 绑定库。

### 当前技术栈
- **C++ 绑定层**: NAN (Native Abstractions for Node.js)
- **JavaScript 包装层**: 纯 JavaScript + 独立的 `.d.ts` 类型定义
- **构建系统**: node-gyp

---

## 当前架构分析

### 🔴 主要问题

#### 1. **双层包装的性能损耗**

```javascript
// 当前架构的调用链
用户代码 → JS 包装类 → Symbol 访问 → NAN ObjectWrap → SFML C++
```

示例：
```javascript
// lib/render_window.js
class RenderWindow {
  constructor(videoMode, title, style) {
    this[RAW_RENDER_WINDOW] = new _RenderWindow(videoMode, title, style);
  }

  clear(color) {
    this[RAW_RENDER_WINDOW].clear(color);  // 双层调用
  }
}
```

#### 2. **频繁的跨语言数据拷贝**

```javascript
// 每次修改颜色属性都触发 C++ 调用
color.r = 128;  // C++ getter/setter
color.g = 255;  // C++ getter/setter
color.b = 0;    // C++ getter/setter
// 总共 3 次跨语言调用！
```

C++ 侧：
```cpp
// src/color.cc - 每个属性都是独立的 NAN 方法
NAN_METHOD(Color::RGetter) {
  Color* color = Nan::ObjectWrap::Unwrap<Color>(info.This());
  info.GetReturnValue().Set(color->_color->r);  // 跨语言返回
}

NAN_METHOD(Color::RSetter) {
  // 参数验证、类型转换...
  Color* color = Nan::ObjectWrap::Unwrap<Color>(info.This());
  color->_color->r = val;  // 跨语言写入
}
```

#### 3. **混乱的 Mixin 模式**

```javascript
// lib/drawable/sprite.js
function setTransformable(proto) {
  proto.getPosition = function() { return this._raw().getPosition(); };
  proto.setPosition = function(x, y) { /* ... */ };
  // ... 大量重复代码
}

setTransformable(Sprite.prototype);
setPluginPackageBound(Sprite.prototype);
setPluginPackageTexture(Sprite.prototype);
```

#### 4. **类型定义与实现分离**

```
lib/color.js        - 运行时实现
lib/color.d.ts      - 类型定义
```

容易导致类型定义与实现不同步。

#### 5. **大量重复代码**

```javascript
// lib/color.js - 每个属性都要重复这样的代码
get r() { return super.r; }
set r(val) {
  val = parseInt(val);
  if (val < 0 || val > 255) {
    throw new Error('`val` should between 0 and 255.');
  }
  super.r = val;
}

get g() { return super.g; }
set g(val) {
  val = parseInt(val);
  if (val < 0 || val > 255) {
    throw new Error('`val` should between 0 and 255.');
  }
  super.g = val;
}
// b, a 同样的模式...
```

---

## 重构目标

### ✅ 核心目标

1. **零拷贝性能**: 使用 V8 External ArrayBuffer 实现 C++ 内存直接映射
2. **类型安全**: 迁移到 TypeScript，消除类型定义与实现分离的问题
3. **简洁 API**: 统一的接口设计，fluent API 模式
4. **可维护性**: 减少重复代码，清晰的架构分层
5. **向后兼容**: 尽可能保持 API 兼容性

### 🎯 技术选型

- **TypeScript**: 类型安全、更好的开发体验
- **NAN**: 保持现有绑定层（稳定、成熟）
- **External ArrayBuffer**: V8 共享内存机制

---

## 新架构设计

### 架构分层

```
┌─────────────────────────────────────────────────────┐
│  TypeScript 用户 API 层 (lib/)                       │
│  - 友好的类型定义                                     │
│  - 便捷的构造函数、方法链                              │
│  - 自动类型转换                                       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  共享内存数据层                                       │
│  - Color, Vector2, Rect 等简单类型                   │
│  - TypedArray 直接映射到 C++ 对象内存                 │
│  - 零拷贝读写                                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  NAN ObjectWrap 层 (src/)                           │
│  - Sprite, Texture, RenderWindow 等复杂对象          │
│  - 管理 SFML C++ 对象生命周期                         │
│  - 创建 External ArrayBuffer                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  SFML C++ 库                                         │
└─────────────────────────────────────────────────────┘
```

### 类型分类

#### A. 共享内存类型（纯数据结构）

这些类型在 C++ 中分配内存，通过 TypedArray 暴露给 JavaScript：

- `Color` → `sf::Color*` → `Uint8Array[4]`
- `Vector2f` → `sf::Vector2f*` → `Float32Array[2]`
- `Vector2i` → `sf::Vector2i*` → `Int32Array[2]`
- `Vector3f` → `sf::Vector3f*` → `Float32Array[3]`
- `IntRect` → `sf::IntRect*` → `Int32Array[4]`
- `FloatRect` → `sf::FloatRect*` → `Float32Array[4]`

#### B. NAN ObjectWrap 类型（复杂对象）

这些类型需要维护 C++ 状态和资源：

- `RenderWindow`
- `Texture`
- `Sprite`
- `Font`
- `Sound`
- `Music`
- `Clock`

---

## 核心技术：共享内存映射

### 原理图

```
┌─────────────────────────────────────────────────────┐
│ JavaScript 侧                                        │
│                                                      │
│  const color = new Color(255, 0, 0);                │
│  color.r = 128;  // 直接写入共享内存                  │
│                                                      │
│  ┌──────────────┐                                   │
│  │ Color 对象    │                                   │
│  │ _data: Uint8Array ────┐                          │
│  └──────────────┘         │                          │
└─────────────────────────────┼──────────────────────┘
                              │
                              │ 指向同一块内存
                              │
┌─────────────────────────────┼──────────────────────┐
│ C++ 侧                       ↓                       │
│                                                      │
│  ┌────────────────────────────────┐                 │
│  │ External ArrayBuffer           │                 │
│  │ [255][128][0][255]             │                 │
│  │  ↑r   ↑g   ↑b  ↑a              │                 │
│  └────────────────────────────────┘                 │
│                ↑                                     │
│                │                                     │
│  ┌─────────────┴────────┐                           │
│  │ sf::Color* color_    │                           │
│  │ new sf::Color()      │                           │
│  └──────────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

### 内存布局

#### Color (4 字节)
```
Offset  Type     Field
0       uint8_t  r
1       uint8_t  g
2       uint8_t  b
3       uint8_t  a
```

#### Vector2f (8 字节)
```
Offset  Type     Field
0-3     float    x
4-7     float    y
```

#### IntRect (16 字节)
```
Offset  Type     Field
0-3     int32_t  left
4-7     int32_t  top
8-11    int32_t  width
12-15   int32_t  height
```

### 关键代码实现

#### C++ 侧创建共享内存

```cpp
// src/graphics/color.cc
NAN_METHOD(Color::New) {
  // 1. 分配 C++ 对象
  Color* color = new Color(r, g, b, a);
  color->color_ = new sf::Color(r, g, b, a);
  color->Wrap(info.This());

  // 2. 创建 External ArrayBuffer 指向 sf::Color 内存
  Isolate* isolate = info.GetIsolate();
  void* data = reinterpret_cast<void*>(color->color_);
  size_t byte_length = 4;  // sizeof(sf::Color) == 4

  std::unique_ptr<BackingStore> backing_store =
    ArrayBuffer::NewBackingStore(
      data,
      byte_length,
      [](void* data, size_t length, void* deleter_data) {
        // 空 deleter - 内存由 Color 对象管理
      },
      nullptr
    );

  Local<ArrayBuffer> array_buffer =
    ArrayBuffer::New(isolate, std::move(backing_store));

  // 3. 创建 TypedArray 视图
  Local<Uint8Array> typed_array = Uint8Array::New(array_buffer, 0, 4);

  // 4. 暴露给 JavaScript
  Nan::Set(info.This(), Nan::New("_data").ToLocalChecked(), typed_array);

  info.GetReturnValue().Set(info.This());
}
```

#### TypeScript 侧访问共享内存

```typescript
// lib/graphics/color.ts
export class Color {
  private _native: any;        // NAN ObjectWrap (管理生命周期)
  private _data: Uint8Array;   // 指向 C++ sf::Color 内存

  constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 255) {
    this._native = new NativeColor(r, g, b, a);
    this._data = this._native._data;  // 获取共享内存
  }

  // 直接读写共享内存 - 零拷贝！
  get r(): number {
    return this._data[0];  // 直接读 sf::Color::r
  }

  set r(value: number) {
    this._data[0] = value;  // 直接写 sf::Color::r
  }
}
```

---

## API 设计

### 1. Color API

```typescript
// 构造函数
const color1 = new Color();                    // 黑色
const color2 = new Color(255, 0, 0);           // 红色
const color3 = new Color(255, 0, 0, 128);      // 半透明红色
const color4 = Color.fromInteger(0xFF0000FF);  // 从整数创建

// 属性访问（直接操作共享内存）
color.r = 128;
color.g = 255;
color.b = 0;
color.a = 255;

console.log(color.r);  // 128

// 方法
const rgba = color.toInteger();  // 转换为整数
const copy = color.clone();      // 克隆
const json = color.toJSON();     // { r: 128, g: 255, b: 0, a: 255 }

// 预定义颜色
Color.Black
Color.White
Color.Red
Color.Green
Color.Blue
Color.Yellow
Color.Transparent
```

### 2. Vector2 API

```typescript
// 构造函数
const vec1 = new Vector2f();           // (0, 0)
const vec2 = new Vector2f(100, 200);   // (100, 200)

// 属性访问（直接操作共享内存）
vec.x = 150;
vec.y = 250;

// 向量运算（返回新对象）
const vec3 = vec1.add(vec2);
const vec4 = vec1.subtract(vec2);
const vec5 = vec1.multiply(2.5);

// 工具方法
const length = vec.length();
const normalized = vec.normalize();

// 整数版本
const pos = new Vector2i(10, 20);
```

### 3. Rect API

```typescript
// 构造函数
const rect = new IntRect(10, 20, 100, 50);
// left=10, top=20, width=100, height=50

// 属性访问
rect.left = 15;
rect.width = 120;

// 计算属性
const right = rect.right;    // left + width
const bottom = rect.bottom;  // top + height

// 方法
const contains = rect.contains(50, 30);  // 检查点是否在矩形内
const intersects = rect.intersects(otherRect);  // 检查是否相交

// 浮点版本
const rectF = new FloatRect(10.5, 20.5, 100.5, 50.5);
```

### 4. Sprite API

```typescript
// 构造函数
const sprite = new Sprite();
const sprite2 = new Sprite(texture);
const sprite3 = new Sprite(texture, new IntRect(0, 0, 32, 32));

// 纹理操作
sprite.setTexture(texture, true);
const tex = sprite.getTexture();

// 颜色（接受共享内存的 Color 对象）
sprite.setColor(new Color(255, 0, 0));
sprite.setColor(Color.Red);
const color = sprite.getColor();  // 返回新的 Color 对象

// 变换（接受共享内存的 Vector2 对象）
sprite.setPosition(new Vector2f(100, 200));
sprite.setPosition(100, 200);  // 重载：直接传 x, y
sprite.setRotation(45);
sprite.setScale(new Vector2f(2, 2));
sprite.setScale(2, 2);

// 方法链（fluent API）
sprite
  .setTexture(texture)
  .setPosition(100, 200)
  .setRotation(45)
  .setScale(2, 2)
  .setColor(Color.Red);
```

### 5. RenderWindow API

```typescript
// 构造函数（简化的配置对象）
const window = new RenderWindow({
  width: 800,
  height: 600,
  title: 'My Game',
  style: WindowStyle.Default,
});

// 清空（接受共享内存的 Color）
window.clear(Color.Black);
window.clear(new Color(25, 25, 25));

// 绘制
window.draw(sprite);

// 异步 API
await window.drawAsync(sprite);
await window.displayAsync();

// 事件循环（Generator）
for (const event of window.events()) {
  if (event.type === EventType.Closed) {
    window.close();
  }
}

// 方法链
window
  .setFramerateLimit(60)
  .setVerticalSyncEnabled(true)
  .setTitle('Updated Title');
```

---

## 性能优势

### 性能对比

#### 场景 1: 频繁修改颜色属性

```typescript
// 旧架构（每次修改都跨语言调用）
for (let i = 0; i < 1000; i++) {
  color.r = i % 255;  // C++ setter 调用
  color.g = 255 - (i % 255);  // C++ setter 调用
  color.b = (i * 2) % 255;  // C++ setter 调用
}
// 总计：3000 次跨语言调用
// 预估耗时：~150-1500μs (每次调用 50-500ns)
```

```typescript
// 新架构（直接内存写入）
for (let i = 0; i < 1000; i++) {
  color.r = i % 255;  // 内存写入
  color.g = 255 - (i % 255);  // 内存写入
  color.b = (i * 2) % 255;  // 内存写入
}
// 总计：3000 次内存写入
// 预估耗时：~3μs (每次写入 ~1ns)
// 性能提升：50-500 倍！
```

#### 场景 2: 游戏循环中的位置更新

```typescript
// 旧架构
const velocity = { x: 5, y: 3 };
const position = { x: 0, y: 0 };

for (let frame = 0; frame < 60; frame++) {
  position.x += velocity.x;  // JS 计算
  position.y += velocity.y;  // JS 计算

  // 每帧都要将位置传递给 C++
  sprite.setPosition(position.x, position.y);  // 跨语言调用
}
// 60 帧 × 1 次调用 = 60 次跨语言调用
```

```typescript
// 新架构
const velocity = new Vector2f(5, 3);
const position = new Vector2f(0, 0);

for (let frame = 0; frame < 60; frame++) {
  position.x += velocity.x;  // 直接写共享内存
  position.y += velocity.y;  // 直接写共享内存

  sprite.setPosition(position);  // 传递指针，C++ 直接读共享内存
}
// 120 次内存写入 + 60 次指针传递
// C++ 侧无需拷贝数据！
```

#### 场景 3: 粒子系统

```typescript
// 1000 个粒子，每帧更新位置和颜色
const particles = Array.from({ length: 1000 }, () => ({
  sprite: new Sprite(texture),
  position: new Vector2f(Math.random() * 800, Math.random() * 600),
  velocity: new Vector2f(Math.random() * 10 - 5, Math.random() * 10 - 5),
  color: new Color(255, 255, 255, 255),
}));

function update() {
  for (const p of particles) {
    // 所有这些操作都是直接内存写入
    p.position.x += p.velocity.x;
    p.position.y += p.velocity.y;
    p.color.a = Math.max(0, p.color.a - 1);

    // 传递共享内存对象给 C++
    p.sprite.setPosition(p.position);
    p.sprite.setColor(p.color);
  }
}

// 旧架构：每帧 ~6000 次跨语言调用
// 新架构：每帧 ~3000 次内存写入 + 2000 次指针传递
// 性能提升：约 3-5 倍
```

### 内存优势

```typescript
// 旧架构：每个 Color 对象
// - JS 包装对象: ~48 字节
// - C++ ObjectWrap: ~64 字节
// - sf::Color: 4 字节
// 总计：~116 字节/对象

// 新架构：每个 Color 对象
// - JS 包装对象: ~32 字节
// - C++ ObjectWrap: ~64 字节
// - sf::Color: 4 字节（共享）
// - TypedArray: ~16 字节
// 总计：~116 字节/对象

// 内存使用相近，但访问效率大幅提升
```

---

## 实施计划

### Phase 1: 基础设施 (Week 1-2)

- [x] 创建项目结构
  - `lib/` 目录用于 TypeScript 源码
  - `src/` 目录重组 C++ 代码
  - 配置 `tsconfig.json`
- [ ] 实现共享内存基础类型
  - `Color`
  - `Vector2f` / `Vector2i` / `Vector2u`
  - `Vector3f`
  - `IntRect` / `FloatRect`
- [ ] 编写单元测试验证共享内存机制
- [ ] 性能基准测试

### Phase 2: 核心类迁移 (Week 3-4)

- [ ] `Texture`
- [ ] `Sprite`
- [ ] `RenderWindow`
- [ ] `Font`
- [ ] `Text`
- [ ] 绘制相关的其他类

### Phase 3: 系统类迁移 (Week 5)

- [ ] `Clock`
- [ ] `Time`
- [ ] `VideoMode`
- [ ] 事件系统

### Phase 4: 音频系统 (Week 6)

- [ ] `Sound`
- [ ] `SoundBuffer`
- [ ] `Music`

### Phase 5: 高级功能 (Week 7-8)

- [ ] `RenderTexture`
- [ ] `Shader`
- [ ] `VertexArray`
- [ ] 形状类 (`CircleShape`, `RectangleShape`, 等)

### Phase 6: 文档和示例 (Week 9-10)

- [ ] API 文档生成（TypeDoc）
- [ ] 迁移指南
- [ ] 示例项目更新
- [ ] 性能对比报告

### Phase 7: 测试和发布 (Week 11-12)

- [ ] 全面测试
- [ ] 修复 bug
- [ ] 准备发布说明
- [ ] 发布 v1.0.0

---

## 迁移指南

### 向后兼容性

大部分 API 保持兼容，主要变化：

#### 1. 导入方式

```typescript
// 旧代码
const sfml = require('sfml.js');
const { Color, RenderWindow } = sfml;

// 新代码（推荐）
import { Color, RenderWindow, Sprite } from 'sfml.js';

// 或者仍然使用 CommonJS
const { Color, RenderWindow, Sprite } = require('sfml.js');
```

#### 2. Color 使用

```typescript
// 旧代码 - 仍然有效
const color = new Color(255, 0, 0);
color.r = 128;

// 新特性 - 预定义颜色
const red = Color.Red;

// 新特性 - 从整数创建
const color2 = Color.fromInteger(0xFF0000FF);
```

#### 3. RenderWindow 构造

```typescript
// 旧代码 - 仍然有效
const mode = new VideoMode(800, 600);
const window = new RenderWindow(mode, 'Title', WindowStyle.Default);

// 新代码（推荐）- 更简洁
const window = new RenderWindow({
  width: 800,
  height: 600,
  title: 'Title',
  style: WindowStyle.Default,
});
```

#### 4. 事件循环

```typescript
// 旧代码 - 仍然有效
let event;
while (event = window.pollEvent()) {
  if (event.type === EventType.Closed) {
    window.close();
  }
}

// 新代码（推荐）- 使用 Generator
for (const event of window.events()) {
  if (event.type === EventType.Closed) {
    window.close();
  }
}
```

### 破坏性变更

#### 1. 不再支持的模式

```typescript
// 旧代码 - 不再支持
const sprite = new Sprite();
delete sprite.setPointCount;  // 手动删除方法

// 新代码 - 类型系统自动处理
const sprite = new Sprite();
// TypeScript 编译器会阻止调用不存在的方法
```

#### 2. 内部 API 变更

```typescript
// 旧代码 - 内部 Symbol 访问
sprite[RAW_RENDER_WINDOW].someMethod();

// 新代码 - 使用公共 API
sprite.someMethod();

// 如果确实需要访问内部对象（不推荐）
sprite._getNative().someMethod();
```

---

## 项目结构

```
sfml.js/
├── src/                          # C++ 源码（NAN）
│   ├── binding.cc                # 主入口
│   ├── system/
│   │   ├── vector2.h
│   │   ├── vector2.cc
│   │   ├── vector3.h
│   │   ├── vector3.cc
│   │   ├── clock.h
│   │   └── clock.cc
│   ├── window/
│   │   ├── render_window.h
│   │   ├── render_window.cc
│   │   ├── event.h
│   │   ├── event.cc
│   │   ├── video_mode.h
│   │   └── video_mode.cc
│   ├── graphics/
│   │   ├── color.h
│   │   ├── color.cc
│   │   ├── rect.h
│   │   ├── rect.cc
│   │   ├── sprite.h
│   │   ├── sprite.cc
│   │   ├── texture.h
│   │   ├── texture.cc
│   │   ├── font.h
│   │   ├── font.cc
│   │   └── ...
│   └── audio/
│       ├── sound.h
│       ├── sound.cc
│       ├── music.h
│       └── music.cc
├── lib/                          # TypeScript 源码
│   ├── index.ts
│   ├── system/
│   │   ├── vector2.ts
│   │   ├── vector3.ts
│   │   ├── clock.ts
│   │   └── time.ts
│   ├── window/
│   │   ├── render-window.ts
│   │   ├── event.ts
│   │   └── video-mode.ts
│   ├── graphics/
│   │   ├── color.ts
│   │   ├── rect.ts
│   │   ├── sprite.ts
│   │   ├── texture.ts
│   │   ├── font.ts
│   │   ├── drawable.ts
│   │   └── ...
│   └── audio/
│       ├── sound.ts
│       ├── music.ts
│       └── sound-buffer.ts
├── dist/                         # 编译输出
│   ├── index.js
│   ├── index.d.ts
│   └── ...
├── examples/                     # 示例代码
│   ├── basic-window.ts
│   ├── sprite-demo.ts
│   └── performance-test.ts
├── docs/                         # 文档
│   ├── REFACTORING_PLAN.md
│   └── API.md
├── test/                         # 测试
│   ├── color.test.ts
│   ├── vector2.test.ts
│   └── ...
├── binding.gyp                   # node-gyp 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json
└── README.md
```

---

## 技术细节

### TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./lib",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["lib/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

### 构建脚本

```json
{
  "scripts": {
    "build:native": "node-gyp rebuild",
    "build:ts": "tsc",
    "build": "npm run build:native && npm run build:ts",
    "dev": "tsc --watch",
    "test": "jest",
    "prepublishOnly": "npm run build"
  }
}
```

---

## 风险和挑战

### 1. 内存安全

**风险**: ArrayBuffer 指向的 C++ 对象被释放后，JavaScript 仍持有引用。

**解决方案**:
- 使用 `Nan::Persistent` 保持 TypedArray 的引用
- 在 C++ 析构函数中清理
- 正确设置 ArrayBuffer 的 deleter

### 2. SFML 内存布局假设

**风险**: SFML 的 `sf::Color` 等类型的内存布局可能在不同版本或平台上变化。

**解决方案**:
- 使用 `static_assert` 验证内存布局
- 添加运行时检查
- 文档中明确支持的 SFML 版本

```cpp
// 验证内存布局
static_assert(sizeof(sf::Color) == 4, "sf::Color size must be 4 bytes");
static_assert(sizeof(sf::Vector2f) == 8, "sf::Vector2f size must be 8 bytes");
```

### 3. 跨平台兼容性

**风险**: 不同平台的字节序、对齐方式可能不同。

**解决方案**:
- SFML 已经处理了跨平台问题
- 在多个平台上进行测试
- 使用标准的 C++ 类型

---

## 后续优化方向

### 1. SIMD 优化

使用 SIMD 指令加速向量和颜色运算：

```cpp
// 使用 SSE/NEON 加速向量运算
void batchUpdatePositions(Vector2f* positions, Vector2f* velocities, size_t count);
```

### 2. 批量操作 API

```typescript
// 批量更新多个对象，减少跨语言调用
window.drawBatch([sprite1, sprite2, sprite3, ...]);
```

### 3. WebAssembly 后端

未来可以考虑提供 WebAssembly 版本，在浏览器中运行。

---

## 总结

本重构方案通过以下技术实现性能和开发体验的双重提升：

1. **TypeScript**: 类型安全、更好的 IDE 支持
2. **共享内存**: V8 External ArrayBuffer 实现零拷贝数据访问
3. **NAN**: 稳定可靠的 Node.js C++ 绑定层
4. **简洁 API**: 统一的接口设计、fluent API

预期性能提升：
- 简单数据类型操作：**50-500 倍**
- 游戏循环场景：**3-5 倍**
- 粒子系统等密集操作：**5-10 倍**

---

## 参考资料

- [V8 ArrayBuffer API](https://v8.dev/docs/embed)
- [NAN Documentation](https://github.com/nodejs/nan)
- [SFML Documentation](https://www.sfml-dev.org/documentation/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
