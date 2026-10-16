import { native, type NativeGraphicsHandle } from './native';
import type { ReadonlyTexture } from '../graphics/texture';
import { SFMLError } from '../system/error';

export const graphicsNative: unique symbol = Symbol('Graphics.native');
export const spriteState: unique symbol = Symbol('Sprite.state');
export const shapeState: unique symbol = Symbol('Shape.state');
export const recordShape: unique symbol = Symbol('RenderTarget.shape');
export const graphicsShapeReads: unique symbol = Symbol('Graphics.shapeReads');
export const textureId: unique symbol = Symbol('Texture.id');
export const textureOwner: unique symbol = Symbol('Texture.owner');
export const graphicsFlush: unique symbol = Symbol('Graphics.flush');
export const graphicsReads: unique symbol = Symbol('Graphics.reads');
export const dispatchDrawable: unique symbol = Symbol('Drawable.dispatch');
export const recordSprite: unique symbol = Symbol('RenderTarget.sprite');
export const recordVertices: unique symbol = Symbol('RenderTarget.vertices');
export const recordVertexBuffer: unique symbol = Symbol('RenderTarget.vertexBuffer');
export const vertexBufferId: unique symbol = Symbol('VertexBuffer.id');
export const vertexArrayBytes: unique symbol = Symbol('VertexArray.bytes');
export const shaderId: unique symbol = Symbol('Shader.id');
export const shaderTextures: unique symbol = Symbol('Shader.textures');

export interface SpriteData {
  id: number;
  words: Uint32Array;
  rectangle: Int32Array;
  texture: ReadonlyTexture;
}

export interface ShapeData {
  id: number;
  words: Uint32Array;
  rectangle: Int32Array;
  texture: ReadonlyTexture | null;
}

export interface PendingTarget {
  [graphicsFlush](): void;
  [graphicsReads](): ReadonlySet<ReadonlyTexture>;
  [graphicsShapeReads]?(): ReadonlySet<object>;
}

let context: NativeGraphicsHandle<'context'> | undefined;
const targets = new Set<WeakRef<PendingTarget>>();

export function graphicsContext(): NativeGraphicsHandle<'context'> {
  context ??= native.createGraphicsContext();
  return context;
}

export function registerTarget(target: PendingTarget): void {
  targets.add(new WeakRef(target));
}

// Resource changes must not alter draws that were recorded earlier.
// Weak references let unused render targets be garbage-collected.
export function flushGraphics(): void {
  for (const reference of targets) {
    const target = reference.deref();
    if (target) target[graphicsFlush]();
    else targets.delete(reference);
  }
}

/** Geometry is shared; submit only targets that recorded this shape. */
export function flushShapeReaders(shape: object): void {
  for (const reference of targets) {
    const target = reference.deref();
    if (!target) targets.delete(reference);
    else if (target[graphicsShapeReads]?.().has(shape)) target[graphicsFlush]();
  }
}

/** Reject feedback or a new cycle before reserving any command/vertex space. */
export function validateTextureRead(
  reader: PendingTarget, texture: ReadonlyTexture | null,
): void {
  const owner = texture?.[textureOwner];
  if (!owner) return;
  if (owner === reader) {
    throw new SFMLError('Cannot sample a render target from its own texture');
  }
  const pending = [ owner ];
  const visited = new Set<PendingTarget>();
  while (pending.length) {
    const target = pending.pop()!;
    if (target === reader) {
      throw new SFMLError('Cyclic texture dependency: display an intermediate target');
    }
    if (visited.has(target)) continue;
    visited.add(target);
    for (const source of target[graphicsReads]()) {
      const dependency = source[textureOwner];
      if (dependency) pending.push(dependency);
    }
  }
}

/** Flush consumers before their sources can overwrite shared FBO textures. */
export function flushTextureReaders(writer: PendingTarget): void {
  const readers = new Map<PendingTarget, Set<PendingTarget>>();
  for (const reference of targets) {
    const target = reference.deref();
    if (!target) {
      targets.delete(reference);
      continue;
    }
    for (const texture of target[graphicsReads]()) {
      const owner = texture[textureOwner];
      if (!owner) continue;
      let consumers = readers.get(owner);
      if (!consumers) readers.set(owner, consumers = new Set());
      consumers.add(target);
    }
  }
  const ordered: PendingTarget[] = [];
  const visiting = new Set<PendingTarget>();
  const done = new Set<PendingTarget>();
  const visit = (source: PendingTarget) => {
    if (visiting.has(source)) throw new SFMLError('Cyclic texture dependency');
    if (done.has(source)) return;
    visiting.add(source);
    for (const target of readers.get(source) ?? []) visit(target);
    visiting.delete(source);
    done.add(source);
    if (source !== writer) ordered.push(source);
  };
  visit(writer);
  // Collect the complete order before performing any native submissions.
  for (const target of ordered) target[graphicsFlush]();
}
