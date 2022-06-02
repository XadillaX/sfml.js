type ExpectedType = (new(...args: any[]) => any) | string;

export function validateTypeOf(
  arg: any,
  name: string,
  type: ExpectedType | ExpectedType[],
  optional = false,
) {
  if (optional && arg === undefined) {
    return;
  }

  if (!Array.isArray(type)) {
    type = [ type ];
  }

  for (const t of type) {
    if (typeof t !== 'string') {
      if (arg instanceof t) {
        return;
      }
    } else {
      if (typeof arg === t) {
        return;
      }
    }
  }

  throw new TypeError(`Parameter \`${name}\` should be type of ${type.map(t => {
    if (typeof t === 'string') return t;
    return t.name;
  }).join(', ')}.`);
}
