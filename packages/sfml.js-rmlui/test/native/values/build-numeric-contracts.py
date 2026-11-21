"""Verify numeric support templates using the existing macOS native build."""

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
        help="Existing temporary directory for probe executables")
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

    vendor = package / "build/Release/obj.target/rmlui/vendor"
    objects = sorted(vendor.rglob("*.o"))
    if not objects:
        parser.error("Build the existing package before running these probes")

    for name in ("numeric-matrix-contracts", "numeric-value-contracts",
                 "numeric-random-contracts"):
        source = package / f"test/native/values/{name}.cc"
        executable = output / name
        run([
            *flags, str(source), *(str(item) for item in objects),
            "-Wl,-dead_strip", "-lz", "-o", str(executable),
        ], package)
        run([str(executable)], package)

    source = package / "test/native/values/numeric-unsupported.cc"
    run([*flags, "-fsyntax-only", str(source)], package)
    print("PASS supported-native-numeric-compile-control", flush=True)

    rejections = {
        "NORMALISE_2I": "Normalise only implemented for Vector<float>.",
        "NORMALISE_3I": "Normalise only implemented for Vector<float>.",
        "NORMALISE_4I": "Normalise only implemented for Vector<float>.",
        "FLOAT_PREMULTIPLIED": "no matching member function",
        "BYTE_COLOUR_LERP":
            "Lerp currently cannot be used with Colourb. Use RoundedLerp",
    }
    for selector, diagnostic in rejections.items():
        result = subprocess.run([
            *flags, f"-DSFML_RMLUI_{selector}", "-fsyntax-only", str(source),
        ], cwd=package, text=True, capture_output=True)
        print(result.stderr, end="", flush=True)
        if result.returncode == 0 or diagnostic not in result.stderr:
            raise SystemExit("Expected native numeric rejection: " + selector)
        print(f"PASS rejected-native-numeric-{selector.lower()}", flush=True)


if __name__ == "__main__":
    main()
