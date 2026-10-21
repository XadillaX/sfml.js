# SFML 공식 예제

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · **한국어**

[SFML 공식 예제][upstream]의 JavaScript 이식입니다. 그래픽, 네이티브 창, 입력, 오디오와 네트워크 예제 24개를 제공합니다. [Android](android/README.md)는 아직 이식하지 않았습니다.

[전체 예제](../README.ko.md) · [빌드 요구 사항](../../docs/getting-started.ko.md#requirements) · [기능 예제](../features/README.ko.md) · [게임과 앱](../projects/README.ko.md)

## 빠른 시작

저장소 루트에서 실행하세요.

```sh
npm ci
cd examples/official
node tennis/Tennis.cjs
```

아래 명령은 모두 `examples/official`에서 실행합니다. 각 스크립트가 필요한 리소스를 불러옵니다. 그래픽 예제에는 디스플레이와 OpenGL 창 지원이 필요합니다.

바로가기: [그래픽](#graphics) · [입력과 이벤트](#input) · [오디오](#audio) · [네트워크](#network) · [플랫폼 통합](#platform)

<a id="graphics"></a>

## 그래픽

<div class="example-gallery">
  <article class="example-entry" id="island">
    <a href="screenshots/island.png">
      <img src="screenshots/island.png" width="360" alt="생성된 섬과 지형 매개변수">
    </a>
    <div class="example-info">
      <p><strong><a href="island/Island.cjs">Island</a></strong></p>
      <p>지형과 조명</p>
      <p><strong>조작</strong> · 방향키로 매개변수 수정, Enter로 재생성</p>
      <p><code>node island/Island.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="shader">
    <a href="screenshots/shader.png">
      <img src="screenshots/shader.png" width="360" alt="나비 이미지에 적용한 픽셀화 셰이더">
    </a>
    <div class="example-info">
      <p><strong><a href="shader/Shader.cjs">Shader</a></strong></p>
      <p>셰이더 장면 5개</p>
      <p><a href="screenshots/shader-edge.png">sfml.js 로고 에지 검출 미리보기</a></p>
      <p><strong>조작</strong> · 좌/우로 선택, 마우스로 조절</p>
      <p><code>node shader/Shader.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="tennis">
    <a href="screenshots/tennis.png">
      <img src="screenshots/tennis.png" width="360" alt="Tennis 플레이 중 두 패들 사이에서 공을 주고받는 장면">
    </a>
    <div class="example-info">
      <p><strong><a href="tennis/Tennis.cjs">Tennis</a></strong></p>
      <p>Pong</p>
      <p><strong>조작</strong> · Space 또는 터치로 시작, 위/아래 키로 이동, Esc로 종료</p>
      <p><code>node tennis/Tennis.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="stencil">
    <a href="screenshots/stencil.png">
      <img src="screenshots/stencil.png" width="360" alt="스텐실 마스크로 겹치는 빨강 초록 파랑 도형">
    </a>
    <div class="example-info">
      <p><strong><a href="stencil/Stencil.cjs">Stencil</a></strong></p>
      <p>스텐실 마스크와 도형 애니메이션</p>
      <p><code>node stencil/Stencil.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="text">
    <a href="screenshots/text.png">
      <img src="screenshots/text.png" width="360" alt="다국어 텍스트 샘플 40개">
    </a>
    <div class="example-info">
      <p><strong><a href="text/Text.cjs">Text</a></strong></p>
      <p>다국어 샘플 40개</p>
      <p><strong>조작</strong> · 클릭으로 선택, F1/F2/F3로 경계와 커서, F4로 전처리 전환, 좌/우로 커서 이동</p>
      <p><code>node text/Text.cjs</code></p>
    </div>
  </article>
</div>

<a id="input"></a>

## 입력과 이벤트

<div class="example-gallery">
  <article class="example-entry" id="keyboard">
    <a href="screenshots/keyboard.png">
      <img src="screenshots/keyboard.png" width="360" alt="키보드 배치, A 키 누름과 문자 입력">
    </a>
    <div class="example-info">
      <p><strong><a href="keyboard/Keyboard.cjs">Keyboard</a></strong></p>
      <p>물리 키 배치, 키 이벤트, 문자 입력과 효과음</p>
      <p><code>node keyboard/Keyboard.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="event-handling">
    <a href="screenshots/event_handling.png">
      <img src="screenshots/event_handling.png" width="360" alt="Visitor 방식의 키와 마우스 이벤트 로그">
    </a>
    <div class="example-info">
      <p><strong><a href="event_handling/EventHandling.cjs">Event handling</a></strong></p>
      <p>이벤트 처리 방식 5개</p>
      <p><strong>조작</strong> · Enter로 전환</p>
      <p><code>node event_handling/EventHandling.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="raw-input">
    <a href="screenshots/raw_input.png">
      <img src="screenshots/raw_input.png" width="360" alt="마우스 원시 이동량과 커서 위치">
    </a>
    <div class="example-info">
      <p><strong><a href="raw_input/RawInput.cjs">Raw input</a></strong></p>
      <p>마우스 Raw Input</p>
      <p><code>node raw_input/RawInput.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="joystick">
    <a href="screenshots/joystick.png">
      <img src="screenshots/joystick.png" width="360" alt="장치가 연결되지 않은 조이스틱 화면">
    </a>
    <div class="example-info">
      <p><strong><a href="joystick/Joystick.cjs">Joystick</a></strong></p>
      <p>축과 버튼</p>
      <p><strong>조작</strong> · 0~7로 장치 선택, Tab으로 일반/게임패드 보기 전환</p>
      <p><code>node joystick/Joystick.cjs</code></p>
    </div>
  </article>
</div>

<a id="audio"></a>

## 오디오

녹음 예제에는 마이크와 OS 녹음 권한이 필요합니다.

<div class="example-gallery">
  <article class="example-entry" id="sound-effects">
    <a href="screenshots/sound_effects.png">
      <img src="screenshots/sound_effects.png" width="360" alt="청취자, 음원과 거리 감쇠 원">
    </a>
    <div class="example-info">
      <p><strong><a href="sound_effects/SoundEffects.cjs">Sound effects</a></strong></p>
      <p>효과 9개</p>
      <p><strong>조작</strong> · 좌/우로 선택, 마우스로 조절, 위/아래로 감쇠/파형 선택, Space로 DSP 우회, F1로 출력 변경</p>
      <p><code>node sound_effects/SoundEffects.cjs</code></p>
    </div>
  </article>
</div>

<div class="example-gallery">
  <article class="example-entry" id="sound">
    <div class="example-info">
      <p><strong><a href="sound/Sound.cjs">Sound</a></strong></p>
      <p>WAV 효과음과 OGG, FLAC, MP3 음악 재생</p>
      <p><code>node sound/Sound.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sound-capture">
    <div class="example-info">
      <p><strong><a href="sound_capture/SoundCapture.cjs">Sound capture</a></strong></p>
      <p>장치와 샘플레이트 선택, 녹음 후 재생 또는 저장</p>
      <p><code>node sound_capture/SoundCapture.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sound-device">
    <div class="example-info">
      <p><strong><a href="sound_device/SoundDevice.cjs">Sound device</a></strong></p>
      <p>장치 알림, 자동 라우팅과 장치 연결 해제 복구. Ctrl+C로 종료</p>
      <p><code>node sound_device/SoundDevice.cjs</code></p>
    </div>
  </article>
</div>

<a id="network"></a>

## 네트워크

<div class="example-gallery">
  <article class="example-entry" id="http">
    <div class="example-info">
      <p><strong><a href="http/Http.cjs">HTTP</a></strong></p>
      <p>리다이렉트를 처리하는 대화형 HTTP GET</p>
      <p><code>node http/Http.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="ftp">
    <div class="example-info">
      <p><strong><a href="ftp/Ftp.cjs">FTP</a></strong></p>
      <p>대화형 FTP 클라이언트, 포트 21</p>
      <p><code>node ftp/Ftp.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sftp">
    <div class="example-info">
      <p><strong><a href="sftp/Sftp.cjs">SFTP</a></strong></p>
      <p>대화형 SFTP. 호스트 지문 확인 후 인증</p>
      <p><code>node sftp/Sftp.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="sockets">
    <div class="example-info">
      <p><strong><a href="sockets/Sockets.cjs">Sockets</a></strong></p>
      <p>TCP, TLS, UDP 메시지 교환, 포트 50001</p>
      <p><code>node sockets/Sockets.cjs</code></p>
    </div>
  </article>
  <article class="example-entry" id="voip">
    <div class="example-info">
      <p><strong><a href="voip/VoIP.cjs">VoIP</a></strong></p>
      <p>TCP 음성 녹음, 재생과 다시 듣기, 포트 2435</p>
      <p><code>node voip/VoIP.cjs</code></p>
    </div>
  </article>
</div>

sockets와 VoIP는 터미널 두 개에서 실행하고 각각 서버와 클라이언트를 선택합니다. 로컬 연결에는 `127.0.0.1`을 사용하세요.

<a id="platform"></a>

## 플랫폼 통합

nodegl 빌드에는 CMake, C++ 컴파일러와 OpenGL 개발 라이브러리(Linux의 `libgl1-mesa-dev`)가 필요합니다. Vulkan에는 Vulkan 로더와 4배 비등방성 필터링을 지원하는 드라이버도 필요합니다.

<div class="example-gallery">
  <article class="example-entry" id="window">
    <a href="screenshots/window.png">
      <img src="screenshots/window.png" width="360" alt="검은 배경에서 회전하는 여섯 색상의 큐브">
    </a>
    <div class="example-info">
      <p><strong><a href="window/Window.cjs">Window</a></strong></p>
      <p>OpenGL 창에서 회전하는 여섯 색상의 큐브</p>
      <p><strong>조작</strong> · 창 테두리를 드래그해 크기 조절, Esc 또는 창 닫기로 종료</p>
      <p><code>node window/Window.cjs</code></p>
      <p>macOS, Linux, Windows · 루트의 <code>npm ci</code>로 <code>@wettstein/nodegl</code> 설치</p>
    </div>
  </article>
  <article class="example-entry" id="opengl">
    <a href="screenshots/opengl.png">
      <img src="screenshots/opengl.png" width="360" alt="SFML 배경과 텍스트 사이에 그린 OpenGL 텍스처 큐브">
    </a>
    <div class="example-info">
      <p><strong><a href="opengl/OpenGL.cjs">OpenGL</a></strong></p>
      <p>SFML 배경·텍스트와 OpenGL 텍스처 큐브의 혼합 렌더링</p>
      <p><strong>조작</strong> · 마우스로 큐브 이동, Enter로 mipmap 전환, Space로 sRGB 전환, Esc로 종료</p>
      <p><code>node opengl/OpenGL.cjs</code></p>
      <p>macOS, Linux, Windows · 루트의 <code>npm ci</code>로 <code>@wettstein/nodegl</code> 설치</p>
    </div>
  </article>
  <article class="example-entry" id="vulkan">
    <a href="screenshots/vulkan.png">
      <img src="screenshots/vulkan.png" width="360" alt="Vulkan으로 렌더링한 원본 색상 큐브와 sfml.js 로고">
    </a>
    <div class="example-info">
      <p><strong><a href="vulkan/Vulkan.cjs">Vulkan</a></strong></p>
      <p>Vulkan으로 렌더링하는 회전 텍스처 큐브</p>
      <p><strong>조작</strong> · 마우스로 큐브 이동, 창 테두리를 드래그해 크기 조절, Esc 또는 창 닫기로 종료</p>
      <p><code>node vulkan/Vulkan.cjs</code></p>
      <p>Linux x64(X11), Windows x64, Node.js 20+ · <code>npm ci --prefix vulkan --ignore-scripts</code></p>
      <p>Vulkan은 x64의 Linux/X11과 Windows를 대상으로 하며 <code>nvk</code> 0.8.0, Vulkan 로더와 4배 비등방성 필터링을 지원하는 드라이버 및 장치가 필요합니다. SFML은 창, 이벤트와 서피스를 담당하고 nvk가 별도의 네이티브 브리지 없이 Vulkan을 직접 호출합니다. SFML Graphics는 여전히 OpenGL을 사용합니다. SFML의 Vulkan 통합은 컴파일 시점에 macOS를 지원하지 않으므로 MoltenVK 설치만으로 활성화할 수 없습니다. Linux/X11과 Windows의 네이티브 렌더링 및 조작 검증을 모두 통과했습니다. 조작법과 요구 사항은 <a href="#platform">플랫폼 통합 안내</a>를 참고하세요.</p>
    </div>
  </article>
  <article class="example-entry" id="cocoa">
    <a href="screenshots/cocoa.png">
      <img src="screenshots/cocoa.png" width="360" alt="Cocoa 네이티브 컨트롤과 내장된 sfml.js 로고">
    </a>
    <div class="example-info">
      <p><strong><a href="cocoa/Cocoa.cjs">Cocoa</a></strong></p>
      <p>macOS 네이티브 컨트롤과 내장 SFML 뷰</p>
      <p><strong>조작</strong> · Update 또는 Enter로 텍스트 적용, Visible로 표시 전환, 다이얼로 회전, Color로 배경색 선택, Up/Down으로 확대·축소. 창 닫기, Cmd+Q 또는 Ctrl+C로 종료</p>
      <p><code>node cocoa/Cocoa.cjs</code></p>
      <p>macOS · <code>npm ci --prefix cocoa --ignore-scripts</code></p>
    </div>
  </article>
  <article class="example-entry" id="win32">
    <a href="screenshots/win32.png">
      <img src="screenshots/win32.png" width="360" alt="Win32 네이티브 창의 SFML 애니메이션 뷰 두 개와 Quit 버튼">
    </a>
    <div class="example-info">
      <p><strong><a href="win32/Win32.cjs">Win32</a></strong></p>
      <p>Windows 네이티브 창의 SFML 애니메이션 뷰 두 개와 Quit 버튼</p>
      <p><strong>조작</strong> · Quit, 창 닫기 또는 Ctrl+C로 종료</p>
      <p><code>node win32/Win32.cjs</code></p>
      <p>Windows x64, Node.js 20+ · <code>npm ci --prefix win32 --ignore-scripts</code></p>
    </div>
  </article>
  <article class="example-entry" id="x11">
    <a href="screenshots/x11.png">
      <img src="screenshots/x11.png" width="360" alt="X11 부모 창 안의 두 SFML 자식 창과 회전하는 큐브">
    </a>
    <div class="example-info">
      <p><strong><a href="X11/X11.cjs">X11</a></strong></p>
      <p>두 내장 SFML 창에서 서로 다른 속도로 회전하는 큐브</p>
      <p><strong>조작</strong> · 아무 키, 창 닫기 또는 Ctrl+C로 종료</p>
      <p><code>node X11/X11.cjs</code></p>
      <p>X11 디스플레이가 있는 Linux · 루트의 <code>npm ci</code>로 <code>x11</code>과 <code>@wettstein/nodegl</code> 설치</p>
    </div>
  </article>
</div>

## 출처와 라이선스

[SFML 예제][upstream]를 바탕으로 이식했습니다. 소스 버전과 리소스 출처는 [provenance.json](provenance.json)에 기록되어 있습니다.

- SFML 소스: [zlib 라이선스](SFML-LICENSE.md).
- 리소스와 저자: [asset_licenses.md](asset_licenses.md).
- Noto: [SIL Open Font License 1.1](text/resources/OFL.txt).
- 이식한 stb Perlin: [MIT/퍼블릭 도메인 이중 라이선스](island/stb_perlin.LICENSE).

[upstream]: https://github.com/SFML/SFML/tree/14cea1d978b3dce05780b9234925ca8be9373260/examples
