"""Inherited letter spacing, normal overrides, negative widths and alignment."""

from ..common import children, classified, close, dimensions, tagged


def run(name, snapshot, image):
    if name != "letter_spacing":
        return []
    normal = classified(snapshot, "normal")
    colored = classified(snapshot, "color")
    assert len(normal) == len(colored) == 8
    for item in normal:
        dimensions(item, 115, 16.8)
    for item, spacing in zip(colored[:6], (0, 1, -1, 5, 5, -5)):
        close(item["content"][0], 93 + 14 * spacing)
    assert len(colored[6]["boxes"]) == 2
    close(colored[6]["boxes"][1][1], 16.8)
    close(colored[7]["content"][0], 0)
    paragraphs = tagged(snapshot, "p")
    assert len(paragraphs) == 12
    for item, fraction in zip(paragraphs[8:11], (0, .5, 1)):
        text = children(snapshot, item, "#text")[0]
        close(text["rect"][0], item["rect"][0] + fraction * (484 - 82))
    inner = children(snapshot, paragraphs[-1], "span")[0]
    dimensions(inner, 16 + 2 * 28, 16.8)
    close(children(snapshot, paragraphs[-1], "#text")[-1]["rect"][0],
          inner["rect"][0] + inner["rect"][2])
    return ["normal overrides and all eight spacing cases including zero clamping and line splits",
            "82px abc aligns left/center/right; nested bb independently uses 2em spacing"]
