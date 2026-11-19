import {
  type Context, DataTypeRegister, DataVariableType,
  type DataCustomDefinition, type DataSchema, type DataEnumKind,
} from '../../dist';

declare const context: Context;
const model = context.createDataModel('custom');
const register = new DataTypeRegister();
const kind: DataEnumKind = 'uint64';
const enumeration: DataSchema | null = register.registerEnum('Code', kind);
void enumeration;
// @ts-expect-error Enums require integral storage.
register.registerEnum('Bad', 'float64');
const definition: DataCustomDefinition<{ value: number }> = {
  type: DataVariableType.Scalar,
  get: payload => ({ success: true, value: payload.value }),
  set: (payload, value) => {
    if (typeof value !== 'number') {
      return false;
    }
    payload.value = value;
    return true;
  },
};
if (model) {
  const scalar = model.registerScalar('Real', 'float64');
  const record = model.registerStruct('Record');
  if (scalar && record) {
    record.registerMember('value', scalar);
  }
  if (record) {
    model.registerArray('Records', record);
  }
  const code = model.registerEnum('Code', 'int16');
  if (code) {
    model.bind('code', 1, code);
  }
  const custom =
    model.registerCustomDataVariableDefinition('Custom', definition);
  if (custom) {
    model.bindCustomDataVariable('value', { value: 2 }, custom);
    const payload: unknown = model.getVariable('value')?.getPayload();
    const classification: boolean = custom.isCustom;
    void payload;
    void classification;
  }
}
const readonlyDefinition: DataCustomDefinition = {
  type: DataVariableType.Scalar,
  // @ts-expect-error Custom Get requires an explicit success field.
  get: () => 3,
};
void readonlyDefinition;
const array: DataCustomDefinition<{
  variable: import('../../dist').DataVariable;
}> = {
  type: DataVariableType.Array,
  size: payload => payload.variable.size,
  child: (payload, address) => payload.variable.child(address),
  reflectMemberNames: () => [ 'size' ],
};
register.registerCustomDataVariableDefinition('Array', array);
