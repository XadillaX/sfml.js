"""Arrow and tab inputs on the original navigation target geometry."""

from ..common import element
from assertions.common import pixel


def navigation(frames, images):
    assert element(frames["enabled"], "0/0")["pseudo"]["focus"]
    expected = {
        "first": "0/2/0", "right": "0/2/1", "below": "0/2/7",
        "left": "0/2/6", "above": "0/2/0", "tab-next": "0/2/1",
        "offscreen-focused": "0/14/0/0", "offscreen-below": "0/14/0/2",
    }
    for state, path in expected.items():
        frame = frames[state]
        target = element(frame, path)
        assert target["pseudo"]["focus"], (state, path)
        # Focus propagates to ancestors; require precisely one focused box.
        boxes = [item for item in frame["elements"]
                 if "box" in item["classes"].split() and item["pseudo"]["focus"]]
        assert len(boxes) == 1 and boxes[0]["path"] == path
        if state != "offscreen-focused":
            assert target["pseudo"]["focus-visible"]
            x, y, width, height = target["rect"]
            pixel(images[state], round(x + width / 2),
                  round(y + height / 2), (204, 255, 204))
    assert frames["offscreen-below"]["scrollPosition"][1] > 1000
    target = element(frames["offscreen-below"], "0/14/0/2")
    assert 0 <= target["rect"][1] <= 768 - target["rect"][3]
    return ["click enables navigation; four arrows and Tab select exact grid targets",
            "down from an offscreen wide target selects the next column box and scrolls it into view"]


FUNCTIONS = {"navigation_01": navigation}
