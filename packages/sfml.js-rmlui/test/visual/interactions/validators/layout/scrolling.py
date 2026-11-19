"""Transformed absolute/fixed descendants must clip through native scrolling."""

import numpy as np

from ..common import close, delta, element


def purple(image):
    pixels = np.asarray(image.convert("RGB"))
    return np.all(pixels == (224, 206, 247), axis=2)


def transformed(frames, images):
    before = purple(images["base"])
    partial = purple(images["partial"])
    bottom = purple(images["bottom"])
    assert np.count_nonzero(before) > 5000
    assert 0 < np.count_nonzero(partial) < np.count_nonzero(before)
    assert not np.any(bottom), "child paint escaped scrolled transformed container"
    for index in (0, 1):
        path = f"0/{index}"
        for state, offset in (("inside", 80), ("partial", 160),
                              ("bottom", 1000), ("restored", 0)):
            close(element(frames[state], path)["scrollOffset"][1], offset)
        # At the partial checkpoint the transformed container clips all
        # purple child paint to its translated vertical padding bounds.
        container = element(frames["partial"], path)
        top = container["rect"][1] + 128 + 3
        low, high = (0, 420) if index == 0 else (420, 768)
        rows = np.nonzero(partial[low:high])[0] + low
        assert len(rows) > 100
        assert rows.min() >= top and rows.max() < top + 250
    assert np.array_equal(before, purple(images["restored"]))
    return ["160dp scroll clips both transformed absolute/fixed children at container padding",
            "1000dp bottom scroll removes every child pixel; zero offsets restore exact paint"]


def scroll_extents(frames, images, paths, expected, baseline="base"):
    """Require literal clamped limits and corresponding child displacement."""
    assert len(paths) == len(expected)
    for path, limit in zip(paths, expected):
        before = element(frames[baseline], path)
        final = element(frames["end"], path)
        restored = element(frames["start"], path)
        for actual, target in zip(final["scrollOffset"], limit):
            close(actual, target)
        assert restored["scrollOffset"] == [0, 0]
        delta(before, final, (0, 0, 0, 0))
        child_path = path + "/0"
        delta(element(frames[baseline], child_path),
              element(frames["end"], child_path), (-limit[0], -limit[1], 0, 0))
        delta(element(frames[baseline], child_path),
              element(frames["start"], child_path), (0, 0, 0, 0))
    assert not np.array_equal(np.asarray(images[baseline]), np.asarray(images["end"]))
    assert np.array_equal(np.asarray(images[baseline]), np.asarray(images["start"]))


def simple_overflow(frames, images):
    scroll_extents(frames, images, ("0/0", "0/1", "0/2"),
                   ((266, 0), (429, 0), (0, 11)))
    return ["oversized direct children include trailing margins/padding; nested border excludes margin",
            "both horizontal limits and margin-only vertical limit clamp, move children and restore exact paint"]


def height_overflow(frames, images):
    paths = tuple(f"0/{group}/{index}/1" for group in (1, 3) for index in range(6))
    limits = ((0, 62), (122, 0), (0, 0), (0, 0), (0, 62), (0, 82))
    scroll_extents(frames, images, paths, limits * 2)
    return ["all twelve block/flex height modes clamp to the declared scroll limits",
            "padded maximum-height adds trailing margin/padding; auto horizontal case retains scrollbar height"]


def margin_overflow(frames, images):
    paths = tuple(f"0/{group}/{index}/1" for group in (1, 3, 5) for index in range(6))
    vertical = ((0, 42), (0, 12), (0, 67), (0, 42), (0, 67), (0, 18))
    horizontal = ((32, 0), (2, 0), (57, 0), (32, 0), (57, 0), (8, 0))
    scroll_extents(frames, images, paths, vertical + horizontal + vertical, "base-bottom")
    return ["all eighteen flex-column/flex-row/block margin/padding permutations reach exact end limits",
            "direct-child margins and end padding extend limits; nested descendants contribute border only"]


def flex_overflow(frames, images):
    paths = tuple(f"0/{index}" for index in (1, 3, 5, 7, 9))
    limits = ((189, 64), (189, 64), (0, 64), (189, 0), (189, 64))
    scroll_extents(frames, images, paths, limits)
    return ["scroll/auto flexboxes clamp both axes; vertical/horizontal cases clamp only their scroll axis",
            "native setters also clamp visible overflow; origin restores all glyphs and tall descendants"]


FUNCTIONS = {
    "position_absolute_transform": transformed, "scrollable_overflow": simple_overflow,
    "scrollable_overflow_height": height_overflow,
    "scrollable_overflow_margin_padding": margin_overflow, "flex_03_scroll": flex_overflow,
}
