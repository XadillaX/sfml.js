"""Original positioning contracts, including checks that can expose engine gaps."""

from ..common import (
    bottom, children, classified, close, dimensions, identified, right, tagged,
)


def css_example(name, snapshot):
    body = tagged(snapshot, "body")[0]
    paragraph = tagged(snapshot, "p")[0]
    if name == "position_09_absolute_positioning_change_bars":
        span = tagged(snapshot, "span")[0]
        close(paragraph["rect"][0], body["rect"][0] + 8 + 10)
        close(span["rect"][0], paragraph["rect"][0] - 20)
        assert paragraph["rect"][1] <= span["rect"][1] < bottom(paragraph)
        return ["20dp change bar offset remains anchored to its paragraph line"]
    outer = identified(snapshot, "outer")
    inner = identified(snapshot, "inner")
    if name in ("position_01_normal_flow", "position_02_relative_positioning"):
        # 20dp font, 40dp line height: inline content has 24dp height and an 8dp
        # half-leading offset. The inner's +12 cancels the outer's -12.
        close(outer["rect"][3], 24)
        close(inner["rect"][3], 24)
        close(inner["rect"][1] - paragraph["rect"][1], 8)
        offset = -12 if name == "position_02_relative_positioning" else 0
        close(outer["rect"][1] - inner["rect"][1], offset)
        close(paragraph["rect"][3], 80)
        return ["inline 24dp boxes retain 40dp line layout and declared relative offsets"]
    if name.startswith(("position_03", "position_04", "position_05")):
        close(inner["content"][0], 130)
        close(right(inner), right(body) - 8)
        assert inner["rect"][3] >= 40
        if name.startswith("position_05"):
            sibling = identified(snapshot, "sibling")
            assert sibling["rect"][1] >= bottom(inner), (
                "declared clear:right did not place inline sibling below float",
                sibling["rect"], inner["rect"])
        return ["130dp right float retains independent line layout and declared clearing"]
    if name == "position_06_absolute_positioning":
        close(outer["rect"][0], 200)
        close(outer["rect"][1], 200)
        close(outer["content"][0], 200)
        close(paragraph["rect"][3], 40)
        return ["absolute 200dp top/left/width removes outer text from normal flow"]
    dimensions(inner, 130, 130)
    if name == "position_07_absolute_positioning_relative":
        close(inner["rect"][0], outer["rect"][0] - 100)
        close(inner["rect"][1], outer["rect"][1] + 200)
        return ["absolute child anchored to positioned inline parent"]
    close(inner["rect"][0], body["rect"][0] - 100)
    close(inner["rect"][1], body["rect"][1] + 200)
    return ["absolute child of static inline parent anchored to document"]


def static_position(snapshot):
    box = classified(snapshot, "absolute")[0]
    word = classified(snapshot, "red")[0]
    close(box["rect"][0], word["rect"][0])
    close(box["rect"][1], word["rect"][1])
    close(box["rect"][2], 70)
    close(box["rect"][3], 70)
    article = classified(snapshot, "article")[0]
    assert article["scroll"][1] > article["content"][1]
    return ["70px static absolute box covers highlighted word; article has scrollable content"]


def transformed(snapshot):
    parents = classified(snapshot, "transform")
    boxes = classified(snapshot, "absolute")
    assert len(parents) == len(boxes) == 2
    for parent, box in zip(parents, boxes):
        # Parent padding box is 170x140; child content is half of this.
        dimensions(box, 85, 70)
        close(right(box), right(parent) - 5)
        close(bottom(box), bottom(parent) - 5)
    return ["absolute and fixed children use transformed parent's padding box and bottom/right anchors"]


def relative(snapshot):
    block = tagged(snapshot, "block")[0]
    purple = classified(snapshot, "purple")[0]
    green = classified(snapshot, "green")[0]
    close(bottom(purple), green["rect"][1])
    close(green["rect"][1], block["rect"][1] + 2 + block["content"][1] / 2)
    last = None
    for color in ("white", "yellow", "purple", "green", "orange", "blue"):
        item = classified(snapshot, color)[0]
        if last is not None:
            assert item["rect"][1] > last
        last = item["rect"][1]
    for left, name in (("orange", "red"), ("blue", "pink")):
        a = classified(snapshot, left)[0]
        b = classified(snapshot, name)[0]
        close(a["rect"][1], b["rect"][1])
        close(right(a), b["rect"][0])
    return ["purple/green centered pair and all eight color groups retain declared visual order"]


def run(name, snapshot, image):
    if name.startswith("position_0"):
        return css_example(name, snapshot)
    functions = {
        "position_absolute_static_position": static_position,
        "position_absolute_transform": transformed, "position_relative": relative,
    }
    return functions[name](snapshot) if name in functions else []
