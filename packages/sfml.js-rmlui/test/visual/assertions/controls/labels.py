"""Initial label control dimensions and separated distant-label targets."""

from ..common import classified, close, dimensions, identified, pixel, right, tagged


def run(name, snapshot, image):
    if name != "element_label":
        return []
    boxes = classified(snapshot, "checkbox")
    assert len(boxes) == 5
    for item in boxes:
        dimensions(item, 16 * 1.2, 16 * 1.2)
        x, y, width, height = item["rect"]
        pixel(image, x + width / 2, y + height / 2, (255, 255, 255))
    name_field = identified(snapshot, "name")
    close(name_field["rect"][2], snapshot["elements"][0]["content"][0] / 2)
    submit = identified(snapshot, "submit")
    close(submit["rect"][2], 84)
    close(submit["rect"][3], 16 * 1.2 + 16 + 2)
    floated = classified(snapshot, "float")
    assert len(floated) == 2
    assert right(floated[0]) < floated[1]["rect"][0]
    close(right(floated[1]), 492)
    assert len(tagged(snapshot, "label")) == 9
    return ["five initially unchecked 1.2em checkboxes, half-width input and two separated submit labels"]
