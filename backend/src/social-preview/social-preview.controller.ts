/**
 * SocialPreviewController
 *
 * Handles:
 *   GET /preview/news/:slug      — legacy direct preview endpoint
 *   GET /news/:slug              — intercepts social-media-bot requests at the
 *                                  canonical article URL and returns OG-tagged HTML;
 *                                  real browsers are proxied through to the SPA.
 *   GET /preview/announcements/:id
 *
 * Social media crawlers (Facebook, WhatsApp, Twitter/X, LinkedIn, Telegram, …)
 * do NOT execute JavaScript.  Because the main frontend is a React SPA, crawlers
 * receive the bare index.html shell and never see article-specific meta tags.
 *
 * This controller solves that by serving a tiny, server-rendered HTML page that
 * contains all required Open Graph and Twitter Card meta tags for BOTH the
 * /preview/news/:slug endpoint AND the canonical /news/:slug URL.
 *
 * Real browsers hitting /news/:slug get a full HTML page that immediately
 * redirects them to the SPA via meta-refresh + JS.
 */

import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { extractIdFromSlug } from '../utils/slug.util';

// ---------------------------------------------------------------------------
// Bot detection
// ---------------------------------------------------------------------------

/** Lower-cased substrings found in social-crawler User-Agent strings. */
const BOT_UA_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'slackbot',
  'discordbot',
  'googlebot',
  'bingbot',
  'applebot',
  'pinterest',
  'vkshare',
  'w3c_validator',
  'ia_archiver',
  'embedly',
  'rogerbot',
  'quora link preview',
  'outbrain',
  'viber',
  'skype',
  'msnbot',
  'yandexbot',
  'duckduckbot',
];

function isBotUserAgent(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_UA_PATTERNS.some((p) => lower.includes(p));
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip HTML tags from a string so it is safe as a meta content value. */
function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

interface OgOptions {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string; // SPA article URL (the URL users actually share)
  author: string;
  publishedAt: string | null;
  siteName: string;
  isBot: boolean;       // true → no redirect; false → redirect to SPA immediately
}

function buildPreviewHtml(o: OgOptions): string {
  const title = escHtml(o.title);
  const desc = escHtml(o.description.slice(0, 300));
  const image = escHtml(o.imageUrl);
  const canonical = escHtml(o.canonicalUrl);
  const author = escHtml(o.author);
  const site = escHtml(o.siteName);

  const redirectBlock = o.isBot
    ? '' // bots: no redirect — let them read the tags
    : `
  <!-- ── Redirect real browsers to the SPA immediately ───────────────── -->
  <meta http-equiv="refresh" content="0;url=${canonical}" />
  <script>window.location.replace(${JSON.stringify(o.canonicalUrl)});</script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- ── Page title & SEO ─────────────────────────────────────────────── -->
  <title>${title} | ${site}</title>
  <meta name="description" content="${desc}" />
  <meta name="author" content="${author}" />
  <link rel="canonical" href="${canonical}" />
  ${o.publishedAt ? `<meta name="article:published_time" content="${escHtml(o.publishedAt)}" />` : ''}

  <!-- ── Open Graph ───────────────────────────────────────────────────── -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${site}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${title}" />
  ${o.publishedAt ? `<meta property="article:published_time" content="${escHtml(o.publishedAt)}" />` : ''}
  <meta property="article:author" content="${author}" />

  <!-- ── Twitter Card ─────────────────────────────────────────────────── -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${title}" />
${redirectBlock}
</head>
<body>
  <!-- Minimal visible content for accessibility and fallback text crawlers -->
  <article>
    <h1>${title}</h1>
    <p>${desc}</p>
    <p><strong>Author:</strong> ${author}</p>
    ${o.publishedAt ? `<p><time datetime="${escHtml(o.publishedAt)}">${new Date(o.publishedAt).toLocaleDateString()}</time></p>` : ''}
    <p><a href="${canonical}">Read the full article on ${site}</a></p>
  </article>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller()
export class SocialPreviewController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Canonical news URL — intercepts both bots and browsers ───────────────
  //
  // This is the KEY route: when a user shares
  //   https://globaltimesrwanda.com/news/my-article-42
  // WhatsApp/Facebook/Telegram crawlers hit this endpoint directly on the
  // backend and receive the OG-tagged HTML.
  //
  // Real browsers hitting this URL get the same HTML page, which immediately
  // redirects them to the SPA (meta-refresh + JS), so they never notice.
  //
  // NestJS note: NewsController also has GET /news/:id (with ParseIntPipe).
  // For numeric-only slugs the NewsController API route handles them fine since
  // ParseIntPipe accepts them. For full slugs like "my-article-42", NestJS
  // will try NewsController first (ParseIntPipe fails → 400) then fall through
  // to this route. We therefore add a guard: if the slug looks purely numeric,
  // redirect directly to the SPA so the API /news/:id endpoint is unaffected.

  @Get('news/:slug')
  async newsArticle(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Pure numeric slug → this is an API request for /news/:id, don't intercept
    if (/^\d+$/.test(slug)) {
      const frontendUrl = this.getFrontendUrl();
      return res.redirect(302, `${frontendUrl}/news/${slug}`);
    }
    return this.serveNewsPreview(slug, req, res);
  }

  // ── Legacy /preview/news/:slug — kept for backward compatibility ──────────

  @Get('preview/news/:slug')
  async previewNews(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.serveNewsPreview(slug, req, res);
  }

  // ── Shared logic for both news routes ────────────────────────────────────

  private async serveNewsPreview(
    slug: string,
    req: Request,
    res: Response,
  ) {
    const frontendUrl = this.getFrontendUrl();
    const backendUrl = this.getBackendUrl(req);
    const siteName = process.env.SITE_NAME || 'Global Times Rwanda';
    const userAgent = req.headers['user-agent'] || '';
    const isBot = isBotUserAgent(userAgent);

    try {
      const news = await this.findNewsBySlug(slug);

      if (!news) {
        if (!isBot) {
          // Real browser: redirect to SPA 404
          return res.redirect(302, `${frontendUrl}/news/${slug}`);
        }
        return res.status(404).send(this.notFoundHtml('Article not found', siteName));
      }

      const title = news.titleEN || news.titleRW || news.titleFR || siteName;
      const rawDescription = news.excerptEN || news.excerptRW || news.excerptFR || '';
      const description = stripHtml(rawDescription);
      const imageUrl = this.resolveImageUrl(news.image, news.images as string[] | null, backendUrl, frontendUrl);
      const canonicalUrl = `${frontendUrl}/news/${news.slug}`;

      const html = buildPreviewHtml({
        title,
        description,
        imageUrl,
        canonicalUrl,
        author: news.author,
        publishedAt: news.publishedAt
          ? news.publishedAt.toISOString()
          : news.createdAt.toISOString(),
        siteName,
        isBot,
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // Bots: cache for 10 min; browsers: no cache (they redirect immediately)
      res.setHeader(
        'Cache-Control',
        isBot
          ? 'public, max-age=600, s-maxage=600'
          : 'no-store',
      );
      return res.status(200).send(html);
    } catch {
      if (!isBot) {
        return res.redirect(302, `${frontendUrl}/news/${slug}`);
      }
      return res.status(500).send(this.errorHtml('Could not load article', siteName));
    }
  }

  // ── Announcement preview ──────────────────────────────────────────────────

  @Get('preview/announcements/:id')
  async previewAnnouncement(
    @Param('id') idParam: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const id = parseInt(idParam, 10);
    const frontendUrl = this.getFrontendUrl();
    const backendUrl = this.getBackendUrl(req);
    const siteName = process.env.SITE_NAME || 'Global Times Rwanda';
    const canonicalUrl = `${frontendUrl}/announcements/${id}`;
    const userAgent = req.headers['user-agent'] || '';
    const isBot = isBotUserAgent(userAgent);

    if (isNaN(id)) {
      return res.status(400).send(this.notFoundHtml('Invalid ID', siteName));
    }

    try {
      const ann = await this.prisma.announcement.findUnique({ where: { id } });

      if (!ann) {
        if (!isBot) return res.redirect(302, canonicalUrl);
        return res.status(404).send(this.notFoundHtml('Announcement not found', siteName));
      }

      const title = ann.titleEN || ann.titleRW || ann.titleFR || 'Announcement';
      const rawDesc = ann.descriptionEN || ann.descriptionRW || ann.descriptionFR || '';
      const description = stripHtml(rawDesc);
      const imageUrl = ann.image
        ? this.resolveImageUrl(ann.image, null, backendUrl, frontendUrl)
        : `${frontendUrl}/og-default.png`;

      const html = buildPreviewHtml({
        title,
        description,
        imageUrl,
        canonicalUrl,
        author: siteName,
        publishedAt: ann.createdAt.toISOString(),
        siteName,
        isBot,
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', isBot ? 'public, max-age=600, s-maxage=600' : 'no-store');
      return res.status(200).send(html);
    } catch {
      if (!isBot) return res.redirect(302, canonicalUrl);
      return res.status(500).send(this.errorHtml('Could not load announcement', siteName));
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async findNewsBySlug(slug: string) {
    // 1. Exact slug match
    let news = await this.prisma.news.findUnique({ where: { slug } });
    if (news) return news;

    // 2. Extract trailing ID from slug (handles "article-42" or bare "42")
    const id = extractIdFromSlug(slug);
    if (!isNaN(id)) {
      news = await this.prisma.news.findUnique({ where: { id } });
    }

    return news ?? null;
  }

  private resolveImageUrl(
    image: string | null,
    images: string[] | null,
    backendUrl: string,
    frontendUrl: string,
  ): string {
    const raw = image || (Array.isArray(images) && images.length > 0 ? images[0] : null);

    if (!raw) return `${frontendUrl}/og-default.png`;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

    // Relative path — prepend backend URL
    const clean = raw.replace(/^\/+/, '');
    return `${backendUrl}/${clean}`;
  }

  private getFrontendUrl(): string {
    return (
      (process.env.FRONTEND_URL || '').split(',')[0].trim() ||
      'http://localhost:8080'
    );
  }

  private getBackendUrl(req: Request): string {
    return (
      process.env.BACKEND_URL?.trim() ||
      `${req.protocol}://${req.get('host')}`
    );
  }

  private notFoundHtml(msg: string, siteName: string): string {
    return `<!DOCTYPE html><html><head><title>${escHtml(msg)} | ${escHtml(siteName)}</title></head><body><h1>${escHtml(msg)}</h1></body></html>`;
  }

  private errorHtml(msg: string, siteName: string): string {
    return `<!DOCTYPE html><html><head><title>Error | ${escHtml(siteName)}</title></head><body><h1>${escHtml(msg)}</h1></body></html>`;
  }
}
