"""Containing-block clipping and nested scroll extent contracts."""

import numpy as np

from ..common import children, classified, close, dimensions, pixel


def hidden(snapshot, image):
    array = np.asarray(image.convert("RGB"))
    assert not np.any((array[:, :, 0] > 235) & (array[:, :, 1] < 150)
                      & (array[:, :, 2] < 150)), "red text or red hidden box remains"
    boxes = classified(snapshot, "overflow")
    assert len(boxes) == 5
    for box in boxes:
        dimensions(box, 200, 120)
    green = classified(snapshot, "green")
    assert len(green) == 2
    for item in green:
        x, y, width, height = item["rect"]
        pixel(image, x + width / 2, y + height - 10, (119, 255, 119))
    return ["five clipping parents remove FAIL/red content while both ancestor/clip-none green boxes remain"]


def nested(snapshot, image):
    outer = classified(snapshot, "outer")
    inner = classified(snapshot, "inner")
    assert len(outer) == 3 and len(inner) == 2
    close(outer[0]["scroll"][0], 200)
    close(outer[0]["scroll"][1], 150)
    close(inner[0]["scroll"][0], 312)
    close(inner[0]["scroll"][1], 84)
    close(outer[1]["scroll"][0], 308)
    close(outer[1]["scroll"][1], 134)
    close(outer[2]["scroll"][0], 184)
    assert outer[2]["scroll"][1] > 150
    # Imported scrollbar rules are 16px; sample each actual track outside thumb.
    for box, vertical in ((inner[0], False), (outer[1], False), (outer[2], True)):
        x, y, width, height = box["rect"]
        if vertical:
            pixel(image, x + width - 8, y + height - 10, (170, 170, 170))
        else:
            pixel(image, x + width - 10, y + height - 8, (170, 170, 170))
    return ["deepest eligible container catches overflow and exactly three intended scrollbar tracks render"]


def transformed(snapshot, image):
    windows = classified(snapshot, "window")
    assert len(windows) == 4
    pictures = []
    for item, translation in zip(windows, (-50, 50, 0, 0)):
        dimensions(item, 400, 200)
        close(item["scroll"][1], 276)
        container = children(snapshot, item, "div")[0]
        dimensions(container, 146, 140)
        close(container["scroll"][0], 298)
        close(container["scroll"][1], 460)
        assert len(children(snapshot, container, "p")) == 23
        x, y, width, height = item["rect"]
        bounds = (int(x), int(y + translation),
                  int(x + width), int(y + translation + height))
        pictures.append(np.asarray(image.crop(bounds).convert("RGB")))
    assert np.any(np.all(pictures[0] == (153, 153, 153), axis=2))
    assert np.any(np.all(pictures[0] == (255, 255, 255), axis=2))
    for picture in pictures[1:]:
        assert np.array_equal(pictures[0], picture), "transformed clipping differs"
    return ["all four translated/untranslated windows have identical full pixels and nested extents"]


FUNCTIONS = {"overflow_hidden": hidden, "overflow_nested": nested,
             "overflow_clip_transform": transformed}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot, image) if name in FUNCTIONS else []
