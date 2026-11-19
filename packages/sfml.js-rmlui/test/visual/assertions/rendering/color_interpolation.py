"""Literal static interpolation and curved border colors from the original page."""

import math

import numpy as np

from ..common import classified, close
from .sampling import rgb


def run(name, snapshot, samples):
    if name != "color_interpolation":
        return []
    boxes = classified(snapshot, "animate")
    assert len(boxes) == 2
    for box in boxes:
        close(box["content"][0], 100)
        rgb(samples.sample(box, .5, .5), (255, 0, 0))
    for kind in ("rectangle", "round"):
        boxes = classified(snapshot, kind)
        assert len(boxes) == 4
        for box in boxes:
            width = 300 if "wide" in box["classes"].split() else 100
            close(box["content"][0], width)
            previous = None
            for u in (.1, .25, .5, .75, .9):
                fraction = (math.floor(u * width) + .5) / width
                expected = (255 * (1 - fraction),
                            0 if "black" in box["classes"].split() else 255 * fraction,
                            0)
                actual = samples.sample(box, u, .5)
                rgb(actual, np.round(expected), 1)
                if previous is not None:
                    assert actual[0] < previous[0]
                previous = actual
            if kind == "round":
                rgb(samples.sample(box, .01, .01), (221, 221, 221))
    for box in classified(snapshot, "round-border"):
        close(box["content"][0], 70)
        rgb(samples.sample(box, .5, .5), (221, 221, 221))
        for u, v in ((.05, .5), (.95, .5)):
            rgb(samples.sample(box, u, v), (255, 0, 0))
        color = (0, 0, 0) if "black" in box["classes"].split() else (0, 255, 0)
        for u, v in ((.5, .05), (.5, .95)):
            rgb(samples.sample(box, u, v), color)
    return ["all eight horizontal gradients follow declared byte interpolation; "
            "rounded corners and both four-color borders retain their literal colors"]
