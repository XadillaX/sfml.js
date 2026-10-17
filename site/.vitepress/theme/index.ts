import { h } from 'vue';
import type { Theme } from 'vitepress';
import { useData, withBase } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import Home from './Home.vue';
import './custom.css';

/** Keep VitePress navigation, accessibility and documentation layouts on every route. */
export default {
  extends: DefaultTheme,
  Layout: {
    setup() {
      const { frontmatter } = useData();
      return () => h(DefaultTheme.Layout, null, {
        'home-hero-before': () => frontmatter.value.sfmlHome ? h(Home) : null,
        'nav-bar-title-after': () => h('img', {
          class: 'sf-wordmark',
          src: withBase('/media/sfml-js-wordmark-dark.svg'),
          width: 123,
          height: 34,
          alt: 'SFML.js',
        }),
        'layout-bottom': () => h('p', { class: 'sf-icon-credits' }, [
          'Icons made by ',
          h('a', { href: 'https://lorcblog.blogspot.com/' }, 'Lorc'),
          ', ',
          h('a', { href: 'https://delapouite.com/' }, 'Delapouite'),
          ' & Skoll · ',
          h('a', { href: 'https://game-icons.net/' }, 'game-icons.net'),
          ' · ',
          h('a', { href: 'https://creativecommons.org/licenses/by/3.0/' }, 'CC BY 3.0'),
        ]),
      });
    },
  },
} satisfies Theme;
