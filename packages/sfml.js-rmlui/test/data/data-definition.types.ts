import {
  DataDefinition, DataPointerTraits, DataStructHandle,
  DataVariable, DataVariableType,
  makeLiteralIntVariable, type DataSchema, type DataModelConstructor,
} from '../../dist';

declare const model: DataModelConstructor;
declare const schema: DataSchema;
const definition: DataDefinition = makeLiteralIntVariable(1).getDefinition();
const type: DataVariableType = definition.type;
const valid: boolean = definition.isValid;
const names: string[] = definition.reflectMemberNames();
const underlying: DataSchema | null = schema.underlying;
const traits = new DataPointerTraits(schema);
const pointer: boolean = traits.isPointer;
const element: DataSchema = traits.elementType;
const target: DataVariable | null = traits.dereference(model.getVariable('x')!);
const register = model.getDataTypeRegister();
const family: number = register.createFamilyId();
const registered: boolean = register.registerDefinition(family, 'Custom', {
  type: DataVariableType.Scalar,
});
const selected: DataSchema | null = register.getDefinition(family);
const structHandle = new DataStructHandle(register, schema);
const structValidity: boolean = structHandle.isValid;
const registeredMember: boolean = structHandle.registerMember('value', schema);
void [ type, valid, names, underlying, pointer, element, target ];
void [ family, registered, selected ];
void [ structValidity, registeredMember ];

// @ts-expect-error Unregistered definitions have no allocated family identity.
definition.familyId;
// @ts-expect-error Pointer traits require a registered schema.
new DataPointerTraits(definition);
// @ts-expect-error Native addresses are never accepted as variables.
traits.dereference(42);
// @ts-expect-error A struct constructor requires a registered definition.
new DataStructHandle(register, definition);
// @ts-expect-error A native pointer is never a struct definition.
new DataStructHandle(register, 42);
