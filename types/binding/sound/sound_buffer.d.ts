declare module '*/binding.node' {
  export class SoundBuffer {
    constructor(buff?: Buffer | undefined);

    duplicateSamples(): Int16Array;
    loadFromSamples(samples: Int16Array | Int16[]): boolean;
    loadFromMemory(buff: Buffer): boolean;
    saveToFile(
      filename: string,
      callback: (err?: Error | undefined) => void,
    ): void;

    getSampleCount(): Uint32;
    getSampleRate(): Uint32;
    getChannelCount(): Uint32;
    getDuration(): Int32;
  }
}
