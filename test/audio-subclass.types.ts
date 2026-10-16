import {
  Music, SoundBufferRecorder, type SoundStreamChunk, type Time,
} from '..';

class FilteredMusic extends Music {
  protected override async onGetData(chunk: SoundStreamChunk): Promise<boolean> {
    const more = await super.onGetData(chunk);
    for (let index = 0; index < chunk.sampleCount; ++index) {
      chunk.samples[index] = Math.trunc(chunk.samples[index] / 2);
    }
    return more;
  }
  protected override async onSeek(offset: Time): Promise<void> {
    await super.onSeek(offset);
  }
  protected override async onLoop(): Promise<bigint | undefined> {
    return await super.onLoop();
  }
}

class FilteredRecorder extends SoundBufferRecorder {
  protected override async onStart(): Promise<boolean> {
    return await super.onStart();
  }
  protected override async onProcessSamples(
    samples: Int16Array,
  ): Promise<boolean> {
    return await super.onProcessSamples(samples);
  }
  protected override async onStop(): Promise<void> {
    await super.onStop();
  }
}

const music = new FilteredMusic();
const recorder = new FilteredRecorder();
// @ts-expect-error 数据回调只允许子类访问。
music.onGetData({ samples: new Int16Array(0), sampleCount: 0 });
// @ts-expect-error 录音回调只允许子类访问。
recorder.onStart();
export { music, recorder };
