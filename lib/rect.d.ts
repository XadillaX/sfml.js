export class IntRect {
  constructor(left: number, top: number, width: number, height: number);
  constructor(position: { x: number, y: number }, size: { x: number, y: number });

  contains(x: number, y: number): boolean;
  intersects(rect: IntRect): false | IntRect;

  left: number;
  top: number;
  width: number;
  height: number;
}

export class FloatRect {
  constructor(left: number, top: number, width: number, height: number);
  constructor(position: { x: number, y: number }, size: { x: number, y: number });

  contains(x: number, y: number): boolean;
  intersects(rect: FloatRect): false | FloatRect;

  left: number;
  top: number;
  width: number;
  height: number;
}
