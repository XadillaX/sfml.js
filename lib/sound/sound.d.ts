import { SoundSource } from './base';

export class Sound extends SoundSource {
  constructor(buffer?: Buffer);

  setLoop(loop: boolean): void;
  getLoop(): boolean;
}
