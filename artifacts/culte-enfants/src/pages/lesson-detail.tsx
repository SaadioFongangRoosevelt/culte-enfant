import { useLocation, useParams } from "wouter";
import { ArrowLeft, Trash2, Printer, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetLesson, useDeleteLesson, getGetLessonQueryKey, getListLessonsQueryKey, getGetLessonsStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const SEQUENCE_LABELS: Record<number, string> = {
  1: "Séquence 1 — Installation des ressources",
  2: "Séquence 2 — Évaluation et intégration",
  3: "Séquence 3 — Vérification des intégrations",
  4: "Séquence 4 — Remédiation",
};
const SEQUENCE_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 border-blue-200",
  2: "bg-green-100 text-green-800 border-green-200",
  3: "bg-amber-100 text-amber-800 border-amber-200",
  4: "bg-red-100 text-red-800 border-red-200",
};
const TRANCHE_LABELS: Record<string, string> = {
  petits: "Petits (Maternelle – CE1)",
  moyens: "Moyens (CE2 – CM1)",
  grands: "Grands (CM2 et plus)",
};

type D = Record<string, unknown>;
function str(v: unknown): string { return typeof v === "string" ? v : String(v ?? ""); }
function arr<T>(v: unknown): T[] { return Array.isArray(v) ? (v as T[]) : []; }
function obj(v: unknown): D { return (v != null && typeof v === "object" && !Array.isArray(v)) ? (v as D) : {}; }
function has(v: unknown): boolean { return v != null && v !== "" && !(Array.isArray(v) && v.length === 0); }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-muted/40 px-5 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  );
}

function QA({ q, a, index }: { q: string; a: string; index: number }) {
  return (
    <div>
      <p className="font-medium text-foreground text-sm">Q{index + 1} : {q}</p>
      <p className="text-sm text-muted-foreground mt-0.5">→ {a}</p>
    </div>
  );
}

function RenderContent({ sequence, data }: { sequence: number; data: D }) {
  if (sequence === 1) {
    const sdv = obj(data.situationDeVie);
    const et = obj(data.exploitationTexte);
    const etQs = arr<{ question: string; reponseAttendue: string }>(et.questions);
    const sdvQs = arr<string>(sdv.questions);
    return (
      <div className="space-y-4">
        {has(data.competence) && (
          <Block title="Compétence à développer">
            <p className="text-foreground leading-relaxed text-sm">{str(data.competence)}</p>
          </Block>
        )}
        {has(data.situationDeVie) && (
          <Block title="Situation de vie">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="italic text-foreground leading-relaxed text-sm">{str(sdv.histoire)}</p>
            </div>
            {sdvQs.map((q, i) => <p key={i} className="text-foreground text-sm">→ {q}</p>)}
          </Block>
        )}
        {etQs.length > 0 && (
          <Block title="Exploitation du texte">
            {etQs.map((q, i) => <QA key={i} q={q.question} a={q.reponseAttendue} index={i} />)}
          </Block>
        )}
        {has(data.retenons) && (
          <Block title="Retenons">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="font-medium text-foreground text-sm">{str(data.retenons)}</p>
            </div>
          </Block>
        )}
        {has(data.messageCentral) && (
          <Block title="Message Central">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="italic text-foreground leading-relaxed text-sm">{str(data.messageCentral)}</p>
            </div>
          </Block>
        )}
        {has(data.elaboration) && (
          <Block title="Élaboration complète">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm">{str(data.elaboration)}</p>
          </Block>
        )}
      </div>
    );
  }

  if (sequence === 2) {
    const ev = obj(data.evaluationSommative);
    const ai = obj(data.activiteIntegration);
    const lf = obj(data.liaisonFamiliale);
    const evQs = arr<{ question: string; reponseAttendue: string }>(ev.questionsHistoire);
    const aiQs = arr<{ question: string; guidanceReponse: string }>(ai.questions);
    const aiSp = obj(ai.situationProbleme);
    const qmc = ev.questionMessageCentral as { question: string; reponseAttendue: string } | undefined;
    const lfDisc = arr<string>(lf.discussionEnFamille);
    return (
      <div className="space-y-4">
        {has(data.evaluationSommative) && (
          <Block title="Évaluation sommative">
            {evQs.map((q, i) => <QA key={i} q={q.question} a={q.reponseAttendue} index={i} />)}
            {qmc != null && (
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">Message Central :</p>
                <p className="font-medium text-foreground text-sm">{qmc.question}</p>
                <p className="text-sm text-muted-foreground mt-0.5">→ {qmc.reponseAttendue}</p>
              </div>
            )}
            {has(ev.questionApplication) && (
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">Application :</p>
                <p className="text-foreground text-sm">{str(ev.questionApplication)}</p>
              </div>
            )}
          </Block>
        )}
        {has(data.activiteIntegration) && (
          <Block title="Activité d'intégration">
            {has(ai.situationProbleme) && (
              <div className="bg-muted/50 rounded-lg p-4 mb-2">
                <p className="italic text-foreground text-sm leading-relaxed">{str(aiSp.histoire)}</p>
              </div>
            )}
            {aiQs.map((q, i) => (
              <div key={i}>
                <p className="font-medium text-foreground text-sm">Q{i + 1} : {q.question}</p>
                <p className="text-sm text-muted-foreground mt-0.5">→ {q.guidanceReponse}</p>
              </div>
            ))}
          </Block>
        )}
        {has(data.liaisonFamiliale) && (
          <Block title="Liaison familiale">
            {has(lf.resumeRecit) && <div><p className="text-sm font-medium text-muted-foreground mb-1">Résumé :</p><p className="text-foreground text-sm leading-relaxed">{str(lf.resumeRecit)}</p></div>}
            {has(lf.messageCentralEtCompetence) && <div><p className="text-sm font-medium text-muted-foreground mb-1">Message central :</p><p className="text-foreground text-sm">{str(lf.messageCentralEtCompetence)}</p></div>}
            {lfDisc.length > 0 && <div><p className="text-sm font-medium text-muted-foreground mb-1">Discussion en famille :</p>{lfDisc.map((d, i) => <p key={i} className="text-foreground text-sm">• {d}</p>)}</div>}
          </Block>
        )}
      </div>
    );
  }

  if (sequence === 3) {
    const pm = obj(data.partageMoniteur);
    const vi = obj(data.verificationIntegrations);
    const viQs = arr<{ question: string; reponseAttendue: string }>(vi.corrigeIntegration);
    const pts = arr<string>(data.pointsAttention);
    return (
      <div className="space-y-4">
        {has(data.partageMoniteur) && (
          <Block title="Partage du moniteur">
            {has(pm.description) && <p className="text-foreground leading-relaxed text-sm">{str(pm.description)}</p>}
            {arr<string>(pm.exemples).length > 0 && <div><p className="text-sm font-medium text-muted-foreground mb-1">Exemples :</p>{arr<string>(pm.exemples).map((e, i) => <p key={i} className="text-foreground text-sm">• {e}</p>)}</div>}
          </Block>
        )}
        {viQs.length > 0 && (
          <Block title="Corrigé de l'intégration">
            {viQs.map((q, i) => <QA key={i} q={q.question} a={q.reponseAttendue} index={i} />)}
          </Block>
        )}
        {pts.length > 0 && (
          <Block title="Points d'attention">
            {pts.map((p, i) => <p key={i} className="text-foreground text-sm">! {p}</p>)}
          </Block>
        )}
      </div>
    );
  }

  if (sequence === 4) {
    const diffs = arr<{ difficulte: string; cause: string; solutionRemediation: string }>(data.difficultesCourantes);
    const rl = obj(data.recapitulatifLecon);
    return (
      <div className="space-y-4">
        {diffs.length > 0 && (
          <Block title="Difficultés et remédiations">
            {diffs.map((d, i) => (
              <div key={i} className="border border-border rounded-lg p-3 space-y-1">
                <p className="font-medium text-foreground text-sm">Difficulté {i + 1} : {d.difficulte}</p>
                <p className="text-sm text-muted-foreground">Cause : {d.cause}</p>
                <p className="text-sm text-green-700 bg-green-50 rounded p-2">Solution : {d.solutionRemediation}</p>
              </div>
            ))}
          </Block>
        )}
        {has(data.recapitulatifLecon) && (
          <Block title="Récapitulatif de la leçon">
            {has(rl.messageCentral) && <div className="bg-primary/5 border border-primary/20 rounded p-3"><p className="italic text-foreground text-sm">{str(rl.messageCentral)}</p></div>}
            {has(rl.competenceVisee) && <p className="text-foreground text-sm"><span className="font-medium">Compétence :</span> {str(rl.competenceVisee)}</p>}
          </Block>
        )}
        {has(data.encouragements) && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <p className="italic text-foreground leading-relaxed text-sm">{str(data.encouragements)}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lessonId = parseInt(id ?? "0");

  const { data: lesson, isLoading } = useGetLesson(lessonId, {
    query: { enabled: lessonId > 0, queryKey: getGetLessonQueryKey(lessonId) },
  });
  const deleteLesson = useDeleteLesson();

  let parsedContent: D | null = null;
  try {
    if (lesson?.contenu) parsedContent = JSON.parse(lesson.contenu) as D;
  } catch {}

  async function handleDelete() {
    if (!confirm("Supprimer définitivement cette leçon ?")) return;
    await deleteLesson.mutateAsync({ id: lessonId });
    await queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getGetLessonsStatsQueryKey() });
    toast({ title: "Leçon supprimée" });
    setLocation("/lecons");
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (lesson == null) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-semibold text-foreground text-lg">Leçon introuvable</h2>
        <Button onClick={() => setLocation("/lecons")} className="mt-4" variant="outline">Retour aux leçons</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <Button variant="ghost" onClick={() => setLocation("/lecons")} className="gap-2 -ml-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => window.print()} className="gap-2" data-testid="button-print">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
        <Button variant="outline" onClick={handleDelete} disabled={deleteLesson.isPending} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5" data-testid="button-delete">
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-2 flex-wrap mb-3">
          <Badge variant="outline" className={`border ${SEQUENCE_COLORS[lesson.sequence]}`}>
            {SEQUENCE_LABELS[lesson.sequence]}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">{TRANCHE_LABELS[lesson.trancheAge]}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{lesson.titre}</h1>
        <p className="text-lg text-muted-foreground mt-1">{lesson.reference}</p>
        <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(lesson.createdAt)}</span>
        </div>
      </div>

      {parsedContent != null && <RenderContent sequence={lesson.sequence} data={parsedContent} />}
    </div>
  );
}
