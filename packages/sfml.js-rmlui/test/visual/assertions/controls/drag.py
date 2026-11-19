"""Original transformed drag sources, independent of the cursor clone checks."""

import numpy as np

from ..common import classified, close, dimensions


def run(name, snapshot, image):
    if name != "drag":
        return []
    containers = classified(snapshot, "container")
    items = classified(snapshot, "item")
    assert len(containers) == len(items) == 2
    array = np.asarray(image.convert("RGB"))
    for container, item, (start, stop) in zip(containers, items, ((0, 380), (380, 768))):
        dimensions(container, 300, 300)
        dimensions(item, 100, 100)
        close(item["rect"][0] - container["rect"][0], 100)
        close(item["rect"][1] - container["rect"][1], 100)
        rows, columns = np.nonzero(np.all(array[start:stop] == 31, axis=2))
        assert len(rows) > 3500
        assert columns.min() > item["rect"][0] + 100
        assert columns.max() - columns.min() < 100
        assert rows.max() - rows.min() < 100
    return ["both transformed sources render distinct dark rotated polygons while "
            "their untransformed layout boxes retain 100dp margins"]
