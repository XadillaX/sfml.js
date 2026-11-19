"""Ellipsis/custom marker rendering without changing the original line layout."""

import numpy as np

from ..common import children, classified, close, dimensions


def mask(samples, item):
    return np.all(samples.region(item, 1) < 110, axis=2)


def trimmed(array):
    rows, columns = np.nonzero(array)
    assert len(rows) > 5, "missing text"
    return array[rows.min():rows.max() + 1, columns.min():columns.max() + 1]


def ellipsis(snapshot, samples):
    groups = classified(snapshot, "group")
    assert len(groups) == 4
    boxes = children(snapshot, groups[0], "div")
    for box in boxes[:4]:
        dimensions(box, 3.1 * 14, 3 * 1.1 * 14)
    before = mask(samples, boxes[0])
    assert np.array_equal(before, mask(samples, boxes[1]))
    clipped, ellipsed = mask(samples, boxes[2]), mask(samples, boxes[3])
    assert np.count_nonzero(clipped) > 100 and np.count_nonzero(ellipsed) > 100
    assert not np.array_equal(trimmed(clipped), trimmed(ellipsed))
    narrow = children(snapshot, groups[1], "div")
    assert len(narrow) == 10
    previous = None
    for box, width in zip(narrow[:7], (30, 20, 15, 10, 3, 1, 0)):
        dimensions(box, width, 1.1 * 14)
        glyphs = mask(samples, box)
        assert np.any(glyphs)
        count = np.count_nonzero(glyphs)
        if previous is not None:
            assert count < previous
        previous = count
    assert not np.any(mask(samples, narrow[7]))
    assert np.any(mask(samples, narrow[8]))
    assert not np.any(mask(samples, narrow[9]))
    scroller = children(snapshot, groups[2], "div")[0]
    dimensions(scroller, 300, 42)
    assert scroller["scrollbars"] == [16, 0]
    assert scroller["scroll"][0] > 800
    assert np.count_nonzero(mask(samples, scroller)) > 500
    wrapping = children(snapshot, groups[3], "div")
    expected = trimmed(mask(samples, wrapping[0]))
    for box in wrapping[:4]:
        dimensions(box, 3.1 * 14, 4 * 1.1 * 14)
        assert np.array_equal(trimmed(mask(samples, box)), expected)
    return ["ellipsis changes only hidden-overflow glyphs; narrowing retains clipped first "
            "character and reduces ink; break-word variants contain identical four-line text"]


def custom(snapshot, samples):
    groups = classified(snapshot, "group")
    boxes = children(snapshot, groups[0], "div")
    assert len(boxes) == 9
    glyphs = [mask(samples, item) for item in boxes]
    for item in boxes[:8]:
        dimensions(item, 3.1 * 14, 1.1 * 14)
    dimensions(boxes[8], 100, 1.1 * 14)
    for glyph in glyphs:
        trimmed(glyph)
    assert len({glyph.tobytes() for glyph in glyphs[:8]}) == 7
    # An empty marker keeps Guaca; "." adds only a baseline dot.
    assert np.array_equal(glyphs[1][:, :41], glyphs[2][:, :41])
    dot = glyphs[2][:, 41:]
    assert np.count_nonzero(dot) == 2
    assert not np.any(dot[:13])
    # The three bullets repeat the same 5px glyph at 8px advances.
    bullets = glyphs[3]
    assert np.count_nonzero(bullets[:, 23:28]) > 10
    assert np.array_equal(bullets[:, 23:28], bullets[:, 31:36])
    assert np.array_equal(bullets[:, 31:36], bullets[:, 39:44])
    # The third emoji is clipped by this narrow line. The two-emoji visible
    # result is still required to differ from the one-emoji marker.
    assert not np.array_equal(glyphs[4], glyphs[5])
    assert np.array_equal(glyphs[5], glyphs[6])
    assert np.array_equal(glyphs[7][:, 19:44], glyphs[8][:, 41:66])
    assert np.count_nonzero(glyphs[8][:, 70:]) > 50
    atoms = children(snapshot, groups[1], "div")
    for item in atoms[:4]:
        dimensions(item, 3.1 * 14, 1.1 * 14)
    assert np.array_equal(mask(samples, atoms[2]), mask(samples, atoms[3]))
    wide = children(snapshot, groups[2], "div")
    assert len(wide) == 5
    counts = []
    for item, width in zip(wide, (20, 30, 40, 50, 60)):
        spans = children(snapshot, item, "span")
        dimensions(spans[0], width, 10)
        dimensions(spans[1], 10, 10)
        array = samples.region(item, 1)
        counts.append(np.count_nonzero(np.all(array == (255, 0, 0), axis=2)))
    assert counts[:3] == [200, 300, 400]
    assert counts[2] < counts[3] == counts[4]
    return ["empty/dot/bullet/emoji/custom text markers have distinct required glyphs "
            "and unchanged line dimensions; wide atomic spans retain literal clipping "
            "(the original page explicitly excludes atomic ellipsis support)"]


FUNCTIONS = {"text_overflow_01": ellipsis, "text_overflow_02": custom}


def run(name, snapshot, samples):
    return FUNCTIONS[name](snapshot, samples) if name in FUNCTIONS else []
