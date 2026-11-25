import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error('无法连接 MySQL。请确认数据库已启动，并检查 server/.env 里的 DATABASE_URL。');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
