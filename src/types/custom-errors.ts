export class RetriableError extends Error {}
export class FatalError extends Error {}

export class ValidationError extends Error {
  readonly data: Record<string, unknown>;

  constructor(message: string, data: Record<string, unknown>) {
    super(message);
    this.data = data;
  }
}
