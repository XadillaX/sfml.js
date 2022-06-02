declare module '*/binding.node' {
  export enum SoundPlayStatus {
    Stopped = 0,
    Paused = 1,
    Playing = 2,
  }

  export class SoundSource {
    play();
    pause();
    stop();

    getStatus(): SoundPlayStatus;

    getPitch(): number;
    setPitch(pitch: number): void;

    getVolume(): number;
    setVolume(volume: number): void;

    getRelativeToListener(): boolean;
    setRelativeToListener(rtl: boolean): void;

    getMinDistance(): number;
    setMinDistance(minDistance: number): void;

    getAttenuation(): number;
    setAttenuation(attenuation: number): void;
  }
}
