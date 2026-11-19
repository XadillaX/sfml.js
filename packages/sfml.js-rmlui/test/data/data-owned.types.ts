import {
  DataVariable, type DataSchema, type DataNumericView,
} from '../../dist';

declare const scalar: DataSchema;
declare const array: DataSchema;
const scalarValue = new DataVariable(scalar, 1);
const arrayValue = new DataVariable(array, [ 1, 2 ]);
const view: DataNumericView = arrayValue.getNumericView();
const defaultValue = new DataVariable(scalar);
const invalid = new DataVariable();
void [ scalarValue, view, defaultValue, invalid ];

// @ts-expect-error Native raw pointer addresses cannot construct variables.
new DataVariable(42, 1);
// @ts-expect-error Owned values require a checked registered schema.
new DataVariable({}, 1);
