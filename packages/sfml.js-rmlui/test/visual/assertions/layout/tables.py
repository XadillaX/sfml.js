"""Column, row, span and inline-table assertions derived from original fixtures."""

from ..common import (
    bottom, children, classified, close, descendants, right, tagged,
)


def basic(snapshot):
    table = tagged(snapshot, "table")[0]
    rows = tagged(snapshot, "tr")
    assert len(rows) == 4
    close(table["rect"][2], 400)
    close(table["rect"][0] + 200, tagged(snapshot, "body")[0]["rect"][2] / 2)
    cells = [children(snapshot, row, "td") for row in rows]
    assert list(map(len, cells)) == [3, 4, 4, 1]
    unit = cells[1][0]["rect"][2]
    close(unit * 4 + 3, table["content"][0])
    close(cells[0][1]["rect"][2], unit * 2)
    close(cells[3][0]["rect"][2], table["content"][0])
    close(cells[3][0]["rect"][3], 20)
    for first, second in zip(cells[1], cells[2]):
        close(first["rect"][0], second["rect"][0])
        close(first["rect"][2], second["rect"][2])
    return ["400dp centered table, four aligned columns, 2/4-column spans and 20dp footer"]


def columns(snapshot):
    tables = tagged(snapshot, "table")
    assert len(tables) == 5
    first = descendants(snapshot, tables[0], "td")
    assert len(first) == 5
    for table in tables[:4]:
        close(table["rect"][2], tables[0]["rect"][2])
        close(table["rect"][3], tables[0]["rect"][3])
        cells = descendants(snapshot, table, "td")
        assert len(cells) == 5
        close(cells[0]["rect"][2], 50)
        close(cells[-1]["rect"][2], 50)
        for a, b in zip(first, cells):
            close(a["rect"][0], b["rect"][0])
            close(a["rect"][2], b["rect"][2])
        for a, b in zip(cells, cells[1:]):
            close(b["rect"][0] - right(a), 5)
    reference = classified(snapshot, "color-ref")[0]
    close(tables[4]["rect"][2], reference["rect"][2])
    close(tables[4]["rect"][3], reference["rect"][3])
    cells = descendants(snapshot, tables[4], "td")
    assert len(cells) == 4
    center = tables[4]["rect"][0] + tables[4]["rect"][2] / 2
    for a, b in zip(cells[:2], reversed(cells[2:])):
        close(a["rect"][0] + right(b), center * 2)
    return ["four column declarations yield identical 50dp end columns and 5dp gaps; color table symmetric"]


def features(snapshot):
    rows = tagged(snapshot, "tr")
    assert len(rows) == 4
    cells = [children(snapshot, row, "td") for row in rows]
    assert list(map(len, cells)) == [3, 1, 3, 2]
    # Two-column cells begin in the same column as their underlying singles.
    close(cells[0][1]["rect"][0], cells[1][0]["rect"][0])
    close(right(cells[0][2]), right(cells[1][0]))
    close(cells[2][1]["rect"][0], cells[3][1]["rect"][0])
    close(cells[2][1]["rect"][2], cells[3][1]["rect"][2])
    close(bottom(cells[0][0]), bottom(cells[1][0]))
    close(bottom(cells[2][2]), bottom(cells[3][1]))
    assert cells[2][2]["scroll"][0] > cells[2][2]["content"][0]
    return ["two-row/two-column spans share correct edges; long unbroken cell produces horizontal overflow"]


def row_heights(snapshot):
    rows = tagged(snapshot, "tr")
    assert len(rows) == 3
    close(rows[1]["content"][1], 2 * rows[2]["content"][1])
    first_cell = children(snapshot, rows[0], "td")[1]
    close(rows[0]["content"][1], first_cell["rect"][3])
    for a, b in zip(rows, rows[1:]):
        close(b["rect"][1] - bottom(a), 5)
    assert rows[0]["rect"][3] >= 60
    assert rows[1]["rect"][3] <= 240
    assert rows[2]["rect"][3] <= 120
    return ["initial auto row fits two lines; flexible content heights follow 2:1 and 5dp row gaps"]


def anonymous_rows(snapshot):
    table = tagged(snapshot, "table")[0]
    direct = children(snapshot, table, "td")
    explicit = tagged(snapshot, "tr")
    assert len(direct) == 5 and len(explicit) == 1
    middle = children(snapshot, explicit[0], "td")
    assert len(middle) == 3
    close(direct[0]["rect"][1], direct[1]["rect"][1])
    close(direct[1]["rect"][1], direct[2]["rect"][1])
    assert direct[3]["rect"][1] > middle[0]["rect"][1] > direct[1]["rect"][1]
    close(bottom(direct[0]), bottom(middle[0]))
    close(bottom(middle[2]), bottom(direct[4]))
    close(direct[1]["rect"][2], middle[0]["rect"][2] * 2 + 3)
    close(direct[3]["rect"][2], middle[0]["rect"][2] * 2 + 3)
    return ["unparented cells form two implicit rows around explicit row with preserved spans"]


def inline(snapshot):
    tables = tagged(snapshot, "table")
    assert len(tables) == 4
    for table in tables:
        rows = descendants(snapshot, table, "tr")
        for row in rows:
            cells = children(snapshot, row, "td")
            assert cells
            for index, cell in enumerate(cells):
                close(cell["rect"][2], 40 if index in (0, len(cells) - 1) else 25)
            for a, b in zip(cells, cells[1:]):
                close(b["rect"][0] - right(a), 5)
    close(tables[0]["rect"][1], tables[1]["rect"][1])
    assert tables[1]["rect"][0] > right(tables[0])
    return ["inline tables share a first-row baseline, 40/25dp columns and 5dp column gaps"]


def run(name, snapshot, image):
    functions = {
        "table_01": basic, "table_02": columns, "table_03": features,
        "table_04": row_heights, "table_05": anonymous_rows, "table_inline": inline,
    }
    return functions[name](snapshot) if name in functions else []
