import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** Port of `src/note/noteModel.js`. */
@Schema({ timestamps: true })
export class Note {
  @Prop({ type: String })
  note: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
export type NoteDocument = HydratedDocument<Note>;
