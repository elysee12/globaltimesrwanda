import { useEffect, useState } from "react";
import { MessageCircle, Send, User } from "lucide-react";
import { toast } from "sonner";
import { commentsAPI, type Comment } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatRelativeDate } from "@/lib/date-utils";
import type { DateLanguage } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CommentsSectionProps {
  newsId: number;
}

const CommentsSection = ({ newsId }: CommentsSectionProps) => {
  const { t, language } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    commentsAPI.getByArticle(newsId).then((data) => {
      if (!cancelled) {
        setComments(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [newsId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await commentsAPI.submit(newsId, name.trim(), content.trim(), email.trim() || undefined);
      toast.success(t("newsDetail.commentSuccess"));
      setName("");
      setEmail("");
      setContent("");
    } catch {
      toast.error(t("newsDetail.commentError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10 border-t border-border pt-8">
      {/* ── Header with count ───────────────────────────────────────────── */}
      <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-6">
        <MessageCircle className="h-5 w-5 text-primary" />
        {t("newsDetail.comments")}
        <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 min-w-[1.5rem]">
          {comments.length}
        </span>
      </h2>

      {/* ── Submission form ──────────────────────────────────────────────── */}
      <div className="bg-muted/40 rounded-xl p-6 mb-8 border border-border">
        <h3 className="text-base font-semibold mb-4 text-foreground">
          {t("newsDetail.leaveComment")}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name + Email row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="comment-name">
                {t("newsDetail.commentName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="comment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("newsDetail.commentName")}
                maxLength={100}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="comment-email">
                {t("newsDetail.commentEmail")}
              </Label>
              <Input
                id="comment-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsDetail.commentEmailPlaceholder")}
                maxLength={191}
                className="mt-1"
              />
            </div>
          </div>

          {/* Comment content */}
          <div>
            <Label htmlFor="comment-content">
              {t("newsDetail.commentContent")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("newsDetail.commentPlaceholder")}
              rows={4}
              maxLength={2000}
              required
              className="mt-1 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {content.length} / 2000
            </p>
          </div>

          <Button type="submit" disabled={submitting} className="gap-2">
            <Send className="h-4 w-4" />
            {submitting ? "..." : t("newsDetail.commentSubmit")}
          </Button>
        </form>
      </div>

      {/* ── Comments list ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-center py-8 text-sm">
          {t("newsDetail.noComments")}
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <span className="text-primary font-bold text-sm uppercase">
                  {comment.name.charAt(0)}
                </span>
              </div>
              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                  <span className="font-semibold text-foreground">{comment.name}</span>
                  {comment.email && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {comment.email}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatRelativeDate(comment.createdAt, language as DateLanguage)}
                  </span>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words text-sm">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentsSection;
