import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService, CreateCommentDto } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // ── Public ───────────────────────────────────────────────────────────────

  /** POST /comments  — submit a new comment (pending approval) */
  @Post()
  create(@Body() dto: CreateCommentDto) {
    return this.commentsService.create(dto);
  }

  /** GET /comments?newsId=X  — approved comments for an article */
  @Get()
  findApproved(@Query('newsId', ParseIntPipe) newsId: number) {
    return this.commentsService.findApproved(newsId);
  }

  /** GET /comments/count?newsId=X  — count of approved comments */
  @Get('count')
  countApproved(@Query('newsId', ParseIntPipe) newsId: number) {
    return this.commentsService.countApproved(newsId).then((count) => ({ count }));
  }

  // ── Admin (protected) ────────────────────────────────────────────────────

  /** GET /comments/all?approved=false  — all or filtered comments for admin */
  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAll(@Query('approved') approved?: string) {
    const filter =
      approved === 'true' ? true : approved === 'false' ? false : undefined;
    return this.commentsService.findAll(filter);
  }

  /** PATCH /comments/:id/approve */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.approve(id);
  }

  /** DELETE /comments/:id */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }
}
