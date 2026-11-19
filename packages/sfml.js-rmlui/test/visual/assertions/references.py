"""Feature-scoped policies for references intentionally using different content."""

from .common import children, classified, close, identified, tagged
from .layout import flex, gap, tables


def run(name, actual, reference, actual_image, reference_image):
    if name == "flex_05":
        flex.heights(actual)
        flex.heights(reference)
        a = classified(actual, "flex")
        b = classified(reference, "flex")
        for left, right in zip(a, b):
            for x, y in zip(left["rect"], right["rect"]):
                close(x, y, 0.005)
        return ["12 container border rectangles match within 0.005dp",
                "reference intentionally omits all flex children; only container size is its stated contract"]
    if name == "flex_06":
        flex.player_list(actual)
        flex.player_list(reference)
        a = actual["elements"]
        b = reference["elements"]
        assert len(a) == len(b)
        shift = b[0]["rect"][0] - a[0]["rect"][0]
        close(b[0]["rect"][0], 1024 * 0.55, 0.005)
        for left, right in zip(a, b):
            assert left["path"] == right["path"]
            for index, (x, y) in enumerate(zip(left["rect"], right["rect"])):
                close(y - x, shift if index == 0 else 0, 0.005)
            for field in ("content", "scroll"):
                for x, y in zip(left[field], right[field]):
                    close(x, y, 0.005)
        return ["all DOM boxes and scroll extents equal after exact document left:55% translation",
                "reference uses explicit flex:none/flex:1 to test auto-minimum sizing"]
    if name == "gap-008":
        gap.run(name, actual, actual_image)
        gap.run(name, reference, reference_image)
        sections = [tagged(snapshot, "section")[0] for snapshot in (actual, reference)]
        for x, y in zip(sections[0]["rect"], sections[1]["rect"]):
            close(x, y, 0.005)
        a, b = [children(snapshot, section) for snapshot, section in
                zip((actual, reference), sections)]
        for left, right in zip(a, b):
            for x, y in zip(left["rect"], right["rect"]):
                close(x, y, 0.005)
        return ["section and all four grey rectangles equal; 20/40px green gaps independently checked",
                "explanatory paragraph whitespace differs between unchanged fixtures"]
    if name == "flex_wrap_column_reverse":
        flex.reverse(actual)
        containers = classified(reference, "test")
        assert len(containers) == 3
        for column, sizes in enumerate(((90, 90, 90), (140, 140), (290,)), 1):
            top = containers[column - 1]["rect"][1]
            offset = 10
            for row, height in enumerate(sizes, 1):
                item = identified(reference, f"row{column}-col{row}")
                close(item["content"][1], height)
                close(item["rect"][1], top + offset)
                counterpart = identified(actual, f"col{column}-row{row}")
                close(counterpart["content"][1], item["content"][1])
                # The reference's '*' reset loses to style.rcss 'p' selector:
                # bottom margin is 0.8em = 11.2px; it collapses with next 10px.
                offset += height + max(10, 14 * 0.8)
        return ["both layouts preserve 90/140/290px heights; test gaps 10px, reference gaps 11.2px",
                "reference '*' reset loses to imported p margin:0.8em; test '*, p' reset overrides it"]
    if name == "table_01":
        tables.basic(actual)
        table = tagged(reference, "table")[0]
        close(table["rect"][2], 400)
        rows = tagged(reference, "tr")
        assert len(rows) == 4
        cells = [children(reference, row, "td") for row in rows]
        assert list(map(len, cells)) == [3, 4, 4, 1]
        unit = table["content"][0] / 4
        for row in cells[1:3]:
            for cell in row:
                close(cell["rect"][2], unit)
                close(cell["rect"][3], 47)
        close(cells[0][1]["rect"][2], unit * 2)
        close(cells[-1][0]["rect"][2], unit * 4)
        close(cells[-1][0]["rect"][3], 20)
        return ["both layouts produce centered 400dp tables, four columns, 2/4-column spans and 20dp footers",
                "reference explicitly says row coloring unsupported and not pixel accurate; inline widths include column border"]
    return []
