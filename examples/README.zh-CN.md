# 示例

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

先体验完整游戏与应用，再按模块了解背后的 SFML 功能。

## 从这里开始

<div class="example-picks">
  <a class="example-pick" href="projects/README.zh-CN.md#super-mario-kart">
    <img src="../assets/examples/projects/super-mario-kart.webp" width="240" alt="Mario 在 Donut Plains 1 赛道上竞速">
    <div class="example-pick-info">
      <h3>Süper Mario Kart</h3>
      <p>TypeScript 赛车游戏，包含 Mode 7 渲染、8 名车手和 5 条赛道。可挑战 Grand Prix 或单场比赛，与 7 名 AI 对手竞速。</p>
      <span class="example-pick-action">查看玩法与运行说明</span>
    </div>
  </a>
  <a class="example-pick" href="projects/README.zh-CN.md#play-nes">
    <img src="../assets/examples/projects/play-nes.webp" width="240" alt="play-nes 中运行的 Concentration Room">
    <div class="example-pick-info">
      <h3>play-nes</h3>
      <p>提供原生图形与音频的桌面 NES 模拟器。可直接游玩内置的 Concentration Room，也可载入有权使用的本地 ROM。</p>
      <span class="example-pick-action">查看玩法与运行说明</span>
    </div>
  </a>
  <a class="example-pick" href="projects/README.zh-CN.md#breakout">
    <img src="../assets/breakout.png" width="240" alt="Breakout 中运动的弹球、挡板与剩余砖块">
    <div class="example-pick-info">
      <h3>Breakout · 打砖块</h3>
      <p>本仓库自带的打砖块游戏，包含碰撞、三条生命、计分与暂停功能。完整游戏写在单个 JavaScript 文件 <code>examples/breakout.cjs</code> 中，方便运行与阅读。</p>
      <span class="example-pick-action">查看玩法与运行说明</span>
    </div>
  </a>
</div>

## 按主题浏览

<dl class="example-topics">
  <div id="screenshots">
    <dt><a href="features/README.zh-CN.md">功能示例</a></dt>
    <dd>
      <p>15 个聚焦单项功能的示例，覆盖 System、Window、Graphics、Audio 和 Network。</p>
      <div class="example-topic-links">
        <a href="features/README.zh-CN.md#render-texture">离屏渲染</a>
        <a href="features/README.zh-CN.md#network">网络通信</a>
      </div>
    </dd>
  </div>
  <div>
    <dt><a href="official/README.zh-CN.md">官方示例</a></dt>
    <dd>
      <p>24 个 SFML 移植示例，附平台要求与上游来源。</p>
      <div class="example-topic-links">
        <a href="official/README.zh-CN.md#shader">Shader 场景</a>
      </div>
    </dd>
  </div>
  <div id="game-projects">
    <dt><a href="projects/README.zh-CN.md">游戏与应用</a></dt>
    <dd>
      <p>使用 TypeScript、JavaScript 和 ClojureScript 编写的游戏，附截图、操作方式与源码。</p>
      <div class="example-topic-links">
        <a id="breakout" href="projects/README.zh-CN.md#breakout">Breakout</a>
        <a id="16-games" href="projects/README.zh-CN.md#16-games">16 个 ClojureScript 游戏</a>
      </div>
    </dd>
  </div>
</dl>

## 运行准备

> 本仓库示例在仓库根目录运行。首次启动前执行 `npm ci`，修改源码后执行 `npm run build`。图形示例需要支持 OpenGL 窗口的图形会话。独立项目按各自说明安装。

```sh
node examples/breakout.cjs
node examples/official/shader/Shader.cjs
node examples/network.cjs
```

[项目首页](../README.zh-CN.md) · [快速开始](../docs/getting-started.zh-CN.md) · [开发指南](../docs/development.zh-CN.md)
