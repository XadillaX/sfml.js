import * as SoundSource from './base';

declare class Sound extends SoundSource {
  constructor(buffer?: Buffer);

  setLoop(loop: boolean): void;
  getLoop(): boolean;
}

export = Sound;
