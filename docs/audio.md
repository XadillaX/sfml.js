# Audio

> SFML 3.1.0 Audio 绑定。Native 持有 SFML 对象、PCM、控制区和 Worker 队列，JS 通过内置 fast buffer 访问数值。设备线程只处理 Native 数据；自定义供数、录音处理和音效在 Node Worker 中执行。

## API 对照

| SFML | JS 接口 |
|------|---------|
| `SoundBuffer` | 空构造、复制构造、PCM 构造；`assign()` 拷贝赋值；`loadFromFile/Memory/Stream()`、`loadFromSamples()`、`saveToFile()`；samples、sampleCount、sampleRate、channelCount、channelMap、duration 查询 |
| `SoundSource` | 抽象基类；pitch、pan、volume、spatialization、position、direction、cone、velocity、dopplerFactor、directionalAttenuationFactor、relativeToListener、min/maxDistance、min/maxGain、attenuation 的完整读写；status、effectProcessor、play/pause/stop；`assign(source)` 复制音源属性 |
| `Sound` | 从 SoundBuffer 或 Sound 构造；buffer、looping、playingOffset 读写及全部 SoundSource 方法；`assign(sound)` 复制属性、循环设置与缓冲绑定 |
| `SoundStream` | Worker 模块构造；sampleRate、channelCount、channelMap 查询，looping、playingOffset 读写；`onGetData/onSeek/onLoop` 回调；`ready`、`close()`、Worker 状态查询 |
| `Music` | 继承 SoundStream；`openFromFile/Memory/Stream()`、`getDuration()`、`set/getLoopPoints()`、`close()` |
| `Listener` | 命名空间；globalVolume、position、direction、velocity、cone、upVector 的完整读写 |
| `PlaybackDevice` | `getAvailableDevices/getDefaultDevice/setDevice/setDeviceToDefault/setDeviceToNull/getDevice/getDeviceSampleRate/isDefaultDevice/setNotificationCallback`；`Notification` 枚举 |
| `SoundRecorder` | Worker 模块构造；`start/stop/setDevice/getDevice/setChannelCount/getChannelCount/getChannelMap/getSampleRate`；静态 `getAvailableDevices/getDefaultDevice/isAvailable`；`onStart/onProcessSamples/onStop` 回调 |
| `SoundBufferRecorder` | 继承 SoundRecorder；空构造，`getBuffer()` 返回只读 SoundBuffer |
| `InputSoundFile` | `openFromFile/Memory/Stream/read/seek/close`；sampleCount、sampleOffset、sampleRate、channelCount、channelMap、duration、timeOffset 查询 |
| `OutputSoundFile` | `openFromFile/write/close` |
| `SoundFileReader` | 抽象 `open/seek/read`，可选 `close`；`SoundFileReader.Info` 对应 `SoundFileReaderInfo` |
| `SoundFileWriter` | 抽象 `open/write`，可选 `close` |
| `SoundFileFactory` | Reader／Writer 的注册、注销、注册查询；`createReaderFromFilename/Memory/Stream`、`createWriterFromFilename` |
| `SoundChannel` | 全部 20 个声道枚举值 |
| `SoundSource::Status` | `SoundStatus`，也可用 `SoundSource.Status` |
| `SoundSource::Cone`、`Listener::Cone` | `Cone`，也可用 `SoundSource.Cone`、`Listener.Cone` |
| `Music::TimeSpan` | `TimeSpan`，也可用 `Music.TimeSpan` |
| `SoundSource::EffectProcessor` | `EffectProcessor` Worker 对象；通过 `source.setEffectProcessor()` 安装或移除 |
| `AudioResource` | SFML 内部设备保活基类，由 Native 对象管理，无独立 JS 业务接口 |

文件、压缩内存与流的加载构造重载采用「空构造 + await open/load」；C++ 移动与析构由 JS 引用和 Native 所有权承担。SoundBuffer 与 Sound 保留显式复制构造；SoundBuffer 另外提供 PCM 构造和对应 C++ 拷贝赋值的 `assign()`。Sound 复制不共享 Worker 音效，需要为副本单独安装 EffectProcessor。

## 播放与共享内存

```js
const sf = require('sfml.js');

async function play() {
  const buffer = new sf.SoundBuffer();
  if (!await buffer.loadFromFile('sound.wav')) return;
  const sound = new sf.Sound(buffer);
  sound.setVolume(25);
  sound.play();
  while (sound.getStatus() === sf.SoundStatus.Playing) {
    await sf.sleep(sf.milliseconds(10));
  }
}
void play();
```

`getSamples()` 返回映射 `sf::SoundBuffer::getSamples()` 的 Int16Array，空缓冲返回 undefined。音频样本采用交错声道排列，sampleCount 包含全部声道，使用 bigint；采样率与声道数使用 number。duration 和 playingOffset 使用 Time。

SoundBuffer 的 sampleRate、duration 直接映射稳定的 SFML 字段，样本数和声道数存于 Native 派生字段。Cone、TimeSpan、SoundFileReader.Info 的数值映射各自的 Native 结构。SoundSource、Listener 使用稳定的 Native 数值控制区传递参数和结果，每次控制操作仍调用 SFML setter/getter，使音频引擎执行同步、换算与状态更新。位置、方向、Cone、Time 返回独立值；修改 getter 的结果不会改变音源。

PCM 和只读 channelMap 视图的 BackingStore 保活对应的 Native 分配。SoundBuffer 成功重载后，旧视图继续指向旧分配，关联 Sound 切换到新缓冲；失败加载保留当前资源。SoundBufferRecorder 每次录音使用新的 Native recorder，结束时直接映射其 `getBuffer()`，旧录音视图继续有效。

`new SoundBuffer(samples, channelCount, sampleRate, channelMap)` 从 Int16Array 同步构造，使用数组视图的长度作为样本数，SFML 复制样本，加载失败抛出 SFMLError。

`target.assign(source)` 在 Native 中深拷贝 source 当前的样本和元数据，返回 target。目标 JS 对象和 Native 句柄保持不变，关联 Sound 重新绑定到目标的新分配；此前取得的样本和声道视图继续保活旧分配。source 可以是录音返回的 ReadonlySoundBuffer；自赋值直接返回，不改变视图或播放状态。该方法和 `loadFromSamples()` 都同步替换当前资源；已经提交的异步加载成功完成后仍会发布其结果，需要固定操作顺序时先 await 加载。

```js
const source = new sf.SoundBuffer(
  new Int16Array([ 1000, -1000, 500, -500 ]),
  1, 44100, [ sf.SoundChannel.Mono ],
);
const target = new sf.SoundBuffer();
target.assign(source);
```

ReadonlySamples、ChannelMap 和 ReadonlySoundBuffer 的只读约束作用于 TypeScript 类型。运行时没有逐样本 Proxy；不要通过 JS 强制写入、分离或转移这些只读视图的底层 buffer。需要独立可写数据时使用 `slice()`。

`loadFromSamples()` 同步调用 SFML，SFML 持有复制后的样本。异步内存加载、文件 read/write 保留操作涉及的底层分配，调用者在 Promise 完成前不得修改、分离或调整输入／输出缓冲。`Music.openFromMemory()` 和 `InputSoundFile.openFromMemory()` 的压缩数据在资源关闭或重新打开前都必须保持不变。

## 音源拷贝赋值

`SoundSource.assign(source)` 同步复制音高、声像、音量、空间化、位置、方向、声锥、速度、多普勒、方向衰减系数、相对位置模式、距离、增益和衰减设置，返回目标自身。Music 和自定义 SoundStream 继承该方法。目标内容、循环设置、播放位置、播放状态和音效保留，源不受影响。复制在一次 Native 调用中完成，SFML setter 更新引擎，控制区 fast buffer 保持原映射。

`Sound.assign(sourceSound)` 接受 Sound，同步复制上述属性、循环设置和 SoundBuffer 绑定。两个 Sound 引用同一个缓冲，赋值更新 JS 引用及 Native 保活和关联列表；目标停止并归零，源播放不变。目标保留自己的 EffectProcessor，已有音效队列通过更新代数失效，随后丢弃旧块。目标 Native sf::Sound 实例和控制区保持不变。

两种 assign 均在自赋值时直接返回。需要对 Sound 只复制基类属性时，可以显式调用 `SoundSource.prototype.assign.call(targetSound, source)`；将变量标注为 SoundSource 不会改变 JS 的动态方法分派。

SFML 3.1.0 的 `SoundSource::operator=` 未复制 directionalAttenuationFactor，本绑定的属性复制包含该字段。

```js
music.assign(sound); // 复制音源属性，保留 music 的内容与播放状态。
targetSound.assign(sourceSound); // 绑定相同缓冲，targetSound 停止并归零。
```

## Worker 供数

所有 Audio Worker 使用模块工厂，支持 CommonJS 和 ESM。`module` 为文件路径或 URL；`exportName` 默认为 `default`；`data` 按 Worker 的 structured clone 规则传入。工厂接收 `{ sampleRate, channelCount, blockFrames }` 和 data，返回对应的回调对象，可以返回 Promise。

仓库中的 [audio-worker.cjs](../examples/audio-worker.cjs) 提供可运行的 `tone` 和 `filter` 工厂。

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
void playStream();
```

| 回调 | 契约 |
|------|------|
| `onGetData(chunk)` | 填写 Native 提供的 `chunk.samples`，设置 `chunk.sampleCount`；true 表示继续，false 表示最后一块 |
| `onSeek(time)` | 将生产游标定位到 Time；初始化也会调用一次 |
| `onLoop()` | 在最后一块准备阶段调用；返回交错样本偏移 bigint，undefined 禁止本轮循环；省略时默认返回 `0n` |
| `onClose()` | Worker 退出前清理资源 |

不能替换 `chunk.samples`。sampleCount 不得超过槽位容量，必须是声道数的整数倍；继续供数时不能提交零样本。最后一块可以携带有效样本。Native 在 seek 时更新代数，设备线程丢弃此前已经排队的数据；Worker 随后执行新的 onSeek。

回调获得的 TypedArray 是可复用 Native 槽位，只在本次回调完成前由该回调独占。不要保留后继续访问，必须保留内容时自行 `slice()`。Promise 完成才会提交或释放槽位。回调必须最终完成；未完成的用户 Promise 会阻止正常 `close()` 或录音排空。

## 音效

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
// 完成使用后，先从音源移除，再结束 Worker。
sound.setEffectProcessor();
await effect.close();
```

音效工厂返回 `process(input, inputFrameCount, output, outputFrameCount, channelCount)`。input 和 output 是 Native float32 队列映射，输入已经过空间化，channelCount 是本次设备输出声道数。返回 `{ inputFrameCount, outputFrameCount }` 指定实际消费和产出帧数，允许部分消费；返回 void 表示消费全部输入并输出同等帧数。非尾音调用必须消费或产出至少一帧。

input 为 null 表示尾音处理，可输出残响，最终返回零输出帧结束尾音。每帧有 channelCount 个交错 float32 样本；只能访问本次传入的有效视图。`maxChannelCount` 是预分配容量，默认 8；实际声道数超过容量时输出静音。工厂 context 中的 channelCount 是容量，实际处理以 process 参数为准；sampleRate 在创建 Worker 时读取，设备切换后需要重新创建依赖采样率的音效。

一个 EffectProcessor 同时只能安装到一个音源。移除后可以安装到其他音源。安装和移除会保留音源的播放位置与播放／暂停状态。显式关闭仍安装着的 EffectProcessor 后，该音源的音效通路输出静音。

## 录音

```js
const recorder = new sf.SoundBufferRecorder();
recorder.setChannelCount(1);
if (await recorder.start(44100)) {
  await sf.sleep(sf.seconds(1));
  await recorder.stop();
  const recorded = recorder.getBuffer();
  console.log(recorded.getSampleCount());
  await recorded.saveToFile('recorded.wav');
}
```

`start()`、`stop()`、`setDevice()` 返回 Promise；声道数支持 1 或 2，修改前先停止录音并等待待处理操作。播放与采集设备分开查询和选择。

自定义 SoundRecorder 使用与 SoundStream 相同的 Worker 配置，工厂返回可选 `onStart()`、必需 `onProcessSamples(samples)`、可选 `onStop()`。onStart 返回 false 取消启动。onProcessSamples 接收只在回调期间有效的 Native Int16Array；返回 false 后由异步任务停止采集。正常 `await stop()` 等待队列排空和 onStop 完成；回调主动返回 false 时丢弃剩余排队样本。

## 文件流与编解码扩展

SoundBuffer、Music、InputSoundFile 都支持现有 InputStream、MemoryInputStream 和 FileInputStream。文件读写、打开与关闭按对象串行，跨对象可并行。成功打开后才发布 Native 元数据；异步 read/seek 完成前 getter 仍返回上一份已发布结果。

内置 SFML 文件／内存解码在线程中执行。异步 InputStream 使用独立 Native 解码线程和 libuv 通知桥接，避免等待 JS 文件 I/O 时占满 libuv 工作线程池。InputStream 的 read 目的缓冲由 Native 分配，完成时取得有效字节快照。

Music 的普通文件／内存输入使用 `sf::Music`。InputStream 或已注册 JS Reader 的输入使用有界 PCM 预取，默认 1024 帧、8 个槽位；异步解码在设备回调外执行，播放、定位和循环通过 Native SoundStream 消费。JS 自定义 Reader 运行在调用环境，耗时的同步 JS 解码会占用该环境的事件循环。

SFML 内置 Reader／Writer 由 SoundFileFactory 创建后仍需调用 `open()`。WAV、FLAC、Ogg 写入与读回已有运行测试；其他 SFML 内置输入格式沿用当前 SFML 构建的解码支持。

扩展 Reader 继承 SoundFileReader，提供静态 `check(stream)`、`open(stream)`、`seek(sampleOffset)`、`read(samples)` 和可选 `close()`。open 返回 `new SoundFileReader.Info({ sampleCount, sampleRate, channelCount, channelMap })` 或 undefined。read 填写传入 Int16Array，返回实际样本数 bigint。扩展 Writer 继承 SoundFileWriter，提供静态 `check(filename)`、`open(filename, sampleRate, channelCount, channelMap)`、`write(samples)` 和可选 `close()`。这些方法可以返回 Promise。

通过 `SoundFileFactory.registerReader(ReaderClass)` 和 `registerWriter(WriterClass)` 注册，使用对应 unregister 方法注销；重复注册同一类不会重复插入。JS 注册表属于当前 Node 环境，Worker 需要在自身环境注册。所有公开 SoundBuffer、Music 和音频文件入口先检测注册的 JS 类，未匹配时回退到 SFML 内置工厂。模板注册接口通过 JS 类实现，不会把 JS 函数指针安装进进程级 C++ 工厂。完整扩展示例见 [audio-codec.test.cjs](../test/audio-codec.test.cjs)。

## 缓冲、状态与清理

Worker 默认 `blockFrames = 1024`、`queueBlocks = 8`。允许 64～65536 帧、2～32 槽位、1～32 声道。槽位内存由 Native 预分配，通过 acquire/release 发布和归还，PCM 不经过 postMessage 复制。postMessage 只传递 ready、错误和停止通知。

1024 帧在 44100 Hz 下为 23.22 ms，8 槽位可容纳约 185.76 ms 的样本。这里是块时长和队列容量，不是端到端延迟保证。Worker 每 2 ms 异步检查可用槽位，设备输出还受 SFML 与系统缓冲影响。

| 情况 | 行为与统计单位 |
|------|----------------|
| Stream 缺少已就绪的 PCM | 输出静音；underruns 统计缺块次数 |
| 录音队列已满 | 丢弃新增样本；overruns 统计交错样本数 |
| 音效输入队列已满 | 丢弃本次接收的输入帧；overruns 统计帧数 |
| 音效输出不足 | 缺少部分补静音；underruns 统计帧数 |
| processed | Stream／Recorder 为交错样本数，EffectProcessor 为消费的输入帧数 |

`getWorkerStats()` 返回 bigint 统计快照，`getWorkerError()` 返回已记录的异步错误。Worker 初始化错误使 ready 拒绝；close／stop 会报告 Worker 错误。C++ 异常映射为 SFMLError，SFML 诊断写入已有 `err()`／`setErrorOutput()` 通路。

Audio Worker 在初始化完成后 unref，不会独自维持 Node 进程；播放期间用窗口循环或 `await sleep()` 保持事件循环。结束时使用 `await stream.close()`、`await music.close()`、`await effect.close()`、`await recorder.stop()`。文件写入使用 `await output.close()` 完成尾部和资源清理。Native 音源与录音资源沿用项目的后台释放机制；视图保活对应分配，Node 环境退出会结束所属资源。

播放设备通知在注册回调的 JS 线程异步派发，不在音频设备线程执行。SFML 的通知回调是进程级单槽位，最后一次注册替代此前注册；调用 `setNotificationCallback()` 移除并丢弃待派发通知。

## 演示与验证

执行 `npm run demo:audio`，或构建后运行 `node examples/audio.cjs`。1～4 切换 Sound、WorkerStream、Music 和录音回放；Space 播放／暂停，S 停止，E 切换音效，R 开始录音，T 结束录音；方向键控制声像和音量。Esc 关闭。录音只保留在内存中。

`node examples/audio.cjs --smoke --frames=90` 自动验证扬声器播放、Worker PCM、音效处理、Music、麦克风录音与回放，随后退出。该模式会启用本机采集设备。普通启动等待用户按键。

自动测试覆盖 SFML 字段对照、真实 PCM 指针映射、旧视图保活、播放状态、WAV／FLAC／Ogg、异步 InputStream、Worker EOF／seek／loop、部分音效帧、尾音、录音排空／溢出、错误传播、自定义编解码、受限预取、资源退出和类型约束。实机验证环境为 macOS arm64、Node.js 22.22.2、MacBook Pro 扬声器与麦克风；其他平台及设备热插拔通知未实机验证。
