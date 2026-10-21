<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import { homeContent } from './content';
import ArrowIcon from './ArrowIcon.vue';
import IconCredits from './IconCredits.vue';
import { mountLanternEffect } from './hero-light.mjs';

const { lang } = useData();
/** Resolve VitePress language tags to the content dictionary and public route. */
const locale = computed(() => lang.value.startsWith('zh') ? 'zh'
  : lang.value.startsWith('ja') ? 'ja' : lang.value.startsWith('ko') ? 'ko' : 'en');
const copy = computed(() => homeContent[locale.value]);
const prefix = computed(() => locale.value === 'en' ? '/' : `/${locale.value}/`);
/** Announce the result of copying the homepage installation command. */
const copyStatus = ref('');
/** Expand the runnable example without making its preview dominate the page. */
const codeExpanded = ref(false);
/** Local Game-icons silhouettes identify the five SFML modules. */
const moduleIcons = ['system', 'window', 'graphics', 'audio', 'network'];
/** 背景图、容器和灯光画布用于响应式坐标换算。 */
const heroElement = ref<HTMLElement>();
const heroImage = ref<HTMLImageElement>();
const lanternCanvas = ref<HTMLCanvasElement>();
/** 水面倒影独立定位，与灯笼共享呼吸周期。 */
const reflectionCanvas = ref<HTMLCanvasElement>();
let disposeLantern: (() => void) | undefined;
let statusTimer: ReturnType<typeof setTimeout> | undefined;
/** Copy the install command and keep feedback available to assistive technology. */
async function copyInstall() {
  try {
    await navigator.clipboard.writeText('npm install sfml.js');
    copyStatus.value = copy.value.copied;
  } catch {
    copyStatus.value = copy.value.copyFailed;
  }
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { copyStatus.value = ''; }, 3000);
}
onMounted(() => {
  if (heroElement.value && heroImage.value && lanternCanvas.value && reflectionCanvas.value) {
    disposeLantern = mountLanternEffect(
      lanternCanvas.value, heroImage.value, heroElement.value, reflectionCanvas.value,
    );
  }
});
onBeforeUnmount(() => {
  clearTimeout(statusTimer);
  disposeLantern?.();
});
</script>

<template>
  <div class="sfml-home">
    <section ref="heroElement" class="sfml-hero" aria-labelledby="home-title">
      <picture class="hero-scene">
        <source media="(max-width: 767px)" :srcset="withBase('/media/forest-hero-mobile.webp')">
        <img ref="heroImage" :src="withBase('/media/forest-hero.webp')" alt="" width="2160" height="1080" fetchpriority="high">
      </picture>
      <div class="hero-shade" aria-hidden="true"></div>
      <canvas ref="lanternCanvas" class="hero-lantern" aria-hidden="true"></canvas>
      <canvas ref="reflectionCanvas" class="hero-reflection" aria-hidden="true"></canvas>
      <div class="hero-inner section-width">
        <div class="hero-copy">
          <p class="hero-kicker">Simple and Fast Multimedia Library</p>
          <h1 id="home-title"><span class="hero-sfml">SFML</span> <span class="hero-target">for Node.js</span></h1>
          <p class="hero-description">{{ copy.description }}</p>
          <div class="hero-actions">
            <a class="sfml-button primary" :href="withBase(`${prefix}guide/getting-started`)">{{ copy.start }}<ArrowIcon /></a>
            <a class="sfml-button secondary" :href="withBase(`${prefix}reference/`)" target="_self">{{ copy.referenceAction }}</a>
          </div>
          <div class="install-block">
            <div class="install-command">
              <span class="prompt" aria-hidden="true">$</span>
              <code>npm install sfml.js</code>
              <button type="button" :aria-label="copy.copy" :title="copy.copy" @click="copyInstall">
                <span class="game-icon gi-copy" aria-hidden="true"></span>
              </button>
            </div>
            <span class="copy-status" role="status">{{ copyStatus }}</span>
          </div>
          <p class="platforms">{{ copy.platforms }}</p>
          <a class="hero-upstream" href="https://www.sfml-dev.org/">{{ copy.upstreamIntro }}<ArrowIcon /></a>
        </div>
      </div>
    </section>

    <section class="module-section section-width" aria-labelledby="modules-title">
        <div class="module-heading">
          <h2 id="modules-title">{{ copy.modulesLabel }}</h2>
          <p>{{ copy.modulesDescription }}</p>
          <a class="text-link" :href="withBase(`${prefix}guide/api`)">{{ copy.guide }}<ArrowIcon /></a>
        </div>
        <nav class="module-list" :aria-label="copy.modulesLabel">
          <a v-for="(module, index) in copy.modules" :key="module[2]" :href="withBase(`${prefix}guide/${module[2]}`)">
            <span class="game-icon module-icon" :class="`gi-${moduleIcons[index]}`" aria-hidden="true"></span>
            <span class="module-content"><span class="module-name">{{ module[0] }}</span><span class="module-description">{{ module[1] }}</span></span>
            <ArrowIcon />
          </a>
        </nav>
    </section>

    <section class="code-section section-width" aria-labelledby="code-title">
      <div class="section-copy">
        <p class="section-label">RenderWindow · CircleShape · Color</p>
        <h2 id="code-title">{{ copy.codeTitle }}</h2>
        <p>{{ copy.codeDescription }}</p>
        <a class="sfml-button green" :href="withBase(`${prefix}guide/getting-started`)">{{ copy.codeAction }}<ArrowIcon /></a>
        <p class="detail">{{ copy.codeDetail }}</p>
      </div>
      <div class="code-window" :class="{ 'is-expanded': codeExpanded }">
        <div class="code-header"><span><span class="js-label">JS</span> hello.cjs</span><code>node hello.cjs</code></div>
        <pre id="home-example-code" tabindex="0" aria-label="hello.cjs"><code><span class="kw">const</span> sf = <span class="fn">require</span>(<span class="str">'sfml.js'</span>);
<span class="kw">const</span> win = <span class="kw">new</span> sf.<span class="type">RenderWindow</span>(
  <span class="kw">new</span> sf.<span class="type">VideoMode</span>(<span class="kw">new</span> sf.<span class="type">Vector2u</span>(<span class="num">800</span>, <span class="num">600</span>)),
  <span class="str">'Hello, sfml.js'</span>,
);
<span class="kw">const</span> circle = <span class="kw">new</span> sf.<span class="type">CircleShape</span>({ radius: <span class="num">80</span> });
circle.<span class="fn">setPosition</span>(<span class="kw">new</span> sf.<span class="type">Vector2f</span>(<span class="num">320</span>, <span class="num">220</span>));
circle.<span class="fn">setFillColor</span>(<span class="kw">new</span> sf.<span class="type">Color</span>(<span class="num">108</span>, <span class="num">190</span>, <span class="num">82</span>));
win.<span class="fn">setFramerateLimit</span>(<span class="num">60</span>);

<span class="kw">function</span> <span class="fn">frame</span>() {
  win.<span class="fn">handleEvents</span>({
    Closed: () =&gt; win.<span class="fn">close</span>(),
    KeyPressed: e =&gt; {
      <span class="kw">if</span> (e.code === sf.Keyboard.Key.Escape) win.<span class="fn">close</span>();
    },
  });
  <span class="kw">if</span> (!win.<span class="fn">isOpen</span>()) <span class="kw">return</span>;
  win.<span class="fn">clear</span>(<span class="kw">new</span> sf.<span class="type">Color</span>(<span class="num">24</span>, <span class="num">28</span>, <span class="num">32</span>));
  win.<span class="fn">draw</span>(circle);
  win.<span class="fn">display</span>();
  <span class="fn">setImmediate</span>(frame);
}
<span class="fn">frame</span>();</code></pre>
        <button class="code-expand" type="button" :aria-expanded="codeExpanded" aria-controls="home-example-code" @click="codeExpanded = !codeExpanded">
          {{ codeExpanded ? copy.codeCollapse : copy.codeExpand }}<ArrowIcon />
        </button>
      </div>
    </section>

    <section class="examples-section section-width" aria-labelledby="examples-title">
      <div class="examples-heading">
        <div>
          <h2 id="examples-title">{{ copy.examplesTitle }}</h2>
          <p>{{ copy.examplesDescription }}</p>
          <p class="project-entry-links">
            <a
              class="text-link"
              :href="withBase(`${prefix}examples/projects#super-mario-kart`)"
            >
              <span>Süper Mario Kart</span><ArrowIcon />
            </a>
            <a class="text-link" href="https://github.com/XadillaX/super-mario-kart-sfml.js">
              {{ copy.source }}
            </a>
          </p>
          <p class="project-entry-links">
            <a
              class="text-link"
              :href="withBase(`${prefix}examples/projects#play-nes`)"
            >
              <span>{{ copy.playNes }}</span><ArrowIcon />
            </a>
            <a class="text-link" href="https://github.com/XadillaX/play-nes">
              {{ copy.source }}
            </a>
          </p>
          <p class="project-entry-links">
            <a
              class="text-link"
              :href="withBase(`${prefix}examples/projects#node-sfml-demos`)"
            >
              <span>{{ copy.gameProjectsAction }}</span><ArrowIcon />
            </a>
            <a class="text-link" href="https://github.com/XadillaX/node-sfml-demos">
              {{ copy.source }}
            </a>
          </p>
          <p class="project-entry-links">
            <a
              class="text-link"
              :href="withBase(`${prefix}examples/projects#16-games`)"
            >
              <span>{{ copy.sixteenGames }}</span><ArrowIcon />
            </a>
            <a class="text-link" href="https://github.com/XadillaX/16-sfml.js-games-ported">
              {{ copy.source }}
            </a>
          </p>
        </div>
        <a class="text-link" :href="withBase(`${prefix}examples`)">{{ copy.examplesAction }}<ArrowIcon /></a>
      </div>
      <div class="examples-grid">
        <figure class="example-demo">
          <a
            class="example-image"
            :href="withBase(`${prefix}examples/projects#breakout`)"
            :aria-label="`${copy.game} · ${copy.runExample}`"
          >
            <img :src="withBase('/media/breakout.png')" :alt="copy.gameAlt" width="1200" height="760" loading="lazy">
          </a>
          <figcaption>
            <div class="example-meta"><code>breakout.cjs</code><span>{{ copy.capture }}</span></div>
            <h3>{{ copy.game }}</h3><p>{{ copy.gameCaption }}</p>
            <div class="example-actions">
              <a class="text-link" :href="withBase(`${prefix}examples/projects#breakout`)">
                {{ copy.runExample }}<ArrowIcon />
              </a>
              <a
                class="text-link"
                href="https://github.com/XadillaX/node-sfml/blob/main/examples/breakout.cjs"
              >
                {{ copy.source }}
              </a>
            </div>
          </figcaption>
        </figure>
        <figure class="example-demo">
          <a
            class="example-image"
            :href="withBase(`${prefix}examples/features#render-texture`)"
            :aria-label="`${copy.textureTitle} · ${copy.runExample}`"
          >
            <img :src="withBase('/media/render-texture.png')" :alt="copy.textureAlt" width="960" height="560" loading="lazy">
          </a>
          <figcaption>
            <div class="example-meta"><code>render-texture.cjs</code><span>{{ copy.capture }}</span></div>
            <h3>{{ copy.textureTitle }}</h3><p>{{ copy.textureText }}</p>
            <div class="example-actions">
              <a class="text-link" :href="withBase(`${prefix}examples/features#render-texture`)">
                {{ copy.runExample }}<ArrowIcon />
              </a>
              <a
                class="text-link"
                href="https://github.com/XadillaX/node-sfml/blob/main/examples/render-texture.cjs"
              >
                {{ copy.source }}
              </a>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>

    <section class="upstream-section" aria-labelledby="resources-title">
      <div class="section-width upstream-inner">
        <div>
          <h2 id="resources-title">{{ copy.upstreamTitle }}</h2>
          <p>{{ copy.upstreamText }}</p>
        </div>
        <div class="upstream-links">
          <a href="https://www.sfml-dev.org/documentation/3.1.0/">
            <span>{{ copy.upstreamAction }}</span><ArrowIcon />
          </a>
          <a :href="withBase(`${prefix}reference/`)" target="_self">
            <span>{{ copy.referenceAction }}</span><ArrowIcon />
          </a>
          <a href="https://github.com/XadillaX/node-sfml">
            GitHub<ArrowIcon />
          </a>
        </div>
      </div>
    </section>
    <footer class="sfml-footer section-width">
      <div class="footer-inner">
        <div class="footer-identity">
          <a class="sfml-brand" :href="withBase(prefix)" aria-label="sfml.js">
            <img
              class="sf-symbol"
              :src="withBase('/media/sfml-js-symbol-pentagon.svg')"
              width="36"
              height="36"
              alt=""
            >
            <img
              class="sf-wordmark sf-wordmark-light"
              :src="withBase('/media/sfml-js-wordmark.svg')"
              width="123"
              height="34"
              alt=""
            >
            <img
              class="sf-wordmark sf-wordmark-dark"
              :src="withBase('/media/sfml-js-wordmark-dark.svg')"
              width="123"
              height="34"
              alt=""
            >
          </a>
        </div>
        <div class="footer-meta">
          <p>{{ copy.footer }}</p>
          <IconCredits />
        </div>
      </div>
    </footer>
  </div>
</template>
