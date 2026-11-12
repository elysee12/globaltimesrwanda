import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsEmail, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export class CreateCommentDto {
  @IsInt()
  newsId: number;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  content: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /** Public: submit a new comment (starts as unapproved) */
  async create(dto: CreateCommentDto) {
    const news = await this.prisma.news.findUnique({ where: { id: dto.newsId } });
    if (!news) throw new NotFoundException(`News with ID ${dto.newsId} not found`);

    return this.prisma.comment.create({
      data: {
        newsId: dto.newsId,
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        content: dto.content.trim(),
        approved: false,
      },
    });
  }

  /** Public: fetch approved comments for one article */
  async findApproved(newsId: number) {
    return this.prisma.comment.findMany({
      where: { newsId, approved: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Public: count approved comments for one article */
  async countApproved(newsId: number): Promise<number> {
    return this.prisma.comment.count({ where: { newsId, approved: true } });
  }

  /** Admin: list all comments (optionally filter by approved status) */
  async findAll(approved?: boolean) {
    const where = approved !== undefined ? { approved } : {};
    return this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { news: { select: { id: true, slug: true, titleEN: true } } },
    });
  }

  /** Admin: count total comments */
  async countAll(): Promise<number> {
    return this.prisma.comment.count();
  }

  /** Admin: approve a comment */
  async approve(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return this.prisma.comment.update({ where: { id }, data: { approved: true } });
  }

  /** Admin: delete a comment */
  async remove(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return this.prisma.comment.delete({ where: { id } });
  }
}
