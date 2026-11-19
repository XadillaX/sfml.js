"""Navigation targets and paired scroll-container geometry in unchanged pages."""

from ..common import children, classified, close, dimensions
from ..rendering.sampling import rgb


def run(name, snapshot, samples):
    if name not in ("navigation_01", "navigation_02"):
        return []
    boxes = classified(snapshot, "box")
    assert len(boxes) == (77 if name == "navigation_01" else 31), len(boxes)
    for box in boxes:
        classes = box["classes"].split()
        width = 190 if "w3" in classes else 120 if "w2" in classes else 50
        dimensions(box, width - 10, 40)
        close(box["rect"][2], width)
        close(box["rect"][3], 50)
    columns = classified(snapshot, "column")
    assert len(columns) == (4 if name == "navigation_01" else 2)
    for left, right in zip(columns[::2], columns[1::2]):
        close(left["rect"][2], right["rect"][2])
        close(right["rect"][0] - left["rect"][0], left["rect"][2])
        left_boxes = children(snapshot, left, "div")
        right_boxes = children(snapshot, right, "div")
        assert len(left_boxes) == len(right_boxes)
        for first, second in zip(left_boxes, right_boxes):
            close(first["rect"][1], second["rect"][1])
            close(first["rect"][2], second["rect"][2])
        if name == "navigation_02":
            close(left["content"][1], 300)
            close(right["content"][1], 300)
            assert left["scroll"][1] > 500 and right["scroll"][1] > 500
            assert left["scrollbars"] == right["scrollbars"] == [0, 16]
    for box in boxes[:5]:
        rgb(samples.sample(box, .5, .5), (170, 238, 170))
        rgb(samples.sample(box, .02, .5), (153, 153, 153))
    return ["all navigation targets preserve declared border-box widths and 50dp height; "
            "paired columns retain identical target geometry and scroll boundaries"]
