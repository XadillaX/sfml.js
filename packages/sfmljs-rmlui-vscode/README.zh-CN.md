# VS Code 的 RmlUi 支持

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

支持 RmlUi 6.3 的 RML／RCSS 语法高亮、代码片段、补全、悬浮说明、诊断和颜色预览。
扩展内置语言服务器，运行时无需 `node_modules`。

## 构建与安装

在现有仓库执行 `node tools/bootstrap.cjs`，然后运行：

```sh
npm --prefix packages/sfmljs-rmlui-language-server test
npm --prefix packages/sfmljs-rmlui-vscode test
npm --prefix packages/sfmljs-rmlui-vscode run vsix -- --out rmlui.vsix
code --install-extension packages/sfmljs-rmlui-vscode/rmlui.vsix
```

按需要指定 VSIX 输出位置。要求 VS Code 1.80 或更新版本。
打开 `.rml` 或 `.rcss` 文件即可激活扩展。

## 命令与设置

命令面板提供 RML 手册、RCSS 手册、属性索引、数据绑定手册及
**RmlUi: Restart RmlUi language server**。
`rmlui` 设置控制未知属性、标签、伪类诊断，工作区 ID／class 补全和服务器跟踪。
自定义元素的未知标签仅显示提示，因为原生 instancer 可能提供该元素。

## 验证

在本包执行 `npm run test:editor`，使用已安装的 `code` CLI 和当前构建，验证实际激活、
命令、补全、诊断、悬浮说明、颜色及服务器重启。测试使用未保存文档，不创建独立编辑器
配置，不下载 VS Code，不复制仓库。CLI 名称不同时设置 `VSCODE_CLI`。

执行 `python tools/packaging/verify-vsix.py <archive.vsix>` 核验归档。
验证器将内置文件与当前构建逐字节比较，并检查源码、测试、依赖及 source map 未被打包。
