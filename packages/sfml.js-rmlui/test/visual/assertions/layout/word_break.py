"""Normal, break-all and break-word line counts including zero-width boxes."""

from ..common import classified, close


def run(name, snapshot, image):
    if name != "word_break":
        return []
    boxes = classified(snapshot, "box")
    assert len(boxes) == 6
    for item, width, lines in zip(boxes, (60, 60, 60, 0, 0, 0), (5, 5, 6, 2, 5, 5)):
        close(item["content"][0], width)
        close(item["content"][1], lines * 16.8)
    assert boxes[0]["scroll"][0] > 60
    for item in boxes[1:3]:
        close(item["scroll"][0], 60)
    assert boxes[3]["scroll"][0] > boxes[4]["scroll"][0]
    close(boxes[4]["scroll"][0], boxes[5]["scroll"][0])
    return ["six declared widths and literal line counts, long-word wrapping and single-glyph zero-width overflow"]
