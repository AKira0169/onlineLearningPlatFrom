import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

/** Port of `src/note/noteController.js`. */
@Injectable()
export class NoteService {
  constructor(@InjectModel('Note') private readonly noteModel: Model<any>) {}

  async createNote(note: string) {
    const newNote = new this.noteModel({ note });
    await newNote.save();
    return { status: 'success', data: newNote };
  }

  async getNotes() {
    const notes = await this.noteModel.find().lean();
    return { status: 'success', results: notes.length, data: { notes } };
  }

  async getNotesForView() {
    const notes = await this.noteModel.find().lean();
    return { notes };
  }
}
