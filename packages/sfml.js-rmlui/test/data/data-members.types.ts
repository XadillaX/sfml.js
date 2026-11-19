import {
  type Context, type DataMemberGetter, type DataMemberSetter,
  type DataScalarDefinition, DataTypeRegister, type DataVariable,
} from '../../dist';

declare const context: Context;
declare const variable: DataVariable;
const model = context.createDataModel('members');
const register = new DataTypeRegister();
const definition: DataScalarDefinition<{ value: number }> = {
  get: payload => payload.value,
  set: (payload, value) => {
    if (typeof value === 'number') {
      payload.value = value;
    }
  },
};
register.registerScalar('Custom', definition);
const getter: DataMemberGetter = parent =>
  Number(parent.child('value')?.get() ?? 0);
const setter: DataMemberSetter = (parent, value) => {
  parent.child('value')?.set(value);
};
if (model) {
  const scalar = model.registerScalar('Value', 'int16');
  const record = model.registerStruct('Record');
  if (scalar && record) {
    record.registerMember('value', scalar);
    record.registerMember('computed', scalar, getter, setter);
    record.registerMember('writeonly', scalar, undefined, setter);
    model.bind('record', { value: 1 }, record);
  }
  const custom = model.registerScalar('Custom', definition);
  if (custom) {
    model.bindCustomDataVariable('custom', { value: 2 }, custom);
  }
  model.bindCustomDataVariable('alias', variable);
  // @ts-expect-error A two-argument alias requires a checked variable.
  model.bindCustomDataVariable('invalid', { value: 2 });
}
