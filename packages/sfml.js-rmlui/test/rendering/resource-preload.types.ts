import {
  preloadResources, FontStyle, FontWeight, type PreloadResources,
  type ResourcePreloadOptions, type RenderInterface,
} from '../../src';

declare const renderer: RenderInterface;
const resources: PreloadResources = {
  textures: [ 'image.png' ],
  fonts: [{
    source: 'font.ttf', family: 'application', style: FontStyle.Normal,
    weight: FontWeight.Normal, fallback: false, faceIndex: 0,
  }],
};
const options: ResourcePreloadOptions = {
  signal: new AbortController().signal, renderInterface: renderer,
};
const pending: Promise<void> = preloadResources(resources, options);
void pending;

// @ts-expect-error Font registration requires an explicit family.
preloadResources({ fonts: [{ source: 'font.ttf' }] });
// @ts-expect-error Texture sources must be strings.
preloadResources({ textures: [ 3 ] });
// @ts-expect-error Renderer must be a native renderer handle.
preloadResources(resources, { renderInterface: {} });
