/**
 * useLocalizedArticles
 *
 * Converts a list of NewsArticle objects into display-ready objects with
 * localized title/excerpt, using a two-phase strategy:
 *
 * Phase 1 (immediate / synchronous):
 *   Returns the title/excerpt stored in the active language field directly
 *   from the database record. No network call, renders instantly.
 *
 * Phase 2 (background / asynchronous):
 *   For articles where the active language field is empty, calls the
 *   translation API in parallel (not sequentially) and updates the state
 *   silently once results arrive.
 *
 * This eliminates the "images before text" problem caused by blocking the
 * render on sequential translation API calls.
 */

import { useMemo, useEffect, useState } from 'react';
import type { NewsArticle } from '@/contexts/NewsContext';
import type { Language } from '@/contexts/LanguageContext';
import { getLocalizedArticleFieldsAsync } from '@/lib/localization';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocalizedArticle {
  id: number;
  slug?: string;
  title: string;
  excerpt: string;
  category: string;
  image?: string;
  images?: string[];
  date: string;
  author: string;
  authorImage?: string;
  featured?: boolean;
  trending?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Synchronously pick the best available title for the given language. */
function syncTitle(article: NewsArticle, lang: Language): string {
  if (lang === 'RW') return article.title.RW || article.title.EN || article.title.FR || '';
  if (lang === 'FR') return article.title.FR || article.title.EN || article.title.RW || '';
  return article.title.EN || article.title.RW || article.title.FR || '';
}

/** Synchronously pick the best available excerpt for the given language. */
function syncExcerpt(article: NewsArticle, lang: Language): string {
  if (lang === 'RW') return article.excerpt.RW || article.excerpt.EN || article.excerpt.FR || '';
  if (lang === 'FR') return article.excerpt.FR || article.excerpt.EN || article.excerpt.RW || '';
  return article.excerpt.EN || article.excerpt.RW || article.excerpt.FR || '';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLocalizedArticles(
  articles: NewsArticle[],
  language: Language,
): LocalizedArticle[] {
  // Overrides from async translation (only filled for articles needing it)
  const [overrides, setOverrides] = useState<Map<number, { title: string; excerpt: string }>>(
    new Map(),
  );

  // Reset overrides when language changes so we don't show stale translations
  useEffect(() => {
    setOverrides(new Map());
  }, [language]);

  // Background: translate only articles with an empty field for the active language
  useEffect(() => {
    if (articles.length === 0) return;

    const needsTranslation = articles.filter((a) => {
      const t = syncTitle(a, language);
      return !t || t.trim() === '';
    });

    if (needsTranslation.length === 0) return;

    let cancelled = false;

    // Run all translation requests in parallel (not sequentially)
    Promise.all(
      needsTranslation.map(async (article) => {
        try {
          const translated = await getLocalizedArticleFieldsAsync(article, language);
          return { id: article.id, title: translated.title, excerpt: translated.excerpt };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const map = new Map<number, { title: string; excerpt: string }>();
      for (const r of results) {
        if (r && r.title) map.set(r.id, { title: r.title, excerpt: r.excerpt });
      }
      if (map.size > 0) setOverrides(map);
    });

    return () => { cancelled = true; };
  }, [articles, language]);

  // Combine: sync titles first, override with translations when available
  return useMemo(
    () =>
      articles.map((article) => {
        const override = overrides.get(article.id);
        return {
          id: article.id,
          slug: article.slug,
          title: override?.title || syncTitle(article, language),
          excerpt: override?.excerpt || syncExcerpt(article, language),
          category: article.category,
          image: article.image,
          images: article.images,
          date: article.date,
          author: article.author,
          authorImage: article.authorImage,
          featured: article.featured,
          trending: article.trending,
        };
      }),
    [articles, overrides, language],
  );
}
