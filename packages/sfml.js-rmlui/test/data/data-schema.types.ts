import {
  type Context, DataTypeRegister, type DataSchema, type DataStructHandle,
  type DataNumericView, type DataStorageValue,
} from '../../dist';

declare const context: Context;
const register = new DataTypeRegister();
const scalar: DataSchema | null = register.registerScalar('Real', 'float64');
const record: DataStructHandle | null = register.registerStruct('Record');
if (scalar && record) {
  record.registerMember('value', scalar);
  const records = register.registerArray('Records', record);
  const model = context.createDataModel('records', { typeRegister: register });
  if (records && model) {
    const initial: DataStorageValue = [{ value: 2 }];
    model.bind('records', initial, records);
    model.applyPatch({ '$.records[0].value': 3 });
    const array = model.getVariable('records');
    array?.resize(2);
    const nativeRegister: DataTypeRegister = model.getDataTypeRegister();
    const found: DataSchema | null = nativeRegister.getDefinition('Real');
    void found;
    // @ts-expect-error Structured bindings require an explicit native schema.
    model.bind('missing-schema', initial);
    // @ts-expect-error Sparse scalar patches cannot contain records.
    model.applyPatch({ '$.records[0]': { value: 4 } });
  }
  const numbers = register.registerArray('Numbers', scalar);
  const numericModel =
    context.createDataModel('numbers', { typeRegister: register });
  if (numbers && numericModel) {
    numericModel.bind('values', new Float64Array([ 1, 2 ]), numbers);
    const view: DataNumericView | undefined =
      numericModel.getVariable('values')?.getNumericView();
    void view;
  }
}
// @ts-expect-error Scalar storage uses a checked native kind.
register.registerScalar('Invalid', 'double-ish');
// @ts-expect-error A shared register is a native owner, not a string.
context.createDataModel('invalid', { typeRegister: 'shared' });
