"""Protect upstream deferrals from missing evidence and binding regressions."""

import copy
import unittest

from acceptance_policy import classify, evaluate, interaction_status, POLICY


class ParityAcceptance(unittest.TestCase):
    def test_both_drivers_must_pass_the_same_positive_contract(self):
        results = {
            "sfml": {"status": "pass", "assertions": ["visible text"]},
            "gl3": {"status": "pass", "assertions": ["visible text"]},
        }
        self.assertEqual(classify("ordinary", "a" * 64, "content", results, True), "pass")
        results.pop("gl3")
        self.assertEqual(classify("ordinary", "a" * 64, "content", results, True), "fail")

    def test_only_diagnosed_failures_with_exact_source_and_stack_are_deferred(self):
        for entry in POLICY["failures"]:
            with self.subTest(page=entry["name"]):
                failure = {"type": "AssertionError", "stack": entry["stack"], "message": "348"}
                results = {driver: {"status": "fail", "failure": copy.deepcopy(failure)}
                           for driver in ("sfml", "gl3")}
                # Numeric serialization differs between native and JS snapshots.
                results["gl3"]["failure"]["message"] = "348.000"
                arguments = (entry["name"], entry["sha256"], entry["scope"])
                self.assertEqual(classify(*arguments, results, True),
                                 "upstream-failure-deferred")
                self.assertEqual(classify(*arguments, results, False), "fail")
                self.assertEqual(classify(entry["name"], "b" * 64, entry["scope"],
                                          results, True), "fail")
                changed = copy.deepcopy(results)
                changed["gl3"] = {"status": "pass", "assertions": ["correct behavior"]}
                self.assertEqual(classify(*arguments, changed, True), "fail")
                changed = copy.deepcopy(results)
                changed["sfml"]["failure"]["stack"][-1]["line"] += 1
                self.assertEqual(classify(*arguments, changed, True), "fail")
                self.assertEqual(classify("unreviewed", entry["sha256"], entry["scope"],
                                          results, True), "fail")

    def test_failure_capture_retains_error_details(self):
        def fail():
            raise AssertionError("original diagnostic")

        result = evaluate(fail)
        self.assertEqual(result["status"], "fail")
        self.assertEqual(result["failure"]["message"], "original diagnostic")
        self.assertEqual(result["failure"]["type"], "AssertionError")

    def test_attached_input_summary_cannot_replace_native_proof(self):
        row = {
            "name": "ordinary", "sourceSHA256": "a" * 64,
            "bindingAccepted": True,
            "interactionResults": {
                "sfml": {"status": "pass", "assertions": ["input received"]},
                "gl3": {"status": "pass", "assertions": ["input received"]},
            },
            "frames": [{
                "pixels": {"pass": True, "maxChannelDifference": 0,
                           "pixelsBeyondOneByte": 0, "differentPixels": 0},
                "layoutMaximum": 0,
                "referenceSHA256": "b" * 64, "actualSHA256": "b" * 64,
            }],
        }
        self.assertEqual(interaction_status(row), "pass")
        missing = copy.deepcopy(row)
        del missing["interactionResults"]["gl3"]
        self.assertEqual(interaction_status(missing), "fail")
        mismatch = copy.deepcopy(row)
        mismatch["frames"][0]["pixels"]["pass"] = False
        self.assertEqual(interaction_status(mismatch), "fail")
        row["frames"] = []
        self.assertEqual(interaction_status(row), "fail")


if __name__ == "__main__":
    unittest.main()
