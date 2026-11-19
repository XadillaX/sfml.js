"""Link the pinned upstream GL3 reference with existing Core build objects."""

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
    parser.add_argument("--css", action="store_true")
    parser.add_argument("--visual", type=Path,
                        help="Capture unchanged VisualTests from a TSV manifest")
    parser.add_argument("--actions", type=Path,
                        help="Run literal input operations on the visual pages")
    options = parser.parse_args()
    package = Path(__file__).resolve().parents[4]
    output = options.output_directory.resolve()
    if sys.platform != "darwin":
        parser.error("This reference driver uses the existing macOS objects")
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
    upstream = re.findall(
        r"\$\(obj\)\.target/\$\(TARGET\)/(third_party/[^\s\\]+\.o)",
        makefile)
    objects = [
        package / "build/Release/obj.target/rmlui" / name
        for name in upstream
    ]
    assert objects and all(path.is_file() for path in objects)
    libraries = Path(subprocess.check_output([
        "node", "-e",
        "process.stdout.write(require('sfml.js-interop/paths').sfmlLib)",
    ], cwd=package, text=True))
    executable = output / ("gl3-visual-reference" if options.visual else
                           "gl3-css-reference" if options.css else "gl3-reference")
    driver = "gl3-css-capture.cc" if options.css else "gl3-capture.cc"
    fixture_sources = [
        str(package / "test/native/rendering/reference" / driver),
    ]
    if options.visual:
        fixture_sources = [
            str(package / "test/native/visual/reference/gl3-capture.cc"),
            str(package / "third_party/rmlui/Tests/Source/VisualTests/XmlNodeHandlers.cpp"),
        ]
    if options.css or options.visual:
        fixture_sources.append(str(
            package / "test/native/rendering/css/native-context-boundary.cc"))
    subprocess.run([
        *flags, "-DRMLUI_NUM_MSAA_SAMPLES=0",
        *fixture_sources,
        str(package / "third_party/rmlui/Backends/RmlUi_Renderer_GL3.cpp"),
        *(str(path) for path in objects),
        *(str(package / "build/Release" / name)
          for name in ("lunasvg.a", "rlottie.a", "lua.a")),
        *(str(libraries / f"libsfml-{name}.dylib")
          for name in ("graphics", "window", "system")),
        "-Wl,-dead_strip", "-Wl,-rpath," + str(libraries),
        "-framework", "AppKit", "-lz", "-o", str(executable),
    ], cwd=package, timeout=60, check=True)
    arguments = [str(executable), str(output)]
    if options.visual:
        arguments.append(str(options.visual.resolve()))
    if options.actions:
        assert options.visual
        arguments.append(str(options.actions.resolve()))
    subprocess.run(arguments, cwd=package, timeout=120, check=True)


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        sys.exit(error.returncode)
