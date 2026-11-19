import {
  DataAddressEntry, DataModelConstructor, DataModelHandle, DataVariable,
  makeLiteralIntVariable, type DataAddress, type DataDefinition,
  type DirtyVariables, type DataTypeGetFunc, type DataTypeSetFunc,
  type DataEventMemberFunc, type MemberGetFunc, type MemberSetFunc,
  type MemberGetterFunc, type MemberSetterFunc, type VoidMemberFunc,
} from '../../dist';

const invalidModel = new DataModelConstructor();
const invalidHandle = new DataModelHandle();
const invalidVariable = new DataVariable();
const valid: boolean = invalidVariable.isValid;
const literal: DataVariable = makeLiteralIntVariable(-1);
const name = new DataAddressEntry('records');
const index = new DataAddressEntry(0);
name.name = 'records.with.dot';
index.index = 1;
const address: DataAddress = [ name, index, new DataAddressEntry('value') ];
declare const model: DataModelConstructor;
const variable: DataVariable | null = model.getVariable(address);
const roots: Record<string, DataVariable> = model.getAllVariables();
const definition: DataDefinition = literal.getDefinition();
const dirty: DirtyVariables = new Set([ 'records' ]);
interface Receiver { value: number }
const get: DataTypeGetFunc<Receiver> = payload => payload.value;
const set: DataTypeSetFunc<Receiver> = (payload, value) => {
  payload.value = Number(value);
};
const getMember: MemberGetFunc<Receiver> = function() {
  return this.value;
};
const setMember: MemberSetFunc<Receiver> = function(value) {
  this.value = Number(value);
};
const getValue: MemberGetterFunc<Receiver, number> = function() {
  return this.value;
};
const setValue: MemberSetterFunc<Receiver, number> = function(value) {
  this.value = value;
};
const event: DataEventMemberFunc<Receiver> = function(current, _event, args) {
  this.value += Number(args[0]);
  current.dirtyVariable('value');
};
const omitted: VoidMemberFunc = undefined;
const receiver: Receiver = { value: 3 };
model.registerScalar('Callback', { get, set });
model.bindFunc('member', getMember.bind(receiver), setMember.bind(receiver));
model.bindEventCallback('member', event.bind(receiver));
literal.child(name);
model.bindCustomDataVariable('constant', literal);
void [
  invalidModel, invalidHandle, valid, variable, roots, definition, dirty,
  getValue, setValue, omitted,
];

// @ts-expect-error A data address entry needs a name or a number.
new DataAddressEntry(true);
// @ts-expect-error Explicit addresses contain entries, not primitive indices.
model.getVariable([ 0 ]);
// @ts-expect-error Integer literals use the native signed 32-bit number type.
makeLiteralIntVariable(1n);
