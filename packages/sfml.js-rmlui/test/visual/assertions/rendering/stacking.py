"""Positive paint-order assertions for text overflow and filter stacking."""

import numpy as np

from ..common import children, classified, close, pixel


def text_overflow(snapshot, image):
    wrappers = classified(snapshot, "wrapper")
    assert len(wrappers) == 6
    portions = []
    for parent in wrappers:
        a, b = children(snapshot, parent, "div")
        close(a["rect"][2], 29)
        close(a["rect"][3], 26)
        close(b["rect"][1], a["rect"][1] + 26)
        close(a["scroll"][1], 33.6)
        x, y, _, _ = b["rect"]
        # AA occupies the side of B's first rows; B itself is centered.
        bounds = (int(x + 3), int(y), int(x + 9), int(y + 6))
        portion = np.asarray(image.crop(bounds).convert("RGB"))
        portions.append(portion)
    assert np.array_equal(portions[0], portions[1])
    assert np.any(np.max(portions[0], axis=2) < 150), "overflowing AA did not paint"
    for portion in portions[2:]:
        assert not np.any(np.max(portion, axis=2) < 150), "AA painted over positioned B"
    return ["AA paints above normal/negative-z boxes but below relative/zero-z/inline-block/flex B"]


def filter_order(snapshot, image):
    positioned = classified(snapshot, "positioned")
    assert len(positioned) == 4
    for index, item in enumerate(positioned):
        x, y, width, height = item["rect"]
        close(width, 114)
        close(height, 34)
        expected = (221, 255, 221) if index == 1 else (255, 221, 221)
        pixel(image, x + width / 2, y + height - 8, expected)
    return ["positioned pink box is hidden only by the second row's later filtered green box"]


FUNCTIONS = {"stacking_context_01": text_overflow, "stacking_context_02": filter_order}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot, image) if name in FUNCTIONS else []
