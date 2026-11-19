"""Handle, inline, flex and scrolling interaction contracts."""

from .containers import FUNCTIONS as CONTAINERS
from .resizing import FUNCTIONS as RESIZING
from .scrolling import FUNCTIONS as SCROLLING

FUNCTIONS = CONTAINERS | RESIZING | SCROLLING
