declare module '*/binding.node' {
  export enum VertexSyncType {
    kPosition = 0,
    kColor = 1,
    kTexCoords = 2,
    kAll = 3,
  }

  export class Vertex {
    constructor();
    constructor(magicNumber: -99999, ptr: BigInt);
    constructor(
      position: Vector2F | undefined,
      color: Color | undefined,
      texCoords: Vector2F | undefined,
    );

    get position(): Vector2F;
    set position(value: Vector2F);
    get color(): Color;
    set color(value: Color);
    get texCoords(): Vector2F;
    set texCoords(value: Vector2F);

    syncFromJS(type: VertexSyncType);

    static setRealConstructor(cons: Function): void;
  }
}
