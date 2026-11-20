"""Verify aggregate acceptance rejects incomplete or forged input evidence."""

import argparse
import copy
import json
from pathlib import Path
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("corpus_directory", type=Path)
    parser.add_argument("interaction_directory", type=Path)
    options = parser.parse_args()
    corpus = options.corpus_directory.resolve()
    inputs = options.interaction_directory.resolve()
    visual = Path(__file__).resolve().parents[1]
    package = visual.parents[1]
    assert inputs.is_dir() and not inputs.is_relative_to(package)
    original = json.loads((inputs / "comparison.json").read_text())
    assert original["summary"]["bindingAccepted"]
    positive = next(row for row in original["pages"] if row["status"] == "pass")
    name = positive["name"]
    cases = []

    missing = copy.deepcopy(original)
    missing["pages"] = [row for row in missing["pages"] if row["name"] != name]
    missing["originalSourceCoverage"]["covered"].remove(name)
    cases.append(("missing-required-input", missing, "missingInteractivePages"))

    forged = copy.deepcopy(missing)
    forged["originalSourceCoverage"]["required"].remove(name)
    cases.append(("forged-source-coverage", forged, "AssertionError"))

    duplicate = copy.deepcopy(original)
    duplicate["pages"].append(copy.deepcopy(positive))
    cases.append(("duplicate-input-row", duplicate, "AssertionError"))

    no_native = copy.deepcopy(original)
    row = next(row for row in no_native["pages"] if row["name"] == name)
    del row["interactionResults"]["gl3"]
    row["bindingAccepted"] = True
    cases.append(("forged-acceptance-without-native", no_native, '"bindingAccepted": false'))

    results = []
    for label, report, marker in cases:
        source = inputs / ("rejected-report-" + label + ".json")
        source.write_text(json.dumps(report, indent=2) + "\n")
        result = subprocess.run(
            [sys.executable, "-B", str(visual / "compare-corpus.py"),
             str(corpus), "--interaction-report", str(source),
             "--require-complete"],
            cwd=package, text=True, capture_output=True, check=False)
        assert result.returncode == 1, (label, result.returncode, result.stdout, result.stderr)
        assert marker in result.stdout + result.stderr, (label, result.stdout, result.stderr)
        results.append({"case": label, "rejected": True})
    restored = subprocess.run(
        [sys.executable, "-B", str(visual / "compare-corpus.py"), str(corpus),
         "--interaction-report", str(inputs / "comparison.json"),
         "--require-complete"],
        cwd=package, text=True, capture_output=True, check=False)
    assert restored.returncode == 0, (restored.stdout, restored.stderr)
    (inputs / "rejected-reports.json").write_text(
        json.dumps({"checks": results}, indent=2) + "\n")
    print(f"PASS rejected {len(results)} incomplete or forged interaction reports")


if __name__ == "__main__":
    main()
