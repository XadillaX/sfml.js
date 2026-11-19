"""Literal image sizing, shadow offset, and premultiplied-alpha assertions."""

from ..common import children, classified, close, pixel, tagged


def image_ratio(snapshot):
    images = tagged(snapshot, "img")
    assert len(images) == 7
    for item, expected in zip(images,
                              [(100, 100), (50, 50), (50, 50), (50, 50),
                               (50, 50), (50, 100), (50, 100)]):
        for actual, value in zip(item["content"], expected):
            close(actual, value)
    return ["all seven attribute/CSS image sizes, including rectangular overrides"]


def drop_shadow(snapshot, image):
    box = classified(snapshot, "dropshadow")[0]
    x, y, width, height = box["rect"]
    close(width, 200)
    close(height, 70)
    pixel(image, x + width / 2, y + height / 2, (255, 255, 255))
    pixel(image, x + width / 2 + 100, y + height / 2 + 100, (255, 238, 51))
    pixel(image, x + width / 2 + 100, y + height / 2 + 80, (255, 238, 51))
    return ["white 200x70dp box and two yellow pixels at the declared 100px shadow offset"]


def alpha_blending(snapshot, image):
    for name, expected in (("white", 255), ("gray", 128), ("black", 0)):
        container = next(item for item in snapshot["elements"]
                         if item["classes"] == name)
        items = children(snapshot, container)
        assert len(items) >= 8
        for item in items:
            x, y, width, height = item["rect"]
            pixel(image, x + width / 2, y + height / 2,
                  (expected, expected, expected))
    return ["all solid/alpha/sprite/filter/gradient cells preserve white, gray and black"]


def run(name, snapshot, image):
    if name == "image_ratio":
        return image_ratio(snapshot)
    functions = {
        "filter_drop_shadow": drop_shadow,
        "renderer_alpha_blending_01": alpha_blending,
    }
    return functions[name](snapshot, image) if name in functions else []
