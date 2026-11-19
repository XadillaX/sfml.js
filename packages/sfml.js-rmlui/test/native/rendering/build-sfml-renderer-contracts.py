"""Link the actual SFML renderer with existing native objects, without V8."""

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
    parser.add_argument("--suite", choices=("renderer", "shaders", "effects",
                                          "textures", "startup", "targets",
                                          "css"),
                        default="renderer")
    parser.add_argument("--references", type=Path)
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
    upstream = re.findall(
        r"\$\(obj\)\.target/\$\(TARGET\)/(third_party/[^\s\\]+\.o)",
        makefile)
    owned = [
        "render-interface-sfml.cc",
        "geometry/render-geometry.cc",
        "geometry/geometry-batching.cc",
        "clipping/clip-masks.cc",
        "textures/render-textures.cc",
        "shaders/render-shaders.cc",
        "shaders/compile-shaders.cc",
        "shaders/gradient-program.cc",
        "effects/color-filter.cc",
        "effects/render-filters.cc",
        "effects/render-blur.cc",
        "layers/render-frame.cc",
        "layers/render-layers.cc",
        "layers/stencil-attachment.cc",
    ]
    objects = [
        package / "build/Release/obj.target/rmlui" / name
        for name in upstream
    ] + [
        package / "build/Release/obj.target/rmlui/native/rendering" /
        Path(name).with_suffix(".o") for name in owned
    ]
    assert len(set(objects)) == len(objects)
    if not objects or not all(item.is_file() for item in objects):
        parser.error("Build the existing package before running this probe")

    libraries = Path(subprocess.check_output([
        "node", "-e",
        "process.stdout.write(require('sfml.js-interop/paths').sfmlLib)",
    ], cwd=package, text=True))
    fixtures = {
        "renderer": "sfml-renderer-contracts.cc",
        "shaders": "shaders/shader-contracts.cc",
        "effects": "effects/filter-contracts.cc",
        "textures": "textures/texture-contracts.cc",
        "startup": "initialization/startup-contracts.cc",
        "targets": "layers/render-target-contracts.cc",
        "css": "css/css-effect-contracts.cc",
    }
    fixture = fixtures[options.suite]
    fixture_sources = [str(package / "test/native/rendering" / fixture)]
    if options.suite == "startup":
        fixture_sources.append(str(
            package / "test/native/rendering/initialization/sfml-faults.cc"))
    if options.suite == "targets":
        fixture_sources.append(str(
            package / "test/native/rendering/layers/sfml-target-faults.cc"))
    if options.suite == "css":
        fixture_sources.append(str(
            package / "test/native/rendering/css/native-context-boundary.cc"))
    executable = output / ("sfml-" + options.suite + "-contracts")
    subprocess.run([
        *flags,
        *fixture_sources,
        *(str(item) for item in objects),
        *(str(package / "build/Release" / name)
          for name in ("lunasvg.a", "rlottie.a", "lua.a")),
        *(str(libraries / f"libsfml-{name}.dylib")
          for name in ("graphics", "window", "system")),
        "-Wl,-dead_strip", "-Wl,-rpath," + str(libraries),
        "-framework", "AppKit", "-lz", "-o", str(executable),
    ], cwd=package, timeout=60, check=True)
    arguments = [str(executable)]
    if options.suite in ("effects", "css"):
        if not options.references or not options.references.is_dir():
            parser.error("The effects suite requires pinned --references")
        arguments.extend((str(options.references.resolve()), str(output)))
    subprocess.run(arguments, cwd=package, timeout=30, check=True)


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        sys.exit(error.returncode)
