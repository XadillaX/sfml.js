"""Decorator equivalences and literal glyph placement, color and opacity."""

import numpy as np

from ..common import children, classified, dimensions


def ink(array, color):
    mask = np.all(np.abs(array - np.asarray(color)) <= 1, axis=2)
    rows, columns = np.nonzero(mask)
    assert len(rows) > 20, ("missing decorator glyphs", color)
    return mask, (int(columns.min()), int(rows.min()),
                  int(columns.max()), int(rows.max()))


def run(name, snapshot, samples):
    if name != "text_decorator":
        return []
    groups = {kind: classified(snapshot, kind)[0]
              for kind in ("basic", "align_top_left", "color", "misc", "hover")}
    for group in groups.values():
        for item in children(snapshot, group, "div"):
            dimensions(item, 138, 38)
    for kind, count, color in (("basic", 4, (51, 51, 51)),
                               ("align_top_left", 5, (51, 51, 51)),
                               ("color", 3, (0, 0, 255))):
        items = children(snapshot, groups[kind], "div")
        assert len(items) == count
        expected = samples.region(items[0], 1)
        ink(expected, color)
        rows, columns = np.nonzero(np.any(expected < 200, axis=2))
        bounds = (int(columns.min()), int(rows.min()),
                  int(columns.max()), int(rows.max()))
        for item in items[1:]:
            assert np.array_equal(samples.region(item, 1), expected)
        if kind == "align_top_left":
            assert bounds[0] <= 2 and bounds[1] <= 5
        elif kind == "basic":
            assert bounds[0] > 10 and bounds[1] > 10
    items = children(snapshot, groups["misc"], "div")
    _, padding = ink(samples.region(items[0], 1), (0, 0, 0))
    _, content = ink(samples.region(items[1], 1), (0, 0, 0))
    assert padding[2] - content[2] == padding[3] - content[3] == 10
    ink(samples.region(items[2], 1), (0, 0, 0))
    solid, first = ink(samples.region(items[3], 1), (255, 0, 255))
    translucent, second = ink(samples.region(items[4], 1), (238, 110, 238))
    assert first == second and np.array_equal(solid, translucent)
    for item in children(snapshot, groups["hover"], "div"):
        ink(samples.region(item, 1), (51, 51, 51))
    return ["all default/top-left/blue shorthand groups are pixel-equivalent and contain glyphs; "
            "content-box shifts bottom-right text by 10px and half-opacity fuchsia retains glyph geometry"]
