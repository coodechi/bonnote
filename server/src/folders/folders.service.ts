import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FolderDto } from './dto/folder.dto';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            notes: { where: { deletedAt: null, archived: false } },
          },
        },
      },
    });
    return folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      icon: folder.icon,
      color: folder.color,
      count: folder._count.notes,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    }));
  }

  async create(userId: string, dto: FolderDto) {
    const folder = await this.prisma.folder.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon?.trim() || '📒',
        color: dto.color || '#E07A4C',
      },
    });
    return { ...folder, count: 0 };
  }

  async update(userId: string, id: string, dto: FolderDto) {
    await this.ensure(userId, id);
    const folder = await this.prisma.folder.update({
      where: { id },
      data: {
        name: dto.name,
        icon: dto.icon?.trim() || '📒',
        color: dto.color || '#E07A4C',
      },
      include: {
        _count: { select: { notes: { where: { deletedAt: null, archived: false } } } },
      },
    });
    return {
      id: folder.id,
      name: folder.name,
      icon: folder.icon,
      color: folder.color,
      count: folder._count.notes,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  async remove(userId: string, id: string) {
    await this.ensure(userId, id);
    await this.prisma.folder.delete({ where: { id } });
    return { ok: true };
  }

  private async ensure(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) throw new NotFoundException('笔记本不存在');
    return folder;
  }
}
