"""Live container handles, scroll retention, flex transitions and table sizing."""

from ..common import close, delta, element, same_rect, tagged


def handles(frames, images):
    base = frames["base"]
    moving = frames["document-moving"]
    resized = frames["document-resizing"]
    delta(element(base, "0"), element(moving, "0"), (30, 20, 0, 0))
    delta(element(moving, "0"), element(resized, "0"), (0, 0, 40, 30))
    # Auto horizontal margins respond to the parent's resize before the block
    # handle is used. RmlUi rounds its -20px drag to -19.5px in this fixture.
    block = frames["block-moving"]
    delta(element(resized, "0/1"), element(block, "0/1"), (-19.5, 15, 0, 0))
    delta(element(block, "0/1"), element(frames["block-resizing"], "0/1"),
          (0, 0, 25, 20))
    return ["document handle moves 30/20px and grows 40/30px",
            "block handle retains anchors, moves with fractional rounding and grows 25/20px"]


def scrollbar_resets(frames, images):
    paths = ("0/0/0/0", "0/0/1/0")
    for path in paths:
        before = element(frames["bottom"], path)
        assert before["scrollOffset"][1] > 0
        for state in ("button-hover", "button-out"):
            assert element(frames[state], path)["scrollOffset"] == before["scrollOffset"]
    before = element(frames["bottom"], "0/1")
    hovered = element(frames["button-hover"], "0/1")
    close(hovered["rect"][3] - before["rect"][3], 20)
    return ["both tabset/flex lists reach bottom; hover changes button padding without resetting either offset"]


def static_absolute(frames, images):
    before = element(frames["base"], "0/0/1/1")
    for name in ("wheel-scrolled", "article-bottom"):
        frame = frames[name]
        assert element(frame, "0/0/1")["scrollOffset"][1] > 0
        same_rect(before, element(frame, "0/0/1/1"))
    return ["wheel and direct scroll move article; absolute box remains fixed to wrapper"]


def flex_transition(frames, images):
    grown = tagged(frames["first-grown"], "article")
    assert len(grown) == 3
    # flex-basis is zero. Subtract 20dp padding before comparing grow factors.
    close((grown[0]["rect"][2] - 20) / (grown[1]["rect"][2] - 20), 1.2)
    close(grown[1]["rect"][2], grown[2]["rect"][2])
    for base, restored in zip(tagged(frames["base"], "article"),
                              tagged(frames["equal-again"], "article")):
        same_rect(base, restored)
    return ["0.3s hover reaches 1.2:1:1 flex-grow; mouse exit restores all three rectangles"]


def table_height(frames, images):
    a = tagged(frames["small"], "tr")
    b = tagged(frames["smaller"], "tr")
    assert len(a) == len(b) == 3
    for row in a[1:] + b[1:]:
        close(row["rect"][3], 60)
    close(tagged(frames["small"], "table")[0]["rect"][3],
          tagged(frames["smaller"], "table")[0]["rect"][3])
    for name in ("large", "larger"):
        rows = tagged(frames[name], "tr")
        for row, limit in zip(rows, (120, 240, 120)):
            close(row["rect"][3], limit)
    close(tagged(frames["larger"], "table")[0]["rect"][3] -
          tagged(frames["large"], "table")[0]["rect"][3], 100)
    return ["downsizing reaches 60dp minima without reducing table height",
            "upsizing reaches 120/240/120dp maxima and leaves 100dp extra empty space"]


def scrollbar_axes(frames, images):
    items = [item for item in frames["scrollbar-axes"]["elements"]
             if "scroller" in item["classes"].split()]
    expected = ((False, False), (False, False), (True, True), (True, True),
                (True, False), (False, True), (True, False))
    assert len(items) == 14
    for start in (0, 7):
        for item, axes in zip(items[start:start + 7], expected):
            assert tuple(size > 0 for size in item["scrollbars"]) == axes
    return ["all 14 block/flex overflow declarations expose precisely the specified scrollbar axes"]


FUNCTIONS = {
    "document_position": handles, "issue_452_scrollbar_resets": scrollbar_resets,
    "position_absolute_static_position": static_absolute, "flex_01": flex_transition,
    "table_04": table_height, "scrollable_overflow_values": scrollbar_axes,
}
