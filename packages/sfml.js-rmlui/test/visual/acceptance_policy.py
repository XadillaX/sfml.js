"""Accept measured binding parity while retaining diagnosed upstream failures."""

import json
import math
from pathlib import Path
import re
import traceback


VISUAL = Path(__file__).resolve().parent
POLICY = json.loads((VISUAL / "upstream-failures.json").read_text(encoding="utf-8"))


def evaluate(callback, *arguments):
    """Run unchanged assertions and retain their original failure identity."""
    try:
        assertions = callback(*arguments)
        return {"status": "pass" if assertions else "pending", "assertions": assertions}
    except (AssertionError, StopIteration) as error:
        stack = []
        for location in traceback.extract_tb(error.__traceback__):
            source = Path(location.filename)
            if not source.is_relative_to(VISUAL):
                continue
            relative = source.relative_to(VISUAL).as_posix()
            if relative.startswith(("assertions/", "interactions/validators/")):
                stack.append({
                    "source": relative, "line": location.lineno,
                    "expression": location.line,
                })
        return {
            "status": "fail",
            "failure": {"type": type(error).__name__, "message": str(error), "stack": stack},
        }


def classify(name, sha256, scope, results, frames_pass):
    """Reject missing native proof or parity loss, even on deferred pages."""
    if not frames_pass or set(results) != {"sfml", "gl3"}:
        return "fail"
    actual, native = results["sfml"], results["gl3"]
    if actual["status"] == native["status"] == "pass":
        if actual.get("assertions") and actual["assertions"] == native.get("assertions"):
            return "pass"
        return "fail"
    if actual["status"] == native["status"] == "pending":
        return "pending"
    if actual["status"] != "fail" or native["status"] != "fail":
        return "fail"
    first, second = actual.get("failure", {}), native.get("failure", {})
    if first.get("type") != "AssertionError" or second.get("type") != "AssertionError":
        return "fail"
    for entry in POLICY["failures"]:
        if (entry["name"], entry["sha256"], entry["scope"]) == (name, sha256, scope):
            if first.get("stack") == second.get("stack") == entry["stack"]:
                return "upstream-failure-deferred"
    return "fail"


def interaction_status(row):
    """Recheck attached input evidence instead of trusting its acceptance flag."""
    frames = row.get("frames", [])
    matches = bool(frames)
    for frame in frames:
        pixels = frame.get("pixels", {})
        maximum = frame.get("layoutMaximum")
        reference = frame.get("referenceSHA256", "")
        actual = frame.get("actualSHA256", "")
        matches = matches and (
            pixels.get("pass") is True
            and pixels.get("maxChannelDifference") == 0
            and pixels.get("differentPixels") == 0
            and pixels.get("pixelsBeyondOneByte") == 0
            and isinstance(maximum, (int, float))
            and math.isfinite(maximum) and 0 <= maximum <= 0.005
            and bool(re.fullmatch("[a-f0-9]{64}", reference))
            and reference == actual
        )
    return classify(row["name"], row["sourceSHA256"], "interaction",
                    row.get("interactionResults", {}), matches)
