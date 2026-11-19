"""Geometry and pixel primitives shared by independent fixture assertions."""

import math


def close(actual, expected, tolerance=0.01):
    assert abs(actual - expected) <= tolerance, (actual, expected, tolerance)


def tagged(snapshot, tag):
    return [item for item in snapshot["elements"] if item["tag"] == tag]


def classified(snapshot, name):
    return [item for item in snapshot["elements"]
            if name in item["classes"].split()]


def identified(snapshot, name):
    return next(item for item in snapshot["elements"] if item["id"] == name)


def children(snapshot, parent, tag=None):
    prefix = parent["path"] + "/"
    return [item for item in snapshot["elements"]
            if item["path"].startswith(prefix)
            and "/" not in item["path"][len(prefix):]
            and (tag is None or item["tag"] == tag)]


def descendants(snapshot, parent, tag):
    prefix = parent["path"] + "/"
    return [item for item in snapshot["elements"]
            if item["path"].startswith(prefix) and item["tag"] == tag]


def right(item):
    return item["rect"][0] + item["rect"][2]


def bottom(item):
    return item["rect"][1] + item["rect"][3]


def pixel(image, x, y, expected, tolerance=1):
    actual = image.getpixel((math.floor(x), math.floor(y)))[:3]
    assert all(abs(a - b) <= tolerance for a, b in zip(actual, expected)), (
        (x, y), actual, expected)


def dimensions(item, width, height):
    close(item["content"][0], width)
    close(item["content"][1], height)
