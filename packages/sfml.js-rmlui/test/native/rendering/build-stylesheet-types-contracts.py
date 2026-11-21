"""Exercise stylesheet and type contracts with the active vendor build objects."""

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
                 if item["file"].endswith("native/rendering/render-interface-sfml.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if flag != "-DNDEBUG" and not flag.startswith("-g")]

    makefile = (package / "build/rmlui.target.mk").read_text()
    relative_objects = re.findall(
        r"\$\(obj\)\.target/\$\(TARGET\)/((?:vendor|third_party)/[^\s\\]+\.o)",
        makefile)
    objects = [package / "build/Release/obj.target/rmlui" / name
               for name in relative_objects]
    if not objects or not all(item.is_file() for item in objects):
        parser.error("Build the existing package before running this probe")
    assert len(set(objects)) == len(objects)

    executable = output / "stylesheet-types-contracts"
    subprocess.run([
        *flags, "-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_EXTENSIVE",
        str(package / "test/native/rendering/stylesheet-types-contracts.cc"),
        *(str(item) for item in objects), "-Wl,-dead_strip", "-lz",
        "-o", str(executable),
    ], cwd=package, timeout=60, check=True)
    subprocess.run([str(executable)], cwd=package, timeout=20, check=True)


if __name__ == "__main__":
    main()
