# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

An online learning platform REST API built on **NestJS 11 + TypeScript** with Mongoose (MongoDB).
Handles users/auth, courses with embedded video lessons, discussions, quizzes, reviews, coupons, and
Paymob payments. Video files live in Cloudinary; lessons store only the Cloudinary `public_id`.
Video **upload is genuinely streamed** (request body piped straight into Cloudinary, no buffering) and
**playback is streamed** through the API as HTTP Range / `206 Partial Content`. EJS renders one view.

> History: this was ported from an Express 4 + plain-JS app (`app.js`/`server.js`, `express-async-handler`
> controllers, manual route wiring, `middleware/`, `utils/`). That tree was deleted in the NestJS migration.

## Commands

- `npm run start:dev` — `nest start --watch` (dev server).
- `npm run build` — `nest build` (tsc → `dist/`). `npm run start:prod` — `node dist/main.js`.
- `npm run lint` — `eslint .` (flat config, `eslint.config.mjs`, typescript-eslint + prettier).
- `npm run format` — `prettier --write "src/**/*.ts"`.
- **No test runner** is configured (no `test` script, no spec files).

## Configuration

Env loads from **`./config.env`** (NOT `.env`) via `ConfigModule.forRoot({ envFilePath: './config.env',
isGlobal: true })` in `src/app.module.ts`. `*.env` is gitignored, so **`config.env` is not committed**; a
placeholder is created locally during setup. The DB connection string keeps a literal `<password>` token
that `MongooseModule.forRootAsync` replaces at runtime with `DATABASE_PASSWORD`.

Required vars: `DATABASE`, `DATABASE_PASSWORD`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
`JWT_COOKIE_EXPIRES_IN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID_Online_Card`, `PAYMOB_INTEGRATION_ID_Mobile_Wallet`,
`HMAC_SECRET`, `Secret_Key`.

## Architecture

**Bootstrap (`src/main.ts`):** `cookie-parser`; global `ValidationPipe({ transform: true })`; global
`AllExceptionsFilter`; EJS view engine (`setBaseViewsDir(../views)` + `setViewEngine('ejs')`);
`setGlobalPrefix('api/v1', { exclude: ['/'] })`. All API routes are under `/api/v1/<resource>`.
`AppController` keeps `GET /` → redirect to `/api/v1/note/view`.

**Wiring (`src/app.module.ts`):** ConfigModule + MongooseModule.forRootAsync, then the global
`SecurityModule` and `CloudinaryModule`, then the feature modules.

**Feature-module convention:** each feature is `src/modules/<name>/` with `schemas/<x>.schema.ts`,
`dto/`, `<name>.service.ts`, `<name>.controller.ts`, `<name>.module.ts`. To add an endpoint, follow an
existing trio (e.g. `src/modules/courses/`) and add the module to `app.module.ts`.

**Global infra:**
- `src/common/security.module.ts` (`@Global`) registers the **`User`** model **once** (with its bcrypt
  pre-save hooks + `correctPassword` method, via `forFeatureAsync`), configures `JwtModule` from
  `JWT_SECRET`/`JWT_EXPIRES_IN`, and provides/exports `JwtAuthGuard` + `RolesGuard`. Every module that
  needs the User model or the guards relies on this global export (don't re-register `User`).
- `src/cloudinary/cloudinary.module.ts` (`@Global`) configures the Cloudinary v2 singleton from env and
  provides `CloudinaryService`.

**Auth & authorization (`src/common/`):**
- `JwtAuthGuard` reads the JWT **only from the `jwt` httpOnly cookie** (no `Authorization` header), loads
  the user, sets `req.user`. Apply per-route/controller with `@UseGuards(JwtAuthGuard)`.
- `RolesGuard` + `@Roles(...)` gate by `req.user.role` (`student | instructor | admin`); a route with no
  `@Roles` is unrestricted. `@CurrentUser()` injects `req.user`.
- `AuthService.createSendToken` issues the `jwt` cookie (httpOnly, `secure` in prod, expiry =
  `JWT_COOKIE_EXPIRES_IN` minutes) on signup/login and strips `password` before responding.

**Error handling (`src/common/filters/all-exceptions.filter.ts`):** port of the old `errorHandler.js` —
branches on `NODE_ENV` (dev = full `{ status, error, message, stack }`; prod maps Mongoose CastError /
dup-key 11000 / JWT errors to clean messages, hides non-operational errors). `AppError`
(`src/common/errors/app-error.ts`) extends `HttpException` and marks `isOperational`.

**Courses are deeply embedded documents:** `Course → modules[] → lessons[]` are subdocuments in one
document (`src/modules/courses/schemas/course.schema.ts`). Access nested docs with Mongoose subdoc
helpers (`course.modules.id(moduleId)`, `module.lessons.id(lessonId)`) and persist with `course.save()`.

**Video pipeline (streaming):**
- Upload: `src/cloudinary/streaming-storage.ts` is a custom multer `StorageEngine` whose `_handleFile`
  pipes `file.stream` straight into `cloudinary.uploader.upload_chunked_stream({ resource_type:'video',
  type:'authenticated', folder:'videos', public_id:<originalname>-<uuid>, chunk_size })` — **no
  full-file buffer**, and the **chunked** uploader (vs. single-request `upload_stream`) supports
  arbitrarily large videos with memory bounded to ~one chunk (default 20 MB, floored at Cloudinary's
  5 MB minimum). `cb` is once-guarded and a `file.stream` `error` aborts the upload, so a client that
  aborts a big upload mid-flight can't fire multer's callback twice or hang. `main.ts` sets
  `server.requestTimeout = 0` so a long large-file upload isn't killed by Node's 5-min body timeout.
  Wired via `@UseInterceptors(FileInterceptor('video', { storage: streamingStorage('videos') }))`. On
  success `file.filename` = the Cloudinary **public_id**, stored in `lesson.videoUrl` (NOT a URL).
- Playback: `GET courses/getLesson/:c/:m/:l/stream` (authed + subscription-gated) mints a 1h signed URL
  (`CloudinaryService.generateSignedUrl`), then `streamAsset` opens an axios stream forwarding the
  client's `Range` header (`validateStatus: () => true`) and the controller relays upstream status
  (200/**206**) + `Content-Range`/`Accept-Ranges`/`Content-Length`/`Content-Type` and pipes the body.
  The original JSON `getLesson` (returns `{ ...lesson, signedUrl }`) is kept alongside it.

**Payments (Paymob, `src/modules/payment/`):** `initiate` runs the 3-step flow (auth → order → payment
key) with deliberate `delay()` spacing (2000ms / 1000ms), applies a coupon discount, persists a
`Payment`, returns `{ paymentKey }`. `paymentWebhook` is **public (no guard)** and verifies authenticity
by recomputing an HMAC-SHA512 over a fixed ordered field list against `req.query.hmac`; on success it
flips `payment.status` and pushes the course into the buyer's `subscribedCourses` (this grants access).

## Conventions & gotchas

- **Load-bearing typos** — preserved verbatim in schemas; do not "fix" or you break reads/writes against
  existing data: user field `firstName`; lesson discussion array `disucssion`.
- **Exact Mongoose model names (data compatibility)** — the model name (not the folder) sets the
  collection. `src/modules/review/` registers as **`Rating`** (collection `ratings`);
  `src/modules/traceStudent/` registers as **`StudentQuiz`** (collection `studentquizzes`). Always
  `forFeature([{ name: '<original model name>', schema }])` with the original name.
- **Relaxed `tsconfig`** for this faithful port: `noImplicitAny:false`, `strictNullChecks:false`,
  `skipLibCheck:true`. Services inject models as `Model<any>` (Mongoose subdoc/array helpers and the
  custom `correctPassword` method aren't in the generated types).
- **Newly reachable routes:** `coupon` (its router was never mounted in the old app) and `discussion`
  now have full modules under `/api/v1/coupon` and `/api/v1/discussion`.
- **Latent crashers fixed by the DI rewrite:** `users.getAllUsers` (undefined `next`) now throws a clean
  404; `review.createReview` injects the previously-unimported `Course` model; `payment.initiate` injects
  the coupon model properly; the review create route is guarded so `req.user` exists.
- **Faithful-but-quirky behavior intentionally preserved:** `review.createReview` writes `user`/`course`
  fields that don't match the schema's `userId`/`courseId` (so a save fails validation — unchanged from
  the original); `traceStudent` grades against `Quiz.questions.correctAnswer`, which is `select:false`
  and not re-selected (so it stays hidden — unchanged); `review` `GET`/`DELETE` stay unauthed and the
  `DELETE /` route has no `:id` param, exactly as the original.
- DTOs are intentionally permissive (the original controllers just destructured `req.body`); validation
  is added only where it matters (auth email/password, multipart numeric coercion for lesson upload).
- Prettier: `printWidth` 120, single quotes, semicolons on for `.ts`, `arrowParens: avoid`.
