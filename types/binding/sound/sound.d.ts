declare module '*/binding.node' {
  export class Music extends SoundSource {
    constructor(soundBuffer?: SoundBuffer | undefined);

    setLoop(loop: boolean): void;
    getLoop(): boolean;

    setBuffer(soundBuffer: SoundBuffer): void;
  }
}
