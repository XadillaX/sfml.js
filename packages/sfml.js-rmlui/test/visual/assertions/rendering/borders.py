"""Curved border colors and nested clipping contracts from the original pages."""

from ..common import classified, close, pixel


def border_radius(snapshot, image):
    thin, thick, arc = [classified(snapshot, name)[0]
                        for name in ("thin", "thick", "arc")]
    for item, size in ((thin, (225, 155)), (thick, (240, 200)), (arc, (160, 160))):
        close(item["rect"][2], size[0])
        close(item["rect"][3], size[1])
    x, y, width, height = thin["rect"]
    for px, py in ((x + 5, y + 5), (x + width - 5, y + height - 5)):
        pixel(image, px, py, (221, 221, 221))
    x, y, width, height = thick["rect"]
    for px, py, color in (
            (x + width / 2, y + 15, (85, 85, 255)),
            (x + width / 2, y + height - 15, (85, 85, 255)),
            (x + 10, y + height / 2, (170, 255, 170)),
            (x + width - 10, y + height / 2, (255, 85, 119)),
            (x + width / 2, y + height / 2, (195, 195, 195))):
        pixel(image, px, py, color)
    x, y, width, height = arc["rect"]
    pixel(image, x + 5, y + 5, (255, 132, 0))
    pixel(image, x + 10, y + height - 10, (221, 221, 221))
    pixel(image, x + width - 10, y + 10, (221, 221, 221))
    assert classified(snapshot, "split")[0]["content"][1] == 70
    return ["asymmetric border widths and colors, rounded cutouts and two-line inline border"]


def clip_mask(snapshot, image):
    parents = classified(snapshot, "box")
    assert len(parents) == 2
    for parent in parents:
        x, y, width, height = parent["rect"]
        for px, py in ((x + 5, y + 5), (x + width - 5, y + height - 5)):
            pixel(image, px, py, (204, 204, 204))
        pixel(image, x + width - 10, y + height / 2, (85, 85, 255))
    for name in ("B", "C"):
        item = classified(snapshot, name)[0]
        x, y, width, height = item["rect"]
        pixel(image, x + width * .85, y + height / 2, (204, 204, 204))
        pixel(image, x + width * .55, y + height / 2, (85, 85, 255))
    a = classified(snapshot, "A")[0]
    pixel(image, a["rect"][0] + 50, a["rect"][1] + 40, (255, 211, 79))
    return ["curved parent cutouts, intact borders and nested B/C overflow removal"]


FUNCTIONS = {"border_radius": border_radius, "clip_mask": clip_mask}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot, image) if name in FUNCTIONS else []
