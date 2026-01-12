/* Base interface for all error types - modules can extend this
 * Common error types that can be used across modules

 */
export interface BaseErrorType {
  readonly type: string;
}

export const CommonErrorTypeValues = [
  "UNKNOWN_ERROR",
  "PRISMA_ERROR",
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INTERNAL_SERVER_ERROR",
] as const;
export type CommonErrorType = (typeof CommonErrorTypeValues)[number];

interface CustomErrorOptions {
  cause?: unknown;
  stack?: string;
  trace?: string;
  module?: string;
  context?: Record<string, unknown>;
}

export class CustomError<T extends string = CommonErrorType> extends Error {
  readonly errorType: T;
  readonly module?: string;
  readonly context?: Record<string, unknown>;
  readonly trace?: string;
  override readonly cause?: unknown;

  constructor(
    errorType: T,
    message: string,
    options?: CustomErrorOptions | string
  ) {
    const opts =
      typeof options === "string" ? { trace: options } : options || {};

    super(message, { cause: opts.cause });

    this.name = this.constructor.name;

    this.errorType = errorType;
    this.module = opts.module;
    this.context = opts.context;
    this.trace = opts.trace;
    this.cause = opts.cause;

    if (opts.stack) {
      this.stack = opts.stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  /**
   * Get the full error chain including causes
   */
  getErrorChain(): Error[] {
    const chain: Error[] = [this];
    let current: unknown = this.cause;

    while (current instanceof Error) {
      chain.push(current);
      current = current.cause;
    }

    return chain;
  }

  /**
   * Get a detailed error message including the cause chain
   */
  getDetailedMessage(): string {
    const chain = this.getErrorChain();
    return chain
      .map((error, index) => {
        const prefix = index === 0 ? "" : `${"  ".repeat(index)}Caused by: `;
        return `${prefix}${error.name}: ${error.message}`;
      })
      .join("\n");
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      errorType: this.errorType,
      module: this.module,
      context: this.context,
      trace: this.trace,
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : this.cause,
    };
  }

  /**
   * Create a CustomError from an unknown error
   */
  static fromError<T extends string = CommonErrorType>(
    error: unknown,
    errorType: T,
    options?: Omit<CustomErrorOptions, "cause">
  ): CustomError<T> {
    if (error instanceof CustomError) {
      return error as CustomError<T>;
    }

    if (error instanceof Error) {
      return new CustomError(errorType, error.message, {
        ...options,
        cause: error,
        stack: error.stack,
      });
    }

    const message =
      typeof error === "string" ? error : "An unknown error occurred";
    return new CustomError(errorType, message, { ...options, cause: error });
  }

  /**
   * Check if this error or any in its cause chain matches the given type
   */
  hasErrorType(type: T): boolean {
    return this.getErrorChain()
      .filter((error): error is CustomError<T> => error instanceof CustomError)
      .some((customError) => customError.errorType === type);
  }

  /**
   * Check if error is from a specific module
   */
  isFromModule(moduleName: string): boolean {
    return this.module === moduleName;
  }
}
