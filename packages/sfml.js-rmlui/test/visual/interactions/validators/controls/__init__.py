"""Form forwarding and spatial keyboard navigation contracts."""

from .forms import FUNCTIONS as FORMS
from .spatial import FUNCTIONS as SPATIAL

FUNCTIONS = FORMS | SPATIAL
