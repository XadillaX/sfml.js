# 예제

[English](README.md) / [简体中文](README.zh-CN.md) / [日本語](README.ja.md) / **한국어**

게임과 앱을 먼저 실행해 보고, 이를 구성하는 SFML 기능을 모듈별로 살펴보세요.

## 여기서 시작하기

<div class="example-picks">
  <a class="example-pick" href="projects/README.ko.md#super-mario-kart">
    <img src="../assets/examples/projects/super-mario-kart.webp" width="240" alt="Donut Plains 1을 달리는 Mario">
    <div class="example-pick-info">
      <h3>Süper Mario Kart</h3>
      <p>Mode 7 렌더링, 드라이버 8명과 코스 5개를 갖춘 TypeScript 카트 레이싱 게임입니다. Grand Prix 또는 단일 경주에서 AI 7명과 대결합니다.</p>
      <span class="example-pick-action">플레이 및 실행 안내</span>
    </div>
  </a>
  <a class="example-pick" href="projects/README.ko.md#play-nes">
    <img src="../assets/examples/projects/play-nes.webp" width="240" alt="play-nes에서 실행 중인 Concentration Room">
    <div class="example-pick-info">
      <h3>play-nes</h3>
      <p>네이티브 그래픽과 오디오를 사용하는 데스크톱 NES 에뮬레이터입니다. 내장 Concentration Room이나 사용 권한이 있는 로컬 ROM을 실행할 수 있습니다.</p>
      <span class="example-pick-action">플레이 및 실행 안내</span>
    </div>
  </a>
  <a class="example-pick" href="projects/README.ko.md#breakout">
    <img src="../assets/breakout.png" width="240" alt="Breakout의 움직이는 공, 패들 및 남은 벽돌">
    <div class="example-pick-info">
      <h3>Breakout · 벽돌 깨기</h3>
      <p>이 저장소에 포함된 벽돌 깨기 게임으로 충돌 판정, 세 번의 목숨, 점수와 일시 정지를 제공합니다. 전체 게임이 단일 JavaScript 파일 <code>examples/breakout.cjs</code>에 있어 실행하고 읽기 쉽습니다.</p>
      <span class="example-pick-action">플레이 및 실행 안내</span>
    </div>
  </a>
</div>

## 주제별 둘러보기

<dl class="example-topics">
  <div id="screenshots">
    <dt><a href="features/README.ko.md">기능 예제</a></dt>
    <dd>
      <p>System, Window, Graphics, Audio, Network를 다루는 기능별 예제 15개.</p>
      <div class="example-topic-links">
        <a href="features/README.ko.md#render-texture">오프스크린 렌더링</a>
        <a href="features/README.ko.md#network">네트워크 통신</a>
      </div>
    </dd>
  </div>
  <div>
    <dt><a href="official/README.ko.md">공식 예제</a></dt>
    <dd>
      <p>플랫폼 요구 사항과 출처를 갖춘 SFML 이식 예제 24개.</p>
      <div class="example-topic-links">
        <a href="official/README.ko.md#shader">Shader 장면</a>
      </div>
    </dd>
  </div>
  <div id="game-projects">
    <dt><a href="projects/README.ko.md">게임과 앱</a></dt>
    <dd>
      <p>TypeScript, JavaScript, ClojureScript 게임의 스크린샷, 조작법과 소스.</p>
      <div class="example-topic-links">
        <a id="breakout" href="projects/README.ko.md#breakout">Breakout</a>
        <a id="16-games" href="projects/README.ko.md#16-games">ClojureScript 게임 16개</a>
      </div>
    </dd>
  </div>
</dl>

## 실행 준비

> 이 저장소의 예제는 루트에서 실행합니다. 처음에는 `npm ci`, 소스 변경 후에는 `npm run build`를 실행하세요. 그래픽 예제에는 OpenGL 창을 지원하는 그래픽 세션이 필요합니다. 별도 프로젝트는 각 설치 안내를 따릅니다.

```sh
node examples/breakout.cjs
node examples/official/shader/Shader.cjs
node examples/network.cjs
```

[프로젝트 홈](../README.ko.md) · [빠른 시작](../docs/getting-started.ko.md) · [개발 가이드](../docs/development.ko.md)
