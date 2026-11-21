"""Verify native converter contracts with the existing macOS package build."""

import argparse
import json
from pathlib import Path
import shlex
import subprocess
import sys


def run(arguments, package):
    result = subprocess.run(arguments, cwd=package)
    if result.returncode:
        raise SystemExit(result.returncode)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "output_directory", type=Path,
        help="Existing temporary directory for executables and the fixture")
    options = parser.parse_args()

    if sys.platform != "darwin":
        parser.error("This native linking fixture requires the macOS build")

    output_directory = options.output_directory.resolve()
    if not output_directory.is_dir():
        parser.error("The output directory must already exist")

    package = Path(__file__).resolve().parents[3]
    if output_directory == package or package in output_directory.parents:
        parser.error("Use a temporary directory outside the package")

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith("native/values/rmlui-variant-conversion.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if flag != "-DNDEBUG" and not flag.startswith("-g")]

    vendor = package / "build/Release/obj.target/rmlui/vendor"
    objects = sorted(vendor.rglob("*.o"))
    if not objects:
        parser.error("Build the existing package before running this fixture")

    script_interface = vendor / "rmlui/Source/Core/ScriptInterface.o"
    for name in ("type-converter-scalars", "type-converter-strings",
                 "type-converter-complex"):
        source = package / f"test/native/values/{name}.cc"
        executable = output_directory / name
        linked_objects = ([script_interface] if name == "type-converter-scalars"
                          else objects)
        run([
            *flags, str(source), *(str(item) for item in linked_objects),
            "-Wl,-dead_strip", "-lz", "-o", str(executable),
        ], package)
        run([str(executable)], package)

    name = "variant-template-consumers"
    source = package / f"test/native/values/{name}.cc"
    module = output_directory / f"{name}.node"
    run([
        *flags, "-bundle", "-undefined", "dynamic_lookup",
        str(source), "-o", str(module),
    ], package)
    run([
        "node", str(package / f"test/native/values/{name}.cjs"), str(module),
    ], package)

    source = package / "test/native/values/type-converter-unsupported.cc"
    run([*flags, "-fsyntax-only", str(source)], package)
    print("PASS supported-string-converter-compile-control", flush=True)

    diagnostic = (
        "The type converter was invoked on a type without a string converter")
    for selector in ("PAYLOAD", "CHARACTER"):
        result = subprocess.run([
            *flags, f"-DSFML_RMLUI_UNSUPPORTED_{selector}",
            "-fsyntax-only", str(source),
        ], cwd=package, text=True, capture_output=True)
        print(result.stderr, end="", flush=True)
        if result.returncode == 0 or diagnostic not in result.stderr:
            raise SystemExit("Expected the upstream static assertion: " +
                             selector)
        print(f"PASS rejected-unsupported-string-converter-{selector.lower()}",
              flush=True)


if __name__ == "__main__":
    main()
