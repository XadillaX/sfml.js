import {
  CallbackTexture, CallbackTextureInterface, CallbackTextureSource,
  TextureHandle, RenderManager, getRenderInterface,
} from '../../src';

const manager = new RenderManager(getRenderInterface()!);
const bytes = new Uint8Array([ 128, 0, 0, 128 ]);
const size = { x: 1, y: 1 };
const handle: TextureHandle = manager.generateTextureHandle(bytes, size);
const texture = manager.makeCallbackTexture(api => {
  api.setTextureHandle(handle, size);
  const owner: RenderManager = api.getRenderManager();
  void owner;
  return true;
});
texture.toTexture().getDimensions();
texture.release();
handle.release();

new CallbackTexture().isValid;
new CallbackTextureSource().getTexture(manager);
new CallbackTextureSource(api => api.generateTexture(bytes, size))
  .getTexture(manager);
const sentinel: 4294967295 = CallbackTexture.invalidHandle();
void sentinel;
// @ts-expect-error Generation is strictly synchronous.
manager.makeCallbackTexture(async api => api.generateTexture(bytes, size));
// @ts-expect-error Native handles are opaque owned tokens.
new CallbackTextureInterface();
// @ts-expect-error Native handles are opaque owned tokens.
new TextureHandle();
manager.makeCallbackTexture(api => {
  // @ts-expect-error Raw pointer numbers cannot transfer texture ownership.
  api.setTextureHandle(123, size);
  api.saveLayerAsTexture();
  return false;
});
// @ts-expect-error Native release does not take a replacement handle.
handle.release(handle);
