# RmlUi for VS Code

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

RML and RCSS language support for RmlUi 6.3: syntax highlighting, snippets,
completion, hover documentation, diagnostics and color previews. The extension
ships its language server and requires no runtime `node_modules`.

## Build and install

Prepare the existing monorepo with `node tools/bootstrap.cjs`, then run:

```sh
npm --prefix packages/sfmljs-rmlui-language-server test
npm --prefix packages/sfmljs-rmlui-vscode test
npm --prefix packages/sfmljs-rmlui-vscode run vsix -- --out rmlui.vsix
code --install-extension packages/sfmljs-rmlui-vscode/rmlui.vsix
```

Choose the output path for your VSIX. VS Code 1.80 or later is required.
Open `.rml` or `.rcss` files to activate the extension.

## Commands and settings

The command palette provides the RML manual, RCSS manual, property index,
data-binding manual and **RmlUi: Restart RmlUi language server**.
Settings under `rmlui` control unknown properties, tags, pseudo-classes,
workspace ID/class suggestions and server tracing. Unknown custom element
tags are hints because a native instancer may provide them.

## Verification

`npm run test:editor` in this package uses the installed `code` CLI and the
current build. It checks actual activation, commands, completion, diagnostics,
hover, colors and server restart. It opens untitled documents and does not
create a separate editor profile, download VS Code or copy the repository.
Set `VSCODE_CLI` when the installed CLI has a different name.

Verify a packaged archive with
`python tools/packaging/verify-vsix.py <archive.vsix>`.
The verifier compares bundled files against the current build and checks that
source files, tests, dependencies and source maps are absent.
