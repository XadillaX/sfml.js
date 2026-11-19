"""Original positive whitespace contract; retain genuine centering failures."""

import numpy as np

from ..common import children, classified, close, tagged


def centered(snapshot, samples):
    boxes = classified(snapshot, "center")[:5]
    guideline = classified(snapshot, "guideline")[0]["rect"][0]
    centers = {}
    for item in boxes:
        x = item["rect"][0]
        array = samples.region(item)
        white = np.all(array > 240, axis=2)
        _, columns = np.nonzero(white)
        assert len(columns)
        centers[item["id"]] = x + (int(columns.min()) + int(columns.max()) + 1) / 2
    assert all(abs(center - guideline) <= .5 for center in centers.values()), (
        "trailing whitespace moves centered I away from the guideline", centers, guideline)


def wrapped(snapshot, samples):
    box = classified(snapshot, "autoheight")[0]
    close(box["content"][1], 4 * 60)
    array = samples.region(box)
    guideline = classified(snapshot, "guideline")[0]["rect"][0]
    centers = []
    for row in range(4):
        white = np.all(array[row * 60:(row + 1) * 60] > 240, axis=2)
        _, columns = np.nonzero(white)
        assert len(columns)
        centers.append(box["rect"][0] + (columns.min() + columns.max() + 1) / 2)
    assert all(abs(center - guideline) <= .5 for center in centers), (
        "wrapped ABC lines miss the guideline", centers, guideline)


def text_mask(samples, item):
    mask = np.all(samples.region(item) < 100, axis=2)
    rows, columns = np.nonzero(mask)
    assert len(rows) > 20
    return mask[rows.min():rows.max() + 1, columns.min():columns.max() + 1]


def headings(snapshot, samples):
    headings = tagged(snapshot, "h1")
    assert len(headings) == 2
    assert np.array_equal(text_mask(samples, headings[0]),
                          text_mask(samples, headings[1])), "Hello World whitespace differs"


def ducks(snapshot, samples):
    paragraphs = tagged(snapshot, "p")
    assert len(paragraphs) == 3
    template = text_mask(samples, children(snapshot, paragraphs[0], "span")[0])
    starts = {}
    for paragraph in paragraphs:
        array = text_mask(samples, paragraph)
        positions = [x for x in range(array.shape[1] - template.shape[1] + 1)
                     if np.array_equal(array[:, x:x + template.shape[1]], template)]
        assert len(positions) == 3, (paragraph["path"], positions)
        starts[paragraph["path"]] = positions
    # The original requirement asks for a space at every word boundary,
    # without requiring all three paragraphs to have identical spacing.
    assert all(second - first >= template.shape[1] + 4
               for positions in starts.values()
               for first, second in zip(positions, positions[1:])), (
        "Duck boundaries omit the 4dp word space", starts, template.shape[1])


def run(name, snapshot, samples):
    if name != "white_space":
        return []
    failures = []
    for contract in (centered, wrapped, headings, ducks):
        try:
            contract(snapshot, samples)
        except AssertionError as error:
            failures.append(f"{contract.__name__}: {error}")
    assert not failures, " | ".join(failures)
    return ["all I and four ABC lines intersect the guideline; Hello World "
            "spacing is identical and every Duck boundary retains a word space"]
