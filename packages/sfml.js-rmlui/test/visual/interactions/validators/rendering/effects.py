"""Independent color, sprite, decorator and clone-drag image assertions."""

import math

import numpy as np

from assertions.common import pixel
from ..common import close, element, same_rect, tagged


def colors(frames, images):
    pixel(images["base"], 242, 78, (255, 0, 0))
    pixel(images["hover-start"], 242, 78, (255, 0, 0))
    # The pinned color interpolation explicitly squares byte channels and
    # square-roots the linear midpoint, truncating to a byte.
    midpoint = int(math.sqrt(0.5) * 255)
    pixel(images["half"], 242, 78, (midpoint, midpoint, 0))
    pixel(images["green"], 242, 78, (0, 255, 0))
    pixel(images["red-again"], 242, 78, (255, 0, 0))
    return ["0.6s transition has correct red start, gamma-2 midpoint, green endpoint and red reversal"]


def red_pixels(image):
    pixels = np.asarray(image.convert("RGB"))
    return np.argwhere(np.all(pixels == (255, 0, 0), axis=2))


def clone_drag(frames, images):
    assert len(red_pixels(images["base"])) == 0
    for side in ("upper", "lower"):
        first = red_pixels(images[f"{side}-clone"])
        moved = red_pixels(images[f"{side}-moved"])
        assert len(first) > 4000 and len(first) == len(moved)
        # Pure red is exclusive to the upstream .item:drag rule. The clone
        # is rendered through the private cursor proxy, outside the DOM.
        assert np.array_equal(moved - first, np.tile((10, 20), (len(first), 1)))
        assert len(red_pixels(images[f"{side}-released"])) == 0
        for path in ("0/0/0", "0/1/0"):
            same_rect(element(frames["base"], path),
                      element(frames[f"{side}-clone"], path))
    return ["both transformed originals remain in place; red clones move exactly 20/10px",
            "both pointer releases remove all clone pixels"]


def sprites(frames, images):
    base = np.asarray(images["base"].convert("RGB"))[8:72, 8:72]
    waves = np.asarray(images["waves"].convert("RGB"))[8:72, 8:72]
    game = np.asarray(images["game"].convert("RGB"))[8:72, 8:72]
    assert not np.array_equal(base, waves)
    assert not np.array_equal(base, game)
    assert not np.array_equal(waves, game)
    dense = frames["high-density"]
    assert dense["density"] == 2
    icon = tagged(dense, "icon")[0]
    image = tagged(dense, "img")[0]
    close(icon["rect"][2], 128)
    close(icon["rect"][3], 128)
    close(image["rect"][2], 64)
    close(image["rect"][3], 64)
    return ["999px/1024px/1300px select three distinct sprites; 2x resolution selects high-density asset"]


def text_decorator(frames, images):
    def content(image):
        return np.asarray(image.convert("RGB"))[40:77, 38:176]
    before = content(images["base"])
    after = content(images["red-heart"])
    assert not np.array_equal(before, after)
    assert np.any(np.all(after == (255, 0, 0), axis=2))
    assert np.array_equal(before, content(images["earth-again"]))
    same_rect(element(frames["base"], "0/1/0"),
              element(frames["red-heart"], "0/1/0"))
    return ["hover substitutes red heart text; exit restores exact earth text pixels without moving box"]


FUNCTIONS = {
    "color_interpolation": colors, "drag": clone_drag,
    "media_query_02": sprites, "text_decorator": text_decorator,
}
