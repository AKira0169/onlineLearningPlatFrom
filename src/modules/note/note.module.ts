import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoteSchema } from './schemas/note.schema';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Note', schema: NoteSchema }])],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}
