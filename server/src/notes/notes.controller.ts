import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { ImportBackupDto, ListNotesQuery, ToggleCheckDto, UpdateNoteDto } from './dto/note.dto';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.notes.stats(user.id);
  }

  @Get('export')
  exportBackup(@CurrentUser() user: AuthUser) {
    return this.notes.exportBackup(user.id);
  }

  @Post('import')
  importBackup(@CurrentUser() user: AuthUser, @Body() dto: ImportBackupDto) {
    return this.notes.importBackup(user.id, dto);
  }

  @Delete('trash')
  emptyTrash(@CurrentUser() user: AuthUser) {
    return this.notes.emptyTrash(user.id);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListNotesQuery) {
    return this.notes.list(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: UpdateNoteDto) {
    return this.notes.create(user.id, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notes.get(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notes.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notes.remove(user.id, id);
  }

  @Post(':id/restore')
  restore(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notes.restore(user.id, id);
  }

  @Delete(':id/permanent')
  destroy(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notes.destroy(user.id, id);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notes.duplicate(user.id, id);
  }

  @Patch(':id/checklist/:itemId')
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: ToggleCheckDto,
  ) {
    return this.notes.toggleCheck(user.id, id, itemId, dto.done);
  }
}
