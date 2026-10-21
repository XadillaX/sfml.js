# 기능 예제

[English](README.md) / [简体中文](README.zh-CN.md) / [日本語](README.ja.md) / **한국어**

> sfml.js 저장소 루트에서 실행합니다. 처음에는 `npm ci`, 소스 변경 후에는 `npm run build`가 필요합니다. Network 외의 모든 진입점은 그래픽 창을 열므로 디스플레이와 OpenGL 지원이 필요합니다.

[개요](../README.ko.md) · [공식 예제](../official/README.ko.md) · [게임과 앱](../projects/README.ko.md)

빌드 후 아래 명령을 직접 실행할 수 있습니다. package.json의 `demo:*` 스크립트는 설정에 따라 다시 빌드합니다. 종료하려면 창을 닫으세요. 프레임 제한을 지정한 진입점은 자동으로 끝납니다. 이미지는 특정 장면의 렌더링 결과이며 성능이나 장치 테스트 결과가 아닙니다.

공개 API만 사용하는 앱은 [빠른 시작](../../docs/getting-started.ko.md)을 참고하세요. 보조 파일은 해당 진입점에 속하며 별도 프로그램이 아닙니다.

<a id="system"></a>

## System

<div class="example-gallery">
  <article class="example-entry" id="sleep-err">
    <a href="../../assets/examples/features/sleep-err.webp">
      <img src="../../assets/examples/features/sleep-err.webp" width="360" alt="비동기 대기와 SFML 로그 출력">
    </a>
    <div class="example-info">
      <p><strong><a href="../sleep-err.cjs">sleep-err.cjs</a></strong></p>
      <p>비동기 대기와 SFML 로그 출력</p>
      <p><code>node examples/sleep-err.cjs</code></p>
      <p>S로 2초 대기, W로 로그 출력, N으로 네이티브 진단을 실행합니다. R은 패널로 로그 전달, M은 로그 숨김, D는 stderr 복원입니다. Esc로 종료합니다.</p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><code>npm run demo:sleep-err</code></p>
    </div>
  </article>
  <article class="example-entry" id="vector-scalars">
    <a href="../../assets/examples/features/vector-scalars.webp">
      <img src="../../assets/examples/features/vector-scalars.webp" width="360" alt="스칼라 벡터의 실시간 공유 저장소와 네이티브 비교">
    </a>
    <div class="example-info">
      <p><strong><a href="../vector-scalars.cjs">vector-scalars.cjs</a></strong></p>
      <p>다양한 수치 스칼라의 벡터 연산</p>
      <p><code>node examples/vector-scalars.cjs</code></p>
      <p>스칼라 타입별 TypedArray 공유 저장소와 네이티브 비교를 표시합니다. Esc로 종료합니다.</p>
      <p><code>--frames</code>를 지원하지 않습니다. 창을 닫아 중지하세요.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
    </div>
  </article>
</div>

<a id="window"></a>

## Window

<div class="example-gallery">
  <article class="example-entry" id="window-demo">
    <a href="../../assets/examples/features/window.webp">
      <img src="../../assets/examples/features/window.webp" width="360" alt="창 이벤트, 커서, 입력 진단">
    </a>
    <div class="example-info">
      <p><strong><a href="../window.cjs">window.cjs</a></strong></p>
      <p>창 이벤트, 커서, 입력 진단</p>
      <p><code>node examples/window.cjs</code></p>
      <p>F1 커서 전환, F2 커서 표시, F3 키 반복, F4 VSync, F5 창 크기, F6 크기 제한, F7 제목, F8 창 숨김과 복원, F9 이벤트 처리 방식, F10 창 이동. 방향키로 표시를 움직이고 문자 입력과 Backspace로 편집하며 Esc로 종료합니다.</p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p>보조 파일: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:window</code></p>
    </div>
  </article>
  <article class="example-entry" id="system-window">
    <a href="../../assets/examples/features/system-window.webp">
      <img src="../../assets/examples/features/system-window.webp" width="360" alt="System 및 Window 인터페이스">
    </a>
    <div class="example-info">
      <p><strong><a href="../system-window.cjs">system-window.cjs</a></strong></p>
      <p>System 및 Window 인터페이스</p>
      <p><code>node examples/system-window.cjs</code></p>
      <p>C로 예제 텍스트를 시스템 클립보드에 쓰고 V로 읽으며 A로 OpenGL 컨텍스트를 전환합니다. Esc로 종료합니다. Touch에는 지원 장치가 필요하며 macOS 트랙패드 제스처는 SFML 터치가 아닙니다.</p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><code>npm run demo:system-window</code></p>
    </div>
  </article>
</div>

<a id="graphics"></a>

## 그래픽

<div class="example-gallery">
  <article class="example-entry" id="all-types">
    <a href="../../assets/examples/features/all-types.webp">
      <img src="../../assets/examples/features/all-types.webp" width="360" alt="값 타입, 변환, 도형, 정점, 텍스트를 포함한 종합 장면">
    </a>
    <div class="example-info">
      <p><strong><a href="../all-types.cjs">all-types.cjs</a></strong></p>
      <p>값 타입, 변환, 도형, 정점, 텍스트를 포함한 종합 장면</p>
      <p><code>node examples/all-types.cjs</code></p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p>보조 파일: <a href="../all-types-scene.cjs">all-types-scene.cjs</a>, <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:types</code></p>
    </div>
  </article>
  <article class="example-entry" id="sprites">
    <a href="../../assets/examples/features/sprites.webp">
      <img src="../../assets/examples/features/sprites.webp" width="360" alt="대량 스프라이트 그리기">
    </a>
    <div class="example-info">
      <p><strong><a href="../sprites.cjs">sprites.cjs</a></strong></p>
      <p>대량 스프라이트 그리기</p>
      <p><code>node examples/sprites.cjs</code></p>
      <p>움직이는 스프라이트 256개. <code>--uncapped</code>로 데모 타이머를 해제할 수 있습니다.</p>
      <p><code>--frames</code>를 지원하지 않습니다. 창을 닫아 중지하세요.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p><code>npm run demo</code></p>
    </div>
  </article>
  <article class="example-entry" id="image">
    <a href="../../assets/examples/features/image.webp">
      <img src="../../assets/examples/features/image.webp" width="360" alt="픽셀 편집, 복사, 마스크, 코덱">
    </a>
    <div class="example-info">
      <p><strong><a href="../image.cjs">image.cjs</a></strong></p>
      <p>픽셀 편집, 복사, 마스크, 코덱</p>
      <p><code>node examples/image.cjs</code></p>
      <p><code>--file=/path/to/image.png</code>로 이미지를 지정할 수 있습니다.</p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p>보조 파일: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:image</code></p>
    </div>
  </article>
  <article class="example-entry" id="texture">
    <a href="../../assets/examples/features/texture.webp">
      <img src="../../assets/examples/features/texture.webp" width="360" alt="이미지 로딩, 자르기, 부분 업로드, 샘플링">
    </a>
    <div class="example-info">
      <p><strong><a href="../texture.cjs">texture.cjs</a></strong></p>
      <p>이미지 로딩, 자르기, 부분 업로드, 샘플링</p>
      <p><code>node examples/texture.cjs</code></p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p>보조 파일: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:texture</code></p>
    </div>
  </article>
  <article class="example-entry" id="sprite">
    <a href="../../assets/examples/features/sprite.webp">
      <img src="../../assets/examples/features/sprite.webp" width="360" alt="스프라이트 애니메이션, 뒤집기, 색상, 경계">
    </a>
    <div class="example-info">
      <p><strong><a href="../sprite.cjs">sprite.cjs</a></strong></p>
      <p>스프라이트 애니메이션, 뒤집기, 색상, 경계</p>
      <p><code>node examples/sprite.cjs</code></p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p>보조 파일: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:sprite</code></p>
    </div>
  </article>
  <article class="example-entry" id="render-texture">
    <a href="../../assets/render-texture.png">
      <img src="../../assets/render-texture.png" width="360" alt="오프스크린 합성, 텍스처 뷰, 그리기 스냅샷">
    </a>
    <div class="example-info">
      <p><strong><a href="../render-texture.cjs">render-texture.cjs</a></strong></p>
      <p>오프스크린 합성, 텍스처 뷰, 그리기 스냅샷</p>
      <p><code>node examples/render-texture.cjs</code></p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p>보조 파일: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:render-texture</code></p>
    </div>
  </article>
  <article class="example-entry" id="drawable">
    <a href="../../assets/examples/features/drawable.webp">
      <img src="../../assets/examples/features/drawable.webp" width="360" alt="사용자 정의 조합, 부모/자식 변환, 블렌딩, 스텐실">
    </a>
    <div class="example-info">
      <p><strong><a href="../drawable.cjs">drawable.cjs</a></strong></p>
      <p>사용자 정의 조합, 부모/자식 변환, 블렌딩, 스텐실</p>
      <p><code>node examples/drawable.cjs</code></p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p>보조 파일: <a href="../bitmap-label.cjs">bitmap-label.cjs</a></p>
      <p><code>npm run demo:drawable</code></p>
    </div>
  </article>
  <article class="example-entry" id="vertex-array">
    <a href="../../assets/examples/features/vertex-array.webp">
      <img src="../../assets/examples/features/vertex-array.webp" width="360" alt="동적 타일과 연속 정점">
    </a>
    <div class="example-info">
      <p><strong><a href="../vertex-array.cjs">vertex-array.cjs</a></strong></p>
      <p>동적 타일과 연속 정점</p>
      <p><code>node examples/vertex-array.cjs</code></p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><strong>저장소 진단용 진입점: 내부 네이티브 미리보기 또는 검증 API를 사용하며 공개 API만 사용하는 앱 템플릿이 아닙니다.</strong></p>
      <p><code>npm run demo:vertices</code></p>
    </div>
  </article>
  <article class="example-entry" id="text">
    <a href="../../assets/examples/features/text.webp">
      <img src="../../assets/examples/features/text.webp" width="360" alt="텍스트 레이아웃과 정점 애니메이션">
    </a>
    <div class="example-info">
      <p><strong><a href="../text.cjs">text.cjs</a></strong></p>
      <p>텍스트 레이아웃과 정점 애니메이션</p>
      <p><code>node examples/text.cjs</code></p>
      <p><code>--font=/path/to/font.ttf</code>와 <code>--text=한국어</code>로 폰트와 텍스트를 지정합니다. 해당 글리프를 포함하는 폰트가 필요합니다. Esc로 종료합니다.</p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p><code>npm run demo:text</code></p>
    </div>
  </article>
</div>

<a id="audio"></a>

## 오디오

<div class="example-gallery">
  <article class="example-entry" id="audio-demo">
    <a href="../../assets/examples/features/audio.webp">
      <img src="../../assets/examples/features/audio.webp" width="360" alt="Sound, Music, Worker 데이터 공급, 오디오 효과, 녹음 재생">
    </a>
    <div class="example-info">
      <p><strong><a href="../audio.cjs">audio.cjs</a></strong></p>
      <p>Sound, Music, Worker 데이터 공급, 오디오 효과, 녹음 재생</p>
      <p><code>node examples/audio.cjs</code></p>
      <p>1~4 모드 선택, Space 재생/일시 정지, S 정지, E 효과 전환, R/T 녹음 시작/종료, 방향키 패닝과 볼륨 조절, Esc 종료. 녹음에는 마이크와 권한이 필요하며 일반 실행은 입력을 기다립니다.</p>
      <p>선택적 프레임 제한: <code>--frames=120</code>.</p>
      <p>보조 파일: <a href="../audio-worker.cjs">audio-worker.cjs</a></p>
      <p><code>npm run demo:audio</code></p>
    </div>
  </article>
</div>

<a id="network"></a>

## 네트워크

<div class="example-gallery">
  <article class="example-entry" id="network-demo">
    <div class="example-info">
      <p><strong><a href="../network.cjs">network.cjs</a></strong></p>
      <p>로컬 TCP, Packet, UDP, Selector</p>
      <p><code>node examples/network.cjs</code></p>
      <p>동적으로 할당한 루프백 포트에서 TCP, Packet, UDP, SocketSelector를 확인하는 콘솔 전용 진입점입니다. 터미널 하나에서 실행하고 끝나면 소켓을 닫습니다.</p>
      <p><code>npm run demo:network</code></p>
    </div>
  </article>
</div>

<a id="screenshots"></a>
## 스크린샷

`SFML_DEMO_SNAPSHOT`을 지원하는 그래픽 예제는 실행 화면을 저장할 수 있습니다. macOS/Linux에서는 다음과 같이 실행합니다.

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-render-texture.png \
  node examples/render-texture.cjs --frames=2
```

PowerShell:

```powershell
$env:SFML_DEMO_SNAPSHOT = "$env:TEMP/sfml-render-texture.png"
node examples/render-texture.cjs --frames=2
Remove-Item Env:SFML_DEMO_SNAPSHOT
```

내장 캡처는 <code>SFML_DEMO_SNAPSHOT</code>을 사용합니다. all-types, sprites, drawable, vertex-array, system-window, sleep-err는 확장자와 관계없이 PPM을 기록하므로 <code>.ppm</code>을 사용하세요. image, texture, sprite, render-texture, window, audio는 PNG를 지원합니다. text와 vector-scalars는 이 환경 변수를 구현하지 않습니다. 두 미리보기는 임시 계측 코드로 캡처했습니다.

sleep-err는 마지막 프레임, vertex-array는 루프 종료 후 저장하므로 유한한 프레임 수를 지정하세요. system-window, window, audio에는 최소 두 프레임이 필요하며 다른 내장 미리보기는 첫 프레임을 저장할 수 있습니다. sprites는 첫 프레임 저장 후에도 실행되며 창을 닫아야 끝납니다. 출처는 [sources.json](../../assets/examples/features/sources.json)에 기록되어 있습니다.
