import { Image as _Image, Uint32, Uint8 } from './binding';
import { Color, ColorType } from './color';
import { validateTypeOf } from './common';
import { IntRect } from './rect';

export class Image extends _Image {
  copy(img: Image, destX: Uint32, destY: Uint32): void;
  copy(img: Image, destX: Uint32, destY: Uint32, applyAlpha: boolean): void;
  copy(
    img: Image,
    destX: Uint32,
    destY: Uint32,
    sourceRect: IntRect,
    applyAlpha?: boolean,
  ): void;
  copy(...args: any[]) {
    const img: Image = args[0];
    const destX: Uint32 = args[1];
    const destY: Uint32 = args[2];
    validateTypeOf(img, 'img', Image);
    validateTypeOf(destX, 'destX', 'number');
    validateTypeOf(destY, 'destY', 'number');
    if (args.length === 3) {
      return super.copy(img, destX, destY);
    }

    validateTypeOf(args[3], 'sourceRectOrApplyAlpha', [ IntRect, 'boolean' ]);
    if (args.length === 4) {
      return super.copy(img, destX, destY, args[3]);
    }

    validateTypeOf(args[4], 'applyAlpha', 'boolean');
    return super.copy(img, destX, destY, args[3], args[4]);
  }

  create(width: Uint32, height: Uint32): void;
  create(width: Uint32, height: Uint32, color: ColorType): void;
  create(
    width: Uint32,
    height: Uint32,
    pixels: Buffer | Uint8[] | ArrayBuffer | Uint8Array,
  ): void;
  create(width: Uint32, height: Uint32, ...args: any[]) {
    validateTypeOf(width, 'width', 'number');
    validateTypeOf(height, 'height', 'number');
    if (width <= 0 || height <= 0) {
      throw new Error('width and height must be greater than 0');
    }

    if (!args.length) {
      return super.create(width, height);
    }

    validateTypeOf(args[0], 'colorOrPixels', [
      Color,
      Buffer,
      Array,
      ArrayBuffer,
      Uint8Array,
      'number',
    ]);

    let color: Color | undefined;
    let pixels: Buffer | Uint8[] | ArrayBuffer | Uint8Array | undefined;
    if (typeof args[0] === 'number') {
      color = new Color(args[0]);
    } else if (args[0] instanceof Color) {
      color = args[0];
    } else {
      pixels = args[0];
    }

    super.create(width, height, color || pixels);
  }

  createMaskFromColor(color: ColorType, alpha: Uint8) {
    if (typeof color === 'number') {
      color = new Color(color);
    }

    validateTypeOf(color, 'color', Color);
    validateTypeOf(alpha, 'alpha', 'number');

    alpha = Math.floor(alpha);
    if (alpha < 0 || alpha > 255) {
      throw new Error('alpha must be between 0 and 255');
    }
    super.createMaskFromColor(color, alpha);
  }
}

_Image.setRealConstructor((...args: any[]) => new Image(...(args as [])));
