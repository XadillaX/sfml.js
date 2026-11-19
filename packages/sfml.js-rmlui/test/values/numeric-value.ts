import {
  NumericValue, Unit, anyUnit, type Units, type Element,
} from '../../src';

declare const element: Element;
const value = new NumericValue(12, Unit.PX);
const flags: Units = Unit.LENGTH_PERCENT;
const nonempty: boolean = anyUnit(flags);
const pixels: number = element.resolveLength(value);
const percent: number = element.resolveNumericValue(
  new NumericValue(25, Unit.PERCENT), 80,
);
value.number = 15;
value.unit = Unit.DP;
const numbers: Float32Array = value.numberView;
const units: Int32Array = value.unitView;
numbers[0] = 4;
units[0] = Unit.PX;
value.equals(value.clone());
value.notEquals(value.clone());
// @ts-expect-error Resolution needs a checked native value.
element.resolveLength({ number: 2, unit: Unit.PX });
// @ts-expect-error Numeric resolution requires a base value.
element.resolveNumericValue(value);
// @ts-expect-error Unit must be numeric.
value.unit = 'px';
// @ts-expect-error Shared views cannot be replaced.
value.numberView = new Float32Array(1);
// @ts-expect-error Unit fields use integer views.
const wrong: Float32Array = value.unitView;
void [ nonempty, pixels, percent, wrong ];
