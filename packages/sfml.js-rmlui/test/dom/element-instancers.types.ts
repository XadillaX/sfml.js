import {
  Factory, Element, ElementInstancer, type ElementReleaseSnapshot,
} from '../../src';

declare const parent: Element;
const plain: ElementInstancer | null = Factory.getElementInstancer('*');
const custom = new ElementInstancer((element, tag, attributes) => {
  const proposedParent: Element | null = element;
  return plain!.instanceElement(proposedParent, tag, attributes);
}, snapshot => {
  const released: ElementReleaseSnapshot = snapshot;
  void released;
});
Factory.registerElementInstancer('custom', custom);
Factory.registerElementInstancer('disabled', null);
const allocated: Element | null = custom.instanceElement(parent, 'custom', {
  number: 4n, vector: { x: 4, y: 6 },
});
if (allocated) {
  custom.releaseElement(allocated);
}

// @ts-expect-error Instancers require callable allocation adapters.
new ElementInstancer(4);
// @ts-expect-error Allocation returns checked elements or null.
new ElementInstancer(() => ({}));
// @ts-expect-error Registration requires a typed instancer.
Factory.registerElementInstancer('bad', {});
custom.instanceElement(parent, 'bad', { target: parent });
// @ts-expect-error Native allocation results can be null.
const required: Element = custom.instanceElement(null, 'optional');
void required;
