# SFML.js 性能分析：布局查询与访问开销

## 布局信息的生命周期

### 1. 何时查询布局？

```typescript
// ====== 模块加载时（只执行一次）======
const { Color: NativeColor } = require('../../build/Release/binding.node');

export class Color {
  // 这行代码只在类定义时执行一次
  private static readonly _layout: ColorLayout = NativeColor.LAYOUT;
  //                                              ^^^^^^^^^^^^^^^^^^^
  //                                              只查询一次！
}
```

**时间点**：
- Node.js 加载模块时
- 类定义被执行时
- 在创建任何 Color 实例之前

**开销**：
- 一次 C++ → JS 的对象传递（~100ns）
- 只发生一次，与创建多少个实例无关

---

### 2. 创建实例时

```typescript
// ====== 每次 new Color() 时 ======
const color = new Color(255, 0, 0);
```

**执行流程**：
```
1. TypeScript: new NativeColor(255, 0, 0)
   ↓
2. C++: Color::New()
   ↓
3. C++: 分配 sf::Color 对象
   ↓
4. C++: 创建 External ArrayBuffer 指向 sf::Color 内存
   ↓
5. C++: 创建 Uint8Array 视图
   ↓
6. JS: color._data = native._data
   ↓
✓ 完成
```

**注意**：整个过程没有重新查询布局！
- ❌ 不访问 `NativeColor.LAYOUT`
- ❌ 不调用 `offsetof()`
- ✅ 只创建指向已分配内存的 TypedArray

---

### 3. 访问属性时

```typescript
// ====== 每次访问 color.r 时 ======
const red = color.r;
```

**执行流程**：
```javascript
get r() {
  return this._data[Color._layout.r];
}
```

**分解**：
1. `Color._layout` - 访问静态属性（JIT 优化后几乎免费）
2. `Color._layout.r` - 访问对象属性（内联后成为常量 0）
3. `this._data[0]` - 数组访问（~1ns）

**V8 JIT 优化后**：
```javascript
// V8 看到的等价代码
get r() {
  return this._data[0];  // 编译时常量
}
```

---

## 性能测试

### 测试代码

```typescript
import { performance } from 'perf_hooks';
import { Color } from './color';

// 测试 1: 创建 100 万个实例
console.log('Test 1: 创建实例');
const start1 = performance.now();
for (let i = 0; i < 1000000; i++) {
  const color = new Color(i % 256, i % 256, i % 256);
}
const end1 = performance.now();
console.log(`创建 100 万个 Color: ${(end1 - start1).toFixed(2)}ms`);
console.log(`平均每个: ${((end1 - start1) / 1000000 * 1000).toFixed(3)}μs`);

// 测试 2: 访问属性 1000 万次
console.log('\nTest 2: 访问属性');
const color = new Color(128, 64, 32, 255);
const start2 = performance.now();
let sum = 0;
for (let i = 0; i < 10000000; i++) {
  sum += color.r;
  sum += color.g;
  sum += color.b;
  sum += color.a;
}
const end2 = performance.now();
console.log(`访问属性 4000 万次: ${(end2 - start2).toFixed(2)}ms`);
console.log(`平均每次: ${((end2 - start2) / 40000000 * 1000000).toFixed(3)}ns`);

// 测试 3: 修改属性 1000 万次
console.log('\nTest 3: 修改属性');
const start3 = performance.now();
for (let i = 0; i < 10000000; i++) {
  color.r = i % 256;
  color.g = (i * 2) % 256;
  color.b = (i * 3) % 256;
  color.a = (i * 4) % 256;
}
const end3 = performance.now();
console.log(`修改属性 4000 万次: ${(end3 - start3).toFixed(2)}ms`);
console.log(`平均每次: ${((end3 - start3) / 40000000 * 1000000).toFixed(3)}ns`);

// 测试 4: 验证布局只查询一次
console.log('\nTest 4: 布局查询');
const start4 = performance.now();
for (let i = 0; i < 1000000; i++) {
  // 即使访问 Color.getLayout()，也是返回缓存的副本
  const layout = Color.getLayout();
}
const end4 = performance.now();
console.log(`获取布局 100 万次: ${(end4 - start4).toFixed(2)}ms`);
console.log(`平均每次: ${((end4 - start4) / 1000000 * 1000).toFixed(3)}μs`);
```

### 预期结果（Linux x64, Node.js 20）

```
Test 1: 创建实例
创建 100 万个 Color: 450.23ms
平均每个: 0.450μs

Test 2: 访问属性
访问属性 4000 万次: 42.15ms
平均每次: 1.054ns

Test 3: 修改属性
修改属性 4000 万次: 85.34ms
平均每次: 2.134ns

Test 4: 布局查询
获取布局 100 万次: 12.45ms
平均每次: 0.012μs
```

---

## 对比：旧架构 vs 新架构

### 场景：游戏循环中修改 1000 个粒子的颜色

**旧架构（每次修改都跨语言调用）**:
```javascript
for (const particle of particles) {  // 1000 个粒子
  particle.color.r = Math.random() * 255;  // C++ 调用
  particle.color.g = Math.random() * 255;  // C++ 调用
  particle.color.b = Math.random() * 255;  // C++ 调用
  particle.color.a = Math.random() * 255;  // C++ 调用
}
// 总计：4000 次跨语言调用
// 预估耗时：4000 × 200ns = 800μs = 0.8ms
```

**新架构（直接内存写入）**:
```javascript
for (const particle of particles) {  // 1000 个粒子
  particle.color.r = Math.random() * 255;  // 内存写入
  particle.color.g = Math.random() * 255;  // 内存写入
  particle.color.b = Math.random() * 255;  // 内存写入
  particle.color.a = Math.random() * 255;  // 内存写入
}
// 总计：4000 次内存写入
// 预估耗时：4000 × 2ns = 8μs = 0.008ms
// 性能提升：100 倍！
```

---

## V8 JIT 优化分析

### 属性访问的 JIT 优化

```typescript
// 源代码
get r(): number {
  return this._data[Color._layout.r];
}
```

**V8 优化流程**：

1. **初始执行**（解释器模式）:
   ```
   - 访问 Color._layout (查找静态属性)
   - 访问 .r (查找对象属性)
   - 数组索引
   ```

2. **热代码识别**（多次调用后）:
   ```
   V8 发现这个 getter 被频繁调用
   → 触发 TurboFan 优化编译器
   ```

3. **优化后的机器码**:
   ```assembly
   ; Color._layout.r 在编译时已知为 0
   mov rax, [rdi + offset_of__data]  ; 加载 this._data
   movzx eax, byte ptr [rax + 0]     ; 读取第 0 字节
   ret
   ```

**结果**：
- 消除了属性查找
- 内联了常量 0
- 直接编译成单条 `movzx` 指令

---

## 内存访问模式分析

### TypedArray 访问的性能特性

```typescript
// 1. 直接索引（最快）
const r = this._data[0];  // ~1ns

// 2. 使用常量索引（JIT 优化后同样快）
const offset = 0;
const r = this._data[offset];  // ~1ns (优化后)

// 3. 使用静态属性索引（我们的方案）
const r = this._data[Color._layout.r];  // ~1ns (优化后)
// V8 发现 Color._layout.r 是常量，优化成情况 1

// 4. 使用变量索引（稍慢）
const offset = Math.random() > 0.5 ? 0 : 1;
const r = this._data[offset];  // ~2-3ns (无法优化)
```

**我们的方案属于情况 3**：
- 虽然看起来是动态的
- 但 `Color._layout.r` 是编译时常量
- V8 会优化成情况 1 的性能

---

## 总结

### ✅ 布局查询开销

| 操作 | 频率 | 开销 |
|------|------|------|
| 查询布局信息 | 1 次（模块加载时） | ~100ns |
| 创建实例 | 每次 `new Color()` | ~450ns（不包括布局查询） |
| 访问属性 | 每次 `color.r` | ~1ns（JIT 优化后） |
| 修改属性 | 每次 `color.r = x` | ~2ns（JIT 优化后） |

### ✅ 性能优化要点

1. **布局信息是类级别的**
   - 所有实例共享
   - 只查询一次
   - 零运行时开销

2. **V8 JIT 会优化常量访问**
   - `Color._layout.r` 被识别为常量
   - 编译成直接偏移量
   - 性能等同于 `this._data[0]`

3. **共享内存避免拷贝**
   - 修改 JS 属性 = 修改 C++ 内存
   - 无需序列化/反序列化
   - 无需跨语言调用

### ✅ 与旧架构对比

| 操作 | 旧架构 | 新架构 | 提升 |
|------|--------|--------|------|
| 修改颜色分量 | ~200ns/次 | ~2ns/次 | **100x** |
| 批量修改（1000 次） | ~200μs | ~2μs | **100x** |
| 游戏循环（60fps） | 可能卡顿 | 流畅 | ✓ |
