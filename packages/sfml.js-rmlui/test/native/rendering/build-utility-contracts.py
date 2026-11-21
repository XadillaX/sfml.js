"""Verify utilities against original RmlUi using the existing package objects."""

import argparse
import json
from pathlib import Path
import shlex
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output_directory", type=Path)
    options = parser.parse_args()
    package = Path(__file__).resolve().parents[3]
    output = options.output_directory.resolve()
    if sys.platform != "darwin":
        parser.error("This runner requires the existing macOS build")
    if not output.is_dir() or output == package or package in output.parents:
        parser.error("Use an existing temporary directory outside the package")

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith("native/style/effects/rmlui-convolution.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if flag != "-DNDEBUG" and not flag.startswith("-g")]
    vendor = package / "build/Release/obj.target/rmlui/vendor"
    objects = sorted(vendor.rglob("*.o"))
    if not objects:
        parser.error("Build the existing package before running this probe")

    executable = output / "utility-contracts"
    subprocess.run([
        *flags, "-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_EXTENSIVE",
        str(package / "test/native/rendering/utility-contracts.cc"),
        *(str(item) for item in objects), "-Wl,-dead_strip", "-lz",
        "-o", str(executable),
    ], cwd=package, timeout=60, check=True)
    subprocess.run([str(executable)], cwd=package, timeout=20, check=True)
    fixture = subprocess.run(
        [str(executable), "--json"], cwd=package, timeout=20,
        check=True, capture_output=True, text=True)
    values = json.loads(fixture.stdout)
    if len(values) != 5:
        parser.error("Expected five original native mesh fixtures")
    (output / "utility-native-reference.json").write_text(fixture.stdout)


if __name__ == "__main__":
    main()
