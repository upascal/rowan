declare module '@peculiar/webcrypto' {
  export class Crypto {
    public readonly subtle: SubtleCrypto;
    public getRandomValues<T extends ArrayBufferView | null>(array: T): T;
    public randomUUID(): `${string}-${string}-${string}-${string}-${string}`;
  }
}
