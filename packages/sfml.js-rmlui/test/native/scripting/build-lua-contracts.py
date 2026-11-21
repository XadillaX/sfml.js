"""Build Lua contract consumers against the existing, loaded native package."""

import argparse
import json
from pathlib import Path
import shlex
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--compile-utilities", action="store_true")
    options = parser.parse_args()
    package = Path(__file__).resolve().parents[3]
    output = options.output.resolve()
    if not output.parent.is_dir() or package in output.parents:
        parser.error("Use an existing temporary directory outside the package")

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith(
                     "native/scripting/lua/rmlui-lua-host.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if not flag.startswith("-DNODE_GYP_MODULE_NAME=")
             and flag != "-DNDEBUG"]

    if sys.platform == "darwin":
        flags += ["-bundle", "-undefined", "dynamic_lookup"]
    elif sys.platform.startswith("linux"):
        flags += ["-shared", "-fPIC"]
    else:
        parser.error("This extension fixture requires POSIX dlopen")

    sources = [
        package / "test/native/scripting/lua-contracts.cc",
        package / "test/native/scripting/lua-contract-types.cc",
    ]
    if options.compile_utilities:
        sources.append(package / "vendor/rmlui/Source/Lua/Utilities.cpp")

    subprocess.run([
        *flags, "-DNODE_GYP_MODULE_NAME=lua_contracts",
        *(str(source) for source in sources), "-o", str(output),
    ], cwd=package, timeout=60, check=True)


if __name__ == "__main__":
    main()
