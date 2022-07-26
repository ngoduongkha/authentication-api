import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto';
import { EditNoteDto } from './dto/edit-note.dto';

@Injectable()
export class NoteService {
  constructor(private prisma: PrismaService) {}

  getNotes(userId: number) {
    return this.prisma.note.findMany({ where: { userId } });
  }

  getNoteById(userId: number, noteId: number) {
    return this.prisma.note.findFirst({ where: { userId, id: noteId } });
  }

  async createNote(userId: number, dto: CreateNoteDto) {
    const note = await this.prisma.note.create({
      data: { userId, ...dto },
    });
    return note;
  }

  async editNote(userId: number, noteId: number, dto: EditNoteDto) {
    const note = await this.prisma.note.findUnique({
      where: {
        id: noteId,
      },
    });

    // check if user owns the note
    if (!note || note.userId !== userId)
      throw new ForbiddenException('Access to resources denied');

    return this.prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteNote(userId: number, noteId: number) {
    const note = await this.prisma.note.findUnique({
      where: {
        id: noteId,
      },
    });

    // check if user owns the note
    if (!note || note.userId !== userId)
      throw new ForbiddenException('Access to resources denied');

    await this.prisma.note.delete({
      where: {
        id: noteId,
      },
    });
  }
}
