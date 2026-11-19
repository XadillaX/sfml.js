# Original basic/demo application acceptance

The original `basic/demo` application has local macOS arm64 behavior and native
window evidence. Task 9 remains open for Invaders, Lua Invaders and the
113 VisualTests; this supplement does not establish whole-scope acceptance.

## Application and resources

The port preserves the original application boundaries:

- [main.cjs](../../../../packages/sfml.js-rmlui/examples/official/basic/demo/main.cjs)
  registers the inline listener instancer before document initialization.
- [DemoWindow.cjs](../../../../packages/sfml.js-rmlui/examples/official/basic/demo/DemoWindow.cjs)
  owns the actual nested sandbox document, base sheet and submission clock.
- [DemoEventListener.cjs](../../../../packages/sfml.js-rmlui/examples/official/basic/demo/DemoEventListener.cjs)
  handles the original inline actions, tween settings and form controls.

The launcher reads the original `Samples/basic/demo/data/demo.rml`, templates,
fonts and textures without rewriting those resources. It requests the original
1600×890 resizable window. `DemoWindow.beforeEvents()` runs before SFML event
processing, followed by context update, render and presentation.

The original subject selector consumes Escape while its dropdown is open.
The document requests exit on a later Escape. The launcher delegates this
application's Escape behavior to the document and retains its shell shortcuts,
including F8 Debugger.

## Binding corrections exposed by the original application

Three existing callback restrictions prevented legitimate upstream operations.
The corrected registrations allow ordinary event callbacks to:

- Read the selected system interface, shared clock and elapsed time.
- Create and load an independent stylesheet container, combine containers,
  and assign the sandbox document's stylesheet.
- Cancel a select box without destroying its widget or event targets.

Provider callback recursion remains rejected. Stylesheet operations still reject
parser, provider, instancer and effect callback reentry. Borrowed or compiled
containers cannot be loaded; update, merge and registry mutation retain their
existing restrictions. Dedicated regression cases verify these distinctions.
The public comments explain the behavior in English, Chinese, Japanese and Korean.

## Native source reference and behavioral evidence

[The native driver](../../../../packages/sfml.js-rmlui/test/native/examples/basic/demo/original-application.cc)
links the actual upstream `DemoWindow.cpp` and `DemoEventListener.cpp` with the
existing vendor build objects. It supplies only a fixed system clock, renderer
stub and backend exit callback. It does not reproduce the application algorithms.

The original application passes four scenarios: inline sandbox changes, form
encoding and clock output, select cancellation before exit, and outer document
shutdown destroying the sandbox. Its ten reference times are 0, 0.25, 0.7, 1,
1.999, 2, 2.5, 3, 3.999 and 4 seconds.

[The JavaScript suite](../../../../packages/sfml.js-rmlui/test/examples/demo-application.test.cjs)
passes six scenarios. It compares both progress values to the native source
reference with a tolerance of `1e-7`, and compares percentage labels, progress
messages and the complete encoded form output exactly. Numeric attribute reads
preserve native precision rather than comparing six-decimal string conversions.

The suite also verifies real nested document ownership, stylesheet isolation,
the five emoji thresholds, all eleven tween types and three directions, duration
labels, child translation geometry, color-click propagation, submission restart,
and Escape behavior. Tween tests advance through the original native animation
engine's `0.1`-second update limit.

## Observed verification

| Check | Result |
| --- | --- |
| Demo application, including native reference comparison | 6 scenarios passed |
| Direct unchanged C++ application | 4 scenarios passed |
| System interface | 15 scenarios passed |
| Stylesheet containers | 15 scenarios passed |
| Form controls | 8 scenarios passed |
| Existing basic application behavior | 5 scenarios passed |
| Existing application controls | 8 scenarios passed |
| Document transfer | 9 scenarios passed |
| Four-language gallery and API comment checks | 30 tests passed |
| Native build, TypeScript build, type checks, package ESLint | Passed |
| Changed native sources and reference: clang-format, cpplint | Passed |
| Actual compiler flags and matching LLVM 18 headers: naming | 4 units passed |

The binding suites comprise 66 local scenarios. These focused results do not
replace a current full runtime run or the remaining platform acceptance.
The native reference builder requires the existing macOS vendor build;
the suite explicitly reports that reference as skipped on other platforms.

## Native screenshots and reproduction

The two screenshots were captured directly from SFML render windows and visually
inspected at 2048×1138 pixels, the size available after OS window constraints.

- [Live sandbox](../../../../packages/sfml.js-rmlui/examples/screenshots/basic-demo-sandbox.png):
  both original editors update the actual nested RmlUi document.
- [Form controls](../../../../packages/sfml.js-rmlui/examples/screenshots/basic-demo-controls.png):
  the original controls, changed rating and running submission progress.

Both images, source links, controls and panel options are included in all four
example galleries. The form screenshot is captured during progress; completed
output and four-second timing are verified by the native source reference.

Run these commands from the existing repository root:

```sh
node packages/sfml.js-rmlui/test/examples/demo-application.test.cjs
node packages/sfml.js-rmlui/examples/official.cjs basic-demo
node packages/sfml.js-rmlui/examples/official.cjs basic-demo \
  --panel sandbox --frames 8 --exercise --screenshot /tmp/basic-demo-sandbox.png
```

The native reference builder uses an existing temporary output directory and the
current package's objects. It creates no worktree, checkout or build environment:

```sh
python3 packages/sfml.js-rmlui/test/native/examples/basic/demo/build-original-application.py \
  /tmp/rmlui-63-completion
```
