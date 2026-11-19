"""Direct-child margins and container padding determine scrollable overflow."""

from ..common import (
    children, classified, close, dimensions, right, tagged,
)


def overflow(snapshot):
    containers = classified(snapshot, "container")
    assert len(containers) == 2
    first, second = containers
    # 600px content + 26px inner edges + 40px margins + 60px padding.
    close(first["scroll"][0], 600 + 26 + 40 + 60)
    innermost = classified(snapshot, "innermost")[0]
    close(second["scroll"][0], right(innermost) - second["rect"][0] - 3)
    last = classified(snapshot, "container_bottom_padding")[0]
    close(last["scroll"][1], 70 + 6 + 15 + 20)
    assert last["scroll"][1] > last["content"][1] + 20
    return ["scroll widths include direct margins/padding but exclude deep margins; trailing margin causes vertical overflow"]


def height_modes(snapshot):
    items = classified(snapshot, "scroller")
    assert len(items) == 12
    for block, flex in zip(items[:6], items[6:]):
        for field in ("content", "scroll"):
            for a, b in zip(block[field], flex[field]):
                close(a, b)
        close(block["rect"][2], flex["rect"][2])
        close(block["rect"][3], flex["rect"][3])
    for item, height in zip(items[:6], (80, 78, 62, 130, 80, 80)):
        close(item["content"][1], height)
    close(items[1]["content"][1] - items[2]["content"][1], 16)
    close(items[5]["scroll"][1], 140 + 2 + 20 + 20)
    return ["all six block/flex sizing modes agree; auto height adds 16dp scrollbar; clamp includes margins/padding"]


def margin_padding(snapshot):
    items = classified(snapshot, "scroller")
    assert len(items) == 18
    expected = (122, 92, 147, 147, 172, 123)
    # Horizontal and vertical permutations differ only in their scroll axis.
    for start, axis in ((0, 1), (6, 0), (12, 1)):
        for item, extent in zip(items[start:start + 6], expected):
            close(item["scroll"][axis], extent)
            dimensions(item, 90, 80)
    return ["18 variants: 122px border, 92px margin-only, 147px one edge, 172px both, 123px deep overflow"]


def overflow_values(snapshot):
    items = classified(snapshot, "scroller")
    assert len(items) == 14
    for item in items:
        dimensions(item, 100, 90)
        close(item["rect"][2], 119)
        close(item["rect"][3], 109)
        close(item["scroll"][0], 130 + 2 + 15 + 15)
        close(item["scroll"][1], 120 + 2 + 15 + 15)
    for block, flex in zip(items[:7], items[7:]):
        assert block["content"] == flex["content"]
        assert block["scroll"] == flex["scroll"]
    # Scrollbar visibility is validated by the live interaction driver, since
    # non-DOM children are deliberately absent from these DOM snapshots.
    return ["14 overflow declarations retain 100x90dp content, 119x109dp border and identical end spacing"]


def run(name, snapshot, image):
    functions = {
        "scrollable_overflow": overflow, "scrollable_overflow_height": height_modes,
        "scrollable_overflow_margin_padding": margin_padding,
        "scrollable_overflow_values": overflow_values,
    }
    return functions[name](snapshot) if name in functions else []
