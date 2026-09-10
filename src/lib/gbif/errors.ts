export class GBIFError extends Error {
  constructor(
    message: string,
    public readonly kind: 'timeout' | 'upstream' | 'schema',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'GBIFError';
  }
}
