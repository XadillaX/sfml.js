"""Backdrop, mask, shadow and blur content assertions from original fixtures."""

from pathlib import Path

import numpy as np
from PIL import Image

from ..common import children, classified, close, dimensions, pixel
from .sampling import rgb


def sepia(color):
    matrix = np.array([[.393, .769, .189], [.349, .686, .168], [.272, .534, .131]])
    return np.rint(np.clip(matrix @ np.asarray(color), 0, 255)).astype(int)


def with_backdrop(snapshot, samples):
    rows = classified(snapshot, "container")
    assert len(rows) == 6
    gray, green, red = (204, 204, 204), (0, 128, 0), (255, 0, 0)
    expected_rows = (
        (gray, gray, sepia(gray), sepia(gray)),
        (green, green, green, sepia(green)),
        (green, green, sepia(green), sepia(green)),
        (green, sepia(green), green, sepia(green)),
        (sepia(red), sepia(red), sepia(red), sepia(red)),
        (red, red, sepia(red), sepia(red)),
    )
    for index, (row, colors) in enumerate(zip(rows, expected_rows)):
        boxes = children(snapshot, row, "div")
        assert len(boxes) == (4 if index < 3 else 8)
        foreground = boxes if index < 3 else boxes[1::2]
        for item, expected in zip(foreground, colors):
            dimensions(item, 100, 100)
            rgb(samples.sample(item, .5, .5), expected)
            if "mask-image" in item["classes"]:
                edge = samples.sample(item, .05, .05)
                assert not np.array_equal(edge, expected), "mask no longer fades its corner"
    return ["all 24 foreground centers obey six declared backdrop/filter/mask combinations",
            "sepia matrix applies to backdrop as well as foreground; all image masks fade corners"]


def shadow_combinations(snapshot, samples):
    boxes = classified(snapshot, "box")
    assert len(boxes) == 8
    for index, item in enumerate(boxes):
        close(item["rect"][2], 200)
        close(item["rect"][3], 70)
        background = 51 if index % 2 == 0 else 204
        rgb(samples.sample(item, .5, .5), (background,) * 3)
        if "boxshadow" in item["classes"]:
            rgb(samples.sample(item, -.1, .3), (95, 95, 231))
            if "filter" not in item["classes"]:
                rgb(samples.sample(item, 1.1, .7), (231, 95, 95))
        if "filter" in item["classes"] and "backdrop" in item["classes"]:
            rgb(samples.sample(item, 1.75, 1.2), (255, 238, 51))
        else:
            rgb(samples.sample(item, 1.75, 1.2), (204, 204, 204))
    return ["all eight inverted/transparent centers and 53% red/blue box-shadow combinations",
            "250/50 yellow drop shadow is present for opaque captured backdrops"]


def detail(array):
    return (np.abs(np.diff(array.astype(float), axis=0)).mean()
            + np.abs(np.diff(array.astype(float), axis=1)).mean())


def blur(name, snapshot, image):
    background = classified(snapshot, "background")[0]
    effect = classified(snapshot, "blur")[0]
    dimensions(background, 512, 512)
    width = 300 if name.endswith("area") else 350
    close(effect["rect"][2], width)
    close(effect["rect"][3], width)
    asset = Path(__file__).resolve().parents[4] / "third_party/rmlui/Samples/assets/invader.tga"
    source = np.asarray(Image.open(asset).convert("RGBA"), dtype=float)
    alpha = source[:, :, 3:4] / 255
    original = source[:, :, :3] * alpha + 204 * (1 - alpha)
    bx, by = map(int, background["rect"][:2])
    actual = np.asarray(image.crop((bx, by, bx + 512, by + 512)).convert("RGB"),
                        dtype=float)
    raw_center, blurred_center = original[131:381, 131:381], actual[131:381, 131:381]
    assert detail(blurred_center) < detail(raw_center) / 10
    assert np.abs(raw_center - blurred_center).mean() > 10
    rgb(actual[20, 20], np.rint(original[20, 20]).astype(int))
    if name.endswith("orb"):
        y, x = np.indices((512, 512))
        ring = ((x - 256) ** 2 + (y - 256) ** 2 > 200 ** 2)
        ring &= ((x - 256) ** 2 + (y - 256) ** 2 < 220 ** 2)
        delta = actual - original
        halo = ring & (delta[:, :, 0] > delta[:, :, 2] + 2)
        halo &= delta[:, :, 1] > delta[:, :, 2] + 2
        assert np.count_nonzero(halo) > 50, "yellow drop-shadow halo is missing"
    return ["declared centered blur dimensions; detail energy falls below one tenth of original atlas",
            "unfiltered outer atlas pixel is intact" if name.endswith("area")
            else "yellow halo survives beyond the rounded backdrop boundary"]


def overflow(snapshot, image):
    parent = classified(snapshot, "parent")[0]
    child = classified(snapshot, "child")[0]
    dimensions(parent, 100, 100)
    dimensions(child, 100, 100)
    close(child["rect"][0] - parent["rect"][0], 210)
    close(child["rect"][1] - parent["rect"][1], 210)
    x, y, _, _ = parent["rect"]
    pixel(image, x + 50, y + 50, (255, 0, 0))
    edge = image.getpixel((int(x - 5), int(y + 50)))[:3]
    assert edge[0] > edge[1] and 0 < edge[1] < 204
    x, y, _, _ = child["rect"]
    pixel(image, x + 50, y + 50, (204, 204, 204))
    return ["red box and blurred outside edge render; original declared missing blue overflow limitation remains"]


def run(name, snapshot, image, samples):
    if name in ("filter_blur_area", "filter_blur_orb"):
        return blur(name, snapshot, image)
    if name == "filter_with_backdrop":
        return with_backdrop(snapshot, samples)
    if name == "filter_backdrop_filter_box_shadow":
        return shadow_combinations(snapshot, samples)
    return overflow(snapshot, image) if name == "filter_overflow" else []
