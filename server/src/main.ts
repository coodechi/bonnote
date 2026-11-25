import { createRequire } from 'node:module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

const loadEnv = createRequire(__filename);
loadEnv('../env.cjs');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  const port = Number(process.env.PORT);
  if (!port) throw new Error('server/.env 缺少 PORT');
  await app.listen(port, '0.0.0.0');
  console.log(`Bonnote API 已启动：http://localhost:${port}/api`);
}

void bootstrap();
