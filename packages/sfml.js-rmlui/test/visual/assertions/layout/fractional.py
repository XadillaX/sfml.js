"""Fractional fixtures explicitly prohibit red gaps between accumulated boxes."""

import math

import numpy as np

from ..common import children, classified, close, tagged


def run(name, snapshot, image):
    handle = tagged(snapshot, "handle")[0]
    x, y, width, height = handle["rect"]
    if name == "fractional-dimensions-02":
        items = tagged(snapshot, "span")
        assert len(items) == 100
        close(handle["content"][0], 87)
        close(handle["content"][1], 87)
        # Three-pixel border surrounds the exact 10x10 accumulation area.
        x, y, width, height = x + 3, y + 3, 87, 87
        for index, item in enumerate(items):
            close(item["rect"][0], x + (index % 10) * 8.7, 0.01)
            close(item["rect"][1], y + (index // 10) * 8.7, 0.01)
    else:
        items = (children(snapshot, handle, "div")
                 if name == "fractional-dimensions-01"
                 else classified(snapshot, "inner"))
        assert len(items) == 34
        for first, second in zip(items, items[1:]):
            close(first["rect"][1] + first["rect"][3], second["rect"][1])
        close(sum(item["rect"][3] for item in items), height)
        for item in items:
            assert 17 <= item["rect"][3] <= 18
    region = np.asarray(image.convert("RGB"))[
        math.ceil(y):math.floor(y + height),
        math.ceil(x):math.floor(x + width)]
    assert region.size
    assert not np.any(np.all(region == (255, 0, 0), axis=2))
    return [f"{len(items)} accumulated fractional boxes are adjacent and expose no red gaps"]
