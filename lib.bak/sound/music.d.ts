import { SoundSource } from './base';

export class Music extends SoundSource {
  constructor();
  openFromFileSync(filename: string): boolean;
  openFromFile(filename: string): Promise<void>;
  openFromMemory(buff: Buffer): boolean;

  setLoop(loop: boolean): void;
  getLoop(): boolean;
}

export namespace Music {
  type Status = SoundSource.Status;
}
