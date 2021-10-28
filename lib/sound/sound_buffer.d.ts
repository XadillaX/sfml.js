import { _Time } from '../time';

export class SoundBuffer {
  constructor(buffer?: Buffer);
  loadFromMemory(buffer: Buffer): boolean;
  loadFromSamples(samples: number[] | Int16Array, channelCount: number, sampleRate: number): boolean;
  duplicateSamples(): Int16Array;
  getSampleCount(): number;
  getSampleRate(): number;
  getChannelCount(): number;
  getDuration(): _Time;

  saveToFile(filename: string): Promise<void>;
}
