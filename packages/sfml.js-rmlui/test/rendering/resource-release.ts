import {
  createContext, createRenderInterface, getRenderInterface,
  getTextureSourceList, releaseTexture, releaseTextures,
  releaseCompiledGeometry, releaseRenderManagers, setRenderInterface,
  type RenderInterface,
} from '../../dist';
import type { RenderWindow } from 'sfml.js';

declare const window: RenderWindow;
const renderer: RenderInterface = createRenderInterface(window);
const selected: RenderInterface | null = getRenderInterface();
setRenderInterface(renderer);
setRenderInterface(null);
// @ts-expect-error Renderer setters reject forged interface values.
setRenderInterface({});
// @ts-expect-error Renderer setters require an explicit null reset.
setRenderInterface(undefined);
// @ts-expect-error Global getters can return null before initialisation.
const missing: RenderInterface = getRenderInterface();
const context = createContext('scoped', 80, 60, renderer);
const scope: RenderInterface = context.renderInterface;
releaseTextures(scope);
releaseTextures(null);
releaseCompiledGeometry(getRenderInterface());
releaseCompiledGeometry();
const released: boolean = releaseTexture('image.png', renderer);
const sources: string[] = getTextureSourceList();
releaseRenderManagers();
// @ts-expect-error Renderer scopes must be genuine native interfaces.
releaseTextures({});
// @ts-expect-error A context is not a renderer interface.
releaseTexture('image.png', context);
// @ts-expect-error Texture sources are strings.
releaseTexture(4);
// @ts-expect-error Context renderer parameters are typed.
createContext('invalid', 80, 60, window);
void [ released, sources, selected, missing ];
