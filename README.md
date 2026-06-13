# Online Learning Platform API

A REST API for an online learning platform, built on **NestJS 11 + TypeScript** with **Mongoose / MongoDB**.
It handles users & auth, courses with embedded video lessons, discussions, quizzes, reviews, coupons, and
**Paymob** payments. Video files live in **Cloudinary**; lessons store only the Cloudinary `public_id`.

Both video **upload** and **playback** are genuinely streamed:

- **Upload** is piped from the request body straight into Cloudinary's *chunked* uploader — no full-file
  buffer or temp file — so arbitrarily large videos upload with memory bounded to roughly one chunk.
- **Playback** is proxied through the API as HTTP **Range / `206 Partial Content`**, so clients can seek.

> History: this was ported from an Express 4 + plain-JS app. That tree (`app.js`, `server.js`, `middleware/`,
> `utils/`) was deleted in the NestJS migration.

---

## Requirements

- **Node.js 18+** (developed on Node 22)
- A **MongoDB** database (Atlas or self-hosted)
- A **Cloudinary** account (for video storage/streaming)
- A **Paymob** account (for payments)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create the env file (see "Configuration" below) — note the name is config.env, NOT .env
#    *.env is gitignored, so config.env is never committed.

# 3. Run in development (watch mode)
npm run start:dev

# 4. The API boots on http://localhost:<PORT> (default 7000)
```

## Scripts

| Command              | What it does                                              |
| -------------------- | --------------------------------------------------------- |
| `npm run start:dev`  | `nest start --watch` — dev server with hot reload         |
| `npm run build`      | `nest build` — compiles TypeScript to `dist/`             |
| `npm run start:prod` | `node dist/main.js` — run the compiled build              |
| `npm run lint`       | `eslint .` (flat config, typescript-eslint + prettier)    |
| `npm run format`     | `prettier --write "src/**/*.ts"`                          |

> There is **no test runner** configured (no `test` script, no spec files).

## Configuration

Environment variables are loaded from **`./config.env`** (not `.env`) via
`ConfigModule.forRoot({ envFilePath: './config.env', isGlobal: true })`. Create that file at the repo root.

The Mongo connection string keeps a literal `<password>` token that is replaced at runtime with
`DATABASE_PASSWORD`.

```ini
# --- Server ---
NODE_ENV=development
PORT=7000

# --- Database --- (keep the literal <password> token; it is substituted at runtime)
DATABASE=mongodb+srv://<user>:<password>@cluster.example.mongodb.net/dbname
DATABASE_PASSWORD=your-db-password

# --- Auth / JWT ---
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90        # in minutes — controls the jwt cookie's expiry

# --- Cloudinary ---
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# --- Paymob ---
PAYMOB_API_KEY=your-paymob-api-key
PAYMOB_INTEGRATION_ID_Online_Card=000000
PAYMOB_INTEGRATION_ID_Mobile_Wallet=000000
HMAC_SECRET=your-paymob-hmac-secret
Secret_Key=your-paymob-secret-key
```

## Architecture

- **Bootstrap (`src/main.ts`):** `cookie-parser`; a global `ValidationPipe({ transform: true })`; a global
  `AllExceptionsFilter`; the EJS view engine (for one notes view); `setGlobalPrefix('api/v1')`. The HTTP
  server's `requestTimeout` is disabled so large video uploads aren't aborted by Node's 5-minute body timeout.
- **All API routes live under `/api/v1/<resource>`.** `GET /` is excluded and redirects to
  `/api/v1/note/view`.
- **Feature-module convention:** each feature is `src/modules/<name>/` with `schemas/`, `dto/`,
  `<name>.service.ts`, `<name>.controller.ts`, `<name>.module.ts`.
- **Global infra:**
  - `src/common/security.module.ts` (`@Global`) registers the `User` model once, configures `JwtModule`,
    and provides `JwtAuthGuard` + `RolesGuard`.
  - `src/cloudinary/cloudinary.module.ts` (`@Global`) configures the Cloudinary singleton.

### Auth & authorization

- **`JwtAuthGuard`** reads the JWT **only from the `jwt` httpOnly cookie** (there is no `Authorization`
  header path), loads the user, and sets `req.user`. On signup/login the API sets that cookie for you.
- **`RolesGuard` + `@Roles(...)`** gate routes by `req.user.role` (`student | instructor | admin`). A route
  with no `@Roles` is open to any authenticated user.

### Video pipeline (streaming)

- **Upload** (`src/cloudinary/streaming-storage.ts`): a custom multer `StorageEngine` pipes the live
  request stream into `cloudinary.uploader.upload_chunked_stream(...)`. The chunked uploader (default
  20 MB chunks, floored at Cloudinary's 5 MB minimum) supports arbitrarily large files with memory bounded
  to ~one chunk. On success the lesson's `videoUrl` stores the Cloudinary **`public_id`** (not a URL).
- **Playback** (`GET .../stream`): the API mints a 1-hour signed Cloudinary URL, forwards the client's
  `Range` header upstream, and relays the upstream status (`200`/`206`) plus
  `Content-Range`/`Accept-Ranges`/`Content-Length`/`Content-Type` while piping the bytes through.

### Error handling

`src/common/filters/all-exceptions.filter.ts` returns full diagnostics in `development` and clean,
mapped messages in `production` (Mongoose CastError, duplicate-key `11000`, JWT errors). `AppError`
(`src/common/errors/app-error.ts`) marks operational errors.

## API overview

All paths are prefixed with **`/api/v1`**. Routes are cookie-authenticated unless noted as **public**.

### Auth — `users`
| Method | Path                  | Notes  |
| ------ | --------------------- | ------ |
| POST   | `/users/signUp`       | public |
| POST   | `/users/logIn`        | public |

### Users — `users` (admin/role-gated)
| Method | Path          |
| ------ | ------------- |
| GET    | `/users`      |
| GET    | `/users/:id`  |
| PUT    | `/users/:id`  |
| DELETE | `/users/:id`  |

### Courses — `courses`
| Method | Path                                                   | Notes                              |
| ------ | ------------------------------------------------------ | ---------------------------------- |
| GET    | `/courses`                                             | admin/instructor                   |
| GET    | `/courses/filter?category=&tag=`                       | any authed user                    |
| POST   | `/courses/initCourse`                                  | admin/instructor                   |
| POST   | `/courses/createModuleForCourse/:courseId`             | admin/instructor                   |
| POST   | `/courses/createLesson/:courseId/:moduleId`            | admin/instructor; multipart `video`|
| POST   | `/courses/upload`                                      | admin/instructor; multipart `video`|
| PATCH  | `/courses/updateCourse/:courseId`                      | admin/instructor                   |
| DELETE | `/courses/:id`                                         | admin/instructor                   |
| GET    | `/courses/getLesson/:courseId/:moduleId/:lessonId`     | subscribed users; signed URL JSON  |
| GET    | `/courses/getLesson/:courseId/:moduleId/:lessonId/stream` | subscribed users; ranged stream |

### Discussion — `discussion`
| Method | Path                                  |
| ------ | ------------------------------------- |
| POST   | `/discussion/createdisuccsion/:lessonId` |
| GET    | `/discussion/discussions`             |
| GET    | `/discussion/getdiscussion/:lessonId` |
| POST   | `/discussion/replytodiscussion/:discussionId` |
| POST   | `/discussion/like/:discussionId`      |
| DELETE | `/discussion/:discussionId`           |

### Quiz — `quiz`
| Method | Path                                   |
| ------ | -------------------------------------- |
| POST   | `/quiz/createquiz/:courseId/:moduleId` |
| GET    | `/quiz/getQuizzes/:courseId`           |
| GET    | `/quiz/getquizbyid/:quizId`            |
| GET    | `/quiz/getquizformodule/:moduleId`     |
| PATCH  | `/quiz/updatequiz/:quizId`             |
| DELETE | `/quiz/deletequiz/:quizId`             |

### Trace student — `traceStudent`
| Method | Path                                    |
| ------ | --------------------------------------- |
| POST   | `/traceStudent/createTraceStudent/:quizId` |

### Review — `review`
| Method | Path        | Notes                                   |
| ------ | ----------- | --------------------------------------- |
| GET    | `/review`   | unauthed (preserved from original)      |
| POST   | `/review`   | authed                                  |
| DELETE | `/review`   | unauthed; no `:id` (preserved as-is)    |

### Coupon — `coupon`
| Method | Path                          |
| ------ | ----------------------------- |
| POST   | `/coupon/createcoupon`        |
| GET    | `/coupon/getallcoupons`       |
| GET    | `/coupon/getacoupnbyid/:id`   |
| PUT    | `/coupon/updatecoupon/:id`    |
| DELETE | `/coupon/deletecoupon/:id`    |
| POST   | `/coupon/applycoupon`         |

### Payment — `payment` (Paymob)
| Method | Path                       | Notes                              |
| ------ | -------------------------- | ---------------------------------- |
| POST   | `/payment/paymob/initiate` | returns a Paymob `paymentKey`      |
| POST   | `/payment/paymob/webhook`  | **public**; HMAC-verified callback |

### Note — `note`
| Method | Path          | Notes                  |
| ------ | ------------- | ---------------------- |
| POST   | `/note`       |                        |
| GET    | `/note`       |                        |
| GET    | `/note/view`  | EJS-rendered view      |

## Uploading a video

`createLesson` and `upload` expect `multipart/form-data` with a field named **`video`**:

```bash
curl -X POST "http://localhost:7000/api/v1/courses/upload" \
  --cookie "jwt=<your-jwt-cookie>" \
  -F "video=@/path/to/big-video.mp4"
```

The file streams through the API into Cloudinary in chunks, so size is bounded by your Cloudinary plan
and connection — not by server memory. The response includes the Cloudinary URL/`public_id` for the asset.

## Conventions & gotchas

- **Config file is `config.env`, not `.env`.** It is gitignored and not committed.
- **Load-bearing typos** are preserved verbatim in schemas (e.g. user `fristName`, discussion array
  `disucssion`) — do not "fix" them or you break compatibility with existing data.
- **Auth and Users both mount under `users`** — `signUp`/`logIn` live alongside the user CRUD routes.
- The port faithfully preserves some quirky-but-intentional original behaviors; see `CLAUDE.md` for the
  full list before changing those areas.
