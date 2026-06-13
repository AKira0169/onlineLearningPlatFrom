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

  // Big-video uploads stream straight to Cloudinary and can take a long time. Node 18+ defaults
  // `requestTimeout` to 5 min (the cap on receiving the *whole* body), which would abort a large
  // upload mid-flight. Disable it; `headersTimeout` (60s default) still guards against slowloris.
  const server = app.getHttpServer();
  server.requestTimeout = 0;

  console.log(`App running on port ${port}`);
}
bootstrap();
