import {
  Texture, VertexBuffer, Sound, SoundBuffer, SoundSource, Music, RenderTexture,
  type ReadonlyTexture,
} from '..';

const texture = new Texture();
const borrowed: ReadonlyTexture = new RenderTexture().getTexture();
const assignedTexture: Texture = texture.assign(borrowed);
const assignedBuffer: VertexBuffer = new VertexBuffer().assign(new VertexBuffer());
const sound = new Sound(new SoundBuffer());
const assignedSound: Sound = sound.assign(new Sound(new SoundBuffer()));
const source: SoundSource = new Music();
const assignedSource: SoundSource = source.assign(sound);
const assignedMusic: Music = new Music().assign(sound);
class CustomTexture extends Texture { custom = true; }
const subclass: CustomTexture = new CustomTexture().assign(texture);

// @ts-expect-error Borrowed textures cannot be assignment targets.
borrowed.assign(texture);
// @ts-expect-error Textures only accept texture resources.
texture.assign(new VertexBuffer());
// @ts-expect-error Vertex buffers only accept vertex buffers.
new VertexBuffer().assign(texture);
// @ts-expect-error Full Sound assignment requires a Sound.
sound.assign(new Music());
// @ts-expect-error SoundSource assignment requires a playable source.
source.assign(new SoundBuffer());

export {
  assignedTexture, assignedBuffer, assignedSound, assignedSource, assignedMusic,
  subclass,
};
