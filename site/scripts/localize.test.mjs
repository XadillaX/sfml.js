import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Application, OptionDefaults } from 'typedoc';
import { localizeProject } from '../../tools/typedoc/localize.mjs';
import constantDocs from '../../tools/constant-docs.cjs';

const fixture = `
/** A clock.
 * @zh 时钟。
 * @ja 時計。
 * @ko 시계.
 */
export class Clock {
  /** Read {@link Clock}.
   * @zh 读取 {@link Clock}。
   * @ja {@link Clock} を読み取ります。
   * @ko {@link Clock}을 읽습니다.
   * @param unit - The time unit.
   * @zh unit - 时间单位。
   * @ja unit - 時間の単位。
   * @ko unit - 시간 단위.
   * @returns Elapsed time.
   * @zh 经过的时间。
   * @ja 経過時間。
   * @ko 경과 시간.
   * @example
   * \`\`\`ts
   * new Clock().read('seconds');
   * \`\`\`
   */
  read(unit: string): number { return 0; }
}
/** Derived clock.
 * @zh 派生时钟。
 * @ja 派生時計。
 * @ko 파생 시계.
 */
export class Child extends Clock {}
`;

/**
 * Exercise TypeDoc's real parsing, including moved parameter comments.
 * @param {string} source - TypeScript fixture source to convert.
 */
async function convert(source = fixture) {
  const directory = await mkdtemp(resolve(tmpdir(), 'sfml-doc-test-'));
  try {
    const file = resolve(directory, 'index.ts');
    await writeFile(file, source);
    const app = await Application.bootstrap({
      entryPoints: [ file ], readme: 'none', logLevel: 'Error',
      blockTags: [ ...OptionDefaults.blockTags, '@zh', '@ja', '@ko' ],
    });
    app.options.setCompilerOptions([ file ], { skipLibCheck: true }, undefined);
    const project = await app.convert();
    assert.ok(project);
    return project;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

const text = parts => parts.map(part => part.text).join('');

test('production plugin retains locale tags after ' +
     'TypeDoc resets bootstrap options', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'sfml-plugin-test-'));
  try {
    const file = resolve(directory, 'index.ts');
    await writeFile(file, fixture);
    const app = await Application.bootstrapWithPlugins({
      options: fileURLToPath(new URL('../../typedoc.json', import.meta.url)),
      entryPoints: [ file ], lang: 'en', logLevel: 'Error',
    });
    for (const tag of [ '@zh', '@ja', '@ko' ]) {
      assert.ok(
        app.options.getValue('blockTags').includes(tag),
        `${tag} must survive bootstrap`
      );
    }
    const warnings = [];
    app.logger.warn = message => warnings.push(String(message));
    app.options.setCompilerOptions([ file ], { skipLibCheck: true }, undefined);
    const project = await app.convert();
    assert.ok(project);
    assert.deepEqual(warnings, []);
    localizeProject(project, 'zh');
    assert.equal(text(project.getChildByName('Clock').comment.summary), '时钟。');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('renders translated summaries, parameters, ' +
     'returns and inherited comments without locale ' +
     'tags', async () => {
  const project = await convert();
  localizeProject(project, 'ko');
  const clock = project.getChildByName('Clock');
  const method = clock.getChildByName('read').signatures[0];
  assert.equal(text(clock.comment.summary), '시계.');
  assert.equal(text(method.comment.summary), 'Clock을 읽습니다.');
  assert.equal(text(method.parameters[0].comment.summary), '시간 단위.');
  assert.equal(text(method.comment.getTag('@returns').content), '경과 시간.');
  assert.match(text(method.comment.getTag('@example').content), /new Clock/);
  assert.ok(
    method.comment.summary.some(
      part => part.kind === 'inline-tag' && part.target === clock
    )
  );
  const inherited = project
    .getChildByName('Child')
    .getChildByName('read').signatures[0];
  assert.equal(text(inherited.comment.summary), 'Clock을 읽습니다.');
  for (const reflection of Object.values(project.reflections)) {
    assert.ok(
      !reflection.comment?.blockTags.some(tag =>
        /^@(zh|ja|ko)$/.test(tag.tag)
      )
    );
  }
});

test('keeps English prose and code while removing ' +
     'translation tags', async () => {
  const project = await convert();
  localizeProject(project, 'en');
  const method = project
    .getChildByName('Clock')
    .getChildByName('read').signatures[0];
  assert.equal(text(method.comment.summary), 'Read Clock.');
  assert.equal(text(method.parameters[0].comment.summary), 'The time unit.');
  assert.equal(
    text(method.comment.getTag('@returns').content),
    'Elapsed time.'
  );
  assert.ok(!method.comment.blockTags.some(tag => tag.tag === '@ko'));
});

test('rejects a missing translation with the affected API name', async () => {
  const project = await convert(
    '/** Untranslated. */ export const missing = 1;'
  );
  assert.throws(() => localizeProject(project, 'ja'), /Missing @ja.*missing/s);
});

test('does not use another API translation to ' +
     'conceal a partially translated comment', async () => {
  const project = await convert(`
/** Shared.
 * @zh 共享。
 * @ja 共有。
 * @ko 공유.
 */
export const complete = 1;
/** Shared.
 * @zh 共享。
 */
export const partial = 2;`);
  assert.throws(() => localizeProject(project, 'ko'), /partial/);
});

test('literal grave key symbols do not swallow ' +
     'generated locale tags', async () => {
  const source = constantDocs.constantDoc('The ` key') +
    '\nexport const grave = 1;\n' +
    constantDocs.constantDoc('Keyboard ` and ~ key') +
    '\nexport const scan = 2;\n';
  for (const [ locale, expected ] of [
    [ 'zh', '键盘上的 ` 和 ~ 键' ],
    [ 'ja', 'キーボードの ` と ~ のキー' ],
    [ 'ko', '키보드의 ` 및 ~ 키' ],
  ]) {
    const project = await convert(source);
    localizeProject(project, locale);
    assert.equal(
      text(project.getChildByName('scan').comment.summary),
      expected
    );
  }
});

test('requires each locally declared parameter ' +
     'translation even when descriptions match', async () => {
  const project = await convert(`
/** Combine values.
 * @zh 合并值。
 * @ja 値を結合します。
 * @ko 값을 결합합니다.
 * @param first - A value.
 * @zh first - 第一个值。
 * @ja first - 最初の値。
 * @ko first - 첫 번째 값.
 * @param second - A value.
 */
export function combine(first: number, second: number): void {}
`);
  assert.throws(() => localizeProject(project, 'ko'), /second/);
});

test('rejects duplicate bindings instead of ' +
     'silently overwriting a parameter translation', async () => {
  const project = await convert(`
/** Combine.
 * @zh 合并。
 * @ja 結合。
 * @ko 결합.
 * @param first - A value.
 * @zh first - 第一个值。
 * @zh first - 第二个值。
 */
export function combine(first: number): void {}
`);
  assert.throws(() => localizeProject(project, 'zh'), /Duplicate.*first/);
});

test('rejects translated summaries and parameters ' +
     'with no English source prose', async () => {
  for (const source of [
    '/** @zh 中文。 */ export const missingEnglish = 1;',
    `/** A function.
     * @param value
     * @zh value - 参数。
     */
     export function missingEnglish(value: number): void {}`,
  ]) {
    const project = await convert(source);
    assert.throws(() => localizeProject(project, 'en'), /Missing English/);
  }
});

test('localizes an inline link label even when it ' +
     'is the entire summary', async () => {
  const project = await convert(`
/** {@link target | Read this}
 * @zh {@link target | 阅读}
 * @ja {@link target | 読む}
 * @ko {@link target | 읽기}
 */
export const link = 1;
/** The target.
 * @zh 目标。
 * @ja 対象。
 * @ko 대상.
 */
export const target = 2;
`);
  localizeProject(project, 'ko');
  assert.equal(text(project.getChildByName('link').comment.summary), '읽기');
});
