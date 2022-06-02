declare module '*/binding.node' {
  export class Music extends SoundSource {
    constructor();

    setLoop(loop: boolean): void;
    getLoop(): boolean;

    openFromFile(filename: string, callback: (err?: Error | undefined) => void);
    openFromFileSync(filename: string): boolean;
    openFromMemory(buff: Buffer): boolean;
  }
}
