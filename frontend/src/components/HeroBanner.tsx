import { useEffect, useState, useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNews } from "@/contexts/NewsContext";
import { getTranslatedCategory } from "@/lib/localization";
import { normalizeImageUrl } from "@/lib/image-utils";
import { newsPath } from "@/lib/slug";
import { useLocalizedArticles } from "@/hooks/useLocalizedArticles";

const HeroBanner = () => {
  const { language, t } = useLanguage();
  const { articles } = useNews();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(true); // true = visible, false = fading out

  // Pick featured articles first, fall back to latest
  const heroSource = useMemo(() => {
    const featured = articles.filter((a) => a.featured);
    return (featured.length ? featured : articles).slice(0, 7);
  }, [articles]);

  // Use the fast hook — no blocking translation loop
  const heroNews = useLocalizedArticles(heroSource, language);

  // Smooth cross-fade transition helper
  const goTo = (indexOrFn: number | ((n: number) => number)) => {
    setFade(false); // start fade-out
    setTimeout(() => {
      setCurrentSlide((prev) =>
        typeof indexOrFn === "function" ? indexOrFn(prev) : indexOrFn
      );
      setFade(true); // fade-in new slide
    }, 300);
  };

  // ── Auto-advance every 3 seconds ──────────────────────────────────────────
  useEffect(() => {
    if (heroNews.length < 2) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % heroNews.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(timer);
  }, [heroNews.length]);

  const prev = () => goTo((i) => (i - 1 + heroNews.length) % heroNews.length);
  const next = () => goTo((i) => (i + 1) % heroNews.length);

  if (heroNews.length === 0) {
    return (
      <div className="bg-navy text-white py-24 text-center">
        <h1 className="text-3xl font-bold">{t("home.noArticles")}</h1>
      </div>
    );
  }

  const main = heroNews[currentSlide];
  const side = heroNews.filter((_, i) => i !== currentSlide).slice(0, 4);

  return (
    <section className="bg-navy pb-4">
      <div className="container mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

          {/* ── Main featured slide ─────────────────────────────────────── */}
          <Link
            to={newsPath(main.slug, main.id)}
            className="relative lg:col-span-2 rounded-xl overflow-hidden block group"
            style={{ minHeight: 420 }}
          >
            {/* Full-bleed image with fade */}
            <img
              key={main.id}
              src={normalizeImageUrl(main.image)}
              alt={main.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{
                opacity: fade ? 1 : 0,
                transition: "opacity 0.35s ease-in-out",
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Content */}
            <div
              className="absolute bottom-0 left-0 right-0 p-5 md:p-7"
              style={{
                opacity: fade ? 1 : 0,
                transform: fade ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.35s ease-in-out, transform 0.35s ease-in-out",
              }}
            >
              <span className="inline-block px-3 py-1 bg-gold text-white text-xs font-bold rounded uppercase tracking-wide mb-3">
                {getTranslatedCategory(main.category, t)}
              </span>
              <h2 className="text-white text-xl md:text-3xl lg:text-4xl font-extrabold leading-tight drop-shadow-md line-clamp-3">
                {main.title}
              </h2>
              <span className="mt-3 inline-flex items-center gap-1.5 text-gold text-sm font-semibold group-hover:gap-3 transition-all">
                {t("hero.readMore")} <ChevronRight className="h-4 w-4" />
              </span>
            </div>

            {/* Prev / Next arrows */}
            {heroNews.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); prev(); }}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); next(); }}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Slide dots */}
            <div className="absolute bottom-3 right-5 flex gap-1.5 z-10">
              {heroNews.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); goTo(i); }}
                  aria-label={`Slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === currentSlide ? 24 : 8,
                    background: i === currentSlide ? "#F4A012" : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </div>
          </Link>

          {/* ── Side articles ───────────────────────────────────────────── */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            {side.map((item) => (
              <Link
                to={newsPath(item.slug, item.id)}
                key={item.id}
                className="flex gap-3 rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors p-2.5 group"
              >
                <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-black">
                  <img
                    src={normalizeImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-gold font-bold mb-1">
                    {getTranslatedCategory(item.category, t)}
                  </span>
                  <h3 className="text-white text-sm font-semibold leading-snug line-clamp-3 group-hover:text-gold/90 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
