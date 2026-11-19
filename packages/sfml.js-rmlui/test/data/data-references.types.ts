import {
  DataModelConstructor, DataSchema, DataStorageValue, DataTypeRegister,
  DataVariable,
} from '../../src';

declare const model: DataModelConstructor;
declare const variable: DataVariable;
const register = new DataTypeRegister();
const scalar = register.registerScalar('Real', 'float64')!;
const reference: DataSchema | null =
  register.registerReference('RealRef', scalar);
const initial: DataStorageValue = { title: 'record', reference: variable };
model.bind('reference', null, reference!);
model.bind('target', variable, reference!);
const classification: boolean = reference!.isReference;
const target: DataVariable | null = variable.getReference();
const success: boolean = variable.setReference(target);
void initial;
void classification;
void success;
// @ts-expect-error References require checked variables.
variable.setReference({ address: 1 });
