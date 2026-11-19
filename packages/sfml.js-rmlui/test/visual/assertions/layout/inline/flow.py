"""Mixed inline/block geometry, nested floats, and CSS1 clearance."""

from ...common import bottom, children, classified, close, dimensions, right, tagged


def contexts(snapshot):
    paragraphs = classified(snapshot, "paragraph")
    assert len(paragraphs) == 4
    for item in paragraphs:
        close(item["content"][0], 1020)
    for item in paragraphs[:2]:
        close(item["content"][1], 3 * 16.8)
    expected_widths = (79, 60, 109, 87, 39)
    for index, paragraph in enumerate(paragraphs[1:]):
        inner = [row for row in snapshot["elements"]
                 if row["path"].startswith(paragraph["path"] + "/")
                 and "inner" in row["classes"].split()]
        assert len(inner) == 5
        for item, width in zip(inner, expected_widths):
            dimensions(item, width, 16.8)
            close(item["rect"][2] - width, 14)
            close(item["baseline"], 0 if index == 0 else 15.9)
    assert paragraphs[2]["content"][1] > paragraphs[1]["content"][1]
    assert paragraphs[3]["content"][1] > paragraphs[2]["content"][1]
    return ["all nested spans retain their widths/edges; only inline-blocks add margin-box baseline spacing"]


def floats_in_lines(snapshot):
    big = classified(snapshot, "big")
    small = classified(snapshot, "small")
    lines = classified(snapshot, "lines")
    assert len(big) == len(lines) == 3 and len(small) == 8
    for item, height in zip(big, (190, 190, 140)):
        dimensions(item, 300, height)
    for item in small:
        dimensions(item, 30, 15)
    left_pair = children(snapshot, lines[1], "div")[:2]
    close(left_pair[0]["rect"][0], left_pair[1]["rect"][0])
    close(bottom(left_pair[0]), left_pair[1]["rect"][1])
    for first, second in zip(big, lines):
        close(first["rect"][1], second["rect"][1])
        close(first["rect"][0] + first["rect"][2], right(second))
    tall = classified(snapshot, "tall")[0]
    dimensions(tall, 30, 100)
    assert tall["rect"][1] >= bottom(big[-1])
    return ["three outer floats, eight inline floats, exact clear-left stacking and the final 100px atomic inline box"]


def css_clear(snapshot):
    images = tagged(snapshot, "img")
    paragraphs = tagged(snapshot, "p")
    assert len(images) == 7 and len(paragraphs) == 5
    for item in images:
        dimensions(item, 15, 50)
    assert paragraphs[0]["rect"][1] < bottom(images[0])
    for name, floats in (("one", images[1:2]), ("two", images[2:3]),
                         ("three", images[3:5])):
        paragraph = classified(snapshot, name)[0]
        close(paragraph["rect"][1], max(bottom(item) for item in floats))
    uncleared = classified(snapshot, "four")[0]
    close(uncleared["rect"][1], images[-1]["rect"][1])
    assert uncleared["rect"][1] < bottom(images[-1])
    return ["left/right/both clearance goes below all intended floats; none remains between both rectangles"]


FUNCTIONS = {"inline_formatting_01": contexts, "inline_formatting_07": floats_in_lines,
             "css1_clear": css_clear}


def run(name, snapshot, image):
    return FUNCTIONS[name](snapshot) if name in FUNCTIONS else []
