"""Compile one extension against the existing Addon, without copying a runtime."""

import json
from pathlib import Path
import shlex
import subprocess
import sys


def build(output: Path) -> None:
    root = Path(__file__).resolve().parents[3]
    database = json.loads(
        (root / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith("native/values/rmlui-variant-objects.cc"))
    arguments = shlex.split(entry["command"])
    arguments.remove("-c")
    arguments.remove(entry["file"])
    arguments = [arg for arg in arguments
                 if not arg.startswith("-DNODE_GYP_MODULE_NAME=")
                 and arg != "-DNDEBUG"]

    if sys.platform == "darwin":
        arguments += ["-bundle", "-undefined", "dynamic_lookup"]
    elif sys.platform.startswith("linux"):
        arguments += ["-shared", "-fPIC"]
    else:
        raise RuntimeError("This external extension fixture requires POSIX dlopen")

    arguments += [
        "-DNODE_GYP_MODULE_NAME=external_variant_adapters",
        str(root / "test/native/values/external-variant-adapters.cc"),
        "-o", str(output),
    ]
    subprocess.run(arguments, cwd=root, check=True)


if __name__ == "__main__":
    build(Path(sys.argv[1]).resolve())
