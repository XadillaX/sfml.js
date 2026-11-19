"""Verify a VSIX against its current bundled sources without extracting it."""

import argparse
import hashlib
import json
from pathlib import Path
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    options = parser.parse_args()
    package = Path(__file__).resolve().parents[2]
    manifest = json.loads((package / "package.json").read_text())
    expected = {
        "package.json",
        "dist/extension.js",
        "dist/server/server.js",
    }
    expected.update(filename.name for filename in package.glob("README*.md"))
    contributes = manifest["contributes"]
    for group, field in (
        ("languages", "configuration"),
        ("grammars", "path"),
        ("snippets", "path"),
    ):
        expected.update(
            item[field].removeprefix("./") for item in contributes[group])
    with zipfile.ZipFile(options.archive) as archive:
        names = set(archive.namelist())
        assert "extension.vsixmanifest" in names
        for filename in expected:
            archived = "readme.md" if filename == "README.md" else filename
            content = archive.read("extension/" + archived)
            current = (package / filename).read_bytes()
            if filename == "README.md":
                # VSCE canonicalizes the primary README filename and rewrites
                # relative Markdown links using the configured monorepo base.
                repository = manifest["repository"]
                base = repository["url"].removeprefix("git+").removesuffix(".git")
                base += "/blob/HEAD/" + repository["directory"] + "/"
                for translated in package.glob("README.*.md"):
                    current = current.replace(
                        f"]({translated.name})".encode(),
                        f"]({base}{translated.name})".encode(),
                    )
            assert content == current, f"Stale or altered VSIX: {filename}"
        for filename in names:
            relative = filename.removeprefix("extension/")
            assert not relative.startswith(
                ("src/", "tools/", "test/", "node_modules/", ".rush/"))
            assert not filename.endswith((".map", ".vsix"))
        bundled = json.loads(archive.read("extension/package.json"))
        assert bundled["version"] == manifest["version"]
        assert bundled["main"] == "./dist/extension.js"
    digest = hashlib.sha256(options.archive.read_bytes()).hexdigest()
    print(f"PASS VSIX {manifest['version']} current bundles and language assets")
    print("PASS VSIX excludes source, test, dependencies and source maps")
    print(f"SHA256 {digest}")


if __name__ == "__main__":
    main()
