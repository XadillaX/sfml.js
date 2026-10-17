# Audio

[English](audio.md) / [简体中文](audio.zh-CN.md) / [日本語](audio.ja.md) / **한국어**

> 짧은 효과음에는 SoundBuffer + Sound를, 긴 오디오에는 Music을 사용합니다. 사용자 정의 데이터 공급, 녹음 처리, 오디오 효과는 Node Worker에서 실행합니다.

[API 안내](api.ko.md) · [핵심 개념](concepts.ko.md) · [예제](../examples/README.ko.md)

## 인터페이스 선택

| 작업 | 인터페이스 |
| --- | --- |
| 짧은 효과음을 로드하여 반복 재생 | SoundBuffer, Sound |
| 파일, 메모리, 입력 스트림에서 스트리밍 재생 | Music |
| PCM 직접 생성 | SoundStream + Worker 모듈 |
| 볼륨, 패닝, 공간 속성 조절 | SoundSource, Listener |
| 재생 장치 선택 | PlaybackDevice |
| 버퍼에 녹음 | SoundBufferRecorder |
| 캡처 데이터 직접 처리 | SoundRecorder + Worker 모듈 |
| 음원 출력 처리 | EffectProcessor |
| 오디오 파일 읽기/쓰기 또는 형식 확장 | InputSoundFile, OutputSoundFile, SoundFileFactory |

파일과 압축 데이터에는 '빈 생성자 + await open/load'를 사용합니다. SoundBuffer와 Sound는 복사 생성자를 제공하며, SoundBuffer는 PCM으로 생성할 수도 있습니다. 전체 시그니처는 [TypeDoc](https://sfml.js.org/ko/reference/)을 참고하세요.

## 짧은 효과음 재생

```js
const sf = require('sfml.js');

async function play() {
  const buffer = new sf.SoundBuffer();
  if (!await buffer.loadFromFile('sound.wav')) {
    throw new Error('Cannot load sound.wav');
  }
  const sound = new sf.Sound(buffer);
  sound.setVolume(25);
  sound.play();
  while (sound.getStatus() === sf.SoundStatus.Playing) {
    await sf.sleep(sf.milliseconds(10));
  }
}
play().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

`setLooping()`으로 반복을 제어하고, `setPlayingOffset()`으로 재생 위치를 조절합니다. 여러 Sound가 하나의 SoundBuffer를 공유할 수 있습니다. Sound를 복사해도 Worker 오디오 효과는 공유하지 않습니다.

## 음악 재생

다음 코드는 async 함수 안에서 실행하세요.

```javascript
const music = new sf.Music();
try {
  if (!await music.openFromFile('music.ogg')) {
    throw new Error('Cannot open music.ogg');
  }
  music.play();
  await sf.sleep(sf.seconds(5));
} finally {
  await music.close();
}
```

Music은 SoundStream을 상속하며, 길이와 반복 구간을 제공합니다. getter가 반환한 Time을 읽거나 수정해도 재생 위치가 직접 바뀌지 않으므로, setter를 호출해야 합니다.

## PCM과 공유 메모리

`getSamples()`는 `sf::SoundBuffer::getSamples()`를 매핑한 Int16Array를 반환하며, 빈 버퍼에서는 undefined를 반환합니다. 오디오 샘플은 채널을 인터리브한 순서로 배치됩니다. sampleCount는 모든 채널을 포함하고 bigint를 사용하며, 샘플 레이트와 채널 수는 number를 사용합니다. duration과 playingOffset은 Time을 사용합니다.

SoundBuffer의 sampleRate와 duration은 안정적인 SFML 필드를 직접 매핑하며, 샘플 수와 채널 수는 네이티브 파생 필드에 저장합니다. Cone, TimeSpan, SoundFileReader.Info의 수치는 각각의 네이티브 구조체를 매핑합니다. SoundSource와 Listener는 안정적인 네이티브 수치 제어 영역으로 매개변수와 결과를 전달하지만, 각 제어 작업에서 여전히 SFML setter/getter를 호출하여 오디오 엔진의 동기화, 변환, 상태 업데이트를 수행합니다. 위치, 방향, Cone, Time은 독립적인 값으로 반환되므로 getter 결과를 수정해도 음원은 바뀌지 않습니다.

PCM과 읽기 전용 channelMap 뷰의 BackingStore는 해당 네이티브 할당의 수명을 유지합니다. SoundBuffer를 성공적으로 다시 로드한 뒤에도 이전 뷰는 이전 할당을 가리키고, 연결된 Sound는 새 버퍼로 전환됩니다. 로딩이 실패하면 현재 리소스를 유지합니다. SoundBufferRecorder는 녹음할 때마다 새 네이티브 recorder를 사용하며, 종료 시 해당 `getBuffer()`를 직접 매핑합니다. 이전 녹음 뷰도 계속 유효합니다.

`new SoundBuffer(samples, channelCount, sampleRate, channelMap)`은 Int16Array에서 동기식으로 생성합니다. 배열 뷰의 길이를 샘플 수로 사용하고, SFML이 샘플을 복사하며, 로딩 실패 시 SFMLError가 발생합니다.

`target.assign(source)`는 source의 현재 샘플과 메타데이터를 네이티브 측에서 깊은 복사하고 target을 반환합니다. 대상 JS 객체와 네이티브 핸들은 유지되며, 연결된 Sound는 대상의 새 할당에 다시 바인딩됩니다. 이전에 가져온 샘플 및 채널 뷰는 이전 할당의 수명을 계속 유지합니다. source에는 녹음에서 반환한 ReadonlySoundBuffer도 사용할 수 있습니다. 자기 대입은 즉시 반환하며 뷰나 재생 상태를 바꾸지 않습니다. 이 메서드와 `loadFromSamples()`는 모두 현재 리소스를 동기식으로 교체합니다. 이미 요청한 비동기 로딩이 나중에 성공하면 그 결과도 반영되므로, 작업 순서를 고정해야 한다면 먼저 로딩을 await하세요.

```js
const source = new sf.SoundBuffer(
  new Int16Array([ 1000, -1000, 500, -500 ]),
  1, 44100, [ sf.SoundChannel.Mono ],
);
const target = new sf.SoundBuffer();
target.assign(source);
```

ReadonlySamples, ChannelMap, ReadonlySoundBuffer의 읽기 전용 제약은 TypeScript 타입에 적용됩니다. 런타임에는 샘플별 Proxy가 없으므로, JS에서 이 읽기 전용 뷰의 기반 buffer에 강제로 쓰거나 이를 분리하거나 전송하지 마세요. 독립적인 쓰기 가능 데이터가 필요하면 `slice()`를 사용합니다.

`loadFromSamples()`는 SFML을 동기식으로 호출하며, SFML이 복사한 샘플을 보유합니다. 비동기 메모리 로딩과 파일 read/write는 작업에 관련된 기반 할당을 유지합니다. 호출자는 Promise가 완료되기 전에 입력/출력 버퍼를 수정하거나 분리하거나 크기를 바꾸어서는 안 됩니다. `Music.openFromMemory()`와 `InputSoundFile.openFromMemory()`의 압축 데이터는 리소스를 닫거나 다시 열 때까지 변경하지 않아야 합니다.

## 음원 복사 대입

`SoundSource.assign(source)`는 피치, 패닝, 볼륨, 공간화, 위치, 방향, 사운드 콘, 속도, 도플러, 방향 감쇠 계수, 상대 위치 모드, 거리, 게인, 감쇠 설정을 동기식으로 복사하고 대상 자신을 반환합니다. Music과 사용자 정의 SoundStream은 이 메서드를 상속합니다. 대상의 콘텐츠, 반복 설정, 재생 위치, 재생 상태, 오디오 효과는 유지되며 원본은 영향을 받지 않습니다. 복사는 네이티브 호출 한 번으로 완료되고 SFML setter가 엔진을 업데이트하며, 제어 영역 fast buffer는 기존 매핑을 유지합니다.

`Sound.assign(sourceSound)`는 Sound를 받아 위 속성, 반복 설정, SoundBuffer 바인딩을 동기식으로 복사합니다. 두 Sound는 같은 버퍼를 참조하며, 대입 시 JS 참조와 네이티브 수명 유지 및 연결 목록을 업데이트합니다. 대상은 정지하고 재생 위치가 0으로 돌아가지만 원본 재생은 바뀌지 않습니다. 대상은 자신의 EffectProcessor를 유지합니다. 기존 효과 큐는 세대 번호를 갱신하여 무효화하고 이후 이전 블록을 버립니다. 대상의 네이티브 sf::Sound 인스턴스와 제어 영역은 유지됩니다.

두 assign 모두 자기 대입에서는 즉시 반환합니다. Sound에 기본 클래스 속성만 복사하려면 `SoundSource.prototype.assign.call(targetSound, source)`를 명시적으로 호출할 수 있습니다. 변수 타입을 SoundSource로 지정해도 JS의 동적 메서드 디스패치는 바뀌지 않습니다.

SFML 3.1.0의 `SoundSource::operator=`는 directionalAttenuationFactor를 복사하지 않지만, 이 바인딩의 속성 복사는 해당 필드를 포함합니다.

```js
music.assign(sound); // 음원 속성을 복사하고 music의 콘텐츠와 재생 상태는 유지합니다.
targetSound.assign(sourceSound); // 같은 버퍼에 바인딩하며 targetSound를 정지하고 재생 위치를 0으로 되돌립니다.
```

## Worker 데이터 공급

모든 Audio Worker는 모듈 팩토리를 사용하며 CommonJS와 ESM을 지원합니다. `module`은 파일 경로나 URL이고, `exportName`의 기본값은 `default`입니다. `data`는 Worker의 structured clone 규칙에 따라 전달됩니다. 팩토리는 `{ sampleRate, channelCount, blockFrames }`와 data를 받아 해당 콜백 객체를 반환하며, Promise를 반환할 수도 있습니다.

저장소의 [audio-worker.cjs](../examples/audio-worker.cjs)는 실행 가능한 `tone`과 `filter` 팩토리를 제공합니다.

```js
const path = require('node:path');
const sf = require('sfml.js');

async function playStream() {
  const stream = new sf.SoundStream({
    module: path.resolve('examples/audio-worker.cjs'),
    exportName: 'tone',
    data: { frequency: 330 },
    sampleRate: 44100,
    channelCount: 1,
    channelMap: [ sf.SoundChannel.Mono ],
    blockFrames: 1024,
    queueBlocks: 8,
  });
  try {
    if (!await stream.ready) return;
    stream.play();
    await sf.sleep(sf.seconds(2));
  } finally {
    await stream.close();
  }
}
playStream().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

| 콜백 | 계약 |
|------|------|
| `onGetData(chunk)` | 네이티브 측에서 제공한 `chunk.samples`를 채우고 `chunk.sampleCount` 설정. true는 계속 공급, false는 마지막 블록 |
| `onSeek(time)` | 생성 커서를 Time 위치로 이동. 초기화 시에도 한 번 호출 |
| `onLoop()` | 마지막 블록 준비 단계에서 호출. 인터리브된 샘플 오프셋 bigint를 반환하고, undefined는 이번 반복을 금지. 생략 시 기본 반환값은 `0n` |
| `onClose()` | Worker 종료 전 리소스 정리 |

`chunk.samples`를 교체할 수는 없습니다. sampleCount는 슬롯 용량을 넘을 수 없고 채널 수의 정수 배수여야 하며, 계속 공급하는 경우 0개 샘플을 제출할 수 없습니다. 마지막 블록에는 유효한 샘플을 포함할 수 있습니다. 네이티브 측은 seek 시 세대 번호를 갱신하고, 장치 스레드는 이전에 큐에 넣은 데이터를 버립니다. 이후 Worker가 새 onSeek를 실행합니다.

콜백이 받는 TypedArray는 재사용 가능한 네이티브 슬롯이며, 해당 콜백이 완료되기 전까지 그 콜백이 독점합니다. 보관한 뒤 계속 접근하지 마세요. 내용을 보관해야 한다면 직접 `slice()`하세요. Promise가 완료되어야 슬롯이 제출되거나 해제됩니다. 콜백은 반드시 최종적으로 완료되어야 합니다. 완료되지 않은 사용자 Promise는 정상적인 `close()`나 녹음 큐 비우기를 막습니다.

## 오디오 효과

다음 코드는 이미 생성된 Sound에 이어서 async 함수 안에서 실행합니다. `path`는 `node:path`이며, Worker 모듈 경로는 저장소 루트 디렉터리를 기준으로 합니다.

```js
const effect = new sf.EffectProcessor({
  module: path.resolve('examples/audio-worker.cjs'),
  exportName: 'filter',
  blockFrames: 1024,
  queueBlocks: 8,
  maxChannelCount: 8,
});
await effect.ready;
sound.setEffectProcessor(effect);
// 사용을 마치면 음원에서 먼저 제거한 뒤 Worker를 종료합니다.
sound.setEffectProcessor();
await effect.close();
```

효과 팩토리는 `process(input, inputFrameCount, output, outputFrameCount, channelCount)`를 반환합니다. input과 output은 네이티브 float32 큐의 매핑입니다. 입력에는 이미 공간화가 적용되어 있으며, channelCount는 이번 장치 출력의 채널 수입니다. `{ inputFrameCount, outputFrameCount }`를 반환하여 실제 소비 및 생성 프레임 수를 지정하고, 일부만 소비할 수도 있습니다. void를 반환하면 모든 입력을 소비하고 같은 수의 프레임을 출력합니다. 잔향 처리가 아닌 호출에서는 최소 한 프레임을 소비하거나 생성해야 합니다.

input이 null이면 잔향 처리이며, 잔향을 출력하다가 최종적으로 출력 프레임 0을 반환하면 종료됩니다. 각 프레임에는 channelCount개의 인터리브된 float32 샘플이 있으며, 이번에 전달된 유효한 뷰에만 접근할 수 있습니다. `maxChannelCount`는 사전 할당 용량으로 기본값은 8이며, 실제 채널 수가 용량을 넘으면 무음을 출력합니다. 팩토리 context의 channelCount는 용량을 뜻하고, 실제 처리는 process 매개변수를 기준으로 합니다. sampleRate는 Worker 생성 시 읽으므로, 장치를 전환한 뒤에는 샘플 레이트에 의존하는 효과를 다시 생성해야 합니다.

하나의 EffectProcessor는 동시에 하나의 음원에만 설치할 수 있습니다. 제거한 뒤에는 다른 음원에 설치할 수 있습니다. 설치와 제거 시 음원의 재생 위치 및 재생/일시 정지 상태는 유지됩니다. 설치된 상태의 EffectProcessor를 명시적으로 닫으면 해당 음원의 효과 경로는 무음을 출력합니다.

## 녹음

다음 코드는 async 함수 안에서 실행하며, `sf`는 가져온 패키지입니다. 먼저 캡처 장치를 사용할 수 있는지 확인하고 시스템 마이크 권한을 허용하세요.

```js
const recorder = new sf.SoundBufferRecorder();
recorder.setChannelCount(1);
try {
  if (!await recorder.start(44100)) throw new Error('Cannot start recording');
  await sf.sleep(sf.seconds(1));
} finally {
  await recorder.stop();
}
const recorded = recorder.getBuffer();
console.log(recorded.getSampleCount());
if (!await recorded.saveToFile('recorded.wav')) throw new Error('Cannot save recording');
```

`start()`, `stop()`, `setDevice()`는 Promise를 반환합니다. 채널 수는 1 또는 2를 지원하며, 변경하기 전에 녹음을 중지하고 대기 중인 작업이 끝날 때까지 기다려야 합니다. 재생 장치와 캡처 장치는 별도로 조회하고 선택합니다.

사용자 정의 SoundRecorder는 SoundStream과 같은 Worker 설정을 사용합니다. 팩토리는 선택적인 `onStart()`, 필수 `onProcessSamples(samples)`, 선택적인 `onStop()`을 반환합니다. onStart가 false를 반환하면 시작을 취소합니다. onProcessSamples는 콜백 동안에만 유효한 네이티브 Int16Array를 받으며, false를 반환하면 비동기 작업이 캡처를 중지합니다. 정상적인 `await stop()`은 큐가 비워지고 onStop이 완료될 때까지 기다립니다. 콜백이 직접 false를 반환하면 큐에 남은 샘플을 버립니다.

## 파일 스트림과 코덱 확장

SoundBuffer, Music, InputSoundFile은 모두 기존 InputStream, MemoryInputStream, FileInputStream을 지원합니다. 파일 읽기/쓰기, 열기, 닫기는 객체별로 직렬 실행하고, 서로 다른 객체에서는 병렬 실행할 수 있습니다. 성공적으로 열린 뒤에만 네이티브 메타데이터를 반영합니다. 비동기 read/seek가 완료되기 전에는 getter가 이전에 반영된 결과를 계속 반환합니다.

내장 SFML 파일/메모리 디코딩은 스레드에서 실행합니다. 비동기 InputStream은 독립적인 네이티브 디코딩 스레드와 libuv 알림 브리지를 사용하여, JS 파일 I/O를 기다리는 동안 libuv 작업 스레드 풀이 모두 점유되는 것을 방지합니다. InputStream의 read 대상 버퍼는 네이티브 측에서 할당하며, 완료 시 유효한 바이트의 스냅샷을 가져옵니다.

Music의 일반 파일/메모리 입력은 `sf::Music`을 사용합니다. InputStream이나 등록된 JS Reader 입력은 제한된 용량의 PCM 미리 읽기를 사용하며, 기본값은 1024프레임과 슬롯 8개입니다. 비동기 디코딩은 장치 콜백 밖에서 실행하고, 재생, 위치 이동, 반복 시에는 네이티브 SoundStream을 통해 데이터를 소비합니다. JS 사용자 정의 Reader는 호출 환경에서 실행되므로, 오래 걸리는 동기식 JS 디코딩은 그 환경의 이벤트 루프를 점유합니다.

SFML 내장 Reader/Writer도 SoundFileFactory로 생성한 뒤 `open()`을 호출해야 합니다. WAV, FLAC, Ogg의 쓰기와 다시 읽기는 런타임 테스트가 있으며, 다른 SFML 내장 입력 형식은 현재 SFML 빌드의 디코딩 지원을 따릅니다.

확장 Reader는 SoundFileReader를 상속하고, 정적 `check(stream)`, `open(stream)`, `seek(sampleOffset)`, `read(samples)`, 선택적인 `close()`를 제공합니다. open은 `new SoundFileReader.Info({ sampleCount, sampleRate, channelCount, channelMap })` 또는 undefined를 반환합니다. read는 전달받은 Int16Array를 채우고 실제 샘플 수를 bigint로 반환합니다. 확장 Writer는 SoundFileWriter를 상속하고, 정적 `check(filename)`, `open(filename, sampleRate, channelCount, channelMap)`, `write(samples)`, 선택적인 `close()`를 제공합니다. 이 메서드들은 Promise를 반환할 수 있습니다.

`SoundFileFactory.registerReader(ReaderClass)`와 `registerWriter(WriterClass)`로 등록하고, 대응하는 unregister 메서드로 해제합니다. 같은 클래스를 중복 등록해도 중복 삽입되지 않습니다. JS 레지스트리는 현재 Node 환경에 속하므로 Worker는 자신의 환경에 등록해야 합니다. 모든 공개 SoundBuffer, Music, 오디오 파일 진입점은 등록된 JS 클래스를 먼저 확인하고, 일치하지 않으면 SFML 내장 팩토리로 폴백합니다. 템플릿 등록 인터페이스는 JS 클래스로 구현하며, JS 함수 포인터를 프로세스 전체 C++ 팩토리에 설치하지 않습니다. 전체 확장 예제는 [audio-codec.test.cjs](../test/audio-codec.test.cjs)를 참고하세요.

## 버퍼, 상태, 정리

Worker 기본값은 `blockFrames = 1024`, `queueBlocks = 8`입니다. 64~65536프레임, 슬롯 2~32개, 채널 1~32개를 허용합니다. 슬롯 메모리는 네이티브 측에서 미리 할당하고 acquire/release로 공개하고 반환합니다. PCM은 postMessage를 통한 복사를 거치지 않으며, postMessage는 ready, 오류, 정지 알림만 전달합니다.

44100 Hz에서 1024프레임은 23.22 ms이며, 슬롯 8개에는 약 185.76 ms의 샘플을 담을 수 있습니다. 이는 블록 길이와 큐 용량이며, 종단 간 지연 보장이 아닙니다. Worker는 2 ms마다 비동기적으로 사용 가능한 슬롯을 확인하며, 장치 출력은 SFML과 시스템 버퍼의 영향도 받습니다.

| 상황 | 동작 및 통계 단위 |
|------|----------------|
| Stream에 준비된 PCM이 없음 | 무음 출력. underruns는 블록 부족 횟수 |
| 녹음 큐가 가득 참 | 새 샘플 버림. overruns는 인터리브된 샘플 수 |
| 효과 입력 큐가 가득 참 | 이번에 받은 입력 프레임 버림. overruns는 프레임 수 |
| 효과 출력이 부족함 | 부족한 부분을 무음으로 채움. underruns는 프레임 수 |
| processed | Stream/Recorder는 인터리브된 샘플 수, EffectProcessor는 소비한 입력 프레임 수 |

`getWorkerStats()`는 bigint 통계 스냅샷을, `getWorkerError()`는 기록된 비동기 오류를 반환합니다. Worker 초기화 오류는 ready를 거부시키며, close/stop은 Worker 오류를 보고합니다. C++ 예외는 SFMLError로 매핑되고, SFML 진단은 기존 `err()`/`setErrorOutput()` 경로에 기록됩니다.

Audio Worker는 초기화 완료 후 unref되므로 단독으로 Node 프로세스를 유지하지 않습니다. 재생 중에는 창 루프나 `await sleep()`으로 이벤트 루프를 유지하세요. 종료 시에는 `await stream.close()`, `await music.close()`, `await effect.close()`, `await recorder.stop()`을 사용합니다. 파일 쓰기는 `await output.close()`로 파일 마무리와 리소스 정리를 완료합니다. 네이티브 음원과 녹음 리소스는 프로젝트의 백그라운드 해제 방식을 따릅니다. 뷰는 해당 할당의 수명을 유지하며, Node 환경 종료 시 소속 리소스도 종료됩니다.

재생 장치 알림은 콜백을 등록한 JS 스레드에서 비동기적으로 전달되며, 오디오 장치 스레드에서 실행되지 않습니다. SFML 알림 콜백은 프로세스 전체에서 단일 슬롯을 사용하므로 마지막 등록이 이전 등록을 대체합니다. `setNotificationCallback()`을 호출하면 콜백을 제거하고 전달 대기 중인 알림을 버립니다.

## 데모와 검증

`npm run demo:audio`를 실행하거나 빌드 후 `node examples/audio.cjs`를 실행하세요. 1~4로 Sound, WorkerStream, Music, 녹음 재생을 전환합니다. Space는 재생/일시 정지, S는 정지, E는 효과 전환, R은 녹음 시작, T는 녹음 종료입니다. 방향키로 패닝과 볼륨을 조절하고 Esc로 닫습니다. 녹음은 메모리에만 유지됩니다.

`node examples/audio.cjs --smoke --frames=90`은 스피커 재생, Worker PCM, 효과 처리, Music, 마이크 녹음 및 재생을 자동 검증한 뒤 종료합니다. 이 모드는 로컬 캡처 장치를 활성화합니다. 일반 실행은 사용자 키 입력을 기다립니다.

자동 테스트는 SFML 필드 대조, PCM 뷰, 리소스 수명 주기, WAV/FLAC/Ogg, 비동기 입력 스트림, Worker 데이터 공급 및 위치 이동, 오디오 효과, 녹음 큐, 사용자 정의 코덱을 포함합니다. 테스트 코드는 [test/audio.test.cjs](../test/audio.test.cjs), [Worker 테스트](../test/audio-worker.test.cjs), [코덱 테스트](../test/audio-codec.test.cjs)를 참고하세요.

실제 사운드 출력, 마이크 캡처, 장치 핫플러그는 대상 장치에서 검증해야 합니다. CI의 빌드 및 테스트 구성은 [개발 가이드](development.ko.md#testing)를 참고하세요.

<a id="sfml-cpp-reference"></a>
## SFML C++ 레퍼런스

원본 클래스 문서: [SoundBuffer](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundBuffer.html), [Sound](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sound.html), [Music](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Music.html), [SoundStream](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundStream.html), [SoundRecorder](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundRecorder.html), [SoundFileFactory](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundFileFactory.html).

재생 및 공간 오디오의 개념은 업스트림 문서를 참고하세요. JS의 비동기 리소스 메서드, Worker 콜백, 공유 버퍼 수명은 C++ 사용 방식과 다르므로 이 가이드의 계약을 따라야 합니다.
