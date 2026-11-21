"""Build a direct rlottie raster oracle using the existing native archive."""

import argparse
from pathlib import Path
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output_directory", type=Path)
    options = parser.parse_args()
    package = Path(__file__).resolve().parents[4]
    output = options.output_directory.resolve()
    if sys.platform != "darwin":
        parser.error("This oracle requires the existing macOS build")
    if not output.is_dir() or output == package or package in output.parents:
        parser.error("Use an existing temporary directory outside the package")

    archive = package / "build/Release/rlottie.a"
    if not archive.is_file():
        parser.error("Build the existing package before running this oracle")
    subprocess.run([
        "c++", "-std=c++20", "-O2", "-DRLOTTIE_STATIC",
        "-I" + str(package / "vendor/rlottie/inc"),
        str(Path(__file__).with_name("lottie-capture.cc")),
        str(archive), "-lz", "-o", str(output / "lottie-reference"),
    ], cwd=package, timeout=60, check=True)


if __name__ == "__main__":
    main()
