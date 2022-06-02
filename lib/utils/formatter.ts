import { Float, Int32, Uint32 } from '../binding'; // eslint-disable-line @typescript-eslint/no-unused-vars, max-len

export type FormatValueFunction = (v: any) => number;

export function formatFloatValue(v: any): Float {
  const n = parseFloat(v);
  if (isNaN(n)) {
    throw new Error(`Invalid float value: ${v}`);
  }
  return n;
}

export function formatInt32Value(v: any): Int32 {
  const n = parseInt(v, 10);
  if (isNaN(n)) {
    throw new Error('Invalid value');
  }
  return n;
}

export function formatUint32Value(v: any): Uint32 {
  const n = parseInt(v, 10);
  if (isNaN(n)) {
    throw new Error('Invalid value');
  }
  if (n < 0) {
    throw new Error('Value must be positive');
  }
  return n;
}
