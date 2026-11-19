"""Independent effect and text rendering contracts."""

from .effects import FUNCTIONS as EFFECTS
from .text import FUNCTIONS as TEXT

FUNCTIONS = EFFECTS | TEXT
