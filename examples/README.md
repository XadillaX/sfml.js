# Examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Try a complete game or application, then explore the individual SFML features behind it.

## Start here

<div class="example-picks">
  <a class="example-pick" href="projects/README.md#super-mario-kart">
    <img src="../assets/examples/projects/super-mario-kart.webp" width="240" alt="Mario racing on Donut Plains 1">
    <div class="example-pick-info">
      <h3>Süper Mario Kart</h3>
      <p>A TypeScript kart racer with Mode 7 rendering, eight drivers and five circuits. Play Grand Prix or a single race against seven AI opponents.</p>
      <span class="example-pick-action">Gameplay and run instructions</span>
    </div>
  </a>
  <a class="example-pick" href="projects/README.md#play-nes">
    <img src="../assets/examples/projects/play-nes.webp" width="240" alt="Concentration Room running in play-nes">
    <div class="example-pick-info">
      <h3>play-nes</h3>
      <p>A desktop NES emulator with native graphics and audio. Start with the bundled Concentration Room or load a local ROM you have permission to use.</p>
      <span class="example-pick-action">Gameplay and run instructions</span>
    </div>
  </a>
  <a class="example-pick" href="projects/README.md#breakout">
    <img src="../assets/breakout.png" width="240" alt="Breakout with a moving ball, paddle and remaining bricks">
    <div class="example-pick-info">
      <h3>Breakout</h3>
      <p>The brick-breaker included in this repository: collisions, three lives, scoring and pause/resume. Read the complete game in a single JavaScript file, <code>examples/breakout.cjs</code>.</p>
      <span class="example-pick-action">Gameplay and run instructions</span>
    </div>
  </a>
</div>

## Browse by topic

<dl class="example-topics">
  <div id="screenshots">
    <dt><a href="features/README.md">Feature examples</a></dt>
    <dd>
      <p>15 focused examples for System, Window, Graphics, Audio and Network.</p>
      <div class="example-topic-links">
        <a href="features/README.md#render-texture">RenderTexture</a>
        <a href="features/README.md#network">Network</a>
      </div>
    </dd>
  </div>
  <div>
    <dt><a href="official/README.md">Official examples</a></dt>
    <dd>
      <p>24 SFML ports with platform requirements and upstream credits.</p>
      <div class="example-topic-links">
        <a href="official/README.md#shader">Shader scenes</a>
      </div>
    </dd>
  </div>
  <div id="game-projects">
    <dt><a href="projects/README.md">Games and applications</a></dt>
    <dd>
      <p>Games in TypeScript, JavaScript and ClojureScript, with screenshots, controls and source links.</p>
      <div class="example-topic-links">
        <a id="breakout" href="projects/README.md#breakout">Breakout</a>
        <a id="16-games" href="projects/README.md#16-games">16 ClojureScript games</a>
      </div>
    </dd>
  </div>
</dl>

## Before running

> For examples in this repository, run `npm ci` from its root before the first launch and `npm run build` after source changes. Graphics examples need a graphical session with OpenGL window support. Separate projects have their own installation commands.

```sh
node examples/breakout.cjs
node examples/official/shader/Shader.cjs
node examples/network.cjs
```

[Project home](../README.md) · [Quick start](../docs/getting-started.md) · [Development guide](../docs/development.md)
