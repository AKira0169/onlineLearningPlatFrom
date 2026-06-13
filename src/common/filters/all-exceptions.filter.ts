import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../errors/app-error';

/**
 * Port of `middleware/errorHandler.js`. Branches on NODE_ENV:
 *  - development → full error dump (`{ status, error, message, stack }`)
 *  - production  → maps Mongoose/JWT errors to clean AppErrors, then sends operational errors to
 *    the client and hides programming errors behind a generic message.
 *
 * Note: the original `sendErrorDev` only responded for URLs starting with `/api`, which would hang
 * any non-API error. Since every route now lives under the `api/v1` global prefix that branch is
 * vacuous, so we always emit a response (a filter that returns without responding would hang).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private handleCastErrorDB(err: any): AppError {
    return new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
  }

  private handleDuplicateFieldsDB(err: any): AppError {
    return new AppError(`Duplicated Name , ${err.keyValue?.email} Already Exists`, 400);
  }

  private handleValidationErrorDB(err: any): AppError {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    return new AppError(`Invalid input Data. ${errors.join('. ')}`, 400);
  }

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Normalise the incoming exception into the shape the original handler expected.
    let statusCode: number;
    let status: string;
    let message: string;
    let isOperational: boolean;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        message = responseBody;
      } else {
        const m = (responseBody as any)?.message;
        message = Array.isArray(m) ? m.join('. ') : m || exception.message;
      }
      status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      isOperational = true;
    } else {
      statusCode = exception?.statusCode || 500;
      status = exception?.status || 'Error';
      message = exception?.message;
      isOperational = exception?.isOperational === true;
    }

    if (process.env.NODE_ENV === 'development') {
      res.status(statusCode).json({
        status,
        error: exception,
        message,
        stack: exception?.stack,
      });
      return;
    }

    // production
    let error: any = { statusCode, status, message, isOperational };
    if (exception?.name === 'CastError') error = this.handleCastErrorDB(exception);
    if (exception?.code === 11000) error = this.handleDuplicateFieldsDB(exception);
    if (exception?.name === 'ValidatorError') error = this.handleValidationErrorDB(exception);
    if (exception?.name === 'JsonWebTokenError') error = new AppError('Invalid Token. Please Login again', 401);
    if (exception?.name === 'TokenExpiredError') error = new AppError('Expired Token. Please Login again', 401);

    const finalStatusCode = error instanceof AppError ? error.getStatus() : error.statusCode || 500;
    const finalStatus =
      error instanceof AppError ? (`${finalStatusCode}`.startsWith('4') ? 'fail' : 'error') : error.status;
    const finalOperational = error instanceof AppError ? error.isOperational : isOperational;

    if (finalOperational) {
      res.status(finalStatusCode).json({
        status: finalStatus,
        message: error.message,
      });
      return;
    }

    res.status(finalStatusCode).json({
      status: 'Error',
      message: 'Something went wrong',
    });
  }
}
