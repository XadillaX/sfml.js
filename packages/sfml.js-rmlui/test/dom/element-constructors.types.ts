import {
  Element, Document, ElementText, ElementForm, ElementFormControlInput,
  ElementFormControlSelect, ElementFormControlTextArea, ElementProgress,
  ElementTabSet,
} from '../../src';

const nodes: Element[] = [
  new Element('section', { id: 'owned', exact: 7n }),
  new Document('body'), new ElementText('#text'), new ElementForm('form'),
  new ElementFormControlInput('input', { type: 'text', value: 'ready' }),
  new ElementFormControlSelect('select'),
  new ElementFormControlTextArea('textarea'),
  new ElementProgress('progress'), new ElementTabSet('tabset'),
];
for (const node of nodes) {
  node.removeAttribute('exact');
  node.release();
}

class Field extends ElementFormControlInput {}
const field: Field = new Field('field');
field.release();

// @ts-expect-error Native construction requires a tag.
new Element();
// @ts-expect-error Tags are strings.
new Element(4);
// @ts-expect-error Attributes are dictionaries.
new Element('div', []);
new Element('div', { target: nodes[0] });
// @ts-expect-error Release has no argument.
field.release(nodes[0]);
// @ts-expect-error Attribute removal requires a name.
field.removeAttribute(7);
