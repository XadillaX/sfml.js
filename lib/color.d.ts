export class Color {
  constructor(color: number);
  constructor(red: number, green: number, blue: number, alpha?: number);

  r: number;
  g: number;
  b: number;
  a: number;

  toInteger(): number;
}
