import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  /** Kept behavior: `GET /` → redirect to the EJS notes view. Excluded from the global prefix. */
  @Get()
  @Redirect('/api/v1/note/view', 302)
  root(): void {}
}
