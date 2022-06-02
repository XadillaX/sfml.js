declare module '*/binding.node' {
  export function touchIsDown(finger: Uint32): boolean;
  // TODO(XadillaX): RenderWindow type.
  export function touchGetPosition(finger: Uint32, window?: any): Vector2I;
}
