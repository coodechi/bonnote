import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ImportBackupDto,
  ListNotesQuery,
  UpdateNoteDto,
} from './dto/note.dto';

const noteInclude = {
  folder: true,
  tags: { include: { tag: true } },
  checklist: { orderBy: { order: 'asc' as const } },
} satisfies Prisma.NoteInclude;

type NoteRecord = Prisma.NoteGetPayload<{ include: typeof noteInclude }>;

function mapNote(note: NoteRecord) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    color: note.color,
    pinned: note.pinned,
    archived: note.archived,
    favorite: note.favorite,
    remindAt: note.remindAt,
    deletedAt: note.deletedAt,
    folderId: note.folderId,
    folder: note.folder
      ? {
          id: note.folder.id,
          name: note.folder.name,
          icon: note.folder.icon,
          color: note.folder.color,
        }
      : null,
    tags: note.tags.map((link) => ({
      id: link.tag.id,
      name: link.tag.name,
      color: link.tag.color,
    })),
    checklist: note.checklist.map((item) => ({
      id: item.id,
      text: item.text,
      done: item.done,
      order: item.order,
    })),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function cleanChecklist(items: { text: string; done?: boolean }[] | undefined) {
  return (items ?? [])
    .map((item) => ({ text: item.text.trim(), done: Boolean(item.done) }))
    .filter((item) => item.text.length > 0)
    .slice(0, 40)
    .map((item, order) => ({ ...item, order }));
}

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListNotesQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(userId, query);
    const orderBy = this.buildOrder(query);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.note.count({ where }),
      this.prisma.note.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: noteInclude,
      }),
    ]);
    return { items: rows.map(mapNote), total, page, pageSize };
  }

  async stats(userId: string) {
    const active = { userId, deletedAt: null, archived: false };
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    const [total, pinned, favorite, archived, trash, today, reminderRows, characterRows] =
      await Promise.all([
        this.prisma.note.count({ where: active }),
        this.prisma.note.count({ where: { ...active, pinned: true } }),
        this.prisma.note.count({ where: { ...active, favorite: true } }),
        this.prisma.note.count({ where: { userId, deletedAt: null, archived: true } }),
        this.prisma.note.count({ where: { userId, deletedAt: { not: null } } }),
        this.prisma.note.count({ where: { ...active, updatedAt: { gte: start } } }),
        this.prisma.note.findMany({
          where: { ...active, remindAt: { not: null } },
          orderBy: { remindAt: 'asc' },
          take: 30,
          include: noteInclude,
        }),
        this.prisma.$queryRaw<{ characters: bigint | number | null }[]>`
          SELECT COALESCE(SUM(CHAR_LENGTH(\`title\`) + CHAR_LENGTH(\`content\`)), 0) AS characters
          FROM \`notes\`
          WHERE \`userId\` = ${userId} AND \`deletedAt\` IS NULL
        `,
      ]);

    const reminders = [...reminderRows]
      .sort((a, b) => {
        const at = a.remindAt?.getTime() ?? 0;
        const bt = b.remindAt?.getTime() ?? 0;
        const aOver = at < now.getTime();
        const bOver = bt < now.getTime();
        if (aOver && bOver) return bt - at;
        if (aOver) return -1;
        if (bOver) return 1;
        return at - bt;
      })
      .slice(0, 6)
      .map(mapNote);

    return {
      total,
      pinned,
      favorite,
      archived,
      trash,
      today,
      characters: Number(characterRows[0]?.characters ?? 0),
      reminders,
    };
  }

  async get(userId: string, id: string) {
    return mapNote(await this.owned(userId, id));
  }

  async create(userId: string, dto: UpdateNoteDto) {
    const tagIds = await this.ensureTags(userId, dto.tagIds);
    await this.ensureFolder(userId, dto.folderId);
    const checklist = cleanChecklist(dto.checklist);
    const note = await this.prisma.note.create({
      data: {
        userId,
        title: dto.title?.trim() ?? '',
        content: dto.content ?? '',
        color: dto.color ?? 'ivory',
        pinned: dto.pinned ?? false,
        archived: dto.archived ?? false,
        favorite: dto.favorite ?? false,
        remindAt: dto.remindAt ? new Date(dto.remindAt) : null,
        folderId: dto.folderId ?? null,
        tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
        checklist: checklist.length ? { create: checklist } : undefined,
      },
      include: noteInclude,
    });
    if (note.folderId) await this.touchFolder(note.folderId);
    return mapNote(note);
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.owned(userId, id);
    const tagIds = dto.tagIds ? await this.ensureTags(userId, dto.tagIds) : undefined;
    if (dto.folderId) await this.ensureFolder(userId, dto.folderId);

    const data: Prisma.NoteUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.pinned !== undefined) data.pinned = dto.pinned;
    if (dto.archived !== undefined) data.archived = dto.archived;
    if (dto.favorite !== undefined) data.favorite = dto.favorite;
    if (dto.remindAt !== undefined) data.remindAt = dto.remindAt ? new Date(dto.remindAt) : null;
    if (dto.folderId !== undefined) data.folderId = dto.folderId;

    const note = await this.prisma.$transaction(async (tx) => {
      if (tagIds) {
        await tx.noteTag.deleteMany({ where: { noteId: id } });
        if (tagIds.length) {
          await tx.noteTag.createMany({ data: tagIds.map((tagId) => ({ noteId: id, tagId })) });
        }
      }
      if (dto.checklist) {
        const checklist = cleanChecklist(dto.checklist);
        await tx.checklistItem.deleteMany({ where: { noteId: id } });
        if (checklist.length) {
          await tx.checklistItem.createMany({
            data: checklist.map((item) => ({ ...item, noteId: id })),
          });
        }
      }
      return tx.note.update({ where: { id }, data, include: noteInclude });
    });

    if (dto.folderId) await this.touchFolder(dto.folderId);
    return mapNote(note);
  }

  async remove(userId: string, id: string) {
    await this.owned(userId, id);
    const note = await this.prisma.note.update({
      where: { id },
      data: { deletedAt: new Date(), pinned: false },
      include: noteInclude,
    });
    return mapNote(note);
  }

  async restore(userId: string, id: string) {
    const existing = await this.owned(userId, id);
    if (!existing.deletedAt) throw new BadRequestException('这张便签不在回收站');
    const note = await this.prisma.note.update({
      where: { id },
      data: { deletedAt: null },
      include: noteInclude,
    });
    return mapNote(note);
  }

  async destroy(userId: string, id: string) {
    await this.owned(userId, id);
    await this.prisma.note.delete({ where: { id } });
    return { ok: true };
  }

  async emptyTrash(userId: string) {
    const result = await this.prisma.note.deleteMany({
      where: { userId, deletedAt: { not: null } },
    });
    return { ok: true, count: result.count };
  }

  async duplicate(userId: string, id: string) {
    const source = await this.owned(userId, id);
    const note = await this.prisma.note.create({
      data: {
        userId,
        title: source.title ? `${source.title} 副本` : '副本',
        content: source.content,
        color: source.color,
        favorite: source.favorite,
        remindAt: source.remindAt,
        folderId: source.folderId,
        tags: source.tags.length
          ? { create: source.tags.map((link) => ({ tagId: link.tagId })) }
          : undefined,
        checklist: source.checklist.length
          ? {
              create: source.checklist.map((item) => ({
                text: item.text,
                done: item.done,
                order: item.order,
              })),
            }
          : undefined,
      },
      include: noteInclude,
    });
    return mapNote(note);
  }

  async toggleCheck(userId: string, noteId: string, itemId: string, done: boolean) {
    await this.owned(userId, noteId);
    const item = await this.prisma.checklistItem.findFirst({ where: { id: itemId, noteId } });
    if (!item) throw new NotFoundException('清单项不存在');
    await this.prisma.checklistItem.update({ where: { id: itemId }, data: { done } });
    const note = await this.prisma.note.update({
      where: { id: noteId },
      data: { updatedAt: new Date() },
      include: noteInclude,
    });
    return mapNote(note);
  }

  async exportBackup(userId: string) {
    const [folders, tags, notes] = await Promise.all([
      this.prisma.folder.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
      this.prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
      this.prisma.note.findMany({
        where: { userId, deletedAt: null },
        include: noteInclude,
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      folders: folders.map((folder) => ({
        name: folder.name,
        icon: folder.icon,
        color: folder.color,
      })),
      tags: tags.map((tag) => ({ name: tag.name, color: tag.color })),
      notes: notes.map((note) => ({
        title: note.title,
        content: note.content,
        color: note.color,
        pinned: note.pinned,
        archived: note.archived,
        favorite: note.favorite,
        remindAt: note.remindAt,
        folderName: note.folder?.name ?? null,
        tagNames: note.tags.map((link) => link.tag.name),
        checklist: note.checklist.map((item) => ({
          text: item.text,
          done: item.done,
          order: item.order,
        })),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    };
  }

  async importBackup(userId: string, dto: ImportBackupDto) {
    const folderMap = new Map<string, string>();
    const tagMap = new Map<string, string>();

    const existingFolders = await this.prisma.folder.findMany({ where: { userId } });
    existingFolders.forEach((folder) => folderMap.set(folder.name, folder.id));
    const existingTags = await this.prisma.tag.findMany({ where: { userId } });
    existingTags.forEach((tag) => tagMap.set(tag.name, tag.id));

    let folderCount = 0;
    let tagCount = 0;
    let noteCount = 0;

    for (const folder of dto.folders ?? []) {
      const name = folder.name.trim();
      if (!name || folderMap.has(name)) continue;
      const created = await this.prisma.folder.create({
        data: {
          userId,
          name,
          icon: folder.icon?.trim() || '📒',
          color: folder.color || '#E07A4C',
        },
      });
      folderMap.set(name, created.id);
      folderCount += 1;
    }

    for (const tag of dto.tags ?? []) {
      const name = tag.name.trim();
      if (!name || tagMap.has(name)) continue;
      const created = await this.prisma.tag.create({
        data: { userId, name, color: tag.color || '#7A5EA7' },
      });
      tagMap.set(name, created.id);
      tagCount += 1;
    }

    for (const item of dto.notes ?? []) {
      const folderName = item.folderName?.trim();
      if (folderName && !folderMap.has(folderName)) {
        const created = await this.prisma.folder.create({
          data: { userId, name: folderName, icon: '📒', color: '#E07A4C' },
        });
        folderMap.set(folderName, created.id);
        folderCount += 1;
      }
      const tagIds: string[] = [];
      for (const rawName of item.tagNames ?? []) {
        const name = rawName.trim();
        if (!name) continue;
        let tagId = tagMap.get(name);
        if (!tagId) {
          const created = await this.prisma.tag.create({
            data: { userId, name, color: '#7A5EA7' },
          });
          tagId = created.id;
          tagMap.set(name, tagId);
          tagCount += 1;
        }
        tagIds.push(tagId);
      }
      const checklist = cleanChecklist(item.checklist);
      const createdAt = item.createdAt ? new Date(item.createdAt) : undefined;
      const updatedAt = item.updatedAt ? new Date(item.updatedAt) : undefined;
      await this.prisma.note.create({
        data: {
          userId,
          title: item.title?.trim() ?? '',
          content: item.content ?? '',
          color: item.color ?? 'ivory',
          pinned: Boolean(item.pinned),
          archived: Boolean(item.archived),
          favorite: Boolean(item.favorite),
          remindAt: item.remindAt ? new Date(item.remindAt) : null,
          folderId: folderName ? folderMap.get(folderName) : null,
          createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined,
          updatedAt: updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : undefined,
          tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
          checklist: checklist.length ? { create: checklist } : undefined,
        },
      });
      noteCount += 1;
    }

    return { folders: folderCount, tags: tagCount, notes: noteCount };
  }

  private buildWhere(userId: string, query: ListNotesQuery): Prisma.NoteWhereInput {
    const status = query.status ?? 'active';
    const where: Prisma.NoteWhereInput = { userId };

    if (status === 'trash') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
      if (status === 'archived') where.archived = true;
      else if (status === 'favorite') {
        where.archived = false;
        where.favorite = true;
      } else if (status === 'pinned') {
        where.archived = false;
        where.pinned = true;
      } else where.archived = false;
    }

    if (query.folderId) where.folderId = query.folderId;
    if (query.tagId) where.tags = { some: { tagId: query.tagId } };
    if (query.color) where.color = query.color;
    if (query.scope === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      where.updatedAt = { gte: start };
    }
    if (query.scope === 'remind') {
      where.remindAt = { not: null };
      where.deletedAt = null;
      where.archived = false;
    }
    const keyword = query.q?.trim();
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { checklist: { some: { text: { contains: keyword } } } },
      ];
    }
    return where;
  }

  private buildOrder(query: ListNotesQuery): Prisma.NoteOrderByWithRelationInput[] {
    if ((query.status ?? 'active') === 'trash') return [{ deletedAt: 'desc' }];
    if (query.scope === 'remind') return [{ remindAt: 'asc' }];
    if (query.sort === 'created') return [{ pinned: 'desc' }, { createdAt: 'desc' }];
    if (query.sort === 'title') return [{ pinned: 'desc' }, { title: 'asc' }];
    return [{ pinned: 'desc' }, { updatedAt: 'desc' }];
  }

  private async owned(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      include: noteInclude,
    });
    if (!note) throw new NotFoundException('找不到这张便签');
    return note;
  }

  private async ensureFolder(userId: string, folderId?: string | null) {
    if (!folderId) return;
    const folder = await this.prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) throw new BadRequestException('笔记本不存在');
  }

  private async ensureTags(userId: string, tagIds?: string[]) {
    const unique = [...new Set(tagIds ?? [])];
    if (!unique.length) return unique;
    const count = await this.prisma.tag.count({ where: { userId, id: { in: unique } } });
    if (count !== unique.length) throw new BadRequestException('包含无效标签');
    return unique;
  }

  private touchFolder(folderId: string) {
    return this.prisma.folder.update({
      where: { id: folderId },
      data: { updatedAt: new Date() },
    });
  }
}
