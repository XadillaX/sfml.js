# RmlUi 6.3 公开类型源级验收

> 公开类型引用检查已通过，中、英、日、韩四语均为零警告。
> 本记录只覆盖类型源、生成器和关联消费契约，不代表完整 API 验收。

计算样式视图由上游 98 个 getter 生成独立的公开只读接口。
`ComputedValues` 的内部实现基类继续负责原生访问；公开视图不暴露构造器、
复制方法或 setter。关联元素销毁、运行时关闭、结构值复制和空值行为保持原有契约。
生成器覆盖 98 个 getter、82 个配对 setter 和一个显式只写 setter。

字节颜色使用公开的 `VariantByteColour`，其类型标识为只读的 `colourb`。
计算样式和独立样式结构使用同一类型。原生整数通道范围校验和共享字段映射保持有效。

变换数组原语公开 `TransformArrayPrimitiveType`、
`TransformPrimitiveValues<K>` 和 `TransformPrimitiveRecord<K>`。
完整的条件元组保留矩阵系数数量、长度单位、弧度值和具名分解矩阵的区分。
它们的公开定义不依赖未导出的辅助类型。

## 已运行检查

| 检查 | 结果 |
| --- | --- |
| 四语 TypeDoc 转换与引用校验 | 4 个测试通过，0 个警告 |
| 完整站点测试 | 81 个测试通过，0 失败，0 跳过 |
| 完整站点构建及链接检查 | 152 个本地化页面、每语种 1,595 个 API 页面、303 个重定向通过 |
| 包 TypeScript 构建及消费端类型检查 | 退出码 0 |
| 包 ESLint | 退出码 0，0 警告 |
| 计算样式原生场景 | 12 个通过 |
| 变换原生场景 | 7 个通过 |
| 重复生成 | 15 个生成文件内容和时间戳不变 |

检查直接运行 TypeDoc 的公开引用验证，未调整 CSS、关闭验证或增加警告豁免。
类型测试同时检查只读视图、只读颜色标识、字节颜色赋值和变换元组长度。
原生场景覆盖默认值、布局更新、共享存储、空值、复制、GC 和运行时世代失效。

## 证据

日志位于 `/tmp/rmlui-63-completion`：

- `public-types-docs-red.log`：四语各复现 5 个未解析类型引用警告。
- `public-types-docs-green.log`：四语转换和引用校验通过。
- `public-types-site-tests.log`：完整站点的 81 个测试。
- `public-types-site-build.log`：四语页面构建及全部本地链接、资源检查。
- `public-types-build-ts-final.log`、`public-types-consumer-final.log`、
  `public-types-lint-final.log`：构建、类型及 lint 结果。
- `public-types-computed-runtime.log`、`public-types-transform-runtime.log`：
  原生消费场景。
- `public-types-generator-stability.log`：准确字段数及重复生成稳定性。

浏览器视觉检查、类型／前向声明对账、外部 C++ 指针、迭代器转移、
完整转换与生命周期矩阵、Lua、可选模块、应用与平台验收继续单独记录。
