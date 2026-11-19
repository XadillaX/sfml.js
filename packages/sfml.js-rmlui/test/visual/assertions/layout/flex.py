"""Positive flex layout contracts taken from the original CSS and assertions."""

from ..common import (
    bottom, children, classified, close, dimensions, identified, pixel, right,
    tagged,
)


def basic(snapshot, image):
    section = tagged(snapshot, "section")[0]
    articles = children(snapshot, section, "article")
    assert len(articles) == 3
    expected = (section["content"][0] - 3 * 10) / 3
    for item in articles:
        close(item["rect"][2], expected, 1)
        close(item["rect"][3], section["content"][1])
        close(item["rect"][2] - item["content"][0], 20)
        x, y, _, height = item["rect"]
        pixel(image, x + 2, y + height / 2, (237, 211, 192))
    for left, next_item in zip(articles, articles[1:]):
        close(next_item["rect"][0] - right(left), 10)
    return ["three equally grown articles, 10dp inter-item margins and 10dp padding"]


def directions(snapshot):
    containers = classified(snapshot, "flex-container")
    assert len(containers) == 4
    for container, axis, sign in zip(containers, (0, 0, 1, 1), (1, -1, 1, -1)):
        items = children(snapshot, container, "div")
        assert len(items) == 3
        for item in items:
            dimensions(item, 50, 50)
        for first, second in zip(items, items[1:]):
            close((second["rect"][axis] - first["rect"][axis]) * sign, 90)
    return ["all four flex directions preserve DOM order or reverse it with 40dp gaps"]


def various(snapshot):
    containers = classified(snapshot, "flex-container")
    assert len(containers) == 4
    for item in classified(snapshot, "flex-item"):
        dimensions(item, 50, 50)
    first = children(snapshot, containers[0], "div")
    close(right(first[0]), right(containers[0]))
    close(bottom(containers[0]) - bottom(first[0]), 10)
    close(bottom(containers[0]) - bottom(first[2]), 20)
    second = children(snapshot, containers[1], "div")[1:]
    assert second[0]["rect"][0] > second[1]["rect"][0] > second[2]["rect"][0]
    close(second[1]["rect"][1] - containers[1]["rect"][1], 20)
    last = children(snapshot, containers[3], "div")
    assert last[0]["rect"][1] > last[1]["rect"][1]
    assert last[2]["rect"][0] < last[0]["rect"][0]
    return ["50dp items, absolute right/bottom anchor, auto margins and reverse wrapping"]


def scrolling(snapshot):
    for name, axes in (("scroll", (True, True)), ("auto", (True, True)),
                       ("vertical", (False, True)), ("horizontal", (True, False))):
        item = identified(snapshot, name)
        assert tuple(s > c for s, c in zip(item["scroll"], item["content"])) == axes
    for item in classified(snapshot, "tall"):
        dimensions(item, 15, 80)
    return ["four flex scroll containers overflow on precisely their declared axes"]


def shorthand(snapshot):
    containers = classified(snapshot, "flex")
    assert len(containers) == 8
    default = children(snapshot, containers[1], "div")
    none = children(snapshot, containers[5], "div")
    for first, second in zip(default, none):
        close(first["rect"][2], second["rect"][2])
    assert sum(item["rect"][2] for item in default) < containers[1]["content"][0]
    auto = children(snapshot, containers[3], "div")
    close(sum(item["rect"][2] for item in auto), containers[3]["content"][0], 1)
    for baseline, grown in zip(default, auto):
        assert grown["rect"][2] > baseline["rect"][2]
    # Auto minimum sizes can keep the long word larger than its flex basis.
    numbers = children(snapshot, containers[7], "div")
    close(numbers[0]["rect"][2], numbers[1]["rect"][2], 1)
    assert numbers[2]["rect"][2] >= numbers[1]["rect"][2]
    return ["default/none do not grow, auto fills available width, numeric basis respects minimums"]


def positioned(snapshot, image):
    containers = classified(snapshot, "flex")
    assert len(containers) == 3
    body = tagged(snapshot, "body")[0]
    for container in containers:
        # An absolute child's containing block is its positioned parent's
        # padding box; normal-flow and floated children use the content box.
        basis = body["rect"][2] if container["id"] == "absolute" else body["content"][0]
        close(container["content"][0], basis * 0.4)
        close(container["content"][1], 100)
        items = children(snapshot, container, "div")
        assert len(items) == 3
        for item, fraction, color in zip(
                items, (0.2, 0.6, 0.2),
                ((255, 0, 0), (0, 128, 0), (0, 0, 255))):
            close(item["rect"][2], container["content"][0] * fraction, 1)
            close(item["rect"][3], 100)
            x, y, width, height = item["rect"]
            pixel(image, x + width / 2, y + height / 2, color)
    absolute = identified(snapshot, "absolute")
    close(absolute["rect"][0], body["rect"][0] + 20)
    close(bottom(body) - bottom(absolute), 20)
    close(right(identified(snapshot, "float")), right(body) - 8)
    return ["normal, absolute and floated flexboxes retain 40% width and 20/60/20 shares"]


def inline(snapshot):
    containers = classified(snapshot, "flex")
    assert len(containers) == 4
    for item, width in zip(containers, (170, 115, 70, 170)):
        close(item["content"][0], width)
    first, wrapped, column, _ = [
        children(snapshot, item, "div") for item in containers]
    assert len(first) == len(wrapped) == len(column) == 3
    for item in first + wrapped + column:
        dimensions(item, 35, 30)
    close(first[0]["rect"][1], first[2]["rect"][1])
    close(wrapped[0]["rect"][1], wrapped[1]["rect"][1])
    close(wrapped[2]["rect"][1] - wrapped[0]["rect"][1], 40)
    for a, b in zip(column, column[1:]):
        close(b["rect"][1] - a["rect"][1], 40)
        close(b["rect"][0], a["rect"][0])
    return ["170/115/70dp inline-flex widths, wrapped third item and three-item column"]


def heights(snapshot):
    items = classified(snapshot, "flex")
    assert len(items) == 12
    for item in items:
        close(item["content"][1], 40)
        close(item["rect"][3], 42)
    return ["twelve height/min-height/max-height containers obey 40dp content height"]


def nested(snapshot, image):
    containers = classified(snapshot, "content")
    assert len(containers) == 2
    all_items = []
    for container in containers:
        items = children(snapshot, container)
        assert len(items) == 3
        for item, fraction, color in zip(
                items, (0.2, 0.6, 0.2),
                ((255, 0, 0), (0, 128, 0), (0, 0, 255))):
            x, y, width, height = item["rect"]
            close(width, container["content"][0] * fraction, 1)
            close(height, 128)
            pixel(image, x + width / 2, y + height / 2, color)
        all_items.extend(items)
    for left, next_item in zip(all_items, all_items[1:]):
        close(left["rect"][1], next_item["rect"][1])
        close(right(left), next_item["rect"][0])
    return ["six proportioned red/green/blue items occupy one contiguous line"]


def reverse(snapshot):
    container = identified(snapshot, "test")
    close(container["content"][1], 300)
    for column, sizes in ((1, (90, 90, 90)), (2, (140, 140)), (3, (290,))):
        offset = 10
        for row, height in enumerate(sizes, 1):
            item = identified(snapshot, f"col{column}-row{row}")
            close(item["content"][1], height)
            close(item["rect"][1], container["rect"][1] + offset)
            close(item["rect"][0], container["rect"][0] +
                  (column - 1) * container["content"][0] / 3, 1)
            offset += height + 10
    return ["three reversed columns preserve declared 90/140/290dp heights and 10dp gaps"]


def player_list(snapshot):
    contents = identified(snapshot, "contents")
    header = identified(snapshot, "panel_info")
    players = identified(snapshot, "players")
    footer = identified(snapshot, "footer")
    assert header["rect"][3] > 0 and footer["rect"][3] > 0
    close(players["rect"][1] - bottom(header), 15)
    close(footer["rect"][1] - bottom(players), 15)
    close(bottom(footer), bottom(contents) - 20)
    assert players["scroll"][1] > players["content"][1]
    return ["auto header/footer fit, 15dp list margins and positive list scroll range"]


def shrink_nested(snapshot):
    containers = classified(snapshot, "shrink-to-fit")
    assert len(containers) == 5
    for container in containers[:2]:
        outer = children(snapshot, container, "div")[0]
        inner = children(snapshot, outer, "div")[0]
        close(outer["content"][0], inner["rect"][2])
        close(outer["rect"][2] - outer["content"][0], 62)
        close(inner["rect"][2] - inner["content"][0], 62)
    dimensions(containers[2], 144, 144)
    for container in containers[3:]:
        dimensions(container, 130, 130)
    return ["nested flex widths fit content plus two 30px paddings and 1px borders"]


def shrink_grids(snapshot, image):
    containers = classified(snapshot, "shrink-to-fit")
    assert len(containers) == 2
    for container in containers:
        dimensions(container, 210, 210)
        outer = children(snapshot, container, "div")[0]
        columns = children(snapshot, outer, "div")
        assert len(columns) == 3
        for index, column in enumerate(columns):
            blocks = children(snapshot, column, "div")
            assert len(blocks) == 3
            for row, (block, color) in enumerate(zip(
                    blocks, ((255, 0, 0), (0, 128, 0), (0, 0, 255)))):
                dimensions(block, 50, 50)
                x, y = (index, row) if "row" in outer["classes"] else (row, index)
                close(block["rect"][0], container["rect"][0] + x * 70 + 10)
                close(block["rect"][1], container["rect"][1] + y * 70 + 10)
                pixel(image, block["rect"][0] + 25, block["rect"][1] + 25, color)
    return ["both 3x3 grids shrink to 210px with 50px cells and 10px margins"]


def run(name, snapshot, image):
    functions = {
        "flex_02": various, "flex_03_scroll": scrolling, "flex_04": shorthand,
        "flex_05": heights, "flex_06": player_list, "flex_direction": directions,
        "flex_inline": inline, "flex_shrink_to_fit_01": shrink_nested,
        "flex_wrap_column_reverse": reverse,
    }
    painted = {
        "flex_01": basic, "flex_absolutely_positioned": positioned,
        "flex_nested": nested, "flex_shrink_to_fit_02": shrink_grids,
    }
    if name in painted:
        return painted[name](snapshot, image)
    return functions[name](snapshot) if name in functions else []
