import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      articleCount,
      viewAggregate,
      advertisementCount,
      mediaCount,
      adminCount,
      commentCount,
    ] = await Promise.all([
      this.prisma.news.count(),
      this.prisma.news.aggregate({ _sum: { views: true } }),
      this.prisma.advertisement.count(),
      this.prisma.media.count(),
      this.prisma.admin.count(),
      this.prisma.comment.count(),
    ]);

    return {
      articles: articleCount,
      totalViews: viewAggregate._sum.views ?? 0,
      advertisements: advertisementCount,
      mediaItems: mediaCount,
      admins: adminCount,
      totalComments: commentCount,
    };
  }
}
