import {
  Context, DataModelConstructor, DataModelHandle, DataVariable,
  DataVariableType, type DataScalarValue, type VariantValue,
} from '../../dist';

declare const context: Context;
const constructor: DataModelConstructor | null =
  context.createDataModel('consumer', { allowMissingVariables: true });
const snapshot: Record<string, DataModelConstructor> = context.getDataModels();
const missing: DataModelConstructor | null = context.getDataModel('missing');
const removed: boolean = context.removeDataModel('consumer');
void [ snapshot, missing, removed ];

if (constructor) {
  const handle: DataModelHandle = constructor.getModelHandle();
  const valid: boolean = handle.isValid;
  const dirty: boolean = handle.isVariableDirty('number');
  handle.dirtyAllVariables();
  constructor.bind('number', 2);
  constructor.bind('exact', 9007199254740993n);
  constructor.bind('string', 'text');
  constructor.bind('boolean', true);
  constructor.bindFunc('getter', () => 3);
  constructor.bindFunc('settable', () => 2, value => {
    const scalar: VariantValue = value;
    void scalar;
  });
  constructor.registerTransformFunc('first', args => String(args[0]));
  constructor.bindEventCallback('event', (model, event, args) => {
    const received: DataModelHandle = model;
    const arguments_: readonly VariantValue[] = args;
    event.stopPropagation();
    received.dirtyVariable('number');
    void arguments_;
  });
  const variable: DataVariable | null = constructor.getVariable('$.number');
  if (variable) {
    const category: DataVariableType = variable.type;
    const value: VariantValue | undefined = variable.get();
    const input: DataScalarValue = '3';
    const result: boolean = variable.set(input);
    const child: DataVariable | null = variable.child('member');
    const names: string[] = variable.reflectMemberNames();
    void [ category, value, result, child, names ];
    // @ts-expect-error A native scalar assignment cannot take an object.
    variable.set({ nested: 2 });
    // @ts-expect-error Address entries must be a name or integer index.
    variable.child(true);
  }
  const updated: boolean = constructor.update(false);
  void [ valid, dirty, updated ];
  // @ts-expect-error BindFunc getters must return a supported owned Variant.
  constructor.bindFunc('invalid', () => ({ nested: 2 }));
  // @ts-expect-error Model handles expose dirty scheduling, not construction.
  handle.bind('invalid', 2);
  // @ts-expect-error Missing-variable mode is boolean.
  context.createDataModel('invalid', { allowMissingVariables: 'yes' });
  // @ts-expect-error Dirty queries require a variable name.
  handle.isVariableDirty(0);
}
