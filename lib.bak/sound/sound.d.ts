import { SoundBuffer } from './sound_buffer';
import { SoundSource } from './base';

export class Sound extends SoundSource {
  constructor(buffer?: Buffer | SoundBuffer);

  setBuffer(buffer: Buffer | SoundBuffer): void;
  getBuffer(): SoundBuffer;

  setLoop(loop: boolean): void;
  getLoop(): boolean;
}

export namespace Sound {
  type Status = SoundSource.Status;
}
