import { ConfigService } from '@nestjs/config';

export function requiredConfig(config: ConfigService, key: string) {
  const value = config.get<string>(key)?.trim();
  if (!value) throw new Error(`server/.env 缺少 ${key}`);
  return value;
}
