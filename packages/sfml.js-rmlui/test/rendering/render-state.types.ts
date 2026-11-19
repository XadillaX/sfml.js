import {
  type RenderManager, type RenderState, type ClipMaskGeometry,
  ClipMaskOperation, clipMaskGeometryEquals, Geometry,
} from '../../src';

declare const manager: RenderManager;
declare const masks: ClipMaskGeometry[];
const state: RenderState = manager.getState();
manager.prepareRender({ x: 160, y: 120 });
manager.setViewport({ x: 160, y: 120 });
manager.getViewport().x.toFixed();
manager.setScissorRegion({ p0: { x: 0, y: 0 }, p1: { x: 2, y: 3 } });
manager.setScissorRegion(null);
manager.getScissorRegion()?.p0.x.toFixed();
manager.disableScissorRegion();
manager.setClipMask(masks);
manager.setClipMask(ClipMaskOperation.Set, new Geometry(), { x: 0, y: 0 });
manager.disableClipMask();
manager.setTransform(state.transform);
manager.setTransform(null);
manager.setState(state);
manager.resetState();
clipMaskGeometryEquals(masks[0], masks[1]).valueOf();

// @ts-expect-error All fields are required.
manager.setState({ transform: new Float32Array(16) });
// @ts-expect-error Transform uses a Float32Array.
manager.setTransform([ 1, 2 ]);
// @ts-expect-error A geometry must be a checked native wrapper.
manager.setClipMask(ClipMaskOperation.Set, {}, { x: 0, y: 0 });
// @ts-expect-error Translation is required for the single-mask overload.
manager.setClipMask(ClipMaskOperation.Set, new Geometry());
// @ts-expect-error A state needs an array of masks.
const invalid: RenderState = { ...state, clipMaskList: 1 };
void invalid;
