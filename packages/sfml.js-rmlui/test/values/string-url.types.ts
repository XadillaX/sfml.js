import {
  URL, StringView, StringIteratorU8, StringUtilities,
  createString, formatString, type FormattedString,
} from '../../src';

const url = new URL('assets/panel.rml');
const setResult: boolean = url.setURL('assets/other.rml');
const text: string = url.getURL();
const parameters: Record<string, string> = url.getParameters();
url.setParameters({ é: '中 😀', ['__proto__']: 'literal key' });
url.setPort(81);
url.setParameter('q', 'text');
url.clearParameters();
const ordered: boolean = url.lessThan(new URL('z.rml'));

const urlUpdates: boolean[] = [
  url.setProtocol('https'), url.setLogin('reader'), url.setPassword('secret'),
  url.setHost('example.test'), url.setPath('assets/'), url.prefixPath('../'),
  url.setFileName('panel'), url.setExtension('rml'),
];
const urlParts: string[] = [
  url.getProtocol(), url.getLogin(), url.getPassword(), url.getHost(),
  url.getPath(), url.getFileName(), url.getExtension(),
  url.getPathedFileName(), url.getQueryString(),
];
const port: number = url.getPort();

const view = new StringView('Aé中😀Z');
const retained: StringView = view.subview(1, 9);
const beginning: number = retained.begin();
const ending: number = retained.end();
const bytes: Uint8Array = retained.toBytes();
const equals: boolean = retained.equals('é中😀');
const iterator = new StringIteratorU8(view, 1, 9);
const character: number = iterator.value();
const position: number = iterator.get();
const moved: StringIteratorU8 = iterator.increment().decrement();

const viewSize: number = view.size();
const viewEmpty: boolean = view.empty();
const viewText: string = view.toString();
const iteratorValid: boolean = iterator.valid();
const iteratorOffset: number = iterator.offset();
const iteratorEqual: boolean = iterator.equals(new StringIteratorU8(view));

const offsets = new Int32Array([ 0, 1, 2 ]);
const converted: Int32Array =
  StringUtilities.convertCharacterOffsetsToByteOffsets(view, offsets);
StringUtilities.convertByteOffsetsToCharacterOffsets(view, offsets, converted);
const expanded: string[] =
  StringUtilities.expandString('a,(b,c)', ',', '(', ')', true);
const defaultQuotes: string[] =
  StringUtilities.expandString('a,,b', ',', true);
const utf8: string = StringUtilities.toUTF8(new Uint32Array([ 0x1f600 ]));
const scalar: string = StringUtilities.toUTF8(0x1f600);
const replacement: string = StringUtilities.replace(view, 'A', 'B');
const byteReplacement: string = StringUtilities.replace(view, 65, 66);
const decoded: string = URL.urlDecode(URL.urlEncode('é\0😀'));
const formatted: FormattedString = formatString('%s:%d', 'é', 7);
const created: string = createString('%*.*f', 8, 2, 1.25);

const normalised: string[] = [
  StringUtilities.toLower(view), StringUtilities.toUpper('é'),
  StringUtilities.encodeRml(view), StringUtilities.decodeRml('&amp;'),
  StringUtilities.stripWhitespace(view),
  StringUtilities.trimTrailingDotZeros('1.200'),
  StringUtilities.joinString([ 'é', '中' ], ',', 'prefix:'),
];
const comparisons: boolean[] = [
  StringUtilities.isWhitespace(' '), StringUtilities.startsWith(view, 'A'),
  StringUtilities.endsWith(view, new StringView('Z')),
  StringUtilities.stringCompareCaseInsensitive(view, 'aé中😀z'),
];
const unicodeOffsets: number[] = [
  StringUtilities.toCharacter(view, 1), StringUtilities.bytesUTF8(0x1f600),
  StringUtilities.lengthUTF8(view), StringUtilities.seekForwardUTF8(view, 1),
  StringUtilities.seekBackwardUTF8(view, 10),
  StringUtilities.convertCharacterOffsetToByteOffset(view, 3),
  StringUtilities.convertByteOffsetToCharacterOffset(view, 6),
];

// @ts-expect-error Native URL setters require strings.
url.setHost(7);
// @ts-expect-error Native parameters require string values.
url.setParameters({ q: 7 });
// @ts-expect-error Batched offsets require Int32Array.
StringUtilities.convertCharacterOffsetsToByteOffsets(view, [ 0, 1 ]);
// @ts-expect-error The cached batch API requires a retained StringView.
StringUtilities.convertByteOffsetsToCharacterOffsets('é', offsets);
// @ts-expect-error Encoding codepoint arrays requires Uint32Array.
StringUtilities.toUTF8([ 65 ]);
// @ts-expect-error Typed formatting accepts scalar numbers and strings.
createString('%s', { text: 'value' });
// @ts-expect-error Iterator identity requires another native-backed iterator.
iterator.equals(view);
// @ts-expect-error StringInput is text or an owned StringView.
StringUtilities.toLower(new Uint8Array());
// @ts-expect-error Native byte offsets must be numeric.
StringUtilities.seekForwardUTF8(view, 'next');
// @ts-expect-error Joining strings rejects arrays of codepoints.
StringUtilities.joinString([ 65 ]);

void [
  setResult, text, parameters, ordered, bytes, equals, character, position,
  moved, converted, expanded, defaultQuotes, utf8, scalar, replacement,
  byteReplacement, decoded, formatted, created, beginning, ending,
  urlUpdates, urlParts, port, viewSize, viewEmpty, viewText, iteratorValid,
  iteratorOffset, iteratorEqual, normalised, comparisons, unicodeOffsets,
];
