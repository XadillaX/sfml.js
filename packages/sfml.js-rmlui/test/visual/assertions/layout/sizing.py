"""Content-box and border-box declarations in block, float and fill contexts."""

from ..common import children, classified, close, dimensions, pixel, right


def box_sizing(snapshot, image):
    root = snapshot["elements"][0]
    section = children(snapshot, root, "div")[0]
    content_box, border_box = children(snapshot, section, "div")
    width = section["content"][0] / 2
    close(content_box["content"][0], width)
    close(content_box["rect"][2], width + 60)
    close(border_box["rect"][2], width)
    close(border_box["content"][0], width - 60)
    floats = classified(snapshot, "float")
    assert len(floats) == 5
    close(right(floats[0]), floats[1]["rect"][0])
    close(floats[0]["rect"][1], floats[1]["rect"][1])
    for item in floats[2:]:
        close(item["rect"][2], section["content"][0] * .233)
        close(item["rect"][1], floats[2]["rect"][1])
    fill = classified(snapshot, "fill")[0]
    rows = children(snapshot, fill, "div")
    assert len(rows) == 2
    dimensions(fill, 454, 200)
    close(fill["scroll"][0], fill["content"][0])
    close(fill["scroll"][1], fill["content"][1])
    for row in rows:
        close(row["rect"][2], fill["content"][0])
        close(row["rect"][3], fill["content"][1] / 2)
        x, y, width, height = row["rect"]
        pixel(image, x + width / 2, y + height / 2, (170, 238, 170))
    close(rows[0]["rect"][1] + rows[0]["rect"][3], rows[1]["rect"][1])
    return ["content versus border dimensions, 50%/23.3% adjacent floats and filled no-scrollbar box"]


def run(name, snapshot, image):
    return box_sizing(snapshot, image) if name == "box_sizing" else []
