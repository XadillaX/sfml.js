declare class Music {
  constructor();
  openFromFileSync(filename: string): boolean;
  openFromFile(filename: string): Promise<void>;
}

export = Music;
