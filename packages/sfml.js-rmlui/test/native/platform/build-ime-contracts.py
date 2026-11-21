"""Exercise IME editing against the existing native RmlUi widget objects."""

import argparse
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output_directory", type=Path)
    parser.add_argument("--cocoa", action="store_true")
    options = parser.parse_args()
    package = Path(__file__).resolve().parents[3]
    ime = package / "test/native/platform/ime"
    output = options.output_directory.resolve()
    if sys.platform != "darwin":
        parser.error("This runner requires the existing macOS build")
    if not output.is_dir() or package == output or package in output.parents:
        parser.error("Use an existing temporary directory outside the package")

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith("native/events/rmlui-events.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if flag != "-DNDEBUG" and not flag.startswith("-g")]

    makefile = (package / "build/rmlui.target.mk").read_text()
    names = re.findall(
        r"\$\(obj\)\.target/\$\(TARGET\)/((?:vendor|third_party)/[^\s\\]+\.o)",
        makefile)
    objects = [package / "build/Release/obj.target/rmlui" / name
               for name in names]
    if not objects or not all(item.is_file() for item in objects):
        parser.error("Build the existing package before running this probe")
    assert len(set(objects)) == len(objects)

    preedit_source = (
        package / "native/platform/ime/x11/text-input-preedit.cc").read_text()
    callback_start = preedit_source.index("template <typename Action>")
    callback_end = preedit_source.index("int Start(", callback_start)
    draw_start = preedit_source.index("void Draw(")
    caret_start = preedit_source.index("void Caret(")
    caret_end = preedit_source.index("XIMStyle PreeditStyle(", caret_start)
    (output / "x11-callback-body.inc").write_text(
        preedit_source[callback_start:callback_end] +
        preedit_source[draw_start:caret_start] +
        preedit_source[caret_start:caret_end])
    flags.extend(["-I", str(output)])

    executable = output / "ime-contracts"
    extra = []
    deferred = package / "native/platform/ime/deferred-text-input.cc"
    if deferred.is_file():
        libraries = Path(subprocess.check_output([
            "node", "-e",
            "process.stdout.write(require('sfml.js-interop/paths').sfmlLib)",
        ], cwd=package, text=True))
        extra.extend([
            str(deferred),
            str(package / "native/platform/rmlui-platform-sfml.cc"),
            *(str(libraries / f"libsfml-{name}.dylib")
              for name in ("graphics", "window", "system")),
            "-Wl,-rpath," + str(libraries),
        ])
    windows_composition = (
        package / "native/platform/ime/windows/composition-update.cc")
    if windows_composition.is_file():
        extra.append(str(windows_composition))
    x11_preedit = package / "native/platform/ime/x11/preedit-buffer.cc"
    if x11_preedit.is_file():
        extra.append(str(x11_preedit))
    try:
        xlib = subprocess.run(
            ["pkg-config", "--cflags", "--libs", "x11"],
            capture_output=True, text=True, timeout=10, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("XIM callbacks use substituted declarations: Xlib SDK absent",
              flush=True)
    else:
        # Exercise the current production state and real callback declarations.
        # Link its locale destructor from the whole production unit; never
        # create an XIC or claim an engine/target-platform result here.
        flags.append("-DSFML_RMLUI_XLIB_TESTS=1")
        extra.extend(shlex.split(xlib.stdout))
        extra.append(str(
            package / "native/platform/ime/x11/text-input-preedit.cc"))
        print("XIM callbacks use real installed Xlib declarations", flush=True)
    if options.cocoa:
        libraries = Path(subprocess.check_output([
            "node", "-e",
            "process.stdout.write(require('sfml.js-interop/paths').sfmlLib)",
        ], cwd=package, text=True))
        extra.extend([
            "-DSFML_RMLUI_IME_COCOA_TESTS=1",
            str(ime / "macos/cocoa-ime-contracts.mm"),
            str(ime / "macos/focus-allocation-contracts.mm"),
            str(ime / "macos/focus-exception-contracts.mm"),
            str(package / "native/platform/ime/platform-text-input.cc"),
            *(str(package / "native/platform/ime/macos" / name)
              for name in ("text-input-events.mm",
                           "text-input-focus.mm",
                           "text-input-editing.mm",
                           "text-input-commands.mm")),
            *(str(libraries / f"libsfml-{name}.dylib")
              for name in ("graphics", "window", "system")),
            "-Wl,-rpath," + str(libraries), "-framework", "AppKit",
        ])
    subprocess.run([
        *flags, str(ime / "common/ime-contracts.cc"),
        str(ime / "layout/caret-contracts.cc"),
        str(ime / "common/deferred-ime-contracts.cc"),
        str(ime / "windows/windows-ime-contracts.cc"),
        str(ime / "x11/x11-ime-contracts.cc"),
        str(ime / "x11/x11-callback-contracts.cc"),
        str(package / "native/platform/ime/unicode-ranges.cc"),
        str(package / "native/platform/ime/text-input-session.cc"),
        *extra,
        *(str(item) for item in objects), "-Wl,-dead_strip", "-lz",
        "-o", str(executable),
    ], cwd=package, timeout=60, check=True)
    subprocess.run([str(executable)], cwd=package, timeout=20, check=True)


if __name__ == "__main__":
    main()
