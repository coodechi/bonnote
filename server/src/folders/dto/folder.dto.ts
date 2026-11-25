import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class FolderDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(1, { message: '请填写笔记本名称' })
  @MaxLength(24, { message: '名称最多 24 个字' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '颜色格式不正确' })
  color?: string;
}
