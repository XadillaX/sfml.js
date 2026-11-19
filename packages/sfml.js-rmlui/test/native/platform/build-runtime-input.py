"""Build a small probe of the loaded, existing RmlUi runtime."""

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
    if not output.is_dir() or output == package or package in output.parents:
        parser.error("Use an existing temporary directory outside the package")
    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith("native/events/rmlui-events.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    if "-o" in flags:
        index = flags.index("-o")
        del flags[index:index + 2]
    if sys.platform == "darwin":
        flags.extend(["-bundle", "-undefined", "dynamic_lookup"])
    elif sys.platform == "linux":
        flags.extend(["-shared", "-fPIC"])
    else:
        parser.error("This probe requires an existing macOS or Linux build")
    runtime = package / "native/platform/ime/runtime-input.cc"
    subprocess.run([
        *flags,
        str(package / "test/native/platform/ime/common/runtime-input-contracts.cc"),
        *([str(runtime)] if runtime.is_file() else []),
        "-o", str(output / "runtime-input-contracts.node"),
    ], cwd=package, timeout=60, check=True)


if __name__ == "__main__":
    main()
