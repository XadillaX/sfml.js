"""The nine original gap fixtures specify lengths and green gap backgrounds."""

from ..common import children, close, pixel, tagged


def run(name, snapshot, image):
    section = tagged(snapshot, "section")[0]
    items = children(snapshot, section)
    assert len(items) == (3 if name in ("gap-001", "gap-002") else 4)
    expected_x = 14 if name == "gap-009" else 20
    expected_y = 50 if name == "gap-009" else 40 if name == "gap-008" else 20
    observed = 0
    for first in items:
        x, y, width, height = first["rect"]
        for second in items:
            sx, sy, _, _ = second["rect"]
            if abs(sy - y) < 0.01 and sx > x:
                distance = sx - (x + width)
                # Nonadjacent items include the intervening item's width.
                if distance <= expected_x + 1:
                    close(distance, expected_x, 1)
                    pixel(image, x + width + distance / 2,
                          y + height / 2, (0, 128, 0))
                    observed += 1
            if abs(sx - x) < 0.01 and sy > y:
                distance = sy - (y + height)
                if distance <= expected_y + 1:
                    close(distance, expected_y, 1)
                    pixel(image, x + width / 2,
                          y + height + distance / 2, (0, 128, 0))
                    observed += 1
    assert observed >= 2, (name, observed)
    return [f"literal gap dimensions and green gap pixels ({observed} gaps)"]
