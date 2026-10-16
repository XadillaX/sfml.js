import { swap, Texture, VertexBuffer, RenderTexture } from '../src';

const texture = new Texture();
const buffer = new VertexBuffer();
const textureResult: void = swap(texture, new Texture());
const bufferResult: void = swap(buffer, new VertexBuffer());
const borrowed = new RenderTexture().getTexture();
// @ts-expect-error Only matching resource types can be exchanged.
swap(texture, buffer);
// @ts-expect-error Only matching resource types can be exchanged.
swap(buffer, texture);
// @ts-expect-error A borrowed texture is not writable.
swap(borrowed, texture);
// @ts-expect-error Both textures must be writable.
swap(texture, borrowed);
// @ts-expect-error Both arguments must be SFML resources.
swap({}, {});
void [ textureResult, bufferResult ];
