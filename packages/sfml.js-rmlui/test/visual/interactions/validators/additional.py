"""Independent contracts for original resize, move, edit and animation inputs."""

import numpy as np

from .common import close, delta, element, same_rect
from assertions.common import classified, tagged
from assertions.rendering.filters import detail


def restored(frames, images, first, last):
    """A reversible interaction must restore every original element box."""
    before, after = frames[first], frames[last]
    assert len(before["elements"]) == len(after["elements"])
    for a, b in zip(before["elements"], after["elements"]):
        assert a["path"] == b["path"]
        same_rect(a, b)
        assert len(a["boxes"]) == len(b["boxes"])
        for left, right in zip(a["boxes"], b["boxes"]):
            for x, y in zip(left, right):
                close(x, y)
    assert np.array_equal(np.asarray(images[first]), np.asarray(images[last])), (
        first, last, "released interaction did not restore painted pixels")


def resize(frames, images):
    """Check the real handle's width deltas and reversible layout."""
    base = element(frames["base"], "0")
    narrow_change = -30 if frames["base"]["title"] == "Flex 06 - Player list" else -40
    for state, change in (("resize-wide", 40), ("resize-narrow", narrow_change),
                          ("resize-restored", 0)):
        document = element(frames[state], "0")
        close(document["content"][0] - base["content"][0], change)
        assert document["content"][1] > 0
        assert len(frames[state]["elements"]) == len(frames["base"]["elements"])
    assert not np.array_equal(np.asarray(images["base"]),
                              np.asarray(images["resize-wide"]))
    restored(frames, images, "base", "resize-restored")
    return ["original document handle grows/shrinks width inside declared constraints and restores all boxes and pixels"]


def editing(frames, images):
    """Validate GetValue, keyboard focus, insertion and backspace on each field."""
    states = [key for key in frames if key.startswith("input-") and key.endswith("-typed")]
    assert states
    for state in states:
        prefix = state.removesuffix("-typed")
        before, typed, after = (frames[prefix + suffix]
                                for suffix in ("-home", "-typed", "-restored"))
        focused = [item for item in before["elements"]
                   if item["tag"] in ("input", "textarea")
                   and item["pseudo"]["focus"]]
        assert len(focused) == 1
        original = focused[0]
        changed = element(typed, original["path"])
        final = element(after, original["path"])
        assert changed["value"] == " xyz" + original["value"]
        assert final["value"] == original["value"]
        assert changed["pseudo"]["focus"] and final["pseudo"]["focus"]
        same_rect(original, changed)
        same_rect(original, final)
        assert not np.array_equal(np.asarray(images[prefix + "-home"]),
                                  np.asarray(images[state])), "inserted text never paints"
    return [f"{len(states)} original fields receive Home, text and four Backspaces with exact value/focus"]


def fractional(frames, images):
    """Accumulate fractional rows at three density ratios without exposed red."""
    delta(element(frames["base"], "0/1"), element(frames["moved"], "0/1"),
          (20, 15, 0, 0))
    restored(frames, images, "base", "restored")
    restored(frames, images, "base", "zoom-restored")
    for state, density in (("zoom-in", 1.25), ("zoom-out", .75),
                           ("zoom-restored", 1)):
        frame = frames[state]
        assert frame["density"] == density
        handle = element(frame, "0/1")
        spans = tagged(frame, "span")
        if spans:
            assert len(spans) == 100
            close(handle["content"][0], 87 * density)
            close(handle["content"][1], 87 * density)
        else:
            rows = classified(frame, "inner") or tagged(frame, "div")
            assert len(rows) == 34
            for a, b in zip(rows, rows[1:]):
                close(a["rect"][1] + a["rect"][3], b["rect"][1])
            close(sum(item["rect"][3] for item in rows), handle["rect"][3])
        x, y, width, height = handle["rect"]
        array = np.asarray(images[state].convert("RGB"))
        region = array[max(0, int(np.ceil(y))):min(768, int(y + height)),
                       max(0, int(np.ceil(x))):min(1024, int(x + width))]
        assert region.size
        assert not np.any(np.all(region == (255, 0, 0), axis=2)), (
            state, "fractional accumulation exposes red")
    return ["moving and 0.75/1/1.25 density preserve fractional accumulation without red gaps"]


def blur(frames, images):
    """Exercise the two independent handles and the declared blur radius."""
    delta(element(frames["base"], "0/1"),
          element(frames["effect-moved"], "0/1"), (30, 20, 0, 0))
    delta(element(frames["base"], "0/0"),
          element(frames["background-moved"], "0/0"), (20, 15, 0, 0))
    for state in ("effect-restored", "background-restored", "blur-restored"):
        restored(frames, images, "base", state)
    for state in ("effect-moved", "background-moved"):
        assert not np.array_equal(np.asarray(images["base"]), np.asarray(images[state]))
    effect = element(frames["base"], "0/1")
    x, y, width, height = effect["rect"]
    bounds = (int(x + width / 4), int(y + height / 4),
              int(x + 3 * width / 4), int(y + 3 * height / 4))
    soft = np.asarray(images["base"].crop(bounds).convert("RGB"))
    sharp = np.asarray(images["blur-small"].crop(bounds).convert("RGB"))
    assert detail(sharp) > detail(soft), "smaller radius fails to restore atlas detail"
    return ["effect and background handles move independently; reducing blur radius increases visible detail"]


def clip(frames, images):
    """Check nested rounded clips after all three handles move."""
    for first, last, path, expected in (
            ("base", "outer-moved", "0/0/1", (30, 15, 0, 0)),
            ("base", "inner-moved", "0/1/1", (-100, -20, 0, 0)),
            ("inner-moved", "nested-moved", "0/1/1/1", (-20, -15, 0, 0))):
        delta(element(frames[first], path), element(frames[last], path), expected)
    for state in ("outer-restored", "inner-restored"):
        restored(frames, images, "base", state)
    restored(frames, images, "inner-moved", "nested-restored")
    # Colored handle backgrounds may never leak beyond the outer rounded box.
    for state in frames:
        frame, array = frames[state], np.asarray(images[state].convert("RGB"))
        for box in classified(frame, "box"):
            x, y, width, height = map(int, box["rect"])
            region = array[y:y + height, x - 8:x]
            assert not np.any(np.all(region == (255, 211, 79), axis=2))
            region = array[y:y + height, x + width:x + width + 8]
            assert not np.any(np.all(region == (211, 255, 79), axis=2))
    return ["all three nested handles move and restore; rounded outer clips retain colored backgrounds"]


def windows(frames, images):
    """The four transformed windows obey the same move/size/scroll contracts."""
    def constrained(before, after, path, dx, dy, sizing=False):
        parent, target = element(before, "0"), element(before, path)
        changes = []
        for axis, requested in enumerate((dx, dy)):
            start = target["rect"][axis] - parent["rect"][axis]
            available = parent["scroll"][axis] - start - target["rect"][axis + 2]
            minimum = -target["content"][axis] if sizing else -start
            # ElementHandle::Dragstart keeps zero inside the allowed range,
            # even when a target already extends beyond its parent's box.
            changes.append(max(min(0, minimum), min(requested, max(0, available))))
        expected = (0, 0, *changes) if sizing else (*changes, 0, 0)
        delta(target, element(after, path), expected)

    for index in range(4):
        path = f"0/{index}"
        prefix = f"window-{index}"
        initial = frames["base"] if index == 0 else frames[f"window-{index - 1}-scroll-restored"]
        constrained(initial, frames[prefix + "-moved"], path, -20, -15)
        constrained(frames[prefix + "-moved"], frames[prefix + "-restored"],
                    path, 20, 15)
        constrained(frames[prefix + "-restored"], frames[prefix + "-resized"],
                    path, 30, 20, sizing=True)
        constrained(frames[prefix + "-resized"], frames[prefix + "-size-restored"],
                    path, -30, -20, sizing=True)
        scrolled = element(frames[prefix + "-scrolled"], path + "/1")
        assert scrolled["scrollOffset"][1] > 0
        close(scrolled["scrollOffset"][1],
              scrolled["scroll"][1] - scrolled["content"][1])
        restored(frames, images, prefix + "-size-restored", prefix + "-scroll-restored")
    return ["all four transformed windows obey zero edge margins, resize constraints and reversible nested scrolling"]


def button(frames, images):
    """Verify native button pseudo states and animated shader paint."""
    for state, hover, active in (("button-hover", True, False),
                                 ("button-active", True, True),
                                 ("button-released", True, False),
                                 ("button-out", False, False)):
        item = element(frames[state], "0/1/0")
        assert item["pseudo"]["hover"] == hover
        assert item["pseudo"]["active"] == active
        same_rect(element(frames["base"], "0/1/0"), item)
    result = ["original gradient button receives hover, press, release and exit without moving layout"]
    if "spinner-base" in frames:
        assert frames["spinner-base"]["time"] < frames["spinner-advanced"]["time"]
        assert frames["spinner-advanced"]["time"] < frames["spinner-next"]["time"]
        for first, last in (("spinner-base", "spinner-advanced"),
                            ("spinner-advanced", "spinner-next")):
            assert not np.array_equal(np.asarray(images[first]), np.asarray(images[last]))
        result.append("conic spinner changes painted pixels at two later deterministic times")
    return result


def run(frames, images):
    """Reject unknown checkpoint sets instead of counting parity as behavior."""
    result = []
    if "resize-wide" in frames:
        result += resize(frames, images)
    if any(key.startswith("input-") and key.endswith("-typed") for key in frames):
        result += editing(frames, images)
    if "zoom-in" in frames:
        result += fractional(frames, images)
    if "effect-moved" in frames:
        result += blur(frames, images)
    if "outer-moved" in frames:
        result += clip(frames, images)
    if "window-0-moved" in frames:
        result += windows(frames, images)
    if "button-hover" in frames:
        result += button(frames, images)
    if "row-hover" in frames:
        assert element(frames["row-hover"], "0/0/4/0")["pseudo"]["hover"]
        assert not element(frames["row-out"], "0/0/4/0")["pseudo"]["hover"]
        assert not np.array_equal(np.asarray(images["row-hover"]), np.asarray(images["row-out"]))
        result.append("original table row hover changes pixels and exits its pseudo state")
    if "radio-first" in frames:
        first = "0/0/1/0/1/1/0/1"
        second = "0/0/1/0/1/1/1/1"
        assert element(frames["radio-first"], first)["pseudo"]["checked"]
        assert element(frames["radio-second"], first)["pseudo"]["checked"]
        assert element(frames["radio-second"], second)["pseudo"]["checked"]
        result.append("original independently named ACID radio controls both receive mouse selection")
    assert result, "missing behavioral validator for original interactive page"
    return result
