import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { newsAPI, type NewsArticle } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeImageUrl } from "@/lib/image-utils";
import { formatRelativeDate } from "@/lib/date-utils";
import type { DateLanguage } from "@/lib/date-utils";
import { getTranslatedCategory } from "@/lib/localization";
import { newsPath } from "@/lib/slug";
import { Clock } from "lucide-react";

interface RelatedArticlesProps {
  newsId: number;
  category: string;
}

const RelatedArticles = ({ newsId, category }: RelatedArticlesProps) => {
  const { t, language } = useLanguage();
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        // Try same category first
        let data = await newsAPI.getRelated(newsId, category, 4);

        // Fallback: if no same-category articles, fetch the latest articles
        // from all categories, excluding the current article
        if (!data || data.length === 0) {
          const result = await newsAPI.getAll({ limit: 5 });
          data = (result.data || []).filter((a) => a.id !== newsId).slice(0, 4);
        }

        if (!cancelled) {
          setRelated(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [newsId, category]);

  // Always render the section (with skeleton while loading)
  return (
    <section className="mt-10 border-t border-border pt-8">
      {/* Section header */}
      <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full inline-block" />
        {t("newsDetail.relatedArticles")}
      </h2>

      {loading ? (
        /* Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex gap-3 bg-card rounded-xl p-3 border border-border">
              <div className="w-24 h-20 bg-muted rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : related.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">{t("newsDetail.noRelated")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {related.map((article) => {
            const title =
              language === "RW"
                ? article.titleRW || article.titleEN
                : language === "FR"
                ? article.titleFR || article.titleEN
                : article.titleEN;

            const to = newsPath(article.slug, article.id);
            const imgSrc = article.image
              ? normalizeImageUrl(article.image)
              : article.images?.[0]
              ? normalizeImageUrl(article.images[0])
              : "/placeholder.svg";

            return (
              <Link
                key={article.id}
                to={to}
                className="group flex gap-3 bg-card hover:bg-muted/40 rounded-xl p-3 transition-colors border border-border hover:border-primary/30"
              >
                {/* Thumbnail */}
                <div className="w-24 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={imgSrc}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-xs font-semibold text-primary mb-1">
                    {getTranslatedCategory(article.category, t)}
                  </span>
                  <h4 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDate(article.createdAt, language as DateLanguage)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RelatedArticles;
