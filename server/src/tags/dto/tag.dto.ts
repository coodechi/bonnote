import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class TagDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(1, { message: '请填写标签名称' })
  @MaxLength(16, { message: '标签最多 16 个字' })
  name!: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '颜色格式不正确' })
  color?: string;
}
