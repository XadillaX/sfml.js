"""Shrink-to-fit width constraints across inline, absolute, float and flex boxes."""

import numpy as np

from ..common import (
    children, classified, close, dimensions, right, tagged,
)


def boxes(snapshot):
    body = tagged(snapshot, "body")[0]
    wrappers = children(snapshot, body, "div")
    assert len(wrappers) == 6
    items = [children(snapshot, wrapper)[0] for wrapper in wrappers]
    for item in items:
        dimensions(item, 42, 16.8)
        close(item["rect"][2], 46)
        close(item["rect"][0], body["rect"][0] + 8)
    return ["all six inline/absolute/float/inline-block boxes fit the same A BOX text"]


def positioned(snapshot):
    body = tagged(snapshot, "body")[0]
    wrappers = children(snapshot, body, "div")
    assert len(wrappers) == 8
    inner = [children(snapshot, wrapper, "div")[0] for wrapper in wrappers]
    for item in inner:
        dimensions(item, 150, 30)
    close(wrappers[0]["rect"][2], wrappers[2]["rect"][2])
    assert wrappers[1]["rect"][2] < wrappers[0]["rect"][2]
    close(wrappers[3]["rect"][2], wrappers[4]["rect"][2])
    close(wrappers[3]["rect"][2], wrappers[7]["rect"][2])
    close(wrappers[5]["rect"][2], wrappers[6]["rect"][2])
    for index in (1, 2, 7):
        close(inner[index]["rect"][0] - wrappers[index]["rect"][0], 52)
    for index in (4, 6):
        close(right(wrappers[index]) - right(inner[index]), 2)
    return ["absolute child excluded from width; relative shift preserves width; left/right floats symmetric"]


def equivalent(snapshot):
    body = tagged(snapshot, "body")[0]
    wrappers = children(snapshot, body, "div")
    assert len(wrappers) == 10
    for group in ((0, 2), (1, 3, 4), (5, 6, 7)):
        first = wrappers[group[0]]
        for index in group[1:]:
            close(wrappers[index]["rect"][2], first["rect"][2])
            close(wrappers[index]["rect"][3], first["rect"][3])
    asymmetric = classified(snapshot, "assymetric_edges")
    assert len(asymmetric) == 3
    for item in asymmetric:
        close(item["rect"][2] - item["content"][0], 22)
    close(wrappers[-1]["rect"][2], body["content"][0])
    assert wrappers[-2]["rect"][2] < wrappers[-1]["rect"][2]
    return ["equal text groups have equal fitted sizes; asymmetric edges add 22px; long text fits available width"]


def fixed(snapshot, image):
    wrappers = classified(snapshot, "wrapper")
    fixed_items = classified(snapshot, "fixed")
    assert len(wrappers) == len(fixed_items) == 5
    for wrapper, item in zip(wrappers, fixed_items):
        close(item["rect"][2], 100)
        close(item["content"][0], 80)
        close(wrapper["rect"][2], 104)
        close(wrapper["rect"][3], wrappers[0]["rect"][3])
        x, y, width, height = wrapper["rect"]
        region = np.asarray(image.convert("RGB"))[
            int(y + 2):int(y + height - 2), int(x + 2):int(x + width - 2)]
        assert region.size and not np.any(np.all(region == (255, 0, 0), axis=2))
    return ["five block/flex/table definite 100dp widths fit borders and expose no red"]


def run(name, snapshot, image):
    if name == "shrink_to_fit_04":
        return fixed(snapshot, image)
    functions = {
        "shrink_to_fit_01": boxes, "shrink_to_fit_02": positioned,
        "shrink_to_fit_03": equivalent,
    }
    return functions[name](snapshot) if name in functions else []
