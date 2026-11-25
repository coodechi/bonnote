import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { NOTE_COLORS } from '../../common/palette';

export class ChecklistItemDto {
  @IsString()
  @MaxLength(300, { message: '清单内容最多 300 字' })
  text!: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: '标题最多 120 字' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000, { message: '正文最多 20000 字' })
  content?: string;

  @IsOptional()
  @IsIn([...NOTE_COLORS], { message: '不支持的便签颜色' })
  color?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @IsISO8601({}, { message: '提醒时间不正确' })
  remindAt?: string | null;

  @IsOptional()
  @IsString()
  folderId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12, { message: '一条笔记最多 12 个标签' })
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40, { message: '清单最多 40 项' })
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];
}

export class ListNotesQuery {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsIn(['active', 'favorite', 'archived', 'trash', 'pinned'])
  status?: 'active' | 'favorite' | 'archived' | 'trash' | 'pinned';

  @IsOptional()
  @IsIn(['updated', 'created', 'title'])
  sort?: 'updated' | 'created' | 'title';

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsString()
  tagId?: string;

  @IsOptional()
  @IsIn([...NOTE_COLORS])
  color?: string;

  @IsOptional()
  @IsIn(['today', 'remind'])
  scope?: 'today' | 'remind';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class ToggleCheckDto {
  @IsBoolean()
  done!: boolean;
}

export class ImportChecklistDto {
  @IsString()
  @MaxLength(300)
  text!: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class ImportNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;

  @IsOptional()
  @IsIn([...NOTE_COLORS])
  color?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @IsISO8601()
  remindAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  folderName?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ImportChecklistDto)
  checklist?: ImportChecklistDto[];

  @IsOptional()
  @IsISO8601()
  createdAt?: string;

  @IsOptional()
  @IsISO8601()
  updatedAt?: string;
}

export class ImportFolderDto {
  @IsString()
  @MaxLength(24)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;
}

export class ImportTagDto {
  @IsString()
  @MaxLength(16)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;
}

export class ImportBackupDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportFolderDto)
  folders?: ImportFolderDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportTagDto)
  tags?: ImportTagDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500, { message: '一次最多导入 500 条笔记' })
  @ValidateNested({ each: true })
  @Type(() => ImportNoteDto)
  notes?: ImportNoteDto[];
}
