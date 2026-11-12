import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { commentsAPI, type Comment } from "@/lib/api";
import { newsPath } from "@/lib/slug";
import { formatArticleDateTime } from "@/lib/date-utils";
import type { DateLanguage } from "@/lib/date-utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, Trash2, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const ManageComments = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [pending, setPending]   = useState<Comment[]>([]);
  const [approved, setApproved] = useState<Comment[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [all] = await Promise.all([commentsAPI.getAll()]);
      setPending(all.filter((c) => !c.approved));
      setApproved(all.filter((c) => c.approved));
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (id: number) => {
    try {
      await commentsAPI.approve(id);
      toast.success("Comment approved");
      fetchAll();
    } catch {
      toast.error("Failed to approve comment");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    try {
      await commentsAPI.delete(id);
      toast.success("Comment deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const CommentCard = ({ comment, showApprove = false }: { comment: Comment; showApprove?: boolean }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Article link */}
            {comment.news && (
              <a
                href={`/news/${comment.news.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline font-medium mb-1 block truncate"
              >
                📰 {comment.news.titleEN}
              </a>
            )}
            {/* Comment meta */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-foreground">{comment.name}</span>
              {comment.email && (
                <span className="text-xs text-muted-foreground">· {comment.email}</span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatArticleDateTime(comment.createdAt, language as DateLanguage)}
              </span>
            </div>
            {/* Comment content */}
            <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {showApprove && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => handleApprove(comment.id)}
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(comment.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate("/admin")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{t("admin.manageComments")}</h1>
              <p className="text-muted-foreground text-sm">{t("admin.manageCommentsDesc")}</p>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex gap-4 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold text-yellow-700">{pending.length}</p>
              <p className="text-xs text-yellow-600">Pending</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold text-green-700">{approved.length}</p>
              <p className="text-xs text-green-600">Approved</p>
            </div>
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending
                {pending.length > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {pending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : pending.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No pending comments.</p>
                </div>
              ) : (
                pending.map((c) => (
                  <CommentCard key={c.id} comment={c} showApprove />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved">
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : approved.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No approved comments yet.</p>
                </div>
              ) : (
                approved.map((c) => (
                  <CommentCard key={c.id} comment={c} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ManageComments;
