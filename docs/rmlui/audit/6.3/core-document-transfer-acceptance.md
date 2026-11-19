# Core document transfer local acceptance

> The original `basic/demo` root-to-sandbox document path is locally verified
> on macOS arm64. This does not complete Tasks 9–10 or whole-project acceptance.

## Native contract

`ElementDocument` retains its own owner-document identity and borrowed context
when removed from the context root. The original `DemoWindow::Initialize`
removes a real document and appends it below `sandbox_target`; its update hook
explicitly calls `UpdateDocument`.

`GetNumDocuments` counts the root's direct DOM children. Closing a nested or
detached document does not destroy its tree. Root reattachment restores ordinary
context-owned close behavior. Closing the outer document destroys the nested
tree. Independently owned trees containing documents must be destroyed before
their borrowed context disappears.

The direct vendor oracle in `test/native/dom/document-transfer.cc` links the
existing native dependency objects. Its executable and log are temporary; it
does not create another build environment or copy the repository. Four native
scenarios pass in `document-transfer-native-oracle.log`.

## Binding ownership

`native/dom/documents/rmlui-document-ownership.*` limits root mutations to that
root's own documents. Every nested document in an inserted subtree must belong
to the destination's live context. Context roots, cycles, foreign-context
documents, native internal children and active native/event trees remain
protected. Root documents must remain DOM children.

Outgoing trees register their existing element token in
`ContextState::owned_documents` before removal. The registry retains weak tokens,
prunes expired entries and avoids duplicate live tokens. Removing an ordinary
container with nested documents registers that container's owned tree.
Context teardown releases those trees before deleting the context.

The original native document remains intact throughout transfer. Removal does
not call the document unload API. No div replacement, rewritten document,
disabled callback guard or changed nested-close behavior is used.

The first binding run exposed the Debugger log beacon missing from its existing
protection list. `ElementLog` retains that document's raw pointer for logging and
destruction. The list now also observes `rmlui-debug-log-beacon`, using the same
guard as the other Debugger documents. The failing attempt remains in
`document-transfer-binding-first.log`.

## Verification

All evidence logs below are under `/tmp/rmlui-63-completion/`.

| Completed check | Result | Evidence |
| --- | --- | --- |
| Direct vendor document oracle | 4 PASS | `document-transfer-native-oracle.log` |
| Original path, root reattachment, GC, detached container, foreign contexts, repeated transfer, callbacks and Debugger | 9 PASS | `document-transfer-binding-final.log` |
| Existing DOM ownership suite | 17 PASS | `document-transfer-existing-dom.log` |
| Existing Debugger lifecycle suite | 18 PASS | `document-transfer-debugger.log` |
| Existing Factory suite | 9 PASS | `document-transfer-factory.log` |
| Native build | Exit 0 | `document-transfer-final-native-build.log` |
| Package ESLint and native formatting | Exit 0 | `document-transfer-final-lint.log`; completed formatting command |
| Changed helper and native oracle cpplint | Exit 0 | Completed focused cpplint command |
| Compiler-backed naming, five changed native units | Exit 0 | `document-transfer-naming-configured.log` |
| TypeScript build and consumer checks | Exit 0 | `document-transfer-final-ts-build.log`, `document-transfer-final-types.log` |
| Four-language comments and rendered gallery checks | 30 PASS, zero failures | `document-transfer-site-focused.log` |

The 53 binding scenarios and four direct vendor scenarios cover this local
ownership change. The previous 149-suite/1,517-scenario full runtime result
predates this change; it is historical evidence, not current whole acceptance.

Naming uses the existing LLVM 18 macOS wrapper with the actual GYP compilation
database and matching standard-library headers. An initial direct invocation
mixed those headers with Xcode's newer libc++ and failed in SDK declarations;
that tooling failure remains in `document-transfer-naming.log`.

## Optional original IME fonts

The RmlUi ZIP excludes five fonts downloaded by the original IME CMake file.
`tools/dependencies/prepare-ime-fonts.cjs` parses those exact URLs and SHA-256
digests, checks cached files and verifies downloads before replacing a file.
`npm run download:ime-fonts` explicitly prepares the sample assets. Ordinary
package builds do not request the 38 MB download.

Four tooling scenarios pass: original manifest validation, download/cache
reuse, corrupt-cache repair/checksum rejection, and all five installed upstream
digests. The actual preparation command reports five cached files and performs
no download. The script is included in package files; all four example galleries
place its prerequisite beside the IME run command.

The original `basic/demo` application port, Invaders applications, 113-page
VisualTests comparisons, physical IME and final package/editor/site/CI checks
remain open.
