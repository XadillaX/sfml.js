import { Application, Renderer } from 'typedoc';
import { externalTranslations } from './external.mjs';

const localeTags = new Set([ '@zh', '@ja', '@ko' ]);
const textOf = parts => (parts || []).map(part => part.text).join('');
const clone = parts => (parts || []).map(part => ({ ...part }));
const hasProse = parts => (parts || []).some(part =>
  [ 'text', 'inline-tag' ].includes(part.kind) && /\S/.test(part.text) &&
  !/^https?:\/\/\S+$/.test(part.text.trim()));

/**
 * Consume the locale tags immediately following one source section.
 * @param {object[]} tags - Documentation tags.
 * @param {number} start - First tag index.
 * @param {string} name - API name used in validation errors.
 */
function followers(tags, start, name) {
  const translations = new Map();
  while (start < tags.length && localeTags.has(tags[start].tag)) {
    if (translations.has(tags[start].tag)) {
      throw new Error(`Duplicate ${tags[start].tag} in ${name}`);
    }
    translations.set(tags[start].tag, tags[start].content);
    start++;
  }
  return { translations, next: start };
}

/**
 * Only inherited declarations may recover translations from their source.
 * @param {object} reflection - TypeDoc reflection to inspect.
 */
function isInherited(reflection) {
  for (
    let current = reflection;
    current;
    current = current.parent
  ) {
    if (current.inheritedFrom) {
      return true;
    }
  }
  return false;
}

/**
 * Remove the parameter prefix without flattening inline links or code.
 * @param {object[]} parts - Documentation display parts.
 * @param {number} length - Text length to remove.
 */
function withoutPrefix(parts, length) {
  return clone(parts).map(part => {
    const removed = Math.min(length, part.text.length);
    length -= removed;
    return { ...part, text: part.text.slice(removed) };
  }).filter(part => part.text);
}

/**
 * Apply source @zh/@ja/@ko tags after TypeDoc resolves links and inheritance.
 * Parameters have already been moved to their own reflections by TypeDoc.
 * @param {object} project - Converted TypeDoc project.
 * @param {string} locale - Documentation language code.
 */
export function localizeProject(project, locale) {
  if (![ 'en', 'zh', 'ja', 'ko' ].includes(locale)) {
    throw new Error(`Unsupported API locale: ${locale}`);
  }
  const records = new Map();
  const parameters = new Map();
  const catalog = new Map();

  for (const reflection of Object.values(project.reflections)) {
    const comment = reflection.comment;
    if (!comment || records.has(comment)) {
      continue;
    }
    const targets = [
      ...(reflection.parameters || []), ...(reflection.typeParameters || []),
    ];
    const tags = [];
    for (const tag of comment.blockTags) {
      const match = localeTags.has(tag.tag) &&
        textOf(tag.content).match(/^([^\s]+)\s+-\s*/);
      const target = match && targets.find(item => item.name === match[1]);
      if (target) {
        if (!target.comment) {
          throw new Error(
            `Missing English: ${reflection.getFullName()} ` +
            `parameter ${target.name}`
          );
        }
        const translations = parameters.get(target.comment) || new Map();
        if (translations.has(tag.tag)) {
          throw new Error(
            `Duplicate ${tag.tag} parameter ${target.name} ` +
            `in ${reflection.getFullName()}`
          );
        }
        translations.set(tag.tag, withoutPrefix(tag.content, match[0].length));
        parameters.set(target.comment, translations);
      } else {
        tags.push(tag);
      }
    }
    const summary = followers(tags, 0, reflection.getFullName());
    const external = externalTranslations(reflection);
    if (external) {
      summary.translations = external;
    }
    const sections = [
      {
        source: comment.summary,
        translations: summary.translations,
        assign: parts => {
          comment.summary = parts;
        },
        label: 'summary',
      },
    ];
    const output = [];
    let index = summary.next;
    while (index < tags.length) {
      const tag = tags[index];
      if (localeTags.has(tag.tag)) {
        throw new Error(`Orphan ${tag.tag} in ${reflection.getFullName()}`);
      }
      const next = followers(tags, index + 1, reflection.getFullName());
      sections.push({
        source: tag.content, translations: next.translations, label: tag.tag,
        assign: parts => { tag.content = parts; },
      });
      output.push(tag);
      index = next.next;
    }
    records.set(comment, {
      reflection, sections, output,
      allowCatalog: isInherited(reflection) &&
        !comment.blockTags.some(tag => localeTags.has(tag.tag)),
    });
  }

  // Collect before mutating so inherited comments can reuse original prose.
  for (const [ comment, record ] of records) {
    const parameter = parameters.get(comment);
    if (parameter) {
      record.sections[0].translations = parameter;
      record.allowCatalog = false;
    }
    for (const section of record.sections) {
      const source = textOf(section.source);
      for (const [ tag, parts ] of section.translations) {
        const key = `${tag}\0${source}`;
        const existing = catalog.get(key);
        // Ambiguous prose must have a local translation, never an
        // arbitrary one.
        if (existing && textOf(existing) !== textOf(parts)) {
          catalog.set(key, null);
        } else if (!catalog.has(key)) {
          catalog.set(key, parts);
        }
      }
    }
  }

  const missing = [];
  for (const [ comment, record ] of records) {
    for (const section of record.sections) {
      if (
        section.translations.size &&
        !textOf(section.source).trim()
      ) {
        throw new Error(
          `Missing English: ${record.reflection.getFullName()} ${section.label}`
        );
      }
      if (locale === 'en' || !hasProse(section.source)) {
        continue;
      }
      const tag = `@${locale}`;
      const localized =
        section.translations.get(tag) ||
        (record.allowCatalog &&
          catalog.get(`${tag}\0${textOf(section.source)}`));
      if (localized && hasProse(localized)) {
        section.assign(clone(localized));
      } else {
        missing.push(
          `${record.reflection.getFullName()}: ${section.label}`
        );
      }
    }
    comment.blockTags = record.output;
  }
  if (missing.length) {
    throw new Error(
      `Missing @${locale} TypeDoc translations:\n- ${missing.join('\n- ')}`
    );
  }
}

/**
 * Register tags before conversion and select the requested renderer language.
 * @param {object} app - TypeDoc application.
 */
export function load(app) {
  // Plugin loading precedes a bootstrap options reset; register
  // after it completes.
  app.on(Application.EVENT_BOOTSTRAP_END, () => {
    app.options.setValue('blockTags', [
      ...new Set([ ...app.options.getValue('blockTags'), ...localeTags ]),
    ]);
  });
  app.renderer.on(Renderer.EVENT_BEGIN, ({ project }) => {
    localizeProject(project, app.options.getValue('lang'));
  });
}
