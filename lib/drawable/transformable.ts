import { Drawable } from './drawable';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Float, TransformablePlugin } from '../binding';
import { Vector2F, Vector2FType } from '../vector2';
import { validateTypeOf } from '../common';

function setVector2F(
  raw: TransformablePlugin,
  method: 'setPosition' | 'setScale' | 'setOrigin' | 'scale' | 'move',
  ...args: any[]
) {
  const x: Float | Vector2FType = args[0];
  const y: Float = args[1];
  switch (args.length) {
    case 1: {
      const pos = (x instanceof Vector2F) ?
        x :
        new Vector2F((x as any)?.x, (x as any)?.y);
      raw[method](pos);
      break;
    }

    case 2:
      validateTypeOf(x, 'x', 'number');
      validateTypeOf(y, 'y', 'number');
      raw[method](x as Float, y as Float);
      break;

    default:
      throw new Error('Invalid arguments');
  }
}

export class Transformable extends Drawable {
  getPosition() {
    return (this._raw() as TransformablePlugin).getPosition() as Vector2F;
  }

  setPosition(pos: Vector2FType): void;
  setPosition(x: Float, y: Float): void;
  setPosition(...args: any[]) {
    setVector2F(this._raw() as TransformablePlugin, 'setPosition', ...args);
  }

  getScale() {
    return (this._raw() as TransformablePlugin).getScale() as Vector2F;
  }

  setScale(scale: Vector2FType): void;
  setScale(x: Float, y: Float): void;
  setScale(...args: any[]) {
    setVector2F(this._raw() as TransformablePlugin, 'setScale', ...args);
  }

  getOrigin() {
    return (this._raw() as TransformablePlugin).getOrigin() as Vector2F;
  }

  setOrigin(origin: Vector2FType): void;
  setOrigin(x: Float, y: Float): void;
  setOrigin(...args: any[]) {
    setVector2F(this._raw() as TransformablePlugin, 'setOrigin', ...args);
  }

  move(vec: Vector2FType): void;
  move(x: Float, y: Float): void;
  move(...args: any[]) {
    setVector2F(this._raw() as TransformablePlugin, 'move', ...args);
  }

  scale(vec: Vector2FType): void;
  scale(x: Float, y: Float): void;
  scale(...args: any[]) {
    setVector2F(this._raw() as TransformablePlugin, 'scale', ...args);
  }

  getRotation() {
    return (this._raw() as TransformablePlugin).getRotation();
  }

  setRotation(rotation: Float): void {
    validateTypeOf(rotation, 'rotation', 'number');
    (this._raw() as TransformablePlugin).setRotation(rotation);
  }

  rotate(angle: Float): void {
    validateTypeOf(angle, 'angle', 'number');
    (this._raw() as TransformablePlugin).rotate(angle);
  }
}
