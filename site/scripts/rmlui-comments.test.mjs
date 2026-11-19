import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  Application, OptionDefaults, ReflectionKind, i18n, translateTagName,
} from 'typedoc';
import { localizeProject } from './typedoc/localize.mjs';

const packageRoot = new URL('../../packages/sfml.js-rmlui/', import.meta.url);
const config = JSON.parse(readFileSync(
  new URL('../typedoc.json', import.meta.url), 'utf8'
));
const text = parts => (parts || []).map(part => part.text).join('');
const scripts = {
  en: /[a-z]/i,
  zh: /\p{Script=Han}/u,
  ja: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
  ko: /\p{Script=Hangul}/u,
};
const symbolOnlySummary = new RegExp([
  '^(?:对应\\s+|参考\\s+|读取\\s+|设置\\s+|注册\\s+|构造\\s+)?',
  '(?:(?:Native-owned|Assign|Read|Get|Set|Register|Create|Construct)\\s+)?',
  'Rml::[\\w:]+(?:\\([^)]*\\))?',
  '(?:\\s+(?:type|value|inheritType|inheritValue))?',
  '(?:\\s*[（(]\\d+[）)])?',
  '(?:\\.|。|\\s+(?:に対応します|を(?:取得|設定|登録|読み取|読み|構築)します)。?',
  '|[을를]\\s*(?:읽습니다|가져옵니다|(?:설정|등록|생성)합니다)\\.',
  '|에\\s*(?:해당|대응)합니다\\.|입니다\\.)?$',
].join(''), 'u');

for (const [ locale, script ] of Object.entries(scripts)) {
  test(`RmlUi public contracts are complete in ${locale}`, async () => {
    const app = await Application.bootstrap({
      name: 'sfml.js-rmlui',
      lang: locale,
      locales: config.locales,
      entryPoints: [ fileURLToPath(new URL('src/index.ts', packageRoot)) ],
      tsconfig: fileURLToPath(new URL('tsconfig.json', packageRoot)),
      readme: 'none',
      excludeInternal: true,
      excludePrivate: true,
      logLevel: 'Error',
      blockTags: [ ...OptionDefaults.blockTags, '@zh', '@ja', '@ko' ],
    });
    const project = await app.convert();
    assert.ok(project);

    app.validate(project);
    assert.equal(
      app.logger.warningCount, 0,
      'Public contracts must resolve every documented type reference'
    );

    for (const tag of [ '@default', '@remarks', '@throws' ]) {
      assert.match(
        translateTagName(tag), script, `Untranslated ${tag} heading`
      );
    }
    for (const label of [
      i18n.theme_hierarchy_summary(),
      i18n.theme_hierarchy_view_summary(),
    ]) {
      assert.match(label, script, 'Untranslated hierarchy heading');
      assert.doesNotMatch(label, /^theme_/);
    }
    localizeProject(project, locale);
    for (const reflection of Object.values(project.reflections)) {
      if (reflection.kindOf([
        ReflectionKind.Project,
        ReflectionKind.TypeLiteral,
      ])) {
        continue;
      }
      let comment = reflection.comment ??
        reflection.signatures?.[0]?.comment ??
        reflection.getSignature?.comment ??
        reflection.setSignature?.comment;
      // A callable alias owns its call summary. Inline object fields require
      // their own comments, even when their enclosing alias is documented.
      if (!text(comment?.summary) &&
          reflection.kindOf([
            ReflectionKind.CallSignature, ReflectionKind.ConstructorSignature,
          ]) &&
          reflection.parent?.kind === ReflectionKind.TypeLiteral) {
        comment = reflection.parent.parent?.comment;
      }
      const summary = text(comment?.summary);
      assert.match(
        summary, script,
        `${reflection.getFullName()}: missing localized description`
      );
      assert.doesNotMatch(
        summary,
        symbolOnlySummary,
        `${reflection.getFullName()}: explain the API behavior, ` +
          'not only its C++ symbol'
      );
      if (locale === 'zh') {
        assert.doesNotMatch(
          summary, /^对应 (?:Construct|Assign|Shared native|Native-owned)\b/u,
          `${reflection.getFullName()}: translate the behavior ` +
            'instead of wrapping English prose'
        );
      }
      assert.ok(
        summary.length < 220,
        `${reflection.getFullName()}: move details into remarks`
      );
      assert.ok(
        !comment?.blockTags.some(tag => /^@(zh|ja|ko)$/.test(tag.tag)),
        'Translation tags must not appear in the rendered API'
      );
      if (reflection.kindOf([
        ReflectionKind.CallSignature, ReflectionKind.GetSignature,
      ]) && reflection.type?.name !== 'void') {
        assert.match(
          text(comment?.getTag('@returns')?.content), script,
          `${reflection.getFullName()}: missing return contract`
        );
      }
    }
    const context = project.getChildByName('Context');
    for (const name of [ 'update', 'render' ]) {
      const comment = context.getChildByName(name).signatures[0].comment;
      assert.match(text(comment.getTag('@returns')?.content), /true/);
      assert.match(text(comment.getTag('@remarks')?.content), /6\.3/);
    }
    const dimensions = project.getChildByName('ContextDimensions');
    for (const field of dimensions.children) {
      assert.ok(field.flags.isReadonly, 'Dimensions require setDimensions');
    }
    const initialise = project.getChildByName('initialise').signatures[0];
    assert.equal(initialise.parameters[0].type.name, 'RenderWindow');
    const document = project.getChildByName('Document');
    const sourceUrl = document.getChildByName('sourceURL').getSignature;
    assert.match(
      text(sourceUrl.comment.getTag('@returns').content),
      /\[document from memory\]/
    );
    const lookup = project.getChildByName('Element')
      .getChildByName('getElementById').signatures[0];
    assert.match(text(lookup.comment.getTag('@remarks').content), /#document/);
    const render = context.getChildByName('render').signatures[0];
    assert.match(text(render.comment.getTag('@remarks').content), /setView/);
  });
}
