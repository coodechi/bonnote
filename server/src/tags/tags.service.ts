import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const [tags, grouped] = await Promise.all([
      this.prisma.tag.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.noteTag.groupBy({
        by: ['tagId'],
        where: { note: { userId, deletedAt: null, archived: false } },
        _count: { _all: true },
      }),
    ]);
    const counts = new Map(grouped.map((row) => [row.tagId, row._count._all]));
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      count: counts.get(tag.id) ?? 0,
      createdAt: tag.createdAt,
    }));
  }

  async create(userId: string, dto: TagDto) {
    try {
      const tag = await this.prisma.tag.create({
        data: { userId, name: dto.name, color: dto.color || '#7A5EA7' },
      });
      return { id: tag.id, name: tag.name, color: tag.color, count: 0, createdAt: tag.createdAt };
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async update(userId: string, id: string, dto: TagDto) {
    await this.ensure(userId, id);
    try {
      const tag = await this.prisma.tag.update({
        where: { id },
        data: { name: dto.name, color: dto.color || '#7A5EA7' },
      });
      const count = await this.prisma.noteTag.count({
        where: { tagId: id, note: { deletedAt: null, archived: false } },
      });
      return { id: tag.id, name: tag.name, color: tag.color, count, createdAt: tag.createdAt };
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async remove(userId: string, id: string) {
    await this.ensure(userId, id);
    await this.prisma.tag.delete({ where: { id } });
    return { ok: true };
  }

  private async ensure(userId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw new NotFoundException('标签不存在');
    return tag;
  }

  private rethrowDuplicate(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('已有同名标签');
    }
    throw error;
  }
}
