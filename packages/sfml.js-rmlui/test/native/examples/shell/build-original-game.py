"""Build unchanged upstream game references using existing vendor objects."""

import argparse
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("application", choices=("invaders", "lua_invaders"))
    parser.add_argument("output_directory", type=Path)
    options = parser.parse_args()
    package = Path(__file__).resolve().parents[4]
    output = options.output_directory.resolve()
    if sys.platform != "darwin":
        parser.error("This reference requires the existing macOS build")
    if not output.is_dir() or output == package or package in output.parents:
        parser.error("Use an existing temporary directory outside the package")

    database = json.loads(
        (package / "build/Release/compile_commands.json").read_text())
    entry = next(item for item in database if item["file"].endswith(
        "native/dom/elements/rmlui-dom.cc"))
    flags = shlex.split(entry["command"])
    flags.remove("-c")
    flags.remove(entry["file"])
    flags = [flag for flag in flags
             if flag != "-DNDEBUG" and not flag.startswith("-g")]
    vendor = package / "vendor/rmlui"
    upstream = vendor / "Samples" / options.application / "src"
    flags += [
        "-I" + str(upstream),
        "-I" + str(vendor / "Backends"),
        "-I" + str(vendor / "Samples/shell/include"),
        "-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_EXTENSIVE",
    ]
    if options.application == "lua_invaders":
        flags += ["-DREFERENCE_LUA_INVADERS"]
    makefile = (package / "build/rmlui.target.mk").read_text()
    names = re.findall(
        r"\$\(obj\)\.target/\$\(TARGET\)/((?:vendor|third_party)/[^\s\\]+\.o)", makefile)
    objects = [package / "build/Release/obj.target/rmlui" / name
               for name in names]
    if not objects or not all(file.is_file() for file in objects):
        parser.error("Build the existing package before running this reference")
    assert len(set(objects)) == len(objects)

    excluded = {
        "main.cpp", "ElementGame.cpp", "ElementGameInstancer.cpp",
        "LuaInterface.cpp",
    }
    sources = [
        Path(__file__).with_name("original-game.cc"),
        *(source for source in sorted(upstream.glob("*.cpp"))
          if source.name not in excluded),
    ]
    application_objects = []
    for index, source in enumerate(sources):
        target = output / (
            f"original-{options.application}-{index}-{source.stem}.o")
        extra = ["-Dfopen=OfficialOpenScoresFile"] if (
            source.name == "HighScores.cpp") else []
        subprocess.run([
            *flags, *extra, "-c", str(source), "-o", str(target),
        ], cwd=package, check=True, timeout=60)
        application_objects.append(target)
    executable = output / f"original-{options.application}"
    subprocess.run([
        flags[0], *(str(file) for file in application_objects),
        *(str(file) for file in objects), "-Wl,-dead_strip", "-lz",
        "-o", str(executable),
    ], cwd=package, check=True, timeout=60)
    reference = output / f"original-{options.application}-reference.json"
    subprocess.run([
        str(executable), options.application, str(reference),
        str(output / f"original-{options.application}-scores.txt"),
    ], cwd=package / "third_party/rmlui/Samples", check=True, timeout=20)
    assert json.loads(reference.read_text())["formationScore"] == 1100


if __name__ == "__main__":
    main()
