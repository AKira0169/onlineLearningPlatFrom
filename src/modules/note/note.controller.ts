import { Body, Controller, Get, HttpCode, Post, Render } from '@nestjs/common';
import { NoteService } from './note.service';

/** Mounted at `note`. `GET /view` renders the EJS `index` template (the Quill notes editor). */
@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @HttpCode(201)
  createNote(@Body('note') note: string) {
    return this.noteService.createNote(note);
  }

  @Get()
  getNotes() {
    return this.noteService.getNotes();
  }

  @Get('view')
  @Render('index')
  view() {
    return this.noteService.getNotesForView();
  }
}
