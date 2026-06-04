import { useLocation } from "wouter";
import { BookOpen, Calendar, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListLessons, useDeleteLesson, useGetLessonsStats, getListLessonsQueryKey, getGetLessonsStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const SEQUENCE_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 border-blue-200",
  2: "bg-green-100 text-green-800 border-green-200",
  3: "bg-amber-100 text-amber-800 border-amber-200",
  4: "bg-red-100 text-red-800 border-red-200",
};

const SEQUENCE_SHORT: Record<number, string> = {
  1: "Séq. 1",
  2: "Séq. 2",
  3: "Séq. 3",
  4: "Séq. 4",
};

const TRANCHE_LABELS: Record<string, string> = {
  petits: "Petits",
  moyens: "Moyens",
  grands: "Grands",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function LessonsPage() {
  const [, setLocation] = useLocation();
  const { data: lessons, isLoading } = useListLessons();
  const { data: stats } = useGetLessonsStats();
  const deleteLesson = useDeleteLesson();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Supprimer cette leçon ?")) return;
    await deleteLesson.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getGetLessonsStatsQueryKey() });
    toast({ title: "Leçon supprimée" });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes leçons</h1>
          <p className="text-muted-foreground mt-1">Toutes vos préparations sauvegardées</p>
        </div>
        <Button onClick={() => setLocation("/")} className="gap-2" data-testid="button-new-lesson">
          <Plus className="h-4 w-4" />
          Nouvelle leçon
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} color="bg-card" />
          <StatCard label="Séquence 1" value={stats.parSequence.sequence1} color="bg-blue-50" textColor="text-blue-800" />
          <StatCard label="Séquence 2" value={stats.parSequence.sequence2} color="bg-green-50" textColor="text-green-800" />
          <StatCard label="Séquence 3–4" value={stats.parSequence.sequence3 + stats.parSequence.sequence4} color="bg-amber-50" textColor="text-amber-800" />
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && lessons?.length === 0 && (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground text-lg">Aucune leçon sauvegardée</h3>
          <p className="text-muted-foreground mt-2 mb-6">Commencez par préparer une leçon avec l'IA.</p>
          <Button onClick={() => setLocation("/")} data-testid="button-start-first">Préparer une leçon</Button>
        </div>
      )}

      {!isLoading && lessons && lessons.length > 0 && (
        <div className="space-y-3">
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              onClick={() => setLocation(`/lecon/${lesson.id}`)}
              className="bg-card border border-border rounded-xl p-5 flex items-start justify-between gap-4 cursor-pointer hover:shadow-sm hover:border-primary/20 transition-all"
              data-testid={`card-lesson-${lesson.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className={`border text-xs ${SEQUENCE_COLORS[lesson.sequence]}`}>
                    {SEQUENCE_SHORT[lesson.sequence]}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">{TRANCHE_LABELS[lesson.trancheAge]}</Badge>
                </div>
                <h3 className="font-semibold text-foreground truncate">{lesson.titre}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{lesson.reference}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(lesson.createdAt)}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDelete(lesson.id, e)}
                disabled={deleteLesson.isPending}
                data-testid={`button-delete-${lesson.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, textColor }: { label: string; value: number; color: string; textColor?: string }) {
  return (
    <div className={`${color} border border-border rounded-xl p-4`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColor ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}
