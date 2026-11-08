import { h } from 'vue';
import type { Theme } from 'vitepress';
import { useData, withBase } from 'vitepress';
import VitePressTheme from 'vitepress/theme';
import Home from './Home.vue';
import IconCredits from './IconCredits.vue';
import ImageLightbox from './ImageLightbox.vue';
import './custom.css';

/**
 * Keep VitePress navigation, accessibility and documentation layouts
 * on every route.
 */
export default {
  extends: VitePressTheme,
  Layout: {
    setup() {
      const { frontmatter } = useData();
      return () => h(VitePressTheme.Layout, null, {
        'home-hero-before': () =>
          (frontmatter.value.sfmlHome ? h(Home) : null),
        'nav-bar-title-after': () =>
          h('img', {
            class: 'sf-wordmark',
            src: withBase('/media/sfml-js-wordmark-dark.svg'),
            width: 123,
            height: 34,
            alt: 'SFML.js',
          }),
        'layout-bottom': () => [
          frontmatter.value.sfmlHome
            ? null
            : h('div', { class: 'sf-doc-credits' }, [ h(IconCredits) ]),
          h(ImageLightbox),
        ],
      });
    },
  },
} satisfies Theme;
