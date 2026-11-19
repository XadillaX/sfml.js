import { Context, Document } from '../../src';

declare const context: Context;
const memory: Document = context.loadDocumentFromMemory('<rml><body/></rml>');
const named: Document = context.loadDocumentFromMemory(
  '<rml><head/><body/></rml>', 'assets/panel.rml');
const ascii: boolean = context.processTextInput(65);
const unicode: boolean = context.processTextInput(0x10ffff);
const byte: boolean = context.processTextInputChar(127);
context.enableMouseCursor(false);
void [ memory, named, ascii, unicode, byte ];

// @ts-expect-error Source URLs must be strings.
context.loadDocumentFromMemory('<rml><body/></rml>', 123);
// @ts-expect-error Null is not the default source URL.
context.loadDocumentFromMemory('<rml><body/></rml>', null);
// @ts-expect-error Native char input takes a byte, not a string.
context.processTextInputChar('A');
// @ts-expect-error Cursor switches require an explicit boolean.
context.enableMouseCursor(1);
