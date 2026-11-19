# Core explicit data application acceptance

`ElementUtilities.applyDataViewsControllers(element)` has a positive native
application regression. The tested element is attached to an active model before
binding attributes are added, so the explicit call constructs the actual native
view and controllers. The test verifies successful initialization, dirty value
updates, native input synchronization, input-to-model assignment and model
event dispatch. It also verifies missing and unregistered bindings return false,
model removal unregisters callbacks, and destroyed elements reject access.

The thirteen-group element-utilities suite passes with zero failures in
`/tmp/rmlui-63-completion/core-data-application-runtime-final.log`.
The existing twelve other static routes retain their separate behavioral
evidence. The exact `Core/ElementUtilities.h:109` method record and
`:19` static class representation are now locally verified. Every callable
record remains independently accounted for; no other class is promoted.

The facade already called the correct native implementation. The added
acceptance test initially used an unavailable `input.value` member; correcting
it to the existing `getValue()` API exposed the real native synchronization.
No production workaround or additional callback path was introduced.
Consumer types check the boolean result and reject arbitrary object receivers.
Four-language guides describe the construction result and removal behavior,
including that reapplication is not an idempotent refresh.

The final full package run exits zero in
`/tmp/rmlui-63-completion/core-offset-iterator-package-final.log`: 78 runtime
suite files, 717 PASS, zero FAIL, with lint/cpplint/build/type acceptance.
The final consumer fixture additionally passes in
`core-data-application-types.log`, and final lint in
`core-data-application-lint.log`.

This resolves the explicit positive data-application gap. It does not establish
IME/text-handler, remaining Core or whole-plan acceptance. Validation uses the
existing workspace and build tree; no commit, push or isolated environment is
part of this result.
