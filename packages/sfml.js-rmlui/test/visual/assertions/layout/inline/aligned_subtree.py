"""Aligned subtrees use their own line root, including a two-fragment inline."""

from ...common import bottom, children, classified, close, dimensions, descendants


def run(name, snapshot, image):
    if name != "inline_formatting_aligned_subtree":
        return []
    wrappers = classified(snapshot, "wrapper")
    assert len(wrappers) == 5
    for wrapper in wrappers[:4]:
        dimensions(wrapper, 468, 86)
        tall = next(item for item in descendants(snapshot, wrapper, "span")
                    if "tall" in item["classes"].split())
        dimensions(tall, tall["content"][0], 70)
        close(tall["rect"][1], wrapper["rect"][1] + 8)
    for wrapper in wrappers[:3]:
        top = children(snapshot, wrapper, "span")[0 if wrapper != wrappers[0] else 1]
        close(top["rect"][1], wrapper["rect"][1])
        block = children(snapshot, top, "span")[0]
        close(bottom(block), bottom(wrapper) - 8)
    outer = children(snapshot, wrappers[1], "span")[0]
    nested = descendants(snapshot, outer, "span")[-1]
    close(nested["rect"][1], outer["rect"][1])
    outer = children(snapshot, wrappers[2], "span")[0]
    block = children(snapshot, outer, "span")[0]
    yellow = children(snapshot, block, "span")[0]
    nested = descendants(snapshot, yellow, "span")[-1]
    close(nested["rect"][1], yellow["rect"][1])
    outer = children(snapshot, wrappers[3], "span")[0]
    close(bottom(outer), bottom(wrappers[3]))
    block = children(snapshot, outer, "span")[0]
    close(block["rect"][1] + block["rect"][3] / 2,
          wrappers[3]["rect"][1] + 8 + wrappers[3]["content"][1] / 2)
    nested = descendants(snapshot, block, "span")[-1]
    close(nested["rect"][1] + nested["rect"][3] / 2,
          block["rect"][1] + block["rect"][3] / 2)
    split = children(snapshot, wrappers[4], "span")[0]
    assert len(split["boxes"]) == 2
    first, second = split["boxes"]
    close(first[3], 16.8 + 6)
    close(second[3], first[3])
    close(second[1], 4 * 14)
    close(split["rect"][0] + second[0], wrappers[4]["rect"][0] + 8)
    return ["top/bottom/center subtrees align to their containing line root; "
            "explicit break produces two bordered fragments separated by 4em"]
