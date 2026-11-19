"""Native inline-block and nested-font baseline relationships."""

from ...common import children, classified, close, descendants, dimensions, tagged


def inline_block(snapshot):
    blocks = classified(snapshot, "iblock")
    assert len(blocks) == 11
    for item in blocks:
        close(item["baseline"], 3.9)
        assert item["content"][0] < snapshot["elements"][0]["content"][0]
    for item, width, height in zip(blocks[:3], (102, 130, 98), (16.8, 33.6, 72.8)):
        dimensions(item, width, height)
    for item in blocks[:4]:
        owner = next(row for row in snapshot["elements"]
                     if row["path"] == item["path"].rsplit("/", 1)[0])
        neighbors = children(snapshot, owner, "#text")
        baseline = item["rect"][1] + item["rect"][3] - item["baseline"]
        for text in neighbors:
            close(text["rect"][1], baseline)
    return ["eleven shrink-to-fit nested inline blocks; last-line baselines align with both adjacent text nodes"]


def nested_font(snapshot):
    wrappers = classified(snapshot, "wrapper")
    assert len(wrappers) == 3
    for index, wrapper in enumerate(wrappers):
        line = children(snapshot, wrapper, "span")[0]
        outer = children(snapshot, line, "span")[0]
        inner = children(snapshot, outer, "span")[0]
        dimensions(line, 139, 16.8)
        dimensions(outer, 112, 36)
        dimensions(inner, 68, 60)
        outer_text = children(snapshot, outer, "#text")
        inner_text = children(snapshot, inner, "#text")
        assert len(outer_text) == len(inner_text) == 2
        for text in outer_text + inner_text:
            close(text["rect"][1], outer_text[0]["rect"][1])
        adjacent = children(snapshot, line, "#text")
        baseline_shift = outer_text[0]["rect"][1] - adjacent[0]["rect"][1]
        close(baseline_shift, (0, 5.5, 15.5)[index])
        sub = children(snapshot, inner, "sub")[0]
        dimensions(sub, 6, 12)
        close(children(snapshot, sub, "#text")[0]["rect"][1]
              - inner_text[0]["rect"][1], 10)
    return ["14/30/50px inline fonts retain baseline/middle/text-top offsets and 10px subscript shift"]


def scroll_baseline(snapshot):
    wrappers = classified(snapshot, "wrapper")
    assert len(wrappers) == 4
    for index, wrapper in enumerate(wrappers):
        blocks = children(snapshot, wrapper, "div")
        neighbors = children(snapshot, wrapper, "#text")
        assert len(blocks) == len(neighbors) == 3
        for block, text in zip(blocks, neighbors):
            dimensions(block, 150, 35)
            close(block["rect"][3], 37)
            close(block["baseline"], 14 if index == 0 else 0)
            glyph = children(snapshot, block, "#text")[0]
            close(text["rect"][1] - glyph["rect"][1], (0, 14, 2, 0)[index])
        spacing = 40.9 if index == 1 else 37
        for before, after in zip(blocks, blocks[1:]):
            close(after["rect"][1] - before["rect"][1], spacing)
    return ["three normal inline baselines; scrolling bottom-edge baseline and exact -12px/center correction"]


FUNCTIONS = {"inline_block": inline_block, "inline_formatting_05": nested_font,
             "inline_formatting_06": scroll_baseline}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot) if name in FUNCTIONS else []
