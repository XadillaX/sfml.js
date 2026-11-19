"""Run the unchanged C++ demo using the current package's vendor objects."""

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
    package = Path(__file__).resolve().parents[5]
    output = options.output_directory.resolve()
    if sys.platform != "darwin":
        parser.error("This reference requires the existing macOS build")
    if not output.is_dir() or output == package or package in output.parents:
        parser.error("Use an existing temporary directory outside the package")

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith("native/dom/elements/rmlui-dom.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if flag != "-DNDEBUG" and not flag.startswith("-g")]
    makefile = (package / "build/rmlui.target.mk").read_text()
    names = re.findall(
        r"\$\(obj\)\.target/\$\(TARGET\)/(third_party/[^\s\\]+\.o)",
        makefile)
    objects = [package / "build/Release/obj.target/rmlui" / name
               for name in names]
    if not objects or not all(item.is_file() for item in objects):
        parser.error("Build the existing package before running this reference")
    assert len(set(objects)) == len(objects)

    vendor = package / "third_party/rmlui"
    original = vendor / "Samples/basic/demo/src"
    executable = output / "original-demo"
    subprocess.run([
        *flags, "-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_EXTENSIVE",
        "-I" + str(vendor / "Backends"),
        str(Path(__file__).with_name("original-application.cc")),
        str(original / "DemoWindow.cpp"),
        str(original / "DemoEventListener.cpp"),
        *(str(item) for item in objects), "-Wl,-dead_strip", "-lz",
        "-o", str(executable),
    ], cwd=package, timeout=60, check=True)
    subprocess.run(
        [str(executable), str(output / "original-demo-reference.json")],
        cwd=vendor / "Samples", timeout=20, check=True)
    references = json.loads((output / "original-demo-reference.json").read_text())
    assert len(references["frames"]) == 10
    assert all(len(row) == 6 for row in references["frames"])
    assert references["formOutput"].startswith("<p>")


if __name__ == "__main__":
    main()
