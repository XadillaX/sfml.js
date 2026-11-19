# Core document flag declaration reconciliation

Twelve previously pending enum declarations now have exact source and existing
runtime/consumer evidence. The TypeScript exports match each pinned native
enumerator, and the document runtime suite asserts all nine numeric values
before exercising native show/focus/modal/scroll behavior.

| Exact native enum | Enumerators and values | Behavioral evidence |
| --- | --- | --- |
| `ModalFlag` | `None = 0`, `Modal = 1`, `Keep = 2` | Removing/enabling/retaining modality, focus blocking and invalid flag rejection |
| `FocusFlag` | `None = 0`, `Document = 1`, `Keep = 2`, `Auto = 3` | No focus request, document focus, retained element focus, autofocus and tab selection |
| `ScrollFlag` | `None = 0`, `Auto = 1` | Explicit no-scroll and focused-child scrolling after layout |

The exact native keys are the three `EnumDecl` rows and their nine
enumerator rows in `Core/ElementDocument.h`. No document class,
constructor, script hook, forward declaration or unrelated enum is promoted.

Sources and consumer evidence:

- `packages/sfml.js-rmlui/third_party/rmlui/Include/RmlUi/Core/ElementDocument.h`
- `packages/sfml.js-rmlui/src/document-flags.ts`
- `packages/sfml.js-rmlui/native/rmlui-document.cc`
- `packages/sfml.js-rmlui/test/documents.test.cjs`: `show-focus-tabs`,
  `hover-modal-unfocus`, `layout-scroll-flags`
- `packages/sfml.js-rmlui/test/documents.ts`: typed `show` calls and negative
  unknown/boolean flag cases

Four-language source comments document each value. The full-package run in
`/tmp/rmlui-63-completion/core-offset-iterator-package-final.log` exits zero with
78 runtime suite files, 717 PASS and zero FAIL, including the document runtime
suite and consumer type checks. It provides the execution record alongside the
exact ledger.
This reconciliation addresses enum records that were omitted from the earlier
method-only recovery. It does not establish full Document or Core acceptance.
