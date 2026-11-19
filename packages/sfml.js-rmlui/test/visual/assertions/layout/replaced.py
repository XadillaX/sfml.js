"""Intrinsic image ratios and internal replaced-control sizing."""

from ..common import close, dimensions, right, tagged


def replaced_elements(snapshot):
    images = tagged(snapshot, "img")
    assert len(images) == 24
    for group, expected in ((images[:6], (50, 40)), (images[6:12], (25, 20)),
                            (images[12:16], (84, 24)), (images[16:19], (50, 40))):
        for item in group:
            dimensions(item, *expected)
    left, center, rightmost = sorted(images[16:19], key=lambda item: item["rect"][0])
    close(left["rect"][1], center["rect"][1])
    close(center["rect"][1], rightmost["rect"][1])
    close(center["rect"][0] - right(left), rightmost["rect"][0] - right(center))
    for item in images[19:22]:
        close(item["rect"][3], 50)
    for item in images[22:]:
        dimensions(item, 50, 40)
        close(item["rect"][0], images[22]["rect"][0])
    inputs = tagged(snapshot, "input")
    assert len(inputs) == 2
    close(inputs[0]["rect"][3], inputs[1]["rect"][3])
    close(inputs[0]["rect"][1], inputs[1]["rect"][1])
    close(right(inputs[0]), inputs[1]["rect"][0])
    parent = snapshot["elements"][0]
    close(sum(item["rect"][2] for item in inputs), parent["content"][0] - 16)
    return ["all 24 intrinsic/constrained image sizes and ratios, equal gaps, borders and 30/70 inputs"]


def replaced_display(snapshot):
    images = tagged(snapshot, "img")
    assert len(images) == 3
    for item in images:
        dimensions(item, 50, 40)
    progress = tagged(snapshot, "progress")
    areas = tagged(snapshot, "textarea")
    assert len(progress) == len(areas) == 6
    for item in progress:
        dimensions(item, 80, 34)
    for item in areas:
        dimensions(item, 100, 35)
        close(item["rect"][2], 126)
        close(item["rect"][3], 49)
        assert item["scroll"][1] > item["content"][1] + 4
    return ["float/block/flex/table/absolute progress and textarea retain six internal sizes and text overflow"]


FUNCTIONS = {"replaced_elements": replaced_elements, "replaced_display": replaced_display}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot) if name in FUNCTIONS else []
