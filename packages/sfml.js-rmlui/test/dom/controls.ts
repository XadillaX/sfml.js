import {
  Document, Element, ElementForm, ElementFormControl,
  ElementFormControlInput, ElementFormControlSelect,
  ElementFormControlTextArea, ElementInstancer, IntrinsicDimensions,
  TextSelection,
} from '../../src';

declare const document: Document;
const valueInstancer: ElementInstancer = ElementFormControl.createInstancer();
const payloadInstancer: ElementInstancer =
  ElementFormControl.createInstancer('payload');
// @ts-expect-error Attribute keys are strings.
ElementFormControl.createInstancer(4);
// @ts-expect-error Native adapters do not take per-value JS callbacks.
ElementFormControl.createInstancer(() => 'value');
void [ valueInstancer, payloadInstancer ];
const element = document.querySelector('input');
if (element instanceof ElementFormControlInput) {
  const base: ElementFormControl = element;
  base.setName('name');
  base.setValue('🌙');
  base.setDisabled(false);
  const values: [ string, string, boolean, boolean ] = [
    base.getName(), base.getValue(), base.isDisabled(), base.isSubmitted(),
  ];
  const focused: boolean = element.focus();
  const size: IntrinsicDimensions = element.getIntrinsicDimensions();
  element.select();
  element.setSelectionRange(0, 1);
  element.setCompositionRange(0, 1);
  const selection: TextSelection = element.getSelection();
  element.blur();
  void [ values, focused, size, selection ];
  // @ts-expect-error Character offsets are numerical.
  element.setSelectionRange('0', 1);
}
declare const select: ElementFormControlSelect;
declare const option: Element;
const indexes: number[] = [
  select.add('Alpha', 'a'), select.add('Beta', 'b', 0, false),
  select.add(option), select.add(option, 0), select.getSelection(),
  select.getNumOptions(),
];
const found: Element | null = select.getOption(0);
select.setSelection(0);
select.remove(0);
select.removeAll();
select.showSelectBox();
select.hideSelectBox();
select.cancelSelectBox();
const visible: boolean = select.isSelectBoxVisible();
// @ts-expect-error RML overload requires a value.
select.add('Alpha');
// @ts-expect-error Element overload takes a numeric index.
select.add(option, 'a');
// @ts-expect-error The selection result is an index, not a text range.
const wrong: TextSelection = select.getSelection();
declare const area: ElementFormControlTextArea;
area.setNumColumns(20);
area.setNumRows(2);
area.setMaxLength(-1);
area.setWordWrap(true);
area.select();
area.setSelectionRange(0, 2);
area.setCompositionRange(0, 0);
const range: TextSelection = area.getSelection();
const dimensions: [ number, number, number, boolean ] = [
  area.getNumColumns(), area.getNumRows(), area.getMaxLength(),
  area.getWordWrap(),
];
declare const form: ElementForm;
form.submit();
form.submit('action', 'save');
void [ indexes, found, visible, wrong, range, dimensions ];
