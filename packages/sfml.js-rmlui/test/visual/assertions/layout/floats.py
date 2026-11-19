"""Float containment, flow-root exclusion, and text/float placement contracts."""

from ..common import (
    bottom, children, classified, close, dimensions, identified, right, tagged,
)


def basic(snapshot):
    content = identified(snapshot, "content")
    dimensions(content, 250, content["content"][1])
    floats = classified(snapshot, "float")
    paragraphs = children(snapshot, content, "p")
    assert len(floats) == 3 and len(paragraphs) == 6
    for item in floats:
        dimensions(item, 100, 100)
        close(item["rect"][0] - content["rect"][0], 5)
    assert paragraphs[1]["rect"][1] < bottom(floats[0])
    assert paragraphs[3]["rect"][1] >= bottom(floats[1]) + 5 - 0.01
    last = paragraphs[5]
    assert last["rect"][1] >= bottom(floats[2]) - 0.01 or (
        last["rect"][0] >= right(floats[2]) + 5)
    return ["ordinary paragraph wraps beside float; clear and new BFC avoid preceding float"]


def excluded(snapshot):
    floats = classified(snapshot, "float")
    boxes = classified(snapshot, "box")
    assert len(floats) == len(boxes) == 2
    close(boxes[0]["rect"][0], floats[0]["rect"][0])
    close(boxes[0]["rect"][1], floats[0]["rect"][1])
    assert boxes[1]["rect"][0] >= right(floats[1]) + 25 - 0.01 or (
        boxes[1]["rect"][1] >= bottom(floats[1]) - 0.01)
    for item in floats:
        dimensions(item, 200, 100)
        close(item["rect"][2], 222)
    return ["normal BFC overlaps float extent; flow-root border box excludes external float"]


def overflow(snapshot):
    boxes = classified(snapshot, "box")
    floats = classified(snapshot, "float")
    assert len(boxes) == len(floats) == 3
    assert bottom(floats[0]) > bottom(boxes[0])
    for container, item in zip(boxes[1:], floats[1:]):
        close(bottom(container) - bottom(item), 10)
        dimensions(item, 200, 130)
    close(boxes[1]["rect"][3], boxes[2]["rect"][3])
    return ["ordinary box excludes float height; overflow:auto and flow-root contain it equally"]


def placement(snapshot):
    floats = classified(snapshot, "box")
    words = tagged(snapshot, "span")
    assert len(floats) == len(words) == 5
    for item, word in zip(floats, words):
        dimensions(item, 150, 70)
        assert word["rect"][0] >= right(item) + 15 - 0.01
    for item, word in zip(floats[:2], words[:2]):
        close(item["rect"][1], word["rect"][1])
    assert floats[-1]["rect"][1] > floats[0]["rect"][1]
    return ["all five floats preserve 150x70px content and following word clears right margin"]


def text_wrap(snapshot):
    item = classified(snapshot, "float")[0]
    paragraph = tagged(snapshot, "p")[0]
    dimensions(item, 380, 100)
    close(item["rect"][2], 402)
    # The 25px margin leaves only 45px; 'CCC' must wrap below the float.
    assert bottom(paragraph) > bottom(item)
    close(paragraph["rect"][2], tagged(snapshot, "body")[0]["content"][0] - 10)
    return ["380px float plus border/padding/margin forces narrow words onto following lines"]


def run(name, snapshot, image):
    functions = {
        "float_basic": basic, "float_excluded_by_flow_root": excluded,
        "float_overflow": overflow, "float_placement": placement,
        "float_text_wrap": text_wrap,
    }
    return functions[name](snapshot) if name in functions else []
