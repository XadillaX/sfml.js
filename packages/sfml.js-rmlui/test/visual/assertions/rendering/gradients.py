"""Original gradient equivalence, direction, hard stops and alpha contracts."""

import numpy as np

from ..common import children, classified, close
from .sampling import equivalent, rgb


POINTS = ((.25, .25), (.75, .25), (.25, .75), (.75, .75))


def group(snapshot, name):
    parent = classified(snapshot, name)[0]
    return children(snapshot, parent, "div")


def equal_group(snapshot, samples, name, count):
    boxes = group(snapshot, name)
    assert len(boxes) == count
    equivalent(samples, boxes, POINTS)
    return boxes


def linear(snapshot, samples):
    basic = equal_group(snapshot, samples, "yellow_blue", 6)
    equal_group(snapshot, samples, "yellow_blue-angle", 2)
    for item in basic:
        rgb(samples.sample(item, .5, .02), (255, 255, 0))
        rgb(samples.sample(item, .5, .98), (0, 0, 255))
    three = group(snapshot, "three_color")[0]
    start = samples.sample(three, .5, .02)
    assert start[0] >= 250 and start[1] >= 250 and start[2] <= 5
    near_blue = samples.sample(three, .5, .25)
    assert near_blue[2] > 245 and near_blue[0] == 0
    rgb(samples.sample(three, .5, .98), (0, 255, 0))
    corners = group(snapshot, "corner_to_corner")
    assert len(corners) == 8
    # Directions are bottom-left, top-left, top-right and bottom-right.
    red_corners = ((.05, .95), (.05, .05), (.95, .05), (.95, .95))
    for index, item in enumerate(corners):
        u, v = red_corners[index % 4]
        red = samples.sample(item, u, v)
        blue = samples.sample(item, 1 - u, 1 - v)
        assert red[0] == 255 and red[2] < 90
        assert blue[2] == 255 and blue[0] < 90
        if index < 4:
            rgb(samples.sample(item, .5, .5), (255, 255, 255))
        else:
            # A sharp diagonal can cross between center pixel samples.
            assert np.any(np.all(samples.region(item, 2) == 255, axis=2))
    equal_group(snapshot, samples, "premultiplied_alpha", 2)
    stripe = group(snapshot, "multiple_locations_per_color")[0]
    for u in (.45, .5, .55):
        rgb(samples.sample(stripe, u, .5), (255, 255, 255))
    repeating = group(snapshot, "repeating")
    assert len(repeating) == 2
    for v in (.1, .3):
        rgb(samples.sample(repeating[1], .5, v),
            samples.sample(repeating[1], .5, v + .4))
    overlap = group(snapshot, "overlapping_gradients")[0]
    assert samples.sample(overlap, .5, .5)[1] == 0
    assert samples.sample(overlap, .5, .5)[0] < 128
    return ["six equivalent yellow/blue forms and reversed-angle pair",
            "three stops, all eight corner directions, white hard plateau and repeating period",
            "premultiplied transparency equals white interpolation and overlapping alpha darkens"]


def radial(snapshot, samples):
    ellipses = equal_group(snapshot, samples, "ellipse", 3)
    for item in ellipses:
        rgb(samples.sample(item, .5, .5), (255, 255, 0))
        rgb(samples.sample(item, .02, .02), (0, 128, 0))
    circle = group(snapshot, "circle")[0]
    rgb(samples.sample(circle, .5, .5), (255, 255, 0))
    assert not np.array_equal(samples.sample(circle, .5, .1),
                              samples.sample(ellipses[0], .5, .1))
    rgb(samples.sample(group(snapshot, "three_color")[0], .5, .5), (255, 0, 0))
    origin = group(snapshot, "origin_bottom_left")[0]
    red = samples.sample(origin, .02, .98)
    assert red[0] > 245 and red[1] < 15
    rgb(samples.sample(origin, .95, .05), (0, 128, 0))
    for name in ("closest_side_ellipse", "closest_side_circle"):
        boxes = equal_group(snapshot, samples, name, 2)
        for item in boxes:
            rgb(samples.sample(item, .75, .75), (0, 128, 0))
    for name in ("closest_corner_ellipse", "closest_corner_circle"):
        rgb(samples.sample(group(snapshot, name)[0], .75, .75), (0, 128, 0))
    sharp = group(snapshot, "sharp")
    assert len(sharp) == 4
    for item in sharp:
        rgb(samples.sample(item, .5, .5), (255, 0, 0))
    edge = group(snapshot, "problematic")
    assert len(edge) == 6
    for item in edge:
        for u, v in POINTS:
            rgb(samples.sample(item, u, v), (0, 128, 0))
    repeated = group(snapshot, "repeating")
    assert len(repeated) == 8
    for item in repeated:
        colors = [samples.sample(item, u, v) for u, v in POINTS]
        assert len({tuple(color) for color in colors}) > 1
        assert all(color[2] == 0 for color in colors)
    return ["ellipse/circle origins, equivalent explicit radii and corner extents",
            "four sharp centers, eight repeating forms and six green degenerate-radius cases"]


def conic(snapshot, samples):
    basic = equal_group(snapshot, samples, "basic", 8)
    equal_group(snapshot, samples, "position", 4)
    equal_group(snapshot, samples, "angle_outside", 2)
    for item in basic:
        rgb(samples.sample(item, .5, .1), (255, 0, 102))
        # Clockwise direction: gold contribution increases toward the left.
        assert samples.sample(item, .1, .5)[1] > samples.sample(item, .9, .5)[1]
    cones = group(snapshot, "cone")
    assert len(cones) == 2
    for item in cones:
        for u, v in POINTS:
            color = samples.sample(item, u, v)
            assert color[0] == color[1] == color[2]
    wheel, pie, checker = group(snapshot, "color_wheel")
    for item in (wheel, pie, checker):
        close(item["rect"][2], 200)
        close(item["rect"][3], 200)
    rgb(samples.sample(wheel, .5, .5), (255, 255, 255))
    for u, v, color in ((.8, .2, (154, 205, 50)), (.8, .8, (154, 205, 50)),
                        (.2, .8, (255, 215, 0)), (.2, .2, (255, 0, 102))):
        rgb(samples.sample(pie, u, v), color)
    for u, v, color in ((.8, .2, 0), (.8, .8, 255), (.2, .8, 0), (.2, .2, 255)):
        rgb(samples.sample(checker, u, v), (color, color, color))
    repeated = group(snapshot, "repeating")
    assert len(repeated) == 2
    for item in repeated:
        colors = np.unique(samples.region(item, 2).reshape(-1, 3), axis=0)
        assert len(colors) > 1
    spinner_colors = np.unique(samples.region(repeated[1], 2).reshape(-1, 3), axis=0)
    assert len(spinner_colors) == 2
    rgb(spinner_colors[0], (0, 170, 204))
    rgb(spinner_colors[1], (51, 187, 214))
    return ["eight equivalent forms, four origins and equivalent out-of-range angles",
            "clockwise color order, smooth grayscale cones, pie hard stops and checker quadrants",
            "repeating conic colors and translucent spinner sectors at the captured time"]


FUNCTIONS = {"shader_linear_gradient": linear, "shader_radial_gradient": radial,
             "shader_conic_gradient": conic}


def run(name, snapshot, samples):
    return FUNCTIONS[name](snapshot, samples) if name in FUNCTIONS else []
