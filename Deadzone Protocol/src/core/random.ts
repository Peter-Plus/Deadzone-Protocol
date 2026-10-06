function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}

/** Mulberry32. Named child streams do not consume their parent. */
export class SeededRandom {
  private state: number;
  constructor(private readonly seed: string) { this.state = hash(seed); }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }
  fork(name: string): SeededRandom { return new SeededRandom(JSON.stringify([this.seed, name])); }
}
