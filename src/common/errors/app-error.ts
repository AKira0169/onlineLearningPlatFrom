import { HttpException } from '@nestjs/common';

/**
 * Port of the original `utils/appError.js`. Extends Nest's HttpException so it flows through the
 * global exception filter. `isOperational` mirrors the original flag the error handler branches on;
 * the `status` string ('fail' | 'error') is derived from the status code inside the filter.
 */
export class AppError extends HttpException {
  public readonly isOperational = true;

  constructor(message: string, statusCode: number) {
    super(message, statusCode);
  }
}
