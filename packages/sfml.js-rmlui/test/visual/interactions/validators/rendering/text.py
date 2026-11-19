"""Positive glyph, clipping and hover restoration assertions."""

import math

import numpy as np

from assertions.controls.text_inputs import absolute_input
from ..common import element, same_rect
from .effects import text_decorator as basic_decorator


def crop(image, item, inset=1):
    x, y, width, height = item["rect"]
    return np.asarray(image.crop((math.floor(x) + inset, math.floor(y) + inset,
                                  math.ceil(x + width) - inset,
                                  math.ceil(y + height) - inset)).convert("RGB"))


def layout_equal(before, after):
    assert len(before["elements"]) == len(after["elements"])
    for first, second in zip(before["elements"], after["elements"]):
        assert first["path"] == second["path"]
        same_rect(first, second)
        for field in ("content", "boxes", "baseline", "scroll"):
            assert first[field] == second[field], (first["path"], field)


def solid_glyphs(array, color):
    mask = np.all(array == color, axis=2)
    rows, columns = np.nonzero(mask)
    assert len(columns) > 20, "missing solid decorator glyphs"
    return mask[rows.min():rows.max() + 1, columns.min():columns.max() + 1]


def decorators(frames, images):
    result = basic_decorator(frames, images)
    for index, state in enumerate(("color", "opacity", "italic", "bold", "spacing", "font", "size")):
        path = f"0/9/{index}"
        base = crop(images["base"], element(frames["base"], path), 11)
        changed = crop(images[state], element(frames[state], path), 11)
        restored = crop(images[f"{state}-restored"], element(frames[f"{state}-restored"], path), 11)
        assert np.count_nonzero(np.any(base < 150, axis=2)) > 100
        assert not np.array_equal(base, changed), state
        assert np.array_equal(base, restored), f"{state}: hover exit did not restore glyphs"
        layout_equal(frames["base"], frames[state])
        # The later group.hover rule has equal specificity and retains earth
        # text; only inherited font/color/opacity properties change here.
        if state == "color":
            assert np.array_equal(solid_glyphs(base, (51, 51, 51)),
                                  solid_glyphs(changed, (255, 0, 0)))
        elif state == "opacity":
            assert np.any(np.all(np.abs(changed.astype(int) - (136, 136, 136)) <= 1, axis=2))
        else:
            assert np.count_nonzero(np.all(changed < 150, axis=2)) > 100, state
            assert not np.array_equal(solid_glyphs(base, (51, 51, 51)),
                                      solid_glyphs(changed, (51, 51, 51))), state
    return result + ["all seven inherited color/opacity/italic/bold/spacing/debugger-font/size hover variants paint real glyphs",
                     "every exit restores exact original pixels and every hover preserves all layout boxes"]


def input_clipping(frames, images):
    for state, frame in frames.items():
        absolute_input(frame, images[state])
        same_rect(element(frames["base"], "0/0"), element(frame, "0/0"))
    target = element(frames["hover-clipped"], "0/3")
    assert target["pseudo"]["hover"]
    assert not element(frames["restored"], "0/3")["pseudo"]["hover"]
    return ["hover enables ancestor overflow clipping while the absolute input retains every required glyph",
            "all three states keep text within 240×17dp content and leave the right exterior blank"]


def ellipsis(frames, images):
    failures = []
    if not np.array_equal(np.asarray(images["base"]),
                          np.asarray(images["initial-repeat"])):
        failures.append("second render changes initial text without any input or elapsed time")
    for index, path in enumerate(("0/0/1", "0/0/3", "0/0/4")):
        state = f"line-{index}"
        before = crop(images["base"], element(frames["base"], path))
        after = crop(images[state], element(frames[state], path))
        restored = crop(images[f"{state}-restored"], element(frames[f"{state}-restored"], path))
        assert element(frames[state], path)["pseudo"]["hover"]
        layout_equal(frames["base"], frames[state])
        assert np.count_nonzero(np.all(after < 110, axis=2)) > 100
        if not np.array_equal(before, restored):
            failures.append(f"{state}: hover exit did not restore text pixels")
        assert np.array_equal(before, after) if index == 0 else not np.array_equal(before, after)
    for index in range(10):
        state, path = f"narrow-{index}", f"0/3/{index}"
        layout_equal(frames["base"], frames[state])
        before = crop(images["base"], element(frames["base"], path))
        after = crop(images[state], element(frames[state], path))
        assert element(frames[state], path)["pseudo"]["hover"]
        assert np.array_equal(before, after) if index >= 4 else not np.array_equal(before, after)
    path = "0/6/0"
    before = crop(images["base"], element(frames["base"], path))
    after = crop(images["scroller-hover"], element(frames["scroller-hover"], path))
    assert np.array_equal(before, after), "scroller hover must retain ellipsis"
    assert element(frames["scroller-end"], path)["scrollOffset"][0] > 500
    layout_equal(frames["break-base"], frames["break-hover"])
    assert np.array_equal(np.asarray(images["break-base"]), np.asarray(images["break-hover"]))
    assert not failures, "; ".join(failures)
    return ["hover removes eligible ellipses without changing any layout box; narrowing clips first glyph",
            "hover exit restores text; scrolling container retains ellipsis; break-word hover leaves paint unchanged"]


def custom(frames, images):
    for index in range(1, 9):
        state, path = f"custom-{index}", f"0/1/{index}"
        layout_equal(frames["base"], frames[state])
        before = crop(images["base"], element(frames["base"], path))
        after = crop(images[state], element(frames[state], path))
        restored = crop(images[f"{state}-restored"], element(frames[f"{state}-restored"], path))
        assert element(frames[state], path)["pseudo"]["hover"]
        assert np.count_nonzero(np.all(after < 110, axis=2)) > 100
        assert not np.array_equal(before, after), state
        assert np.array_equal(before, restored), state
    return ["all eight empty/dot/bullet/emoji/custom-string markers change real text paint on hover",
            "every box and inline layout stays fixed; every exit restores exact original marker glyphs"]


FUNCTIONS = {
    "text_decorator": decorators, "text_overflow_01": ellipsis, "text_overflow_02": custom,
    "issue_143_overflow_in_absolutely_positioned_input": input_clipping,
}
