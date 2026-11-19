"""Compare actual SFML pages to independent GL3 and upstream match fixtures."""

import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image

sys.dont_write_bytecode = True
from acceptance_policy import classify, evaluate, interaction_status, POLICY


def load_assertions():
    sys.dont_write_bytecode = True
    import assertions
    return assertions


def pixels(first, second):
    a = np.asarray(first.convert("RGB"), dtype=np.int16)
    b = np.asarray(second.convert("RGB"), dtype=np.int16)
    assert a.shape == b.shape == (768, 1024, 3)
    difference = np.max(np.abs(a - b), axis=2)
    return {
        "maxChannelDifference": int(difference.max()),
        "differentPixels": int(np.count_nonzero(difference)),
        "pixelsBeyondOneByte": int(np.count_nonzero(difference > 1)),
        "pass": not bool(np.any(difference > 1)),
    }


def geometry(first, second):
    a = first["elements"]
    b = second["elements"]
    assert len(a) == len(b), (len(a), len(b))
    maximum = 0
    for left, right in zip(a, b):
        for field in ("path", "tag", "id", "classes", "visible"):
            assert left[field] == right[field], (field, left, right)
        for field in ("rect", "content", "scroll", "scrollbars"):
            maximum = max(maximum, max(abs(x - y)
                                      for x, y in zip(left[field], right[field])))
        maximum = max(maximum, abs(left["baseline"] - right["baseline"]))
        assert (left["inkBounds"] is None) == (right["inkBounds"] is None)
        if left["inkBounds"] is not None:
            maximum = max(maximum, max(abs(x - y)
                                      for x, y in zip(left["inkBounds"], right["inkBounds"])))
        assert len(left["boxes"]) == len(right["boxes"])
        for first_box, second_box in zip(left["boxes"], right["boxes"]):
            maximum = max(maximum, max(abs(x - y)
                                      for x, y in zip(first_box, second_box)))
    assert maximum <= 0.005, maximum
    return maximum


def reference_frame(root, frame):
    reference = json.loads(frame.with_suffix(".json").read_text())
    actual_path = root / "sfml" / frame.name
    actual = json.loads(actual_path.with_suffix(".json").read_text())
    assert reference["errors"] == actual["errors"] == []
    assert reference["warnings"] == actual["warnings"] == []
    maximum = geometry(reference, actual)
    comparison = pixels(Image.open(frame), Image.open(actual_path))
    return {
        "name": frame.stem, "pixelComparison": comparison,
        "maxLayoutDifference": maximum,
        "scrollPosition": reference["scrollPosition"],
        "referencePNGHash": hashlib.sha256(frame.read_bytes()).hexdigest(),
        "actualPNGHash": hashlib.sha256(actual_path.read_bytes()).hexdigest(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture_directory", type=Path)
    parser.add_argument("--evidence-file", type=Path,
                        help="Write the measured ledger to the task audit directory")
    parser.add_argument("--require-complete", action="store_true",
                        help="Fail while any content/interaction scope remains pending")
    parser.add_argument("--interaction-report", type=Path,
                        help="Attach verified input checkpoint results to each page")
    options = parser.parse_args()
    root = options.capture_directory.resolve()
    pages = json.loads((root / "catalog.json").read_text())
    assert len(pages) == 113
    assertions = load_assertions()
    interaction_rows = {}
    if options.interaction_report:
        interaction_report = json.loads(options.interaction_report.read_text())
        assert interaction_report["acceptancePolicy"] == POLICY["version"]
        interaction_rows = {row["name"]: row for row in interaction_report["pages"]}
        assert len(interaction_rows) == len(interaction_report["pages"])
        assert set(interaction_rows) <= {page["name"] for page in pages}
        for row in interaction_rows.values():
            row["bindingStatus"] = interaction_status(row)
            row["bindingAccepted"] = row["bindingStatus"] in (
                "pass", "upstream-failure-deferred")
    ledger = []
    for page in pages:
        name = page["name"]
        assert hashlib.sha256(Path(page["file"]).read_bytes()).hexdigest() == page["sha256"]
        frames = sorted(frame for frame in (root / "gl3").glob(name + "*.png")
                        if frame.stem == name
                        or frame.stem.startswith(name + "--scroll-"))
        assert frames
        row = {
            "name": name, "sha256": page["sha256"],
            "upstreamMetadata": page["metadata"],
            "referenceFrames": [], "contentAssertions": [],
            "matchReferenceFrames": [],
            "interactionAssertions": "pending",
            "platform": "macOS arm64; Linux/Windows unverified",
        }
        for frame in frames:
            row["referenceFrames"].append(reference_frame(root, frame))
        actual = json.loads((root / "sfml" / (name + ".json")).read_text())
        content_frames = [
            (json.loads((root / "sfml" / frame.with_suffix(".json").name).read_text()),
             Image.open(root / "sfml" / frame.name))
            for frame in frames
        ]
        native = json.loads((root / "gl3" / (name + ".json")).read_text())
        native_frames = [(json.loads(frame.with_suffix(".json").read_text()),
                          Image.open(frame)) for frame in frames]
        results = {
            "sfml": evaluate(assertions.run, name, actual,
                             Image.open(root / "sfml" / (name + ".png")), content_frames),
            "gl3": evaluate(assertions.run, name, native,
                            Image.open(root / "gl3" / (name + ".png")), native_frames),
        }
        row["contentResults"] = results
        row["contentStatus"] = results["sfml"]["status"]
        row["contentAssertions"] = results["sfml"].get("assertions", [])
        if row["contentStatus"] == "fail":
            row["contentError"] = results["sfml"]["failure"]["message"]
            if results["gl3"]["status"] == "fail":
                row["contentFailureAlsoInPinnedUpstream"] = results["gl3"]["failure"]["message"]
        elif row["contentStatus"] == "pass":
            if (results["gl3"]["status"] == "pass"
                    and results["gl3"]["assertions"] == row["contentAssertions"]):
                row["contentAssertionsAlsoPassPinnedUpstream"] = True
            else:
                row["nativeContentError"] = results["gl3"]
        if page["reference"]:
            from assertions import references
            for match_frame in sorted((root / "gl3").glob("match-" + name + "*.png")):
                if (match_frame.stem == "match-" + name
                        or match_frame.stem.startswith("match-" + name + "--scroll-")):
                    row["matchReferenceFrames"].append(reference_frame(root, match_frame))
            row["upstreamMatch"] = pixels(
                Image.open(root / "sfml" / (name + ".png")),
                Image.open(root / "gl3" / ("match-" + name + ".png")))
            if row["upstreamMatch"]["pass"]:
                row["upstreamMatch"]["featureStatus"] = "pass"
                row["upstreamMatch"]["interpretation"] = "pixel-identical within one byte"
            else:
                try:
                    match = root / "gl3" / ("match-" + name + ".png")
                    contracts = references.run(
                        name, actual, json.loads(match.with_suffix(".json").read_text()),
                        Image.open(root / "sfml" / (name + ".png")), Image.open(match))
                    row["upstreamMatch"]["featureStatus"] = "pass" if contracts else "pending"
                    row["upstreamMatch"]["featureAssertions"] = contracts
                except (AssertionError, StopIteration) as error:
                    row["upstreamMatch"]["featureStatus"] = "fail"
                    row["upstreamMatch"]["featureError"] = str(error)
        row["status"] = "pending"
        row["bindingStatus"] = classify(
            name, page["sha256"], "content", results,
            all(frame["pixelComparison"]["pass"]
                for frame in row["referenceFrames"] + row["matchReferenceFrames"])
            and row.get("upstreamMatch", {}).get("featureStatus", "pass") == "pass")
        row["bindingAccepted"] = row["bindingStatus"] in ("pass", "upstream-failure-deferred")
        if name in interaction_rows:
            interaction = interaction_rows[name]
            assert interaction["sourceSHA256"] == page["sha256"]
            row["interactionAssertions"] = {
                "status": interaction["status"],
                "assertions": interaction.get("assertions", []),
                "assertionFailures": interaction.get("assertionFailures", {}),
                "frames": len(interaction["frames"]),
                "evidence": options.interaction_report.name,
                "bindingStatus": interaction["bindingStatus"],
                "bindingAccepted": interaction["bindingAccepted"],
            }
        ledger.append(row)
    report = {
        "scope": "113 unchanged upstream pages; static/scroll reference phase",
        "rendererReference": "actual pinned GL3 renderer; separate executable, same existing Core objects",
        "captureDimensions": [1024, 768],
        "pixelPolicy": "every RGB channel within one byte at the same pixel; no spatial tolerance",
        "acceptancePolicy": POLICY["version"],
        "pages": ledger,
        "summary": {
            "pages": len(ledger),
            "frames": sum(len(row["referenceFrames"]) + len(row["matchReferenceFrames"])
                          for row in ledger),
            "primaryFrames": sum(len(row["referenceFrames"]) for row in ledger),
            "matchFrames": sum(len(row["matchReferenceFrames"]) for row in ledger),
            "referenceFailures": sum(not frame["pixelComparison"]["pass"]
                                     for row in ledger
                                     for frame in row["referenceFrames"] + row["matchReferenceFrames"]),
            "positivePass": sum(row["contentStatus"] == "pass" for row in ledger),
            "positiveFail": sum(row["contentStatus"] == "fail" for row in ledger),
            "positivePending": sum(row["contentStatus"] == "pending"
                                   for row in ledger),
            "nativePositivePass": sum(
                row.get("contentAssertionsAlsoPassPinnedUpstream", False) for row in ledger),
            "nativePositiveMismatch": sum("nativeContentError" in row for row in ledger),
            "upstreamMatchFeaturePass": sum(
                row.get("upstreamMatch", {}).get("featureStatus") == "pass" for row in ledger),
            "upstreamMatchFeatureFail": sum(
                row.get("upstreamMatch", {}).get("featureStatus") == "fail" for row in ledger),
            "upstreamContentDisagreements": sum(
                "contentFailureAlsoInPinnedUpstream" in row for row in ledger),
            "interactionPass": sum(
                isinstance(row["interactionAssertions"], dict)
                and row["interactionAssertions"]["status"] == "pass" for row in ledger),
            "interactionFail": sum(
                isinstance(row["interactionAssertions"], dict)
                and row["interactionAssertions"]["status"] == "fail" for row in ledger),
            "deferredUpstreamFailures": sum(
                row["bindingStatus"] == "upstream-failure-deferred" for row in ledger),
            "bindingRegressions": sum(row["bindingStatus"] == "fail" for row in ledger),
            "bindingContentAccepted": all(row["bindingAccepted"] for row in ledger),
            "bindingAccepted": all(row["bindingAccepted"] for row in ledger)
                and len(interaction_rows) >= 25
                and all(row["bindingAccepted"] for row in interaction_rows.values()),
            "wholeCorpusAccepted": False,
        },
    }
    (root / "comparison.json").write_text(json.dumps(report, indent=2) + "\n")
    if options.evidence_file:
        repository = Path(__file__).resolve().parents[4]
        expected = repository / "docs/rmlui/audit/6.3"
        destination = options.evidence_file.resolve()
        assert destination.parent == expected and expected.is_dir()
        destination.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report["summary"], indent=2))
    for row in ledger:
        if row["contentStatus"] == "fail":
            print("FAIL content", row["name"], row["contentError"])
        if row.get("upstreamMatch", {}).get("featureStatus") == "fail":
            print("FAIL match", row["name"], row["upstreamMatch"]["featureError"])
        for frame in row["referenceFrames"] + row["matchReferenceFrames"]:
            if not frame["pixelComparison"]["pass"]:
                print("FAIL reference", frame["name"], frame["pixelComparison"])
    if (report["summary"]["referenceFailures"] or report["summary"]["bindingRegressions"]
            or report["summary"]["upstreamMatchFeatureFail"]
            or report["summary"]["nativePositiveMismatch"]
            or any(not row["bindingAccepted"] for row in interaction_rows.values())):
        raise SystemExit(1)
    if options.require_complete and not report["summary"]["bindingAccepted"]:
        print("PENDING: measured binding content and interaction acceptance is incomplete")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
