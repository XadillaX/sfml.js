"""Initial target anchoring and handle positions; live movement is separate."""

from ..common import children, classified, close, dimensions, right, bottom, tagged


def handle_pair(snapshot, parent, border):
    move, resize = children(snapshot, parent, "handle")
    close(move["rect"][0], parent["rect"][0] + border)
    close(move["rect"][1], parent["rect"][1] + border)
    close(move["rect"][2], parent["rect"][2] - 2 * border)
    close(move["rect"][3], 20)
    close(right(resize), right(parent) - border)
    close(bottom(resize), bottom(parent) - border)
    dimensions(resize, 16, 16)


def document_position(snapshot):
    document = snapshot["elements"][0]
    x, y, width, height = document["rect"]
    close(width, 600)
    close(height, 400)
    close(x, (1024 - 440 - 600) / 2)
    close(y, (768 - 400) / 2)
    block = tagged(snapshot, "div")[0]
    close(block["rect"][0], x + 5 + 590 / 2 + (590 / 2 - 160) / 2)
    close(block["rect"][1], y + 5 + 120)
    close(block["rect"][2], 160)
    close(block["rect"][3], 390 - 2 * 120)
    handle_pair(snapshot, document, 5)
    handle_pair(snapshot, block, 5)
    return ["document centers in non-debugger area; absolute block and both handle pairs retain target anchors"]


def target_anchor(snapshot):
    document = snapshot["elements"][0]
    close(document["rect"][0], 100)
    close(document["rect"][1], 100)
    close(document["rect"][2], 1024 - 100 - 580)
    close(document["rect"][3], 768 - 2 * 100)
    left = classified(snapshot, "top_left")[0]
    right_bottom = classified(snapshot, "bottom_right")[0]
    close(left["rect"][0], document["rect"][0] + 5 + 25 + 20)
    close(left["rect"][1], document["rect"][1] + 5 + 25 + 30)
    close(right(right_bottom), right(document) - 5 - 25 - 20)
    close(bottom(right_bottom), bottom(document) - 5 - 25 - 30)
    for item in (left, right_bottom):
        dimensions(item, 180, 100)
        handle_pair(snapshot, item, 0)
    all_sides = classified(snapshot, "top_right_bottom_left")[0]
    assert all_sides["content"][0] >= 100
    assert all_sides["content"][1] >= 50
    handle_pair(snapshot, all_sides, 0)
    handle_pair(snapshot, document, 5)
    return ["top-left, bottom-right and all-side minimum-size targets with both initial handle anchors"]


FUNCTIONS = {"document_position": document_position, "handle_target_anchor": target_anchor}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot) if name in FUNCTIONS else []
