"""Verify that independent interaction contracts reject specific lost behavior."""

import argparse
import copy
import hashlib
import json
from pathlib import Path
import sys

from PIL import Image

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from interactions.validators import controls, layout, rendering
from interactions.validators import additional
from interactions.validators.common import element


def change(frames, images, operation, state, path):
    """Corrupt the named behavior without modifying any upstream input."""
    if operation == "focus":
        element(frames[state], path)["pseudo"]["focus"] = False
    elif operation == "edge":
        element(frames[state], path)["rect"][0] += 10
    elif operation == "split":
        element(frames[state], path)["boxes"].pop()
    elif operation == "offset":
        element(frames[state], path)["scrollOffset"][1] = 0
    elif operation == "escaped-child":
        images[state].putpixel((400, 50), (224, 206, 247, 255))
    elif operation == "input-ink":
        x, y = element(frames[state], path)["rect"][:2]
        images[state].putpixel((int(x + 260), int(y + 12)), (0, 0, 0, 255))
    elif operation == "missing-glyphs":
        x, y, width, height = element(frames[state], path)["rect"]
        images[state].paste((221, 221, 221, 255),
                            (int(x), int(y), int(x + width), int(y + height)))
    elif operation == "value":
        element(frames[state], path)["value"] = "lost native keyboard insertion"
    elif operation == "width":
        element(frames[state], path)["content"][0] += 10
    elif operation == "active":
        element(frames[state], path)["pseudo"]["active"] = False
    elif operation == "frozen-animation":
        images[state] = images["spinner-base"].copy()
    elif operation == "unchanged-blur":
        images[state] = images["base"].copy()
    elif operation == "clip-leak":
        x, y, _, height = element(frames[state], path)["rect"]
        images[state].putpixel((int(x - 1), int(y + height / 2)),
                               (255, 211, 79, 255))
    else:
        raise AssertionError(operation)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture_directory", type=Path)
    options = parser.parse_args()
    root = options.capture_directory.resolve()
    validators = controls.FUNCTIONS | layout.FUNCTIONS | rendering.FUNCTIONS
    cases = (
        ("navigation_01", "focus", "right", "0/2/1"),
        ("handle_target_anchor", "edge", "target-2-edge-max", "0/2"),
        ("inline_formatting_03", "split", "split", "0/0/1"),
        ("text_decorator", "missing-glyphs", "font", "0/9/5"),
        ("text_overflow_02", "missing-glyphs", "custom-3", "0/1/3"),
        ("issue_143_overflow_in_absolutely_positioned_input", "input-ink",
         "hover-clipped", "0/0"),
        ("position_absolute_transform", "escaped-child", "bottom", "0/0/0/2"),
        ("scrollable_overflow_margin_padding", "offset", "end", "0/1/0/1"),
        ("text_alignment", "value", "input-0-typed", "0/0"),
        ("filter_drop_shadow", "width", "resize-wide", "0"),
        ("overflow_clip_transform", "edge", "window-0-moved", "0/0"),
        ("shader_radial_gradient", "active", "button-active", "0/1/0"),
        ("shader_conic_gradient", "frozen-animation", "spinner-advanced", "0"),
        ("filter_blur_area", "unchanged-blur", "blur-small", "0/1"),
        ("clip_mask", "clip-leak", "outer-moved", "0/0"),
    )
    results = []
    for driver in ("sfml", "gl3"):
        for name, operation, state, path in cases:
            snapshots = {}
            images = {}
            for source in (root / driver / f"{name}.json",
                           *(root / driver).glob(name + "--*.json")):
                key = "base" if source.stem == name else source.stem[len(name) + 2:]
                snapshots[key] = json.loads(source.read_text())
                images[key] = Image.open(source.with_suffix(".png")).convert("RGBA")
            validator = validators.get(name, additional.run)
            assert validator(snapshots, images), (driver, name, "baseline")
            snapshots = copy.deepcopy(snapshots)
            images = {key: image.copy() for key, image in images.items()}
            change(snapshots, images, operation, state, path)
            rejected = False
            try:
                validator(snapshots, images)
            except AssertionError:
                rejected = True
            assert rejected, (driver, name, operation)
            results.append({"driver": driver, "page": name, "operation": operation,
                            "state": state, "path": path, "rejected": True})
    report = {"rejected": len(results), "checks": results,
              "actionsSHA256": hashlib.sha256((root / "actions.tsv").read_bytes()).hexdigest()}
    (root / "mutations.json").write_text(json.dumps(report, indent=2) + "\n")
    print(f"PASS rejected {len(results)} independent lost-behavior mutations")


if __name__ == "__main__":
    main()
