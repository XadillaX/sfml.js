"""Verify string and URL contracts against the existing macOS native build."""

import argparse
import json
from pathlib import Path
import shlex
import subprocess
import sys


def run(arguments, package):
    result = subprocess.run(arguments, cwd=package, timeout=60)
    if result.returncode:
        raise SystemExit(result.returncode)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "output_directory", type=Path,
        help="Existing temporary directory for the native executable")
    options = parser.parse_args()

    if sys.platform != "darwin":
        parser.error("This runner requires the existing macOS package build")

    output = options.output_directory.resolve()
    package = Path(__file__).resolve().parents[3]
    if not output.is_dir() or output == package or package in output.parents:
        parser.error("Use an existing temporary directory outside the package")

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith("native/values/rmlui-variant-conversion.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if flag != "-DNDEBUG" and not flag.startswith("-g")]

    vendor = package / "build/Release/obj.target/rmlui/third_party"
    objects = sorted(vendor.rglob("*.o"))
    if not objects:
        parser.error("Build the existing package before running this probe")

    source = package / "third_party/rmlui/Source/Core/StringUtilities.cpp"
    hardened = output / "string-utilities-hardened.o"
    run([
        *flags,
        "-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_EXTENSIVE",
        "-c", str(source), "-o", str(hardened),
    ], package)

    retained = [item for item in objects
                if not str(item).endswith("/Core/StringUtilities.o")]
    if len(retained) != len(objects) - 1:
        parser.error("Expected exactly one existing StringUtilities object")

    executable = output / "string-url-contracts"
    run([
        *flags, str(package / "test/native/values/string-url-contracts.cc"),
        str(hardened), *(str(item) for item in retained),
        "-Wl,-dead_strip", "-lz", "-o", str(executable),
    ], package)
    run([str(executable)], package)
    run([str(executable), "empty-replace"], package)
    print("PASS hardened-native-string-source-and-partial-entities", flush=True)


if __name__ == "__main__":
    main()
