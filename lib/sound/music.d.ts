import { SoundSource } from './base';

export class Music extends SoundSource {
  constructor();
  openFromFileSync(filename: string): boolean;
  openFromFile(filename: string): Promise<void>;

  setLoop(loop: boolean): void;
  getLoop(): boolean;
}
