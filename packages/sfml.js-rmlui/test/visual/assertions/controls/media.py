"""Expanded menu layout and the initial media-selected sprite's actual pixels."""

from pathlib import Path

import numpy as np
from PIL import Image

from ..common import close, dimensions, pixel, right, tagged


def menu(snapshot, image):
    items = tagged(snapshot, "item")
    assert len(items) == 4
    width = snapshot["elements"][0]["content"][0] / 4
    for item in items:
        close(item["rect"][1], 8)
        close(item["rect"][2], width)
        close(item["rect"][3], 16.8 * 1.2 + 2 * 16.8 + 6)
        x, y, _, height = item["rect"]
        pixel(image, x + width / 2, y + height - 8, (255, 255, 255))
    for first, second in zip(items, items[1:]):
        close(right(first), second["rect"][0])
    return ["four expanded table-menu cells equally fill the available width with one shared border"]


def sprites(snapshot, image):
    icon = tagged(snapshot, "icon")[0]
    sprite = tagged(snapshot, "img")[0]
    dimensions(icon, 64, 64)
    dimensions(sprite, 51, 39)
    x, y, width, height = map(int, sprite["rect"])
    source = Path(__file__).resolve().parents[4] / "third_party/rmlui/Samples/assets/invader.tga"
    rgba = np.asarray(Image.open(source).crop((179, 152, 230, 191)).convert("RGBA"),
                      dtype=float)
    expected = np.rint(rgba[:, :, :3] * rgba[:, :, 3:4] / 255
                      + 221 * (1 - rgba[:, :, 3:4] / 255))
    actual = np.asarray(image.crop((x, y, x + width, y + height)).convert("RGB"))
    assert np.max(np.abs(actual - expected)) <= 1
    return ["at 1024px the full 51x39 invader sprite composites against the original atlas"]


FUNCTIONS = {"media_query_01": menu, "media_query_02": sprites}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot, image) if name in FUNCTIONS else []
