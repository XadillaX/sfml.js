declare module '*/binding.node' {
  export class Color {
    constructor();
    constructor(color: number);
    constructor(red: number, green: number, blue: number, alpha?: number);

    toInteger(): Uint32;

    get r(): number;
    set r(value: number);

    get g(): number;
    set g(value: number);

    get b(): number;
    set b(value: number);

    get a(): number;
    set a(value: number);
  }
  export function setRealColorConstructor(cons: Function): void;
}
