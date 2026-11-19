# Native script object acceptance

> Managed script associations cover actual native Context, Element and Event
> instances. Whole Core/Lua declaration and platform acceptance remain open.

## Native representation

The pinned `ScriptInterface::GetScriptObject` virtual returns null before
registration and a checked opaque record after `setScriptObject`. The native
base owns the record's lifetime. JS receives the original host object, never
its native address. An unregistered foreign native override rejects access and
cannot be overwritten through the managed setter.

`Context`, `Element` and `RmlEvent` extend the typed `ScriptInterface` facade.
Context and Event retain their actual inherited native base class identifier.
Element retains its native derived identity. JS subclassing and script-object
registration do not change native RTTI.

Elements and Context roots reuse `CallbackLeaseOwners` and native parent
notifications. Only changed leases are visited. Attached native roots retain
the V8 object strongly; detached owners retain it through private JS edges.
The independently owned Context handle also retains its root handle so script
objects survive GC without retaining otherwise unreachable Context cycles.
Context Factory transfer promotes ownership through its existing root notice.

Native element destruction retires the lease and clears its old owner slot
at a safe boundary. Replacing or clearing an association retires only that
record. Cloned elements start with null and preserve original release chains.
Unregistered native objects allocate no script record.

Owned EventPtr facades retain their object through a private handle edge.
Factory transfer promotes the object before removing the former owner edge.
Native dispatch retains one association between successive listener leases;
each borrowed facade still expires after its individual callback. Event
destruction releases the record. Explicit release clears its private edge.

Registered Contexts reject `release()` and use `remove()` for registration
removal. Independently owned Contexts release through their original native
instancer, without affecting a same-name Core registration.

## Verification

The initial element/event red run has nine expected failures for the missing
setter. The separate Context red case fails its base-inheritance assertion.
Focused Context verification then passed 23 cases. Two additional Context
root/Factory retention scenarios are included in final package verification.

Final `npm test` passed lint, cpplint, the native/TypeScript builds, consumer
types and all 102 runtime test files: 1,003 PASS, zero FAIL. The ScriptInterface
group contains 25 passing scenarios, including both additional Context cases.
File counts include only `.test.cjs` entries; package setup and smoke-summary
messages using the same log prefix are not test files.

All four changed native adapter object files are newer than their final
sources. Nine touched native source/header files pass formatting. Four native
compilation units pass naming with real compiler flags. The managed
ScriptInterface source patch is unchanged after two repeat runs.

The site build validates 152 localized pages, 1,586 API pages in four languages,
303 redirects and all local links/assets. Five existing source-type reference
warning categories remain in TypeDoc and still require whole-site QA.

Continuous 1,000 reads of a registered element's script object record zero
script-object ownership passes, zero lease visits and zero element-owner
visits. This is an ownership counter check, not a frame or GPU timing result.

Evidence is under `/tmp/rmlui-63-completion`:

- `script-object-red.log`
- `script-context-red.log`
- `script-object-runtime-1.log`
- `script-context-runtime-1.log`
- `script-object-package-2.log`
- `script-object-naming-2.log`
- `script-object-patch-idempotence.log`
- `script-object-site-1.log`

## Remaining scope

The Core 19 acceptance groups, remaining exact declaration review, all 55 Lua
declaration mappings, modules, GPU/platform IME, official applications, visual
corpus, rendered four-language/editor/package CI and whole-scope independent
review remain active. Scalar execution does not cover Lua's compile-without-
execution `LoadString` contract.
