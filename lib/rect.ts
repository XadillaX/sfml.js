import * as util from 'util';
import {
  Float,
  FloatRect as _FloatRect,
  Int32,
  IntRect as _IntRect,
} from './binding';
import {
  TwoDemensionalPoint,
  Vector2F,
  Vector2I,
} from './vector2';
import {
  formatFloatValue,
  formatInt32Value,
  FormatValueFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
} from './utils/formatter';

function inspect<V extends(IntRect | FloatRect)>(
  name: string,
  rect: V,
  opts: util.InspectOptionsStylized,
) {
  return `${name} ${util.inspect({
    ...rect.toJSON(),
  }, opts)}`;
}

export interface IRect<T> {
  top: T;
  left: T;
  width: T;
  height: T;
}

function toJSON<T>(
  vec: IntRect | FloatRect,
): IRect<T> {
  return {
    top: vec.top as unknown as T,
    left: vec.left as unknown as T,
    width: vec.width as unknown as T,
    height: vec.height as unknown as T,
  };
}

function processConstructorArgs<T, V>(
  Vec: any,
  args: any[],
  formatValue: FormatValueFunction,
): [] | [T, T, T, T] | [V, V] {
  if (args.length === 0) {
    return [];
  } else if (args.length === 2) {
    if (!(args[0] instanceof Vec) || !(args[1] instanceof Vec)) {
      throw new Error('Invalid constructor arguments');
    }
    return [ args[0] as V, args[1] as V ];
  } else if (args.length === 4) {
    args[0] = formatValue(args[0]);
    args[1] = formatValue(args[1]);
    args[2] = formatValue(args[2]);
    args[3] = formatValue(args[3]);
    return [ args[0] as T, args[1] as T, args[2] as T, args[3] as T ];
  }

  throw new Error('Invalid constructor arguments');
}

function processContainsArgs<T, V>(
  Vec: any,
  args: any[],
  formatValue: FormatValueFunction,
): [ V ] | [ T, T ] {
  if (args.length === 1) {
    if (!(args[0] instanceof Vec)) {
      return [
        formatValue(args[0]?.x) as unknown as T,
        formatValue(args[0]?.y) as unknown as T,
      ];
    }

    return [ args[0] ];
  } else if (args.length === 2) {
    args[0] = formatValue(args[0]);
    args[1] = formatValue(args[1]);
    return [ args[0] as T, args[1] as T ];
  }

  throw new Error('Invalid constructor arguments');
}

function processIntersectsArgs<R>(Rect: any, args: any[]) {
  if (args.length === 1) {
    if (!(args[0] instanceof Rect)) {
      throw new Error('Invalid constructor arguments');
    }
    return args as [ R ];
  }

  throw new Error('Invalid constructor arguments');
}

export class FloatRect extends _FloatRect {
  constructor();
  constructor(position: Vector2F, size: Vector2F);
  constructor(left: Float, top: Float, width: Float, height: Float);
  constructor(...args: any[]) {
    const newArgs = processConstructorArgs<Float, Vector2F>(
      Vector2F,
      args,
      formatFloatValue,
    ) as [];
    super(...newArgs);
  }

  [util.inspect.custom](_: number, opts: util.InspectOptionsStylized) {
    return inspect('FloatRect', this, opts);
  }

  toJSON(): IRect<Float> {
    return toJSON<Float>(this);
  }

  set top(value: Float) {
    super.top = formatFloatValue(value);
  }

  set left(value: Float) {
    super.left = formatFloatValue(value);
  }

  set width(value: Float) {
    super.width = formatFloatValue(value);
  }

  set height(value: Float) {
    super.height = formatFloatValue(value);
  }

  contains(p: Vector2F): boolean;
  contains(p: TwoDemensionalPoint<Float>): boolean;
  contains(x: Float, y: Float): boolean;
  contains(...args: any[]): boolean {
    const newArgs = processContainsArgs<Float, Vector2F>(
      Vector2F,
      args,
      formatFloatValue,
    );
    return super.contains(...newArgs as [Vector2F]);
  }

  intersects(rect: FloatRect): FloatRect | false;
  intersects(...args: any[]): FloatRect | false {
    args = processIntersectsArgs<FloatRect>(FloatRect, args);
    return super.intersects(
      ...(args as [ FloatRect ]),
    ) as unknown as (FloatRect | false);
  }
}

export class IntRect extends _IntRect {
  constructor();
  constructor(position: Vector2I, size: Vector2I);
  constructor(left: Int32, top: Int32, width: Int32, height: Int32);
  constructor(...args: any[]) {
    const newArgs = processConstructorArgs<Int32, Vector2I>(
      Vector2I,
      args,
      formatInt32Value,
    ) as [];
    super(...newArgs);
  }

  [util.inspect.custom](_: number, opts: util.InspectOptionsStylized) {
    return inspect('IntRect', this, opts);
  }

  toJSON(): IRect<Int32> {
    return toJSON<Int32>(this);
  }

  set top(value: Int32) {
    super.top = formatInt32Value(value);
  }

  set left(value: Int32) {
    super.left = formatInt32Value(value);
  }

  set width(value: Int32) {
    super.width = formatInt32Value(value);
  }

  set height(value: Int32) {
    super.height = formatInt32Value(value);
  }

  contains(p: Vector2I): boolean;
  contains(p: TwoDemensionalPoint<Int32>): boolean;
  contains(x: Int32, y: Int32): boolean;
  contains(...args: any[]): boolean {
    const newArgs = processContainsArgs<Int32, Vector2I>(
      Vector2I,
      args,
      formatInt32Value,
    );
    return super.contains(...newArgs as [Vector2I]);
  }

  intersects(rect: IntRect): IntRect | false;
  intersects(...args: any[]): IntRect | false {
    args = processIntersectsArgs<IntRect>(IntRect, args);
    return super.intersects(
      ...(args as [ IntRect ]),
    ) as unknown as (IntRect | false);
  }
}

_FloatRect.setRealConstructor((...args: any) => new FloatRect(...(args as [])));
_IntRect.setRealConstructor((...args: any) => new IntRect(...(args as [])));
