import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNews } from "@/contexts/NewsContext";
import { useLocalizedArticles } from "@/hooks/useLocalizedArticles";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";

const Economics = () => {
  const { t, language } = useLanguage();
  const { articles, loading } = useNews();

  const categoryArticles = useMemo(
    () => articles.filter(a => a.category.toLowerCase() === 'economics'),
    [articles],
  );

  const categoryNews = useLocalizedArticles(categoryArticles, language);
  const topStories = useMemo(() => categoryNews.filter(n => n.featured || n.trending).slice(0, 3), [categoryNews]);
  const latestNews  = useMemo(() => categoryNews.filter(n => !n.featured && !n.trending), [categoryNews]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-foreground mb-8 animate-fade-in">{t('nav.economics')}</h1>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-muted-foreground">Loading articles...</p>
            </div>
          ) : (
            <>
              {topStories.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-3xl font-bold text-navy mb-6 border-l-4 border-gold pl-4">{t('home.featuredNews')}</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topStories.map(n => <NewsCard key={n.id} {...n} featured />)}
                  </div>
                </section>
              )}
              <section>
                <h2 className="text-3xl font-bold text-navy mb-6 border-l-4 border-gold pl-4">{t('home.latestNews')}</h2>
                {latestNews.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {latestNews.map(n => <NewsCard key={n.id} {...n} />)}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No latest articles yet.</p>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Economics;
