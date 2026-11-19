"""Check production X11 units against installed Xlib declarations.

On macOS, only SFML's X11 handle type is selected for syntax checking. The
compiler, C library and Node headers remain those of the host; this does not
verify Linux ABI, linking or an input method engine.
"""

import json
from pathlib import Path
import shlex
import subprocess
import sys


def main():
    package = Path(__file__).resolve().parents[3]
    if sys.platform not in ("darwin", "linux"):
        print("SKIP Xlib declaration checks: unsupported host")
        return

    try:
        headers = subprocess.run(
            ["pkg-config", "--cflags", "x11"],
            capture_output=True, text=True, timeout=10, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        if sys.platform == "darwin":
            print("SKIP Xlib declaration checks: X11 development headers absent")
            return
        raise

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database
                 if item["file"].endswith(
                     "native/platform/ime/deferred-text-input.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    if "-o" in flags:
        output = flags.index("-o")
        del flags[output:output + 2]
    flags.extend(["-fsyntax-only", *shlex.split(headers.stdout)])
    if sys.platform == "darwin":
        # Config.hpp still selects the host OS. WindowHandle.hpp checks this
        # explicit X11 handle branch first; no system macros are removed.
        flags.append("-DSFML_SYSTEM_LINUX")

    for name in ("preedit-buffer.cc", "text-input-preedit.cc",
                 "text-input-events.cc", "text-input-focus.cc"):
        subprocess.run(
            [*flags, str(package / "native/platform/ime/x11" / name)],
            cwd=package, timeout=45, check=True)
        print(f"PASS real Xlib declarations compile {name}", flush=True)


if __name__ == "__main__":
    main()
