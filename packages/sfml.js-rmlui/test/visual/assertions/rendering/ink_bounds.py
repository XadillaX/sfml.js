"""Require the debugger's actual Auto bounds to cover rendered shadow ink."""

import math

from ..common import classified, close
from .sampling import rgb


def run(name, snapshot, samples):
    if name != "ink_overflow_bounding_box":
        return []
    boxes = classified(snapshot, "box")
    assert len(boxes) == 3
    skew = math.tan(math.radians(10))
    for box in boxes:
        close(box["rect"][2], 280)
        close(box["rect"][3], 70)
        bounds = box["inkBounds"]
        assert bounds is not None
        x, y, width, height = box["rect"]
        # The declared skew is about the center. The solid lower shadow is
        # safely away from the rounded corners and lies 40px below the box.
        if "dropshadow" in box["classes"].split():
            probe_x, probe_y = x + width / 2 + 30, y + height + 35
            # Resolve the original stable path with a normalized coordinate
            # for the actual unchanged pixel in every scroll frame.
            rgb(samples.sample(box, (probe_x - x) / width,
                               (probe_y - y) / height), (255, 238, 51))
            assert bounds[3] >= y + height + 40, (
                "debugger Auto bounds omit drop-shadow ink",
                box["classes"], bounds, "required bottom", y + height + 40)
        if "boxshadow" in box["classes"].split():
            close(bounds[1], y - 30)
            close(bounds[0], x - 40 - skew * 65)
            close(bounds[2], x + width + 40 + skew * 65)
            assert bounds[3] >= y + height + 30
    return ["debugger Auto bounds cover all transformed box-shadow and drop-shadow ink"]
