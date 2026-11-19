"""Auxiliary inline boxes, broken borders and anonymous block placement."""

from ...common import children, classified, close, dimensions, identified, tagged


def block_inside(snapshot):
    wrapper = identified(snapshot, "wrap")
    a = identified(snapshot, "a")
    b = identified(snapshot, "b")
    block = identified(snapshot, "block")
    assert len(wrapper["boxes"]) == len(a["boxes"]) == 2
    assert len(b["boxes"]) == len(block["boxes"]) == 1
    dimensions(block, 484, 16.8)
    close(b["rect"][1], block["rect"][1] + block["rect"][3])
    for item in (wrapper, a):
        close(item["boxes"][0][2], 0)
        close(item["boxes"][1][1], 16.8)
    return ["both inline ancestors split around the full-width block; Z starts on the next line"]


def narrow(snapshot):
    dimensions(snapshot["elements"][0], 70, 728)
    span = tagged(snapshot, "span")[0]
    assert len(span["boxes"]) == 3
    for index, box in enumerate(span["boxes"]):
        close(box[1], index * 16.8)
        close(box[3], 16.8 + 18)
        close(box[5], 16.8)
    close(span["boxes"][0][2] - span["boxes"][0][4], 9)
    close(span["boxes"][1][2] - span["boxes"][1][4], 0)
    close(span["boxes"][2][2] - span["boxes"][2][4], 9)
    assert span["boxes"][1][0] == span["boxes"][2][0] == -50
    return ["three wrapped line fragments retain only opening/closing horizontal border and padding"]


def wide_margin(snapshot):
    close(snapshot["elements"][0]["content"][0], 280)
    paragraph = classified(snapshot, "paragraph")[0]
    close(paragraph["content"][1], 4 * 16.8)
    span = classified(snapshot, "outer")[0]
    assert len(span["boxes"]) == 1
    dimensions(span, 51, 16.8)
    close(span["rect"][2] - span["content"][0], 18)
    close(span["rect"][0], 20 + 89 + 50)
    return ["280px paragraph wraps to four lines while the short span retains 50px margins and 9px edges"]


def split_borders(snapshot):
    wrappers = classified(snapshot, "wrap")
    assert [len(item["boxes"]) for item in wrappers] == [1, 2, 2, 2]
    for item in wrappers:
        for box in item["boxes"]:
            close(box[3], 16.8 + 16)
    for item, lines in zip(wrappers[1:], (2, 1, 1)):
        close(item["boxes"][1][1], lines * 3 * 14)
    inner = classified(snapshot, "inner")
    assert len(inner) == 6
    for item in inner:
        for box in item["boxes"]:
            close(box[3], 16.8 + 10)
        if len(item["boxes"]) == 2:
            close(item["boxes"][0][2] - item["boxes"][0][4], 30)
            close(item["boxes"][1][2] - item["boxes"][1][4], 30)
    return ["nested inline borders split at block/break boundaries using exact 42/84px line offsets"]


FUNCTIONS = {"display_block_inside_inline": block_inside, "inline_formatting_02": narrow,
             "inline_formatting_03": wide_margin, "inline_formatting_04": split_borders}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot) if name in FUNCTIONS else []
