"""Shared accessors for captured checkpoints of unchanged upstream pages."""

from assertions.common import close, identified, tagged


def element(snapshot, path):
    return next(item for item in snapshot["elements"] if item["path"] == path)


def same_rect(first, second):
    for a, b in zip(first["rect"], second["rect"]):
        close(a, b)


def delta(first, second, expected):
    for a, b, change in zip(first["rect"], second["rect"], expected):
        close(b - a, change)
