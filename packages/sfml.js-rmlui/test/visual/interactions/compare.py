"""Verify literal input checkpoints against actual GL3 and feature contracts."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

from PIL import Image

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from interactions.validators import controls, layout, rendering
from acceptance_policy import evaluate, interaction_status, POLICY


def comparison_module():
    source = Path(__file__).resolve().parents[1] / "compare-corpus.py"
    spec = importlib.util.spec_from_file_location("corpus_comparison", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture_directory", type=Path)
    parser.add_argument("--evidence-file", type=Path)
    options = parser.parse_args()
    root = options.capture_directory.resolve()
    pages = json.loads((root / "catalog.json").read_text())
    comparison = comparison_module()
    validators = controls.FUNCTIONS | layout.FUNCTIONS | rendering.FUNCTIONS
    rows = []
    for page in pages:
        name = page["name"]
        assert hashlib.sha256(Path(page["file"]).read_bytes()).hexdigest() == page["sha256"]
        row = {"name": name, "sourceSHA256": page["sha256"], "frames": []}
        snapshots = {}
        images = {}
        native_snapshots = {}
        native_images = {}
        try:
            captures = [root / "gl3" / f"{name}.json",
                        *sorted((root / "gl3").glob(name + "--*.json"))]
            expected = [line.split("\t")[2] for line in
                        (root / "actions.tsv").read_text().splitlines()
                        if line.startswith(name + "\tcapture\t")]
            assert len(captures) == len(expected) + 1
            for source in captures:
                target = root / "sfml" / source.name
                a = json.loads(source.read_text())
                b = json.loads(target.read_text())
                assert a["errors"] == b["errors"] == []
                assert a["warnings"] == b["warnings"] == []
                maximum = comparison.geometry(a, b)
                for field in ("focus", "hover", "pointer", "dimensions", "density", "time"):
                    assert a[field] == b[field], (source.stem, field)
                for first, second in zip(a["elements"], b["elements"]):
                    for field in ("pseudo", "visible", "scrollbars"):
                        assert first[field] == second[field]
                    for x, y in zip(first["scrollOffset"], second["scrollOffset"]):
                        assert abs(x - y) <= 0.005
                image_a = Image.open(source.with_suffix(".png"))
                image_b = Image.open(target.with_suffix(".png"))
                pixels = comparison.pixels(image_a, image_b)
                assert pixels["pass"], (source.stem, pixels)
                checkpoint = "base" if source.stem == name else source.stem[len(name) + 2:]
                snapshots[checkpoint], images[checkpoint] = b, image_b
                native_snapshots[checkpoint], native_images[checkpoint] = a, image_a
                row["frames"].append({
                    "name": source.stem, "pixels": pixels,
                    "layoutMaximum": maximum, "pointer": a["pointer"], "time": a["time"],
                    "referenceSHA256": hashlib.sha256(source.with_suffix(".png").read_bytes()).hexdigest(),
                    "actualSHA256": hashlib.sha256(target.with_suffix(".png").read_bytes()).hexdigest(),
                })
            failures = {}
            results = {}
            for driver, captured, painted in (
                    ("sfml", snapshots, images),
                    ("gl3", native_snapshots, native_images)):
                results[driver] = evaluate(validators[name], captured, painted)
                if results[driver]["status"] == "pass":
                    row[f"{driver}Assertions"] = results[driver]["assertions"]
                elif results[driver]["status"] == "fail":
                    failure = results[driver]["failure"]
                    location = failure["stack"][-1]
                    failures[driver] = {
                        "message": failure["message"] or location["expression"],
                        "validator": location["source"],
                        "line": location["line"],
                    }
            row["interactionResults"] = results
            row["assertionFailures"] = failures
            assert not failures, json.dumps(failures)
            row["assertions"] = row["sfmlAssertions"]
            assert row["assertions"] == row["gl3Assertions"]
            row["status"] = "pass"
        except (AssertionError, StopIteration, KeyError) as error:
            row["status"] = "fail"
            row["error"] = str(error)
            print("FAIL interaction", name, str(error))
        row["bindingStatus"] = interaction_status(row)
        row["bindingAccepted"] = row["bindingStatus"] in ("pass", "upstream-failure-deferred")
        rows.append(row)
    report = {
        "scope": f"{len(pages)} unchanged original pages; deterministic native mouse/key/scroll/layout inputs",
        "platform": "macOS arm64; physical IME and Linux/Windows remain unverified",
        "actionsSHA256": hashlib.sha256((root / "actions.tsv").read_bytes()).hexdigest(),
        "pixelPolicy": "all RGB channels within one byte at the same pixel; no exclusions",
        "acceptancePolicy": POLICY["version"],
        "pages": rows,
        "summary": {
            "pages": len(rows), "frames": sum(len(row["frames"]) for row in rows),
            "byteExactFrames": sum(
                frame["pixels"]["differentPixels"] == 0
                for row in rows for frame in row["frames"]),
            "pass": sum(row["status"] == "pass" for row in rows),
            "fail": sum(row["status"] == "fail" for row in rows),
            "deferredUpstreamFailures": sum(
                row["bindingStatus"] == "upstream-failure-deferred" for row in rows),
            "bindingRegressions": sum(row["bindingStatus"] == "fail" for row in rows),
            "bindingAccepted": bool(rows) and all(row["bindingAccepted"] for row in rows),
            "wholeCorpusAccepted": False,
        },
    }
    mutation_source = root / "mutations.json"
    if mutation_source.is_file():
        mutations = json.loads(mutation_source.read_text())
        assert mutations["actionsSHA256"] == report["actionsSHA256"]
        report["mutationChecks"] = mutations
    serialized = json.dumps(report, indent=2) + "\n"
    (root / "comparison.json").write_text(serialized)
    if options.evidence_file:
        repository = Path(__file__).resolve().parents[5]
        destination = options.evidence_file.resolve()
        assert destination.parent == repository / "docs/rmlui/audit/6.3"
        destination.write_text(serialized)
    print(json.dumps(report["summary"], indent=2))
    if not report["summary"]["bindingAccepted"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
