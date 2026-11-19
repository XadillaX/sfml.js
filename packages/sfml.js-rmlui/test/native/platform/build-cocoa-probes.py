"""Build Cocoa probes against the existing addon and SFML libraries."""

import json
from pathlib import Path
import shlex
import subprocess
import sys


def build(output: Path) -> None:
    package = Path(__file__).resolve().parents[3]
    if sys.platform != "darwin":
        raise RuntimeError("Cocoa probes require macOS")
    if not output.parent.is_dir() or package in output.parents:
        raise RuntimeError("Use an existing temporary directory")

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith("native/events/rmlui-events.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if not flag.startswith("-DNODE_GYP_MODULE_NAME=")]

    libraries = Path(subprocess.check_output([
        "node", "-e",
        "process.stdout.write(require('sfml.js-interop/paths').sfmlLib)",
    ], cwd=package, text=True))
    subprocess.run([
        *flags, "-bundle", "-undefined", "dynamic_lookup",
        "-DNODE_GYP_MODULE_NAME=cocoa_probes",
        str(package / "test/native/platform/macos/cocoa-probes.mm"),
        str(libraries / "libsfml-window.dylib"),
        "-Wl,-rpath," + str(libraries), "-framework", "AppKit",
        "-o", str(output),
    ], cwd=package, timeout=60, check=True)


if __name__ == "__main__":
    build(Path(sys.argv[1]).resolve())
