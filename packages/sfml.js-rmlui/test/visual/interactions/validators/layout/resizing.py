"""Original handle anchoring, flex shorthand and inline split requirements."""

import math

import numpy as np

from ..common import close, delta, element, same_rect


def anchors(frames, images):
    wide = frames["parent-wide"]
    delta(element(frames["base"], "0"), element(wide, "0"), (0, 0, 400, 0))
    delta(element(frames["base"], "0/1"), element(wide, "0/1"), (0, 0, 0, 0))
    delta(element(frames["base"], "0/3"), element(wide, "0/3"), (400, 0, 0, 0))
    # The all-sides box starts below its 100dp min-width; widening by 400dp
    # releases that minimum and yields the original opposing anchors.
    close(element(wide, "0/2")["rect"][2], 744 - 10 - 250 * 2 - 20 * 2)
    previous = wide
    for index in (1, 2, 3):
        path = f"0/{index}"
        moved = frames[f"target-{index}-moved"]
        resized = frames[f"target-{index}-resized"]
        delta(element(previous, path), element(moved, path), (20, 15, 0, 0))
        delta(element(moved, path), element(resized, path), (0, 0, 25, 20))
        previous = resized
    small = frames["parent-smaller"]
    delta(element(previous, "0"), element(small, "0"), (0, 0, -50, -40))
    delta(element(previous, "0/1"), element(small, "0/1"), (0, 0, 0, 0))
    delta(element(previous, "0/2"), element(small, "0/2"), (0, 0, -50, -40))
    delta(element(previous, "0/3"), element(small, "0/3"), (-50, -40, 0, 0))
    for index in (1, 2, 3):
        for side in ("min", "max"):
            frame = frames[f"target-{index}-edge-{side}"]
            parent, target = element(frame, "0"), element(frame, f"0/{index}")
            width, height = target["rect"][2:]
            margin_x = math.floor(-width / 2 + .5) if index == 1 else 50 if index == 2 else 0
            margin_y = math.floor(-height / 2 + .5) if index == 1 else 50 if index == 2 else 0
            origin_x, origin_y = parent["rect"][0] + 5, parent["rect"][1] + 5
            expected_x = origin_x + margin_x
            expected_y = origin_y + margin_y
            if side == "max":
                expected_x = origin_x + parent["scroll"][0] - width - margin_x
                expected_y = origin_y + parent["scroll"][1] - height - margin_y
            close(target["rect"][0], expected_x)
            close(target["rect"][1], expected_y)
    return ["move/resize preserve top-left, all-sides and bottom-right anchoring through parent resize",
            "extreme drags stop at literal -50%, 50dp and zero edge margins"]


def flex(frames, images):
    for state, width in (("wide", 700), ("narrow", 200), ("restored", 500)):
        close(element(frames[state], "0")["rect"][2], width)
    paths = tuple(f"0/{group}/{row}" for group in (1, 3, 5, 7) for row in (1, 3))
    for path in paths:
        same_rect(element(frames["base"], path), element(frames["restored"], path))
    # Compare the nowrap rows so wrapping does not mask the flex factors.
    for index in range(3):
        default = f"0/1/3/{index}"
        fixed = f"0/5/3/{index}"
        automatic = f"0/3/3/{index}"
        close(element(frames["base"], default)["rect"][2],
              element(frames["wide"], default)["rect"][2])
        for state in ("wide", "narrow"):
            close(element(frames["base"], fixed)["rect"][2],
                  element(frames[state], fixed)["rect"][2])
        assert element(frames["narrow"], default)["rect"][2] < element(frames["base"], default)["rect"][2]
        assert element(frames["wide"], automatic)["rect"][2] > element(frames["base"], automatic)["rect"][2]
        assert element(frames["narrow"], automatic)["rect"][2] < element(frames["base"], automatic)["rect"][2]
    for state in ("base", "wide", "narrow"):
        children = [element(frames[state], f"0/7/3/{index}") for index in range(3)]
        for child in children[1:]:
            close(child["rect"][2], children[0]["rect"][2])
        close(sum(child["rect"][2] for child in children), element(frames[state], "0/7/3")["content"][0])
    return ["real document handle resizes 500→700→200→500dp",
            "default only shrinks; auto grows/shrinks; none keeps widths; numeric flex shares space equally"]


def inline(frames, images):
    span = "0/0/1"
    for state, width, count in (("base", 320, 1), ("split", 180, 2), ("wide", 380, 1), ("restored", 320, 1)):
        frame = frames[state]
        close(element(frame, "0")["rect"][2], width)
        boxes = element(frame, span)["boxes"]
        assert len(boxes) == count
        assert all(box[2] > 0 and box[3] > 0 for box in boxes)
        if state == "split":
            assert boxes[1][1] > boxes[0][1]
            assert boxes[1][0] < boxes[0][0]
        pixels = np.asarray(images[state].convert("RGB"))
        red = (pixels[:, :, 0] > 200) & (pixels[:, :, 1] < 80) & (pixels[:, :, 2] < 80)
        yellow = (pixels[:, :, 0] > 200) & (pixels[:, :, 1] > 200) & (pixels[:, :, 2] < 80)
        assert np.count_nonzero(red) > 40 and np.count_nonzero(yellow) > 500
    same_rect(element(frames["base"], span), element(frames["restored"], span))
    assert element(frames["base"], span)["boxes"] == element(frames["restored"], span)["boxes"]
    return ["handle narrowing splits the decorated inline span into two positioned boxes",
            "widening joins the span; original size restores exact boxes and retains red glyphs/yellow borders"]


FUNCTIONS = {"handle_target_anchor": anchors, "flex_04": flex,
             "inline_formatting_03": inline}
