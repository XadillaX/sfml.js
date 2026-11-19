"""Dispatch page-specific contracts to their layout or rendering subsystem."""

from .layout import flex, floats, fractional, gap, positioning, scrolling, shrink, tables
from .layout import acid, letter_spacing, overflow, replaced, sizing, white_space, word_break
from .layout.inline import aligned_subtree, baselines, flow, splits
from .controls import drag, handles, labels, media, navigation, scroll_lists, text_inputs
from .rendering import alpha, borders, color_interpolation, effects, filters, gradients, ink_bounds
from .rendering import stacking, text_decorators, text_overflow
from .rendering.sampling import Frames


def run(name, snapshot, image, frames=None):
    if name.startswith("gap-"):
        return gap.run(name, snapshot, image)
    if name.startswith("fractional-dimensions-"):
        return fractional.run(name, snapshot, image)
    for module in (flex, floats, tables, positioning, scrolling, shrink,
                   acid, letter_spacing, overflow, replaced, sizing,
                   word_break, handles, labels, media,
                   scroll_lists, text_inputs, drag, aligned_subtree,
                   baselines, flow, splits, borders, effects, stacking):
        results = module.run(name, snapshot, image)
        if results:
            return results
    samples = Frames(frames or [(snapshot, image)])
    for module in (alpha, gradients, color_interpolation, navigation,
                   text_decorators, text_overflow, ink_bounds, white_space):
        results = module.run(name, snapshot, samples)
        if results:
            return results
    return filters.run(name, snapshot, image, samples)
