"""Compare font fields with upstream using the existing macOS vendor objects."""

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
                 if item["file"].endswith("native/fonts/rmlui-font-engine.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if flag != "-DNDEBUG" and not flag.startswith("-g")]
    makefile = (package / "build/rmlui.target.mk").read_text()
    relative_objects = re.findall(
        r"\$\(obj\)\.target/\$\(TARGET\)/(third_party/[^\s\\]+\.o)",
        makefile)
    objects = [package / "build/Release/obj.target/rmlui" / name
               for name in relative_objects]
    if not objects or not all(item.is_file() for item in objects):
        parser.error("Build the existing package before running this probe")
    assert len(set(objects)) == len(objects)

    executable = output / "font-fields-contracts"
    subprocess.run([
        *flags, "-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_EXTENSIVE",
        str(package / "test/native/fonts/font-fields-contracts.cc"),
        *(str(item) for item in objects), "-Wl,-dead_strip", "-lz",
        "-o", str(executable),
    ], cwd=package, timeout=60, check=True)
    font = package / "third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf"
    subprocess.run(
        [str(executable), str(font)], cwd=package, timeout=20, check=True)
    fixture = subprocess.run(
        [str(executable), str(font), "--json"], cwd=package, timeout=20,
        check=True, capture_output=True, text=True)
    references = json.loads(fixture.stdout)
    assert len(references) == 2
    assert all(len(row["widths"]) == 27 for row in references)
    (output / "font-fields-native-reference.json").write_text(fixture.stdout)


if __name__ == "__main__":
    main()
