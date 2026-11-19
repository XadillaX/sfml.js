"""Visible glyph alignment and the original input/textarea clipping distinction."""

import math

import numpy as np

from ..common import close, dimensions, tagged


def region(image, item, left, top, right, bottom):
    x, y = item["rect"][:2]
    return np.asarray(image.crop((math.floor(x) + left, math.floor(y) + top,
                                  math.floor(x) + right, math.floor(y) + bottom))
                      .convert("RGB"))


def glyph_bounds(array):
    rows, columns = np.nonzero(np.all(array < 110, axis=2))
    assert len(columns) > 15, "missing visible text"
    return int(columns.min()), int(columns.max()), int(rows.min()), int(rows.max())


def alignment(snapshot, image):
    inputs = tagged(snapshot, "input")
    areas = tagged(snapshot, "textarea")
    assert len(inputs) == 3 and len(areas) == 9
    for item in inputs + areas:
        dimensions(item, 226, 17 if item in inputs + areas[6:] else 51)
        close(item["rect"][2], 250)
    bounds = [glyph_bounds(region(image, item, 12, 7, 238, 24)) for item in inputs]
    assert bounds[0][0] == 1
    assert abs((bounds[1][0] + bounds[1][1] + 1) / 2 - 113) <= 1.5
    assert bounds[2][1] == 224
    bounds = [glyph_bounds(region(image, item, 12, 41, 238, 58))
              for item in areas[:3]]
    assert bounds[0][0] == 1 and bounds[2][1] == 224
    assert abs((bounds[1][0] + bounds[1][1] + 1) / 2 - 113) <= 1.5
    for item in areas[3:6]:
        first = glyph_bounds(region(image, item, 12, 7, 238, 24))
        assert first[0] == 1 and first[1] == 225
        assert item["scroll"][0] > item["content"][0]
        assert item["scrollbars"][0] == 16
    bounds = [glyph_bounds(region(image, item, 12, 7, 222, 24)) for item in areas[6:]]
    assert bounds[0][0] == 1 and bounds[2][1] == 208
    assert abs((bounds[1][0] + bounds[1][1] + 1) / 2 - 105) <= 1.5
    for item in areas[6:]:
        assert item["scrollbars"][1] == 16
    return ["left/center/right input glyphs and wrapped line-break align to content; "
            "nowrap clips overflowing lines and single-row textarea reserves its vertical scrollbar"]


def shadow_bounds(image, item):
    width, height = map(math.ceil, item["rect"][2:])
    array = region(image, item, -40, -15, width + 40, height + 15)
    rows, columns = np.nonzero((array[:, :, 0] > 200)
                              & (array[:, :, 1] < 100)
                              & (array[:, :, 2] < 100))
    assert len(columns), "missing red font shadow"
    return columns - 40, rows - 15


def overflow(snapshot, image):
    inputs = tagged(snapshot, "input")
    areas = tagged(snapshot, "textarea")
    assert len(inputs) == 5 and len(areas) == 6
    for item in inputs:
        dimensions(item, 116, 17)
        glyph_bounds(region(image, item, 17, 12, 133, 29))
    x, y = shadow_bounds(image, inputs[1])
    assert x.min() < 0 and y.min() < 12
    for item in inputs[2:]:
        x, y = shadow_bounds(image, item)
        assert x.min() >= 17 and x.max() < 133
        assert y.min() >= 12 and y.max() < 29
    for item in areas:
        dimensions(item, 240, 34)
    x, y = shadow_bounds(image, areas[1])
    assert x.min() < 0
    for item in (areas[2], areas[4], areas[5]):
        x, y = shadow_bounds(image, item)
        assert x.min() >= 2 and x.max() < 274
        assert y.min() >= 2 and y.max() < 56
    assert areas[3]["scrollbars"][1] == areas[4]["scrollbars"][1] == 16
    assert areas[5]["scrollbars"] == [16, 16]
    return ["short font shadows may escape; overflowing/rounded inputs clip to content "
            "while overflowing/rounded textareas clip to padding and expose required scrollbar axes"]


def absolute_input(snapshot, image):
    item = tagged(snapshot, "input")[0]
    dimensions(item, 240, 17)
    array = region(image, item, 0, 0, 280, 31)
    rows, columns = np.nonzero(np.all(array < 110, axis=2))
    assert len(columns) > 100
    assert columns.min() >= 7 and columns.max() < 247
    assert rows.min() >= 7 and rows.max() < 24
    assert np.all(array[2:29, 254:280] == 221)
    return ["absolutely positioned overflowing input retains glyphs only in its "
            "240x17dp content area; right exterior remains the document background"]


FUNCTIONS = {"text_alignment": alignment, "text_input_overflow": overflow,
             "issue_143_overflow_in_absolutely_positioned_input": absolute_input}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot, image) if name in FUNCTIONS else []
