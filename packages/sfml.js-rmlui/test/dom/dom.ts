import { Document, Element } from '../../src';

declare const document: Document;
declare const parent: Element;
declare const child: Element;
const created: Element | null = document.createElement('div');
const text: Element | null = document.createTextNode('Unicode 🌙');
const clone: Element | null = child.clone();
const appended: Element = parent.appendChild(child, false);
const inserted: Element = parent.insertBefore(child, null);
const replaced: Element | null = parent.replaceChild(child, null);
const removed: Element | null = parent.removeChild(child);
const nodes: Element[] = parent.querySelectorAll('div');
const byTag: Element[] = parent.getElementsByTagName('div');
const byClass: Element[] = parent.getElementsByClassName('active');
const ancestor: Element | null = child.closest('body');
const match: boolean = child.matches('.active');
const contains: boolean = parent.contains(null);
const relatives: Array<Element | null> = [
  child.getParentNode(), child.getNextSibling(), child.getPreviousSibling(),
  parent.getFirstChild(), parent.getLastChild(), parent.getChild(0),
];
const count: number = parent.getNumChildren(true);
const hasChildren: boolean = parent.hasChildNodes();
void [
  created, text, clone, appended, inserted, replaced, removed, nodes,
  byTag, byClass, ancestor, match, contains, relatives, count, hasChildren,
];

// @ts-expect-error Ownership APIs accept element wrappers, not strings.
parent.appendChild('div');
// @ts-expect-error DOM membership is a boolean.
parent.appendChild(child, 'non-dom');
// @ts-expect-error The reference must be an element or explicit null.
parent.insertBefore(child, 1);
// @ts-expect-error Count options are boolean, not option records.
parent.getNumChildren({ internal: true });
