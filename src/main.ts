import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Parse the `jwt` httpOnly cookie (the only place auth tokens are read from).
  app.use(cookieParser());

  // `transform: true` coerces multipart numeric fields (lesson duration/order) via @Type().
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Global error handler — port of middleware/errorHandler.js.
  app.useGlobalFilters(new AllExceptionsFilter());

  // EJS view engine for the single notes view. `views/` lives at the repo root (one level up from dist).
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // All API routes under /api/v1; `GET /` (the redirect) is excluded.
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

  const port = process.env.PORT || 7000;
  await app.listen(port);
  console.log(`App running on port ${port}`);
}
bootstrap();
