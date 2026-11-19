"""Sample unchanged document coordinates from existing top and scroll frames."""

import math

import numpy as np


class Frames:
    """Resolve a stable DOM path in the frame where its requested pixels exist."""

    def __init__(self, frames):
        self.frames = frames

    def sample(self, element, u, v):
        for snapshot, image in self.frames:
            item = next(row for row in snapshot["elements"]
                        if row["path"] == element["path"])
            x, y, width, height = item["rect"]
            px, py = math.floor(x + u * width), math.floor(y + v * height)
            if 0 <= px < image.width and 0 <= py < image.height:
                return np.asarray(image.getpixel((px, py))[:3], dtype=np.int16)
        raise AssertionError(("uncaptured sample", element["path"], u, v))

    def region(self, element, inset=0):
        for snapshot, image in self.frames:
            item = next(row for row in snapshot["elements"]
                        if row["path"] == element["path"])
            x, y, width, height = item["rect"]
            bounds = (math.ceil(x) + inset, math.ceil(y) + inset,
                      math.floor(x + width) - inset, math.floor(y + height) - inset)
            if (0 <= bounds[0] < bounds[2] <= image.width
                    and 0 <= bounds[1] < bounds[3] <= image.height):
                return np.asarray(image.crop(bounds).convert("RGB"), dtype=np.int16)
        raise AssertionError(("uncaptured region", element["path"], inset))


def rgb(actual, expected, tolerance=1):
    assert np.max(np.abs(actual - expected)) <= tolerance, (
        actual.tolist(), np.asarray(expected).tolist())


def equivalent(samples, elements, points):
    """Compare stable interior samples, including pairs with fractional offsets."""
    assert len(elements) >= 2
    for u, v in points:
        expected = samples.sample(elements[0], u, v)
        for element in elements[1:]:
            rgb(samples.sample(element, u, v), expected)
