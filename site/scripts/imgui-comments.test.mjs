import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Application, OptionDefaults, ReflectionKind } from 'typedoc';
import { parse } from 'parse5';
import { localizeProject } from './typedoc/localize.mjs';
import { registerSiteTheme } from './typedoc/theme.mjs';

const source = fileURLToPath(
  new URL('../../packages/sfml.js-imgui/src/index.ts', import.meta.url)
);
const tsconfig = fileURLToPath(
  new URL('../../packages/sfml.js-imgui/tsconfig.json', import.meta.url)
);
const text = parts => (parts || []).map(part => part.text).join('');
const domText = node =>
  node.value || (node.childNodes || []).map(domText).join('');
const classes = node =>
  node.attrs?.find(attr => attr.name === 'class')?.value.split(' ') || [];
const elements = (node, predicate) => [
  ...(predicate(node) ? [ node ] : []),
  ...(node.childNodes || []).flatMap(child => elements(child, predicate)),
];
const scripts = {
  en: /[a-z]/i,
  zh: /\p{Script=Han}/u,
  ja: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
  ko: /\p{Script=Hangul}/u,
};

for (const locale of Object.keys(scripts)) {
  test(
    `${locale} public API and overview share structured declaration comments`,
    async () => {
      const app = await Application.bootstrap({
        name: 'sfml.js-imgui',
        entryPoints: [ source ],
        tsconfig,
        readme: 'none',
        excludeInternal: true,
        logLevel: 'Error',
        blockTags: [ ...OptionDefaults.blockTags, '@zh', '@ja', '@ko' ],
      });
      const project = await app.convert();
      assert.ok(project);
      localizeProject(project, locale);
      const imgui = project.getChildByName('ImGui');
      assert.ok(imgui, 'The public ImGui namespace must be documented');
      for (const name of [ 'Begin', 'BeginChild', 'Button', 'ButtonEx' ]) {
        const signature = imgui.getChildByName(name).signatures[0];
        const summary = text(signature.comment?.summary);
        assert.ok(
          summary.length > 0 && summary.length < 180,
          `${name}: overview must contain a concise purpose, got ${summary}`
        );
        assert.match(summary, scripts[locale]);
        for (const parameter of signature.parameters) {
          assert.match(
            text(parameter.comment?.summary),
            scripts[locale],
            `${name}.${parameter.name}: missing parameter description`
          );
        }
        assert.match(
          text(signature.comment.getTag('@returns')?.content),
          scripts[locale],
          `${name}: missing return semantics`
        );
      }
      const begin = imgui.getChildByName('Begin').signatures[0];
      const remarks = text(begin.comment.getTag('@remarks')?.content);
      assert.match(remarks, /End/);
      assert.match(
        remarks,
        /\n(?:\n|- )/,
        'Usage instructions must retain paragraphs or list boundaries'
      );
      const open = begin.parameters.find(
        parameter => parameter.name === 'p_open'
      );
      assert.match(
        text(open.comment.summary),
        /(?:Uint8Array|\[0\])/,
        'The open flag must describe the JavaScript reference representation'
      );
      for (const reflection of Object.values(project.reflections)) {
        assert.ok(
          !reflection.comment?.blockTags.some(tag =>
            /^@(zh|ja|ko)$/.test(tag.tag)
          ),
          'Locale tags must not leak into rendered API sections'
        );
        const sections = [
          reflection.comment?.summary,
          ...(reflection.comment?.blockTags.map(tag => tag.content) || []),
        ];
        for (const section of sections) {
          const description = text(section);
          assert.doesNotMatch(
            description,
            new RegExp([
              /\b(?:bool|float|int|char|void)\s*\*/.source,
              /\b(?:NULL|nullptr|FLT_MAX|INT_MAX|INT_MIN)\b/.source,
              /\bIm\w*::/.source,
              /(?<![.\w])ImGui\w+_(?:\b|[A-Z])/.source,
            ].join('|')),
            `${reflection.getFullName()}: describe the JavaScript API`
          );
          assert.doesNotMatch(
            description,
            /\bImGuiMod\./,
            `${reflection.getFullName()}: modifiers belong to ImGuiKey`
          );
          for (const [ , name, wildcard ] of description.matchAll(
            /\bImGui\.([A-Za-z_]\w*)(\*)?/g
          )) {
            assert.ok(
              wildcard
                ? imgui.children.some(child => child.name.startsWith(name))
                : imgui.getChildByName(name),
              `${reflection.getFullName()}: unknown public API ImGui.${name}`
            );
          }
        }
      }
      for (const fn of imgui.children) {
        for (const signature of fn.signatures || []) {
          assert.match(
            text(signature.comment?.summary),
            scripts[locale],
            `${fn.name}: missing function purpose`
          );
          for (const parameter of signature.parameters || []) {
            assert.match(
              text(parameter.comment?.summary),
              scripts[locale],
              `${fn.name}.${parameter.name}: missing parameter contract`
            );
          }
          if (signature.type?.name !== 'void') {
            assert.match(
              text(signature.comment?.getTag('@returns')?.content),
              scripts[locale],
              `${fn.name}: missing return contract`
            );
          }
        }
      }
      const documentedKinds = [
        ReflectionKind.Class,
        ReflectionKind.Interface,
        ReflectionKind.TypeAlias,
        ReflectionKind.Enum,
        ReflectionKind.EnumMember,
        ReflectionKind.Property,
        ReflectionKind.Accessor,
      ];
      for (const reflection of Object.values(project.reflections)) {
        let owner = reflection;
        while (owner && owner !== imgui) {
          owner = owner.parent;
        }
        if (owner !== imgui || !reflection.kindOf(documentedKinds)) {
          continue;
        }
        if (reflection.flags.isPrivate || reflection.inheritedFrom) {
          continue;
        }
        const comment =
        reflection.comment ??
        reflection.getSignature?.comment ??
        reflection.setSignature?.comment;
        assert.match(
          text(comment?.summary),
          scripts[locale],
          `${reflection.getFullName()}: missing public declaration description`
        );
      }
      registerSiteTheme(app, {
        locale: { id: locale, reference: 'API', contents: 'Contents' },
        languages: [],
        home: '/',
        localeHref: () => '/',
      });
      const directory = await mkdtemp(
        resolve(tmpdir(), 'imgui-overview-test-')
      );
      try {
        await app.generateDocs(project, directory);
        for (const constant of imgui.children.filter(
          item => item.kind === ReflectionKind.Variable
        )) {
          const members =
          constant.type?.typeArguments?.[0]?.declaration?.children;
          if (!members?.length) {
            continue;
          }
          const page = parse(
            await readFile(
              resolve(directory, 'variables', `ImGui.${constant.name}.html`),
              'utf8'
            )
          );
          const content = elements(page, node =>
            classes(node).includes('col-content')
          )[0];
          const signature = elements(content, node =>
            classes(node).includes('tsd-signature')
          )[0];
          assert.match(
            domText(signature),
            /\bReadonly\b/,
            `${constant.name}: keep the declared readonly contract`
          );
          const rendered = domText(content).replace(/\s+/g, '');
          for (const member of members) {
            const description = text(member.comment?.summary).replace(
              /\s+/g,
              ''
            );
            assert.ok(
              description && rendered.includes(description),
              `${constant.name}.${member.name}: ` +
            'missing rendered member description'
            );
          }
        }
        const overview = parse(
          await readFile(resolve(directory, 'index.html'), 'utf8')
        );
        const directories = elements(overview, node =>
          classes(node).includes('tsd-member-summaries')
        );
        const descriptions = directories.flatMap(list =>
          list.childNodes.filter(node => node.tagName === 'dd')
        );
        assert.ok(
          descriptions.length >= imgui.children.length,
          'The overview must include the complete public API directory'
        );
        for (const description of descriptions) {
          assert.ok(
            domText(description).trim().length < 220,
            `Overview contains detailed prose: ${domText(description)}`
          );
          assert.equal(
            elements(description, node =>
              [ 'ul', 'ol', 'h4' ].includes(node.tagName)
            ).length,
            0,
            'Usage details belong on the API detail page'
          );
        }
        const featured = elements(overview, node =>
          classes(node).includes('sf-api-featured')
        );
        const rows = featured.flatMap(list =>
          (list.childNodes || []).filter(node => node.tagName === 'div')
        );
        for (const name of [ 'Begin', 'Button' ]) {
          const row = rows.find(
            node =>
              domText(elements(node, child => child.tagName === 'dt')[0]) ===
            name
          );
          assert.ok(row, `${name}: missing from the actual overview page`);
          const description = elements(row, node => node.tagName === 'dd')[0];
          const expected = text(
            imgui.getChildByName(name).signatures[0].comment.summary
          );
          assert.equal(
            domText(description).trim(),
            expected.trim(),
            `${name}: overview must render only the declaration summary`
          );
          assert.ok(domText(description).trim().length < 180);
        }
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });
}
