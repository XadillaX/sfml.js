"""The two original tabset/flex lists' initial clipping and scroll extents."""

from ..common import children, classified, close, pixel, tagged


def run(name, snapshot, image):
    if name != "issue_452_scrollbar_resets":
        return []
    outer = classified(snapshot, "outer")[0]
    close(outer["rect"][3], 200)
    containers = classified(snapshot, "container")
    lists = classified(snapshot, "list")
    assert len(containers) == len(lists) == 2
    for container, item in zip(containers, lists):
        close(container["rect"][2], outer["content"][0] / 2)
        close(item["rect"][3], 200 - 32)
        close(item["scroll"][0], 195)
        close(item["scroll"][1], 6 * (40 + 2 * 14 * .8))
        rows = children(snapshot, item, "div")
        assert len(rows) == 6
        for row in rows:
            close(row["rect"][2], 195)
            close(row["rect"][3], 62.4)
    button = tagged(snapshot, "button")[0]
    close(button["rect"][1], outer["rect"][1] + 200)
    x, y, width, height = button["rect"]
    pixel(image, x + width - 10, y + height / 2, (255, 0, 0))
    return ["two padded 200px flex lists preserve six 62.4px entries and identical overflow extents"]
