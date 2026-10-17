# Audio

**English** · [简体中文](audio.zh-CN.md) · [日本語](audio.ja.md) · [한국어](audio.ko.md)

> Use SoundBuffer + Sound for short sound effects and Music for long audio. Custom data production, recording processing and effects run through Node Workers.

[API guide](api.md) · [Core concepts](concepts.md) · [Examples](../examples/README.md)

## Choose an API

| Task | API |
| --- | --- |
| Load and repeatedly play short sound effects | SoundBuffer, Sound |
| Stream playback from files, memory or input streams | Music |
| Generate your own PCM | SoundStream + Worker module |
| Adjust volume, panning and spatial properties | SoundSource, Listener |
| Select a playback device | PlaybackDevice |
| Record into a buffer | SoundBufferRecorder |
| Process captured data yourself | SoundRecorder + Worker module |
| Process sound-source output | EffectProcessor |
| Read/write audio files or extend formats | InputSoundFile, OutputSoundFile, SoundFileFactory |

For files and compressed data, use default construction followed by await open/load. SoundBuffer and Sound provide copy constructors; SoundBuffer can also be constructed from PCM. See [TypeDoc](https://sfml.js.org/reference/) for complete signatures.

## Play short sound effects

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

Use `setLooping()` to control looping and `setPlayingOffset()` to adjust playback position. Multiple Sounds can share one SoundBuffer; copying a Sound does not share its Worker effect.

## Play music

Run this snippet inside an async function:

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

Music extends SoundStream and provides duration and loop ranges. Accessing the Time returned by a getter does not directly change playback position; use the setter.

## PCM and shared memory

`getSamples()` returns an Int16Array mapped to `sf::SoundBuffer::getSamples()`, or undefined for an empty buffer. Audio samples use interleaved channels; sampleCount includes all channels and uses bigint. Sample rate and channel count use number; duration and playingOffset use Time.

SoundBuffer's sampleRate and duration map directly to stable SFML fields; sample and channel counts are stored in native derived fields. Numeric values in Cone, TimeSpan and SoundFileReader.Info map to their respective native structures. SoundSource and Listener pass arguments and results through stable native numeric control regions. Each control operation still calls SFML setters/getters so the audio engine performs synchronization, conversion and state updates. Position, direction, Cone and Time return independent values; modifying getter results does not change the source.

The BackingStore of PCM and read-only channelMap views keeps the corresponding native allocation alive. After a successful SoundBuffer reload, old views continue pointing to the old allocation and associated Sounds switch to the new buffer; failed loads preserve the current resource. SoundBufferRecorder uses a new native recorder for each recording, directly mapping its `getBuffer()` when finished; old recording views remain valid.

`new SoundBuffer(samples, channelCount, sampleRate, channelMap)` constructs synchronously from an Int16Array, using the array view's length as the sample count. SFML copies the samples; loading failure throws SFMLError.

`target.assign(source)` deep-copies the source's current samples and metadata in native code and returns target. The target JS object and native handle stay unchanged; associated Sounds are rebound to the target's new allocation, while previously acquired sample and channel views keep the old allocation alive. source may be a ReadonlySoundBuffer returned by recording; self-assignment returns immediately without changing views or playback state. This method and `loadFromSamples()` synchronously replace the current resource. Previously submitted asynchronous loads still publish their results on successful completion; await loading first when operation order must be fixed.

```js
const source = new sf.SoundBuffer(
  new Int16Array([ 1000, -1000, 500, -500 ]),
  1, 44100, [ sf.SoundChannel.Mono ],
);
const target = new sf.SoundBuffer();
target.assign(source);
```

The read-only constraints on ReadonlySamples, ChannelMap and ReadonlySoundBuffer apply to TypeScript types. There is no per-sample Proxy at runtime; do not force writes through JS or detach or transfer the underlying buffers of these read-only views. Use `slice()` for independent writable data.

`loadFromSamples()` calls SFML synchronously, and SFML owns the copied samples. Asynchronous memory loading and file read/write retain the underlying allocations involved; callers must not modify, detach or resize input/output buffers before the promise completes. Compressed data passed to `Music.openFromMemory()` and `InputSoundFile.openFromMemory()` must remain unchanged until the resource is closed or reopened.

## Sound-source copy assignment

`SoundSource.assign(source)` synchronously copies pitch, panning, volume, spatialization, position, direction, cone, velocity, Doppler, directional attenuation factor, relative-position mode, distance, gain and attenuation settings, returning the target itself. Music and custom SoundStream inherit this method. Target contents, looping settings, playback position, playback state and effects are preserved; the source is unaffected. Copying completes in one native call, SFML setters update the engine, and the control-region fast buffer retains its original mapping.

`Sound.assign(sourceSound)` accepts a Sound and synchronously copies the properties above, looping settings and SoundBuffer binding. Both Sounds reference the same buffer; assignment updates JS references, native lifetime retention and association lists. The target stops and resets to the beginning; source playback is unchanged. The target keeps its own EffectProcessor; existing effect queues are invalidated by updating the generation, and old blocks are subsequently discarded. The target's native sf::Sound instance and control region remain unchanged.

Both assign methods return immediately on self-assignment. To copy only base-class properties into a Sound, explicitly call `SoundSource.prototype.assign.call(targetSound, source)`; annotating a variable as SoundSource does not change JS dynamic method dispatch.

SFML 3.1.0's `SoundSource::operator=` does not copy directionalAttenuationFactor; this binding includes that field when copying properties.

```js
music.assign(sound); // Copy source properties, preserving music's contents and playback state.
targetSound.assign(sourceSound); // Bind the same buffer; targetSound stops and resets to the beginning.
```

## Worker data production

All Audio Workers use module factories supporting CommonJS and ESM. `module` is a file path or URL; `exportName` defaults to `default`; `data` is passed under Worker structured-clone rules. The factory receives `{ sampleRate, channelCount, blockFrames }` and data, and returns the corresponding callback object, optionally through a promise.

The repository's [audio-worker.cjs](../examples/audio-worker.cjs) provides runnable `tone` and `filter` factories.

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

| Callback | Contract |
|------|------|
| `onGetData(chunk)` | Fill the natively provided `chunk.samples` and set `chunk.sampleCount`; true means continue, false marks the last block |
| `onSeek(time)` | Position the production cursor at Time; also called once during initialization |
| `onLoop()` | Called while preparing the last block; return an interleaved sample offset as bigint, or undefined to prevent this loop; defaults to `0n` when omitted |
| `onClose()` | Clean up resources before the Worker exits |

Do not replace `chunk.samples`. sampleCount must not exceed slot capacity and must be a multiple of the channel count; continuing data production cannot submit zero samples. The last block may contain valid samples. Native code updates the generation on seek, and the device thread discards previously queued data; the Worker then executes the new onSeek.

The TypedArray received by a callback is a reusable native slot, exclusively available to that callback only until it completes. Do not retain it for later access; use `slice()` if you need to keep the contents. A slot is submitted or released only when the promise completes. Callbacks must eventually finish; unresolved user promises prevent normal `close()` or recording drain.

## Effects

This snippet continues from an existing Sound and runs inside an async function. `path` is `node:path`, and the Worker module path is relative to the repository root.

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
// When finished, detach from the source before closing the Worker.
sound.setEffectProcessor();
await effect.close();
```

The effect factory returns `process(input, inputFrameCount, output, outputFrameCount, channelCount)`. input and output map native float32 queues; input has already been spatialized, and channelCount is the device output channel count for this call. Return `{ inputFrameCount, outputFrameCount }` to specify the actual consumed and produced frame counts; partial consumption is allowed. Returning void consumes all input and produces the same number of frames. Non-tail calls must consume or produce at least one frame.

A null input indicates tail processing: you can output residual sound, then return zero output frames to end the tail. Each frame has channelCount interleaved float32 samples; access only the valid views passed to the current call. `maxChannelCount` is the preallocated capacity, defaulting to 8; output is silent if the actual channel count exceeds capacity. channelCount in the factory context is the capacity; use the process argument for actual processing. sampleRate is read when the Worker is created; recreate sample-rate-dependent effects after switching devices.

An EffectProcessor can be attached to only one source at a time. After removal, it can be attached to another source. Attaching and detaching preserve the source's playback position and playing/paused state. Explicitly closing an EffectProcessor while it is still attached makes that source's effect path output silence.

## Recording

Run this snippet inside an async function, with `sf` as the package import. First confirm a capture device is available and grant system microphone permission:

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

`start()`, `stop()` and `setDevice()` return promises. Channel count supports 1 or 2; stop recording and await pending operations before changing it. Playback and capture devices are queried and selected separately.

A custom SoundRecorder uses the same Worker configuration as SoundStream. The factory returns optional `onStart()`, required `onProcessSamples(samples)` and optional `onStop()`. Returning false from onStart cancels startup. onProcessSamples receives a native Int16Array valid only during the callback; returning false schedules asynchronous capture shutdown. Normal `await stop()` waits for the queue to drain and onStop to finish; when the callback explicitly returns false, remaining queued samples are discarded.

## File streams and codec extensions

SoundBuffer, Music and InputSoundFile support the existing InputStream, MemoryInputStream and FileInputStream. File reads, writes, opens and closes are serialized per object but can run concurrently across objects. Native metadata is published only after a successful open; getters return the last published result until asynchronous read/seek completes.

Built-in SFML file/memory decoding runs on threads. Asynchronous InputStream uses a dedicated native decoding thread and a libuv notification bridge, avoiding saturation of the libuv worker pool while waiting for JS file I/O. The InputStream read destination buffer is allocated natively, and valid bytes are snapshotted on completion.

Music uses `sf::Music` for ordinary file/memory input. InputStream or registered JS Reader input uses bounded PCM prefetching, defaulting to 1024 frames and 8 slots. Asynchronous decoding runs outside device callbacks; playback, seeking and looping consume data through native SoundStream. Custom JS Readers run in the calling environment, so expensive synchronous JS decoding occupies that environment's event loop.

Built-in SFML Readers/Writers still require `open()` after creation through SoundFileFactory. Runtime tests cover WAV, FLAC and Ogg writing and readback; other built-in SFML input formats use the decoding support in the current SFML build.

An extended Reader inherits SoundFileReader and provides static `check(stream)`, instance `open(stream)`, `seek(sampleOffset)`, `read(samples)` and optional `close()`. open returns `new SoundFileReader.Info({ sampleCount, sampleRate, channelCount, channelMap })` or undefined. read fills the supplied Int16Array and returns the actual sample count as bigint. An extended Writer inherits SoundFileWriter and provides static `check(filename)`, instance `open(filename, sampleRate, channelCount, channelMap)`, `write(samples)` and optional `close()`. These methods may return promises.

Register through `SoundFileFactory.registerReader(ReaderClass)` and `registerWriter(WriterClass)`, and unregister through the corresponding methods; registering the same class again does not insert duplicates. The JS registry belongs to the current Node environment; Workers must register in their own environments. All public SoundBuffer, Music and audio-file entry points check registered JS classes first, falling back to the built-in SFML factory if none match. Template registration APIs are implemented through JS classes, without installing JS function pointers into the process-wide C++ factory. See [audio-codec.test.cjs](../test/audio-codec.test.cjs) for complete extension examples.

## Buffers, state and cleanup

Workers default to `blockFrames = 1024` and `queueBlocks = 8`. Allowed ranges are 64-65536 frames, 2-32 slots and 1-32 channels. Slot memory is preallocated natively, published and returned through acquire/release; PCM is not copied through postMessage. postMessage carries only ready, error and stop notifications.

1024 frames at 44100 Hz correspond to 23.22 ms; 8 slots hold approximately 185.76 ms of samples. These figures describe block duration and queue capacity, not guaranteed end-to-end latency. Workers asynchronously check for available slots every 2 ms; device output also depends on SFML and system buffering.

| Condition | Behavior and statistic units |
|------|----------------|
| Stream has no ready PCM | Output silence; underruns counts missing blocks |
| Recording queue is full | Discard new samples; overruns counts interleaved samples |
| Effect input queue is full | Discard the input frames received in this call; overruns counts frames |
| Effect output is insufficient | Fill the missing portion with silence; underruns counts frames |
| processed | Interleaved sample count for Stream/Recorder; consumed input frame count for EffectProcessor |

`getWorkerStats()` returns a snapshot of bigint statistics; `getWorkerError()` returns recorded asynchronous errors. Worker initialization errors reject ready; close/stop report Worker errors. C++ exceptions map to SFMLError, and SFML diagnostics use the existing `err()`/`setErrorOutput()` path.

Audio Workers are unref'ed after initialization and do not keep the Node process alive on their own; maintain the event loop with a window loop or `await sleep()` during playback. Finish with `await stream.close()`, `await music.close()`, `await effect.close()` and `await recorder.stop()`. For file output, `await output.close()` finalizes the file trailer and cleans up resources. Native sound sources and recording resources use the project's background-release mechanism; views keep their allocations alive, and exiting a Node environment shuts down its resources.

Playback-device notifications are dispatched asynchronously on the JS thread that registered the callback, not on the audio device thread. SFML provides one process-wide notification callback slot; the latest registration replaces the previous one. Calling `setNotificationCallback()` removes it and discards pending notifications.

## Demos and verification

Run `npm run demo:audio`, or `node examples/audio.cjs` after building. Keys 1-4 switch between Sound, WorkerStream, Music and recording playback. Space plays/pauses, S stops, E toggles effects, R starts recording and T stops recording; arrow keys control panning and volume. Esc closes the window. Recordings are kept only in memory.

`node examples/audio.cjs --smoke --frames=90` automatically verifies speaker playback, Worker PCM, effect processing, Music, microphone recording and playback, then exits. This mode activates the local capture device. Normal startup waits for user input.

Automated tests cover SFML field comparisons, PCM views, resource lifetimes, WAV/FLAC/Ogg, asynchronous input streams, Worker data production and seeking, effects, recording queues and custom codecs. See [test/audio.test.cjs](../test/audio.test.cjs), [Worker tests](../test/audio-worker.test.cjs) and [codec tests](../test/audio-codec.test.cjs).

Actual sound output, microphone capture and device hot-plugging require verification on target devices. See the [development guide](development.md#testing) for CI build and test configuration.

<a id="sfml-cpp-reference"></a>

## SFML C++ reference

See the original [SoundBuffer](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundBuffer.html), [Sound](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sound.html), [Music](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Music.html), [SoundStream](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundStream.html), [SoundRecorder](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundRecorder.html) and [SoundFileFactory](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1SoundFileFactory.html) references for playback, spatial audio, recording and codec concepts.

JavaScript resource methods are asynchronous where described above. Worker callback execution and shared-buffer lifetimes differ from C++; follow this guide's callback, ownership and cleanup contracts.
