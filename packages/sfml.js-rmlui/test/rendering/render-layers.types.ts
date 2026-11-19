import {
  type RenderManager, type LayerHandle, BlendMode, FilterHandleList,
} from '../../src';

declare const manager: RenderManager;
const base: LayerHandle = manager.getTopLayer();
const layer: LayerHandle = manager.pushLayer();
manager.getNextLayer();
manager.compositeLayers(layer, base, BlendMode.Blend);
manager.compositeLayers(layer, base, BlendMode.Replace, new FilterHandleList());
manager.saveLayerAsMaskImage().isValid.valueOf();
manager.popLayer();

// @ts-expect-error Layer handles are opaque.
manager.compositeLayers(1n, base, BlendMode.Blend);
// @ts-expect-error Empty objects cannot forge layer handles.
manager.compositeLayers({}, base, BlendMode.Blend);
// @ts-expect-error Filter lists retain native resources.
manager.compositeLayers(layer, base, BlendMode.Blend, []);
// @ts-expect-error Blend mode must be one of the native enumerators.
manager.compositeLayers(layer, base, 7);
