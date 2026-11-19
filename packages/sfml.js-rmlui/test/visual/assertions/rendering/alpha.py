"""Alpha compositing, font pass opacity, and decorator alpha masks."""

import numpy as np

from ..common import children, classified, close, tagged
from .sampling import equivalent, rgb


def wheels(name, snapshot, samples):
    containers = classified(snapshot, "container")
    assert len(containers) == 2
    for container in containers:
        pair = children(snapshot, container, "div")
        assert len(pair) == 2
        for wheel in pair:
            close(wheel["rect"][3], 300)
            assert len(children(snapshot, wheel, "div")) == 3
        # These lie within solid discs or their solid overlapping portions.
        points = [(x / pair[0]["rect"][2], y / 300)
                  for x, y in ((100, 50), (245, 50), (175, 235),
                               (165, 90), (140, 170), (225, 175))]
        equivalent(samples, pair, points)
        background = 255 if "white" in container["classes"] else 0
        for x, y, colors in (
                (100, 50, [(255, 255, 0)]),
                (245, 50, [(255, 0, 255)]),
                (175, 235, [(0, 255, 255)]),
                (165, 90, [(255, 255, 0), (255, 0, 255)])):
            result = np.zeros(3)
            alpha = 0
            coverage = .6 if name.endswith("02") else 136 / 255
            for color in colors:
                result = coverage * np.asarray(color) + (1 - coverage) * result
                alpha = coverage + (1 - coverage) * alpha
            if name.endswith("03"):
                result = .5 * (.5 * result + .25 * 255 * alpha)
                alpha *= .5
            result += background * (1 - alpha)
            rgb(samples.sample(pair[0], x / pair[0]["rect"][2], y / 300),
                np.rint(result).astype(int))
    return ["white/black wheel interiors and overlaps agree for both compositing paths",
            "literal 60% disc compositing" if name.endswith("02")
            else "contrast/opacity order preserves the same colors and alpha"]


def opacity(snapshot, samples):
    paragraphs = tagged(snapshot, "p")
    assert len(paragraphs) == 10
    # RmlUi multiplies byte alpha before rendering each font/effect pass.
    for pair, alpha in zip((paragraphs[index:index + 2] for index in range(0, 10, 2)),
                           (255, 63, 0, 68, 17)):
        red = np.rint(alpha + 204 * (1 - alpha / 255)).astype(int)
        low = np.rint(204 * (1 - alpha / 255)).astype(int)
        for item in pair:
            region = samples.region(item)
            if not alpha:
                assert np.all(region == 204), item["classes"]
                continue
            assert np.any(np.all(np.abs(region - (red, low, low)) <= 1, axis=2)), (
                item["classes"], (red, low, low))
            if item is pair[1]:
                # Outline textures overlap the base glyph and adjacent outlines.
                assert np.any(region[:, :, 1] > region[:, :, 2] + 10)
                if alpha < 255:
                    assert region[:, :, 0].max() < 255
                    assert region[:, :, 2].min() > 0
        # An outline-only pixel must carry the very same alpha as the glyph.
        outlined = samples.region(pair[1])
        assert np.any(np.all(np.abs(outlined - (red, low, low)) <= 1, axis=2))
    return ["opaque/25%/zero/byte-alpha/combined opacity on glyphs and red outline passes"]


def masks(snapshot, samples):
    boxes = tagged(snapshot, "div")
    assert len(boxes) == 5
    base, heart, present, radial, horizontal = boxes
    for item in boxes:
        close(item["content"][0], 180)
        close(item["content"][1], 80)
    for item in (heart, present, radial):
        rgb(samples.sample(item, .5, .25), samples.sample(base, .5, .25))
        rgb(samples.sample(item, .95, .5), np.full(3, 221))
    for item in (present, radial):
        rgb(samples.sample(item, .25, .25), np.full(3, 221))
    # At the middle of the box, the horizontal mask is half opaque.
    rgb(samples.sample(horizontal, .5, .25),
        (samples.sample(base, .5, .25) + 221) / 2)
    distances = []
    for u in (.25, .5, .75, .95):
        masked = samples.sample(horizontal, u, .25)
        original = samples.sample(base, u, .25)
        original_distance = np.linalg.norm(original - 221)
        distances.append(np.linalg.norm(masked - 221) / original_distance)
    assert all(left > right for left, right in zip(distances, distances[1:]))
    return ["sprite/image/radial masks retain opaque centers and remove transparent areas",
            "horizontal alpha mask fades monotonically and composites at 50%"]


def run(name, snapshot, samples):
    if name in ("renderer_alpha_blending_02", "renderer_alpha_blending_03"):
        return wheels(name, snapshot, samples)
    functions = {"opacity": opacity, "mask_image": masks}
    return functions[name](snapshot, samples) if name in functions else []
