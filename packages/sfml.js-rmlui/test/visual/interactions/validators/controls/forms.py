"""Label forwarding, responsive menus and spatial keyboard navigation."""

from ..common import element, identified, tagged


def labels(frames, images):
    assert identified(frames["label-hover"], "pasta")["pseudo"]["hover"]
    assert identified(frames["label-active"], "pasta")["pseudo"]["active"]
    assert identified(frames["pasta-checked"], "pasta")["pseudo"]["checked"]
    assert not identified(frames["pasta-unchecked"], "pasta")["pseudo"]["checked"]
    assert "input#name" in frames["name-focused"]["focus"]
    assert identified(frames["submit-active"], "submit")["pseudo"]["active"]
    assert "button#submit" in frames["submit-focused"]["focus"]
    return ["external label forwards hover/active and toggles checkbox twice",
            "text label focuses input; distant button label forwards active and click focus"]


def menu(frames, images):
    assert not tagged(frames["collapsed"], "items")[0]["visible"]
    opened = frames["menu-open"]
    assert "menu" in opened["focus"]
    assert tagged(opened, "items")[0]["visible"]
    items = tagged(opened, "item")
    assert len(items) == 4
    assert len({item["rect"][0] for item in items}) == 1
    assert items[0]["rect"][1] < items[-1]["rect"][1]
    expanded = frames["expanded"]
    assert tagged(expanded, "items")[0]["visible"]
    items = tagged(expanded, "item")
    assert len({item["rect"][1] for item in items}) == 1
    assert items[0]["rect"][0] < items[-1]["rect"][0]
    assert frames["collapsed"]["dimensions"][0] == 999
    assert expanded["dimensions"][0] == 1000
    return ["999dp collapses menu; click reveals four stacked items; 1000dp restores horizontal row"]


def navigation(frames, images):
    assert "div#left-top" in frames["left-entered"]["focus"]
    assert "div#top." in frames["left-exited"]["focus"]
    assert element(frames["right-skipped"], "0/2/2")["pseudo"]["focus"]
    assert "column.right" not in frames["right-skipped"]["focus"]
    assert "div#left-bottom-a" in frames["left-bottom-entered"]["focus"]
    assert element(frames["left-bottom-entered"], "0/4/0")["scrollOffset"][1] > 0
    return ["manual down/up enters/exits left scroller, automatic up skips right scroller",
            "bottom override enters offscreen left item and scrolls it into view"]


FUNCTIONS = {
    "element_label": labels, "media_query_01": menu, "navigation_02": navigation,
}
