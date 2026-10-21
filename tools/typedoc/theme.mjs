import { DefaultTheme, JSX, ReflectionKind } from 'typedoc';
import { modules, referenceLabels } from './labels.mjs';
import { createGameIcons } from './icons.mjs';

const element = JSX.createElement;

/**
 * Reuse the locally vendored Game-icons assets in the API toolbar.
 * @param {string} name - Resource or icon name.
 * @param {string} className - Additional CSS classes.
 */
function icon(name, className = '') {
  return element('span', {
    'aria-hidden': 'true',
    class: `game-icon gi-${name} ${className}`.trim(),
  });
}

/**
 * Resolve a module from sources, including namespace-owned declarations.
 * @param {object} reflection - TypeDoc reflection to inspect.
 */
function moduleOf(reflection) {
  for (let item = reflection; item && !item.isProject(); item = item.parent) {
    for (const source of item.sources || []) {
      const filename = (source.fullFileName || source.fileName)
        .replaceAll('\\', '/');
      const match = filename.match(
        /(?:^|\/)src\/(system|window|graphics|audio|network)\//
      );
      if (match) return match[1];

      // Shared scalar and readonly-value types belong with System.
      if (/(?:^|\/)src\/internal\//.test(filename)) return 'system';
    }
  }

  return 'other';
}

/**
 * Collect separately addressable APIs, including nested namespace exports.
 * @param {object} context - TypeDoc rendering context.
 * @param {object} container - Reflection containing child declarations.
 */
function documentMembers(context, container) {
  return (container.children || []).flatMap(child => [
    ...(context.router.hasOwnDocument(child) ? [ child ] : []),
    ...documentMembers(context, child),
  ]);
}

/**
 * Preserve TypeDoc group/category ordering in the compact member directory.
 * @param {object} model - Reflection whose members are listed.
 */
function memberSections(model) {
  if (model.categories?.length) return model.categories;

  if (model.groups?.length) {
    return model.groups.flatMap(group => (group.categories?.length
      ? group.categories.map(category => ({
        ...category,
        title: `${group.title} · ${category.title}`,
      }))
      : [ group ]));
  }

  return [{ title: '', children: model.childrenIncludingDocuments || [] }];
}

/**
 * Keep namespace-qualified names distinct in cross-module lists.
 * @param {object} reflection - TypeDoc reflection to inspect.
 */
function apiName(reflection) {
  const names = [ reflection.name ];
  for (
    let parent = reflection.parent;
    parent && !parent.isProject();
    parent = parent.parent
  ) {
    names.unshift(parent.name);
  }

  return names.join('.');
}

/**
 * Register the shared site shell and structure for API reference pages.
 * @param {object} app - TypeDoc application.
 * @param {object} options - Rendering options.
 * @param {object} options.locale - Current language labels.
 * @param {object[]} options.languages - Available language definitions.
 * @param {string} options.home - Project home URL.
 * @param {Function} options.localeHref - Resolve a localized page URL.
 */
export function registerSiteTheme(
  app, { locale, languages, home, localeHref }
) {
  const labels = referenceLabels[locale.id] || referenceLabels.en;

  class SiteTheme extends DefaultTheme {
    /**
     * Use the catalog artwork before TypeDoc creates any icon references.
     * @param {object} renderer - TypeDoc renderer owning this theme.
     */
    constructor(renderer) {
      super(renderer);
      this.icons = createGameIcons(this.icons);
    }

    /**
     * Reorganize pages while preserving signatures, anchors and search.
     * @param {object} page - Page being rendered.
     */
    getRenderContext(page) {
      const context = super.getRenderContext(page);
      const allMembers = documentMembers(context, page.project);
      const moduleGroups = [
        ...modules,
        ...(allMembers.some(item => moduleOf(item) === 'other')
          ? [{ id: 'other', name: labels.other, featured: [] }] : []),
      ].map((module, index) => ({
        ...module,
        description: labels.moduleDescriptions[index],
        children: allMembers.filter(item => moduleOf(item) === module.id)
          .sort((a, b) => apiName(a).localeCompare(apiName(b), 'en')),
      })).filter(module => module.children.length);
      const activeModule = !page.model.isProject() &&
        moduleGroups.find(module => module.id === moduleOf(page.model));
      const nativeIndex = context.index;
      const nativeSources = context.memberSources;
      const nativeHierarchy = context.hierarchy;
      const nativeModule = context.moduleReflection;
      const nativeHeader = context.header;
      const nativeMember = context.member;

      context.header = props => {
        if (props.url === 'hierarchy.html' || props.model.isDocument()) {
          return nativeHeader(props);
        }

        const isProject = props.model.isProject();
        return element('div', { class: 'tsd-page-title sf-api-title' },
          element('nav', {
            class: 'sf-api-breadcrumb', 'aria-label': locale.reference,
          },
          element('a', {
            href: context.relativeURL('index.html'),
          }, locale.reference),
          activeModule && element(JSX.Fragment, null,
            element('span', { 'aria-hidden': 'true' }, '/'),
            element('a', {
              href: context.relativeURL('index.html') +
                `#module-${activeModule.id}`,
            }, activeModule.name)),
          !isProject && element('span', { class: 'sf-api-kind' },
            ReflectionKind.singularString(props.model.kind))),
          element('h1', {
            class: props.model.isDeprecated() ? 'deprecated' : undefined,
          },
          isProject ? labels.overview : apiName(props.model),
          props.model.typeParameters?.length &&
            element('span', { class: 'sf-api-type-params' },
              '<',
              props.model.typeParameters.map(item => item.name).join(', '),
              '>')),
          context.reflectionFlags(props.model));
      };

      context.navigation = () => element('nav', {
        id: 'sf-api-module-nav',
        class: 'tsd-navigation sf-api-module-nav',
        'aria-label': labels.modules,
      },
      element('a', {
        href: context.relativeURL('index.html'),
        class: 'sf-api-overview' + (page.model.isProject() ? ' current' : ''),
        'aria-current': page.model.isProject() ? 'page' : undefined,
      }, labels.overview),
      element('div', { class: 'sf-api-nav-label' }, labels.modules),
      ...moduleGroups.map(module => {
        const kindOrder = [
          ReflectionKind.Class, ReflectionKind.Interface,
          ReflectionKind.Namespace, ReflectionKind.Enum,
          ReflectionKind.TypeAlias, ReflectionKind.Function,
          ReflectionKind.Variable,
        ];
        const kinds = [ ...new Set(module.children.map(item => item.kind)) ]
          .sort((a, b) => kindOrder.indexOf(a) - kindOrder.indexOf(b));

        return element('details', {
          class: 'sf-api-module',
          'data-module': module.id,
          open: module.id === activeModule?.id,
        },
        element('summary', null,
          module.id !== 'other' && icon(module.id),
          element('span', null, module.name),
          icon('arrow', 'sf-api-disclosure')),
        ...kinds.map(kind => element('details', {
          class: 'sf-api-nav-kind',
          open: module.id === activeModule?.id && page.model.kind === kind,
        },
        element('summary', null,
          ReflectionKind.pluralString(kind),
          icon('arrow', 'sf-api-disclosure')),
        element('ul', null, ...module.children
          .filter(item => item.kind === kind)
          .map(item => element('li', null, element('a', {
            href: context.urlTo(item),
            class: context.getReflectionClasses(item) +
              (item === page.model ? ' current' : ''),
            'aria-current': item === page.model ? 'page' : undefined,
          }, apiName(item)))))
        )));
      }));

      context.index = model => {
        if (!model.childrenIncludingDocuments?.length) {
          return nativeIndex(model);
        }

        const sections = memberSections(model);
        return element('details', { class: 'sf-api-member-index' },
          element('summary', null, labels.members,
            element('span', { class: 'sf-api-count' },
              String(model.childrenIncludingDocuments.length)),
            icon('arrow', 'sf-api-disclosure')),
          ...sections.map(section =>
            element('section', { class: 'sf-api-index-section' },
              section.title && element('h3', null, section.title),
              section.description && element(JSX.Raw, {
                html: context.markdown(section.description),
              }),
              element('ul', null, ...section.children.map(item =>
                element('li', { class: context.getReflectionClasses(item) },
                  element('a', { href: context.urlTo(item) },
                    item.name,
                    item.flags?.isStatic &&
                      element('span', { class: 'sf-api-inline-flag' }, 'static')
                  )
                )
              ))
            )
          ));
      };

      context.memberSources = model => {
        if (!model.sources?.length && !model.implementationOf &&
            !model.inheritedFrom && !model.overwrites) {
          return null;
        }

        return element('details', { class: 'sf-api-source' },
          element('summary', null,
            labels.source, icon('arrow', 'sf-api-disclosure')),
          nativeSources(model));
      };

      context.hierarchy = hierarchy =>
        hierarchy && element('details', { class: 'sf-api-hierarchy' },
          element('summary', null,
            labels.hierarchy, icon('arrow', 'sf-api-disclosure')),
          nativeHierarchy(hierarchy));

      context.pageNavigation = props => element('nav', {
        class: 'tsd-page-navigation sf-api-page-nav',
        'aria-label': locale.contents,
      },
      props.pageSections.some(section => section.headings.length) &&
        element('h3', null, locale.contents),
      ...props.pageSections.filter(section => section.headings.length)
        .map(section => {
          const links = element('ul', null,
            ...section.headings.map(heading => element('li', null,
              element('a', {
                href: heading.link, class: heading.classes,
              }, heading.text))));

          return section.title ? element('details', {
            class: 'tsd-accordion tsd-page-navigation-section',
            open: section.title !== labels.symbols,
          },
          element('summary', {
            class: 'tsd-accordion-summary',
            'data-key': `section-${section.title}`,
          }, section.title, icon('arrow', 'sf-api-disclosure')),
          element('div', null, links)) : links;
        }));

      context.pageSidebar = props => element(JSX.Fragment, null,
        context.pageNavigation(props), context.settings());

      context.member = model => (model.kind === ReflectionKind.EnumMember
        ? element('div', { class: 'sf-api-enum-member' }, nativeMember(model))
        : nativeMember(model));

      context.members = model => {
        const sections = memberSections(model).map(section => ({
          ...section,
          children: section.children.filter(
            child => !context.router.hasOwnDocument(child)
          ),
        })).filter(section => section.children.length);
        const symbols = sections.flatMap(section =>
          section.children.filter(child => child.name.startsWith('['))
        );
        const primary = sections.map(section => ({
          ...section,
          children: section.children.filter(
            child => !child.name.startsWith('[')
          ),
        })).filter(section => section.children.length);
        if (symbols.length) {
          primary.push({ title: labels.symbols, children: symbols });
        }

        return element(JSX.Fragment, null, ...primary.map(section => {
          if (section.title) page.startNewSection(section.title);

          return element('details', {
            class: 'tsd-panel-group tsd-member-group tsd-accordion',
            open: section.title !== labels.symbols,
          },
          element('summary', {
            class: 'tsd-accordion-summary',
            'data-key': `section-${section.title}`,
          },
          icon('arrow', 'sf-api-disclosure'),
          element('h2', null, section.title || labels.members)),
          element('section', null,
            ...section.children.map(item => context.member(item))));
        }));
      };

      context.memberSignatureBody = (model, { hideSources = false } = {}) => {
        const returns = model.comment?.getTag('@returns');
        return element(JSX.Fragment, null,
          context.reflectionFlags(model),
          context.commentSummary(model),
          model.typeParameters?.length &&
            context.typeParameters(model.typeParameters),
          model.parameters?.length &&
            element('section', { class: 'sf-api-parameters' },
              element('h4', null, labels.parameters),
              element('dl', null, ...model.parameters.map(parameter =>
                element('div', { class: 'sf-api-parameter' },
                  element('dt', null,
                    element('code', null,
                      parameter.flags.isRest ? '...' : '', parameter.name),
                    context.reflectionFlags(parameter)),
                  element('dd', null,
                    element('div', { class: 'sf-api-parameter-type' },
                      context.type(parameter.type),
                      parameter.defaultValue != null &&
                        element('span', { class: 'sf-api-default' },
                          ' = ', parameter.defaultValue)),
                    context.commentSummary(parameter),
                    context.commentTags(parameter),
                    context.typeDetailsIfUseful(parameter, parameter.type))
                )
              ))
            ),
          model.type && element('section', { class: 'sf-api-returns' },
            element('h4', null, labels.returns),
            element('div', { class: 'sf-api-return-body' },
              element('div', { class: 'sf-api-parameter-type' },
                context.type(model.type)),
              returns && element(JSX.Raw, {
                html: context.markdown(returns.content),
              }),
              context.typeDetailsIfUseful(model, model.type))),
          context.commentTags(model),
          !hideSources && context.memberSources(model));
      };

      context.moduleReflection = model => {
        if (!model.isProject()) return nativeModule(model);

        return element('div', { class: 'sf-api-overview-content' },
          element('p', { class: 'sf-api-intro' }, labels.intro),
          ...moduleGroups.map(module => {
            const anchor = `module-${module.id}`;
            page.pageHeadings.push({
              link: `#${anchor}`, text: module.name, level: 2,
            });
            const featured = module.featured.map(name =>
              module.children.find(item => apiName(item) === name)
            ).filter(Boolean);

            return element('section', {
              class: 'sf-api-module-section', id: anchor,
            },
            element('div', { class: 'sf-api-module-heading' },
              module.id !== 'other' && icon(module.id),
              element('h2', null, module.name)),
            module.description && element('p', null, module.description),
            element('dl', { class: 'sf-api-featured' },
              ...featured.map(item => element('div', null,
                element('dt', null,
                  element('a', { href: context.urlTo(item) }, item.name)),
                element('dd', null, context.commentShortSummary(item))))),
            element('details', { class: 'sf-api-all-exports' },
              element('summary', null, labels.all,
                element('span', { class: 'sf-api-count' },
                  String(module.children.length)),
                icon('arrow', 'sf-api-disclosure')),
              element('dl', { class: 'tsd-member-summaries' },
                // Native summaries retain legacy anchors and descriptions.
                ...module.children.map(item => {
                  const headingCount = page.pageHeadings.length;
                  const summary = context.moduleMemberSummary(item);
                  // The overview navigation contains modules.
                  page.pageHeadings.splice(headingCount);
                  return summary;
                }))));
          }));
      };

      const footer = context.footer;
      context.footer = () => element(JSX.Fragment, null,
        footer(),
        element('p', { class: 'sf-icon-credits' }, 'Icons made by ',
          element('a', { href: 'https://lorcblog.blogspot.com/' }, 'Lorc'),
          ', ',
          element('a', { href: 'https://delapouite.com/' }, 'Delapouite'),
          ' & Skoll · ',
          element('a', { href: 'https://game-icons.net/' }, 'game-icons.net'),
          ' · ',
          element('a', {
            href: 'https://creativecommons.org/licenses/by/3.0/',
          }, 'CC BY 3.0')));

      context.toolbar = () => element('header', { class: 'sf-api-header' },
        element('div', { class: 'sf-api-header-inner' },
          element('a', {
            class: 'sf-api-logo', href: home, 'aria-label': 'sfml.js',
          },
          element('img', {
            class: 'sf-symbol',
            src: context.relativeURL('assets/sfml-js-symbol-pentagon.svg'),
            width: 40, height: 40, alt: '',
          }),
          element('img', {
            class: 'sf-wordmark',
            src: context.relativeURL('assets/sfml-js-wordmark-dark.svg'),
            width: 123, height: 34, alt: '',
          })),
          element('div', { class: 'sf-api-controls' },
            element('button', {
              id: 'tsd-search-trigger', class: 'sf-api-search',
              'aria-label': locale.search, type: 'button',
            },
            icon('search'),
            element('span', { class: 'sf-api-search-label' }, locale.search)),
            element('nav', {
              id: 'sf-api-nav', class: 'sf-api-nav', 'aria-label': locale.menu,
            },
            element('a', {
              href: `${home}guide/getting-started`,
            }, locale.guide),
            element('a', { href: `${home}examples` }, locale.examples),
            element('a', {
              href: context.relativeURL('index.html'), 'aria-current': 'page',
            }, locale.reference)),
            element('details', { class: 'sf-api-languages' },
              element('summary', {
                'aria-label': locale.language, title: locale.language,
              }, icon('language'), icon('arrow', 'sf-api-chevron')),
              element('nav', {
                class: 'sf-api-language-menu', 'aria-label': locale.language,
              },
              ...languages.map(target => element('a', {
                href: localeHref(target, page.url),
                lang: target.id === 'zh' ? 'zh-CN' : target.id,
                hreflang: target.id === 'zh' ? 'zh-CN' : target.id,
                'data-api-language': target.id,
                'aria-current': target.id === locale.id ? 'page' : undefined,
              }, target.label)))),
            element('button', {
              class: 'sf-api-theme', type: 'button', role: 'switch',
              'aria-checked': 'false', 'aria-label': locale.dark,
              'data-light-label': locale.light, 'data-dark-label': locale.dark,
            },
            element('span', {
              class: 'sf-api-theme-label', 'aria-hidden': 'true',
            }, locale.appearance),
            element('span', { class: 'sun' }, icon('sun')),
            element('span', { class: 'moon' }, icon('moon'))),
            element('a', {
              class: 'sf-api-github',
              href: 'https://github.com/XadillaX/node-sfml',
              'aria-label': 'GitHub',
            }, 'GitHub'),
            element('button', {
              class: 'sf-api-menu-button', type: 'button',
              'aria-label': locale.menu, 'aria-expanded': 'false',
              'aria-controls': 'sf-api-nav',
            }, icon('menu')))),
        element('div', { class: 'sf-api-mobile-bar' },
          element('button', {
            id: 'sf-api-sidebar-trigger', type: 'button',
            'aria-expanded': 'false', 'aria-controls': 'sf-api-module-nav',
          }, icon('menu'), locale.contents),
          element('a', {
            href: context.relativeURL('index.html'),
          }, locale.reference)),
        element('dialog', { id: 'tsd-search', 'aria-label': locale.search },
          element('input', {
            role: 'combobox', id: 'tsd-search-input',
            'aria-controls': 'tsd-search-results',
            'aria-autocomplete': 'list', 'aria-expanded': 'true',
            spellcheck: false, autocapitalize: 'off', autocomplete: 'off',
            placeholder: locale.searchPlaceholder, maxLength: 100,
          }),
          element('ul', { role: 'listbox', id: 'tsd-search-results' }),
          element('div', {
            id: 'tsd-search-status',
            'aria-live': 'polite', 'aria-atomic': 'true',
          }, element('div', null, locale.preparingSearch))));

      return context;
    }
  }

  app.renderer.defineTheme('sfml', SiteTheme);
  app.options.setValue('theme', 'sfml');
  app.options.setValue('useFirstParagraphOfCommentAsSummary', true);
}
