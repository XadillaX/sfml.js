export class SoundSource {
  constructor(innerName: string, ...args: any);

  play(): void;
  pause(): void;
  stop(): void;

  getStatus(): SoundSource.Status;

  setPitch(pitch: number): void;
  getPitch(): number;

  setVolume(volume: number): void;
  getVolume(): number;

  setMinDistance(distance: number): void;
  getMinDistance(): number;

  setAttenuation(attenuation: number): void;
  getAttenuation(): number;

  setRelativeToListener(relative: boolean): void;
  getRelativeToListener(): boolean;
  isRelativeToListener(): boolean;
}

export namespace SoundSource {
  enum Status {
    Stopped = 0,
    Paused = 1,
    Playing = 2,
  }
}
