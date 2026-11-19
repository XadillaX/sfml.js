import {
  DataTypeRegister, TransformFuncRegister, type DataTransformResult,
  type DataVariantValue, type DataGetFunc, type DataTransformFunc,
  type Context, type Element, makeTransitionList, FilterList,
} from '../../dist';

declare const context: Context;
declare const element: Element;
const types = new DataTypeRegister();
const transforms: TransformFuncRegister = types.getTransformFuncRegister();
const valid: boolean = transforms.isValid;
const getter: DataGetFunc = () => ({ x: 1, y: 2 });
const callback: DataTransformFunc = () => makeTransitionList();
transforms.register('motion', callback);
const result: DataTransformResult = transforms.call('motion', [
  null, true, 2n, { type: 'colourb', red: 1, green: 2, blue: 3, alpha: 4 },
  new FilterList('blur(2px)'),
]);
const value: DataVariantValue = result.value;
const model = context.createDataModel('owned-values');
if (model) {
  model.bindFunc('vector', getter);
  model.bindFunc('nullable', () => null);
  model.registerTransformFunc('filters', () => new FilterList('blur(2px)'));
  const variable = model.getVariable('vector');
  variable?.set({ x: 3, y: 4 });
  variable?.set(null);
  variable?.set(makeTransitionList());
  // @ts-expect-error Data values require owned Variants; elements are borrowed.
  model.bindFunc('borrowed', () => element);
  // @ts-expect-error A variable assignment cannot retain an element pointer.
  variable?.set(element);
}
// @ts-expect-error Transform arguments require owned Variants.
transforms.call('motion', [ element ]);
// @ts-expect-error A transform cannot return a borrowed element.
transforms.register('borrowed', () => element);
// @ts-expect-error Arbitrary objects have no native Variant definition.
transforms.register('unsupported', () => ({ nested: 2 }));
void [ valid, value ];
