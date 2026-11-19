"""ACID1's literal em/percentage dimensions, colors and final float clearance."""

from ..common import bottom, close, dimensions, identified, pixel, tagged


def run(name, snapshot, image):
    if name != "acid1":
        return []
    body = snapshot["elements"][0]
    dimensions(body, 48 * 10, 380)
    dt = tagged(snapshot, "dt")[0]
    dd = tagged(snapshot, "dd")[0]
    dimensions(dt, 470 * .10638, 28 * 10)
    dimensions(dd, 34 * 10, 27 * 10)
    close(dt["rect"][1], dd["rect"][1])
    close(dt["rect"][3], dd["rect"][3])
    lists = tagged(snapshot, "li")
    assert len(lists) == 4
    for item in (lists[0], lists[2]):
        dimensions(item, 50, 90)
        x, y, width, height = item["rect"]
        pixel(image, x + width / 2, y + height - 20, (255, 204, 0))
    bar = identified(snapshot, "bar")
    baz = identified(snapshot, "baz")
    dimensions(bar, 340 * .4117, 90)
    dimensions(baz, 100, 100)
    for item in (bar, baz):
        x, y, width, height = item["rect"]
        pixel(image, x + width / 2, y + height - 10, (0, 0, 0))
    dimensions(tagged(snapshot, "blockquote")[0], 50, 90)
    dimensions(tagged(snapshot, "h1")[0], 100, 100)
    paragraph = next(row for row in tagged(snapshot, "p") if row["path"] == "0/1")
    close(paragraph["rect"][1], max(bottom(dt), bottom(dd)))
    pixel(image, dt["rect"][0] + 30, dt["rect"][1] + 100, (204, 0, 0))
    return ["48em ACID1 box, literal percentage/em float dimensions and yellow/red/black panels",
            "the final paragraph clears both equal-height float columns"]
