import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Save, RefreshCw, ChevronDown, ChevronUp, BookOpen, Users, Layers, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateLesson, getListLessonsQueryKey, getGetLessonsStatsQueryKey } from "@workspace/api-client-react";

const formSchema = z.object({
  titre: z.string().min(2, "Le titre est requis"),
  reference: z.string().min(2, "La référence biblique est requise"),
  trancheAge: z.enum(["petits", "moyens", "grands"]),
  sequence: z.enum(["1", "2", "3", "4"]),
  contexteLecon: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

const SEQUENCES = [
  { value: "1", label: "Séquence 1", sub: "Installation des ressources", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  { value: "2", label: "Séquence 2", sub: "Évaluation & intégration", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { value: "3", label: "Séquence 3", sub: "Vérification des intégrations", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { value: "4", label: "Séquence 4", sub: "Remédiation", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
];
const AGE_GROUPS = [
  { value: "petits", label: "Petits", sub: "Maternelle – CE1", icon: "👶" },
  { value: "moyens", label: "Moyens", sub: "CE2 – CM1", icon: "🧒" },
  { value: "grands", label: "Grands", sub: "CM2 et plus", icon: "👦" },
];

type D = Record<string, unknown>;
function str(v: unknown): string { return typeof v === "string" ? v : String(v ?? ""); }
function arr<T>(v: unknown): T[] { return Array.isArray(v) ? (v as T[]) : []; }
function obj(v: unknown): D { return (v != null && typeof v === "object" && !Array.isArray(v)) ? (v as D) : {}; }
function has(v: unknown): boolean { return v != null && v !== "" && !(Array.isArray(v) && v.length === 0); }

function SectionCard({
  title, children, defaultOpen = true, accent, icon
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; accent?: string; icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          {accent && <div className="w-1 h-5 rounded-full shrink-0" style={{ background: accent }} />}
          {icon && <span className="text-base">{icon}</span>}
          <span className="font-semibold text-foreground text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{text}</p>;
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/60 rounded-lg p-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-foreground text-sm mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function PriereBlock({ data, accent }: { data: D; accent: string }) {
  if (!has(data.priere)) return null;
  const p = obj(data.priere);
  return (
    <SectionCard title="Prière" accent={accent} icon="🙏" defaultOpen={true}>
      {has(p.ouverture) && (
        <div>
          <Label text="Prière d'ouverture" />
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 italic text-sm text-foreground leading-relaxed">{str(p.ouverture)}</div>
        </div>
      )}
      {has(p.intercession) && (
        <div>
          <Label text="Point d'intercession" />
          <p className="text-sm text-foreground">{str(p.intercession)}</p>
        </div>
      )}
    </SectionCard>
  );
}

function ElaborationBlock({ data, accent }: { data: D; accent: string }) {
  if (!has(data.elaboration)) return null;
  const elab = obj(data.elaboration);
  const etapes = arr<{ phase: string; duree: string; description: string }>(elab.etapes);
  return (
    <SectionCard title="Déroulé complet de la séance" accent={accent} icon="📋" defaultOpen={false}>
      {has(elab.dureeTotal) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-semibold text-foreground">Durée totale :</span> {str(elab.dureeTotal)}
        </div>
      )}
      <div className="space-y-2">
        {etapes.map((e, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors">
            <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ background: accent }}>{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-foreground text-xs">{e.phase}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{e.duree}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{e.description}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ConseilsBlock({ data, accent }: { data: D; accent: string }) {
  const conseils = arr<string>(data.conseilsMoniteur);
  if (conseils.length === 0) return null;
  return (
    <SectionCard title="Conseils pour le moniteur" accent={accent} icon="💡" defaultOpen={true}>
      <div className="space-y-2">
        {conseils.map((c, i) => (
          <div key={i} className="flex gap-2.5 p-3 rounded-lg border border-amber-100 bg-amber-50/60">
            <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
            <p className="text-sm text-foreground leading-relaxed">{c}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function Section1({ data }: { data: D }) {
  const blue = "#3b82f6";
  const sdv = obj(data.situationDeVie);
  const et = obj(data.exploitationTexte);
  const lr = obj(data.lectureTexte);
  const ac = obj(data.activiteCreative);
  const elab = obj(data.elaboration);
  const etQs = arr<{ question: string; reponseAttendue: string; verset?: string }>(et.questions);
  const sdvQs = arr<string>(sdv.questions);
  const objSpecs = arr<string>(data.objectifsSpecifiques);
  const materiels = arr<string>(data.materielNecessaire);
  const chants = arr<{ titre: string; lien: string; paroles: string }>(data.chantsDeLouange);
  const motsCles = arr<{ mot: string; definition: string }>(lr.motsCles);

  return (
    <div className="space-y-3">
      {/* Objectifs */}
      {objSpecs.length > 0 && (
        <SectionCard title="Objectifs spécifiques" accent={blue} icon="🎯" defaultOpen={true}>
          <div className="space-y-1.5">
            {objSpecs.map((o, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{o}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Compétence */}
      {has(data.competence) && (
        <SectionCard title="Compétence à développer" accent={blue} icon="⚡">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-foreground leading-relaxed text-sm font-medium">{str(data.competence)}</p>
          </div>
        </SectionCard>
      )}

      {/* Matériel */}
      {materiels.length > 0 && (
        <SectionCard title="Matériel nécessaire" accent={blue} icon="🎒" defaultOpen={true}>
          <div className="flex flex-wrap gap-2">
            {materiels.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                ✓ {m}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Prière */}
      <PriereBlock data={data} accent={blue} />

      {/* Chants */}
      {chants.length > 0 && (
        <SectionCard title="Chants de louange" accent={blue} icon="🎵" defaultOpen={true}>
          <div className="space-y-3">
            {chants.map((c, i) => (
              <div key={i} className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-base">🎵</span>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{c.titre}</p>
                    <p className="text-xs text-muted-foreground italic">{c.lien}</p>
                  </div>
                </div>
                {has(c.paroles) && (
                  <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                    <p className="text-sm text-foreground whitespace-pre-wrap italic leading-relaxed">{c.paroles}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Situation de vie */}
      {has(data.situationDeVie) && (
        <SectionCard title="Situation de vie" accent={blue} icon="🌍" defaultOpen={true}>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-3">
            <p className="text-foreground leading-relaxed italic text-sm">{str(sdv.histoire)}</p>
          </div>
          {sdvQs.length > 0 && (
            <div>
              <Label text="Questions pour les enfants" />
              <div className="space-y-1.5">
                {sdvQs.map((q, i) => (
                  <div key={i} className="flex gap-2 text-sm text-foreground py-1.5 border-b border-border last:border-0">
                    <span className="text-blue-500 font-bold shrink-0">→</span> {q}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {has(sdv.contexte) && <Chip label="Contexte" value={str(sdv.contexte)} />}
            {has(sdv.cible) && <Chip label="Cible" value={str(sdv.cible)} />}
            {has(sdv.paradoxe) && <Chip label="Paradoxe" value={str(sdv.paradoxe)} />}
            {has(sdv.tache) && <Chip label="Tâche" value={str(sdv.tache)} />}
          </div>
        </SectionCard>
      )}

      {/* Lecture du texte */}
      {has(data.lectureTexte) && (
        <SectionCard title="Lecture du texte biblique" accent={blue} icon="📖" defaultOpen={true}>
          {has(lr.strategie) && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-2">
              <Label text="Stratégie de lecture" />
              <p className="text-sm text-foreground">{str(lr.strategie)}</p>
            </div>
          )}
          {motsCles.length > 0 && (
            <div>
              <Label text="Mots clés à expliquer" />
              <div className="space-y-2">
                {motsCles.map((m, i) => (
                  <div key={i} className="flex gap-3 items-start p-2.5 rounded-lg border border-border">
                    <span className="font-bold text-blue-600 text-sm shrink-0 min-w-[80px]">{m.mot}</span>
                    <span className="text-muted-foreground text-sm">{m.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Exploitation du texte */}
      {etQs.length > 0 && (
        <SectionCard title="Exploitation du texte" accent={blue} icon="❓" defaultOpen={true}>
          <div className="space-y-2">
            {etQs.map((q, i) => (
              <div key={i} className="border border-border rounded-lg p-3.5 hover:bg-muted/30 transition-colors">
                <p className="font-semibold text-foreground text-sm mb-1">Q{i + 1} : {q.question}</p>
                <p className="text-xs text-muted-foreground pl-3 border-l-2 border-blue-200 leading-relaxed">→ {q.reponseAttendue}</p>
                {q.verset && <p className="text-xs text-blue-500 mt-1.5 font-medium">📖 {q.verset}</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Retenons */}
      {has(data.retenons) && (
        <SectionCard title="Retenons" accent={blue} icon="⭐">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
            <p className="text-foreground font-bold text-base leading-relaxed">"{str(data.retenons)}"</p>
          </div>
        </SectionCard>
      )}

      {/* Message Central */}
      {has(data.messageCentral) && (
        <SectionCard title="Message Central" accent={blue} icon="✝️">
          <div className="bg-primary/5 border-l-4 rounded-r-xl p-4" style={{ borderColor: blue }}>
            <p className="text-foreground italic leading-relaxed text-sm">{str(data.messageCentral)}</p>
          </div>
        </SectionCard>
      )}

      {/* Activité créative */}
      {has(data.activiteCreative) && (
        <SectionCard title="Activité créative" accent={blue} icon="🎨" defaultOpen={true}>
          <div className="flex flex-wrap gap-3 mb-3">
            {has(ac.type) && <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">{str(ac.type)}</span>}
            {has(ac.duree) && <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground">⏱ {str(ac.duree)}</span>}
          </div>
          {has(ac.description) && <p className="text-sm text-foreground leading-relaxed">{str(ac.description)}</p>}
          {arr<string>(ac.materiel).length > 0 && (
            <div className="mt-2">
              <Label text="Matériel" />
              <div className="flex flex-wrap gap-1.5">
                {arr<string>(ac.materiel).map((m, i) => <span key={i} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">• {m}</span>)}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Déroulé */}
      <ElaborationBlock data={data} accent={blue} />

      {/* Conseils */}
      <ConseilsBlock data={data} accent={blue} />
    </div>
  );
}

function Section2({ data }: { data: D }) {
  const green = "#16a34a";
  const ev = obj(data.evaluationSommative);
  const ai = obj(data.activiteIntegration);
  const lf = obj(data.liaisonFamiliale);
  const rappel = obj(data.rappelSequence1);
  const evQs = arr<{ question: string; reponseAttendue: string; pointsAttention?: string }>(ev.questionsHistoire);
  const aiQs = arr<{ question: string; guidanceReponse: string }>(ai.questions);
  const aiSp = obj(ai.situationProbleme);
  const qmc = obj(ev.questionMessageCentral);
  const lfDisc = arr<string>(lf.discussionEnFamille);

  return (
    <div className="space-y-3">
      {/* Prière */}
      <PriereBlock data={data} accent={green} />

      {/* Rappel Séquence 1 */}
      {has(data.rappelSequence1) && (
        <SectionCard title="Rappel de la Séquence 1" accent={green} icon="🔄" defaultOpen={true}>
          {has(rappel.resumeBref) && <p className="text-sm text-foreground leading-relaxed">{str(rappel.resumeBref)}</p>}
          {has(rappel.questionRevision) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
              <Label text="Question de révision rapide" />
              <p className="text-sm text-foreground font-medium">{str(rappel.questionRevision)}</p>
            </div>
          )}
          {has(rappel.chantRappel) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>🎵</span> Chant : <span className="text-foreground font-medium">{str(rappel.chantRappel)}</span>
            </div>
          )}
        </SectionCard>
      )}

      {/* Évaluation sommative */}
      {has(data.evaluationSommative) && (
        <SectionCard title="Évaluation sommative" accent={green} icon="📝" defaultOpen={true}>
          {has(ev.consigneMoniteur) && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3 text-sm text-foreground italic">
              💬 {str(ev.consigneMoniteur)}
            </div>
          )}
          <div className="space-y-2">
            {evQs.map((q, i) => (
              <div key={i} className="border border-border rounded-lg p-3.5 hover:bg-muted/30 transition-colors">
                <p className="font-semibold text-foreground text-sm mb-1">Q{i + 1} : {q.question}</p>
                <p className="text-xs text-muted-foreground pl-3 border-l-2 border-green-200 leading-relaxed">→ {q.reponseAttendue}</p>
                {q.pointsAttention && <p className="text-xs text-amber-600 mt-1.5 flex gap-1.5"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{q.pointsAttention}</p>}
              </div>
            ))}
            {has(qmc.question) && (
              <div className="border border-green-200 rounded-lg p-3.5 bg-green-50">
                <p className="text-xs font-bold text-green-700 mb-1">✝ MESSAGE CENTRAL</p>
                <p className="font-semibold text-foreground text-sm mb-1">{str(qmc.question)}</p>
                {has(qmc.reponseAttendue) && <p className="text-xs text-muted-foreground pl-3 border-l-2 border-green-300">→ {str(qmc.reponseAttendue)}</p>}
                {has(qmc.pointsAttention) && <p className="text-xs text-amber-600 mt-1.5 flex gap-1.5"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{str(qmc.pointsAttention)}</p>}
              </div>
            )}
            {has(ev.questionApplication) && (
              <div className="border border-green-200 rounded-lg p-3.5 bg-green-50/50">
                <p className="text-xs font-bold text-green-700 mb-1">🌱 APPLICATION</p>
                <p className="text-foreground text-sm">{str(ev.questionApplication)}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Activité d'intégration */}
      {has(data.activiteIntegration) && (
        <SectionCard title="Activité d'intégration" accent={green} icon="🧩" defaultOpen={true}>
          {has(ai.consigneMoniteur) && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3 text-sm text-foreground italic">
              💬 {str(ai.consigneMoniteur)}
            </div>
          )}
          {has(ai.situationProbleme) && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-3">
              <p className="text-foreground italic leading-relaxed text-sm">{str(aiSp.histoire)}</p>
              {has(aiSp.tache) && <p className="text-xs text-muted-foreground mt-2 font-medium">📌 Tâche : {str(aiSp.tache)}</p>}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {has(aiSp.contexte) && <Chip label="Contexte" value={str(aiSp.contexte)} />}
                {has(aiSp.cible) && <Chip label="Cible" value={str(aiSp.cible)} />}
                {has(aiSp.paradoxe) && <Chip label="Paradoxe" value={str(aiSp.paradoxe)} />}
              </div>
            </div>
          )}
          <div className="space-y-2">
            {aiQs.map((q, i) => (
              <div key={i} className="border border-border rounded-lg p-3.5">
                <p className="font-semibold text-foreground text-sm mb-1">Q{i + 1} : {q.question}</p>
                <p className="text-xs text-muted-foreground pl-3 border-l-2 border-green-200 leading-relaxed">→ {q.guidanceReponse}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Liaison familiale */}
      {has(data.liaisonFamiliale) && (
        <SectionCard title="Liaison familiale" accent={green} icon="🏠" defaultOpen={true}>
          <div className="space-y-3">
            {has(lf.resumeRecit) && (
              <div>
                <Label text="Résumé du récit pour les parents" />
                <p className="text-foreground text-sm leading-relaxed">{str(lf.resumeRecit)}</p>
              </div>
            )}
            {has(lf.messageCentralEtCompetence) && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <Label text="Message central et compétence" />
                <p className="text-foreground text-sm">{str(lf.messageCentralEtCompetence)}</p>
              </div>
            )}
            {lfDisc.length > 0 && (
              <div>
                <Label text="Discussion en famille" />
                <div className="space-y-1.5">
                  {lfDisc.map((d, i) => (
                    <div key={i} className="flex gap-2 text-sm text-foreground">
                      <span className="text-green-500 shrink-0">•</span> {d}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {has(lf.versetAMediter) && (
              <div className="bg-primary/5 border-l-4 rounded-r-xl p-3" style={{ borderColor: green }}>
                <Label text="Verset à méditer en famille" />
                <p className="text-foreground text-sm italic">{str(lf.versetAMediter)}</p>
              </div>
            )}
            {has(lf.messageParents) && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Label text="Message aux parents" />
                <p className="text-foreground text-sm italic">{str(lf.messageParents)}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Déroulé */}
      <ElaborationBlock data={data} accent={green} />

      {/* Conseils */}
      <ConseilsBlock data={data} accent={green} />
    </div>
  );
}

function Section3({ data }: { data: D }) {
  const amber = "#d97706";
  const pm = obj(data.partageMoniteur);
  const vi = obj(data.verificationIntegrations);
  const rt = obj(data.recueilTemoignages);
  const lfv = obj(data.liaisonFamilialeVerification);
  const viQs = arr<{ question: string; reponseAttendue: string; critere?: string }>(vi.corrigeIntegration);
  const criteresEval = arr<string>(vi.criteresEvaluation);
  const pts = arr<string>(data.pointsAttention);
  const lfvQs = arr<string>(lfv.questionsVerification);
  const rtQs = arr<string>(rt.questions);
  const pmEx = arr<string>(pm.exemples);
  const pmDiff = arr<string>(pm.difficultes);

  return (
    <div className="space-y-3">
      {/* Prière */}
      <PriereBlock data={data} accent={amber} />

      {/* Partage du moniteur */}
      {has(data.partageMoniteur) && (
        <SectionCard title="Partage du moniteur (en premier !)" accent={amber} icon="🗣️" defaultOpen={true}>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
            <p className="text-xs font-bold text-amber-700 mb-2">⚠️ LE MONITEUR PARTAGE EN PREMIER — avant d'inviter les enfants</p>
            {has(pm.description) && <p className="text-foreground text-sm leading-relaxed">{str(pm.description)}</p>}
          </div>
          {pmEx.length > 0 && (
            <div>
              <Label text="Exemples de mise en pratique" />
              <div className="space-y-2">
                {pmEx.map((e, i) => (
                  <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                    <span className="text-amber-600 shrink-0">✓</span>
                    <p className="text-sm text-foreground">{e}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {pmDiff.length > 0 && (
            <div>
              <Label text="Difficultés à partager honnêtement" />
              <div className="space-y-1.5">
                {pmDiff.map((d, i) => (
                  <div key={i} className="flex gap-2 text-sm text-foreground p-2 rounded bg-white border border-amber-100">
                    <span className="text-amber-400 shrink-0">~</span> {d}
                  </div>
                ))}
              </div>
            </div>
          )}
          {has(pm.consigne) && (
            <div className="mt-2 bg-amber-100 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium italic">{str(pm.consigne)}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Recueil de témoignages */}
      {has(data.recueilTemoignages) && (
        <SectionCard title="Recueil des témoignages des enfants" accent={amber} icon="👂" defaultOpen={true}>
          {rtQs.length > 0 && (
            <div className="space-y-2">
              {rtQs.map((q, i) => (
                <div key={i} className="flex gap-2 text-sm text-foreground py-1.5 border-b border-border last:border-0">
                  <span className="text-amber-500 font-bold shrink-0">→</span> {q}
                </div>
              ))}
            </div>
          )}
          {has(rt.gestionParole) && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-2">
              <Label text="Gestion de la prise de parole" />
              <p className="text-sm text-foreground">{str(rt.gestionParole)}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Corrigé de l'intégration */}
      {viQs.length > 0 && (
        <SectionCard title="Corrigé de l'activité d'intégration" accent={amber} icon="✅" defaultOpen={true}>
          {has(vi.consigneMoniteur) && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3 text-sm text-foreground italic">
              💬 {str(vi.consigneMoniteur)}
            </div>
          )}
          <div className="space-y-2">
            {viQs.map((q, i) => (
              <div key={i} className="border border-border rounded-lg p-3.5">
                <p className="font-semibold text-foreground text-sm mb-1">Q{i + 1} : {q.question}</p>
                <p className="text-xs text-muted-foreground pl-3 border-l-2 border-amber-200 leading-relaxed">→ {q.reponseAttendue}</p>
                {q.critere && (
                  <p className="text-xs text-amber-700 mt-1.5 flex gap-1.5 items-start">
                    <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /> Critère : {q.critere}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Critères d'évaluation */}
      {criteresEval.length > 0 && (
        <SectionCard title="Critères d'évaluation" accent={amber} icon="📊" defaultOpen={true}>
          <div className="space-y-2">
            {criteresEval.map((c, i) => (
              <div key={i} className="flex gap-2.5 p-3 rounded-lg bg-green-50 border border-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{c}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Liaison familiale — vérification */}
      {has(data.liaisonFamilialeVerification) && (
        <SectionCard title="Vérification de la liaison familiale" accent={amber} icon="🏠" defaultOpen={true}>
          {lfvQs.length > 0 && (
            <div className="space-y-2 mb-3">
              {lfvQs.map((q, i) => (
                <div key={i} className="flex gap-2 text-sm text-foreground py-1.5 border-b border-border last:border-0">
                  <span className="text-amber-500 font-bold shrink-0">?</span> {q}
                </div>
              ))}
            </div>
          )}
          {has(lfv.activitePratique) && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <Label text="Nouvelle activité pratique à la maison" />
              <p className="text-sm text-foreground">{str(lfv.activitePratique)}</p>
            </div>
          )}
          {has(lfv.messageEncouragement) && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2">
              <p className="text-sm text-foreground italic">{str(lfv.messageEncouragement)}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Points d'attention */}
      {pts.length > 0 && (
        <SectionCard title="Points d'attention" accent={amber} icon="⚠️" defaultOpen={true}>
          <div className="space-y-2">
            {pts.map((p, i) => (
              <div key={i} className="flex gap-2.5 items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{p}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Déroulé */}
      <ElaborationBlock data={data} accent={amber} />

      {/* Conseils */}
      <ConseilsBlock data={data} accent={amber} />
    </div>
  );
}

function Section4({ data }: { data: D }) {
  const red = "#dc2626";
  const diffs = arr<{ difficulte: string; cause: string; solutionRemediation: string; exempleActivite?: string }>(data.difficultesCourantes);
  const meths = arr<{ methode: string; description: string; pourQui?: string; materielNecessaire: string[] }>(data.methodesRemediation);
  const rl = obj(data.recapitulatifLecon);
  const diag = obj(data.diagnosticDifficultés);
  const diagSigns = arr<string>(diag.signesAlerte);
  const pointsCles = arr<string>(rl.pointsCles);
  const ac = obj(data.activiteConsolidation);
  const celeb = obj(data.celebrationDesProgres);
  const celebIdees = arr<string>(celeb.ideesCelebration);

  return (
    <div className="space-y-3">
      {/* Prière */}
      <PriereBlock data={data} accent={red} />

      {/* Diagnostic */}
      {has(data.diagnosticDifficultés) && (
        <SectionCard title="Diagnostic des difficultés" accent={red} icon="🔍" defaultOpen={true}>
          {has(diag.description) && <p className="text-sm text-foreground mb-2">{str(diag.description)}</p>}
          {diagSigns.length > 0 && (
            <div>
              <Label text="Signes d'alerte à observer" />
              <div className="space-y-1.5">
                {diagSigns.map((s, i) => (
                  <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Difficultés et remédiations */}
      {diffs.length > 0 && (
        <SectionCard title="Difficultés et remédiations" accent={red} icon="🛠️" defaultOpen={true}>
          <div className="space-y-4">
            {diffs.map((d, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-2">
                <p className="font-bold text-foreground text-sm">Difficulté {i + 1} : {d.difficulte}</p>
                <div className="flex gap-2 items-start">
                  <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">Cause : {d.cause}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">✅ SOLUTION</p>
                  <p className="text-sm text-green-800">{d.solutionRemediation}</p>
                </div>
                {d.exempleActivite && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs font-bold text-blue-700 mb-1">🎯 Activité de remédiation</p>
                    <p className="text-sm text-blue-800">{d.exempleActivite}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Méthodes de remédiation */}
      {meths.length > 0 && (
        <SectionCard title="Méthodes de remédiation" accent={red} icon="📚" defaultOpen={true}>
          <div className="space-y-3">
            {meths.map((m, i) => (
              <div key={i} className="border border-border rounded-xl p-4">
                <p className="font-bold text-foreground text-sm mb-1">{m.methode}</p>
                {m.pourQui && <p className="text-xs text-blue-600 mb-2">👥 Pour qui : {m.pourQui}</p>}
                <p className="text-sm text-muted-foreground mb-2">{m.description}</p>
                {m.materielNecessaire?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.materielNecessaire.map((mat, j) => (
                      <span key={j} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">• {mat}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Activité de consolidation */}
      {has(data.activiteConsolidation) && (
        <SectionCard title="Activité de consolidation" accent={red} icon="🎯" defaultOpen={true}>
          {has(ac.titre) && <p className="font-bold text-foreground text-sm mb-2">{str(ac.titre)}</p>}
          {has(ac.description) && <p className="text-sm text-foreground mb-2">{str(ac.description)}</p>}
          {has(ac.deroulement) && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <Label text="Déroulé" />
              <p className="text-sm text-foreground whitespace-pre-wrap">{str(ac.deroulement)}</p>
            </div>
          )}
          {has(ac.duree) && <p className="text-xs text-muted-foreground mt-1">⏱ Durée : {str(ac.duree)}</p>}
        </SectionCard>
      )}

      {/* Récapitulatif */}
      {has(data.recapitulatifLecon) && (
        <SectionCard title="Récapitulatif de la leçon (4 séquences)" accent={red} icon="📋" defaultOpen={true}>
          {has(rl.messageCentral) && (
            <div className="bg-primary/5 border-l-4 border-primary/30 rounded-r-xl p-4 mb-3">
              <Label text="Message central" />
              <p className="italic text-foreground text-sm">{str(rl.messageCentral)}</p>
            </div>
          )}
          {has(rl.competenceVisee) && (
            <div className="mb-3">
              <Label text="Compétence visée" />
              <p className="text-foreground text-sm font-medium">{str(rl.competenceVisee)}</p>
            </div>
          )}
          {pointsCles.length > 0 && (
            <div className="mb-3">
              <Label text="Points clés à retenir" />
              <div className="space-y-1.5">
                {pointsCles.map((p, i) => (
                  <div key={i} className="flex gap-2.5 items-start p-2.5 rounded-lg bg-muted/40">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <p className="text-sm text-foreground">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {has(rl.versetsMemorise) && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <Label text="Versets à avoir mémorisé" />
              <p className="text-sm text-foreground italic">{str(rl.versetsMemorise)}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Célébration des progrès */}
      {has(data.celebrationDesProgres) && (
        <SectionCard title="Célébration des progrès" accent={red} icon="🎉" defaultOpen={true}>
          {has(celeb.description) && <p className="text-sm text-foreground mb-2">{str(celeb.description)}</p>}
          {celebIdees.length > 0 && (
            <div className="space-y-2">
              {celebIdees.map((id, i) => (
                <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="text-amber-500">🎉</span>
                  <p className="text-sm text-foreground">{id}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Déroulé */}
      <ElaborationBlock data={data} accent={red} />

      {/* Encouragements */}
      {has(data.encouragements) && (
        <div className="rounded-xl p-6 text-center" style={{ background: "linear-gradient(135deg, hsl(220 55% 30% / 0.06) 0%, hsl(43 88% 52% / 0.08) 100%)", border: "1px solid hsl(220 55% 30% / 0.15)" }}>
          <p className="text-2xl mb-3">🙌</p>
          <p className="text-foreground italic leading-relaxed text-sm">{str(data.encouragements)}</p>
        </div>
      )}

      {/* Conseils */}
      <ConseilsBlock data={data} accent={red} />
    </div>
  );
}

function renderContent(sequence: number, data: D) {
  if (sequence === 1) return <Section1 data={data} />;
  if (sequence === 2) return <Section2 data={data} />;
  if (sequence === 3) return <Section3 data={data} />;
  if (sequence === 4) return <Section4 data={data} />;
  return null;
}

export default function GeneratorPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [parsedData, setParsedData] = useState<D | null>(null);
  const [generationError, setGenerationError] = useState("");
  const [lastForm, setLastForm] = useState<FormValues | null>(null);
  const createLesson = useCreateLesson();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { titre: "", reference: "", trancheAge: "moyens", sequence: "1", contexteLecon: "" },
  });

  const watchSeq = form.watch("sequence");
  const watchAge = form.watch("trancheAge");
  const currentSeq = SEQUENCES.find(s => s.value === watchSeq)!;

  async function onSubmit(values: FormValues) {
    setGenerating(true);
    setParsedData(null);
    setGenerationError("");
    setLastForm(values);
    try {
      const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const response = await fetch(`${BASE}/api/lessons/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: values.titre,
          reference: values.reference,
          trancheAge: values.trancheAge,
          sequence: parseInt(values.sequence),
          contexteLecon: values.contexteLecon || undefined,
        }),
      });
      if (!response.body) throw new Error("Pas de réponse");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.content) {
                accumulated += evt.content;
                try { setParsedData(JSON.parse(accumulated)); } catch {}
              }
              if (evt.done) {
                setGenerating(false);
                try { setParsedData(JSON.parse(accumulated)); }
                catch { setGenerationError("Réponse invalide. Réessayez."); }
              }
              if (evt.error) { setGenerationError(evt.error); setGenerating(false); }
            } catch {}
          }
        }
      }
    } catch {
      setGenerationError("Erreur de connexion. Veuillez réessayer.");
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!parsedData || !lastForm) return;
    try {
      const lesson = await createLesson.mutateAsync({
        data: {
          titre: lastForm.titre,
          reference: lastForm.reference,
          trancheAge: lastForm.trancheAge,
          sequence: parseInt(lastForm.sequence),
          contenu: JSON.stringify(parsedData),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetLessonsStatsQueryKey() });
      toast({ title: "Leçon sauvegardée !", description: "Retrouvez-la dans Mes Leçons." });
      setLocation(`/lecon/${lesson.id}`);
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-7 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, hsl(220 55% 28%) 0%, hsl(220 55% 20%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 20% 80%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5" style={{ color: "hsl(43 88% 65%)" }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(43 88% 65%)" }}>
                IA — Approche par Compétence EEC
              </p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-1">Préparer une leçon</h1>
            <p className="text-white/65 text-sm">
              Renseignez les informations ci-dessous. L'IA génère votre fiche de préparation complète, riche et prête à l'emploi.
            </p>
          </div>
          <img src="/logo.jpg" alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shadow-lg hidden md:block" />
        </div>
      </div>

      {/* Form card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

        {/* Séquence picker */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(220 55% 30% / 0.1)" }}>
              <Layers className="h-4 w-4" style={{ color: "hsl(220 55% 30%)" }} />
            </div>
            <p className="font-semibold text-foreground text-sm">Choisir la séquence</p>
          </div>
          <Form {...form}>
            <FormField control={form.control} name="sequence" render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SEQUENCES.map(seq => (
                  <button
                    key={seq.value}
                    type="button"
                    onClick={() => field.onChange(seq.value)}
                    className="rounded-xl p-3 border-2 text-left transition-all cursor-pointer"
                    style={
                      field.value === seq.value
                        ? { background: seq.bg, borderColor: seq.color, boxShadow: `0 0 0 1px ${seq.color}` }
                        : { background: "transparent", borderColor: "hsl(var(--border))" }
                    }
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mb-2" style={{ background: seq.color }}>{seq.value}</div>
                    <p className="font-semibold text-xs text-foreground leading-tight">{seq.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{seq.sub}</p>
                  </button>
                ))}
              </div>
            )} />
          </Form>
        </div>

        {/* Age group picker */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(220 55% 30% / 0.1)" }}>
              <Users className="h-4 w-4" style={{ color: "hsl(220 55% 30%)" }} />
            </div>
            <p className="font-semibold text-foreground text-sm">Tranche d'âge</p>
          </div>
          <Form {...form}>
            <FormField control={form.control} name="trancheAge" render={({ field }) => (
              <div className="grid grid-cols-3 gap-3">
                {AGE_GROUPS.map(ag => (
                  <button
                    key={ag.value}
                    type="button"
                    onClick={() => field.onChange(ag.value)}
                    className="rounded-xl p-4 border-2 text-center transition-all cursor-pointer"
                    style={
                      field.value === ag.value
                        ? { background: "hsl(220 55% 30% / 0.08)", borderColor: "hsl(220 55% 30%)", boxShadow: "0 0 0 1px hsl(220 55% 30%)" }
                        : { background: "transparent", borderColor: "hsl(var(--border))" }
                    }
                  >
                    <p className="text-2xl mb-1">{ag.icon}</p>
                    <p className="font-semibold text-sm text-foreground">{ag.label}</p>
                    <p className="text-xs text-muted-foreground">{ag.sub}</p>
                  </button>
                ))}
              </div>
            )} />
          </Form>
        </div>

        {/* Lesson info */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(220 55% 30% / 0.1)" }}>
              <BookOpen className="h-4 w-4" style={{ color: "hsl(220 55% 30%)" }} />
            </div>
            <p className="font-semibold text-foreground text-sm">Informations de la leçon</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="titre" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Titre de la leçon</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: La foi d'Abraham" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reference" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Référence biblique</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Genèse 22:1-18" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="contexteLecon" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Contexte supplémentaire <span className="text-muted-foreground font-normal">(optionnel)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes particulières, contexte local, thème du mois, difficulté spécifique à adresser..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                  style={{ background: generating ? "hsl(220 55% 38%)" : "hsl(220 55% 28%)" }}
                >
                  {generating
                    ? <><RefreshCw className="h-4 w-4 animate-spin" />Génération en cours…</>
                    : <><Sparkles className="h-4 w-4" />Générer avec l'IA</>
                  }
                </button>
                {parsedData != null && !generating && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Préparation prête — pensez à sauvegarder
                  </div>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Result */}
      {(generating || parsedData) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">Préparation générée</h2>
              {lastForm && (
                <>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
                    style={{ background: currentSeq.bg, borderColor: currentSeq.border, color: currentSeq.color }}>
                    {currentSeq.label}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{watchAge}</span>
                </>
              )}
            </div>
            {parsedData != null && !generating && (
              <button
                onClick={handleSave}
                disabled={createLesson.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 shadow-sm hover:shadow-md active:scale-95"
                style={{ background: "hsl(220 55% 28%)" }}
              >
                <Save className="h-4 w-4" />
                {createLesson.isPending ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            )}
          </div>

          {generationError !== "" && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive text-sm flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {generationError}
            </div>
          )}

          {generating && parsedData == null && (
            <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center gap-4 text-muted-foreground">
              <RefreshCw className="h-9 w-9 animate-spin" style={{ color: "hsl(220 55% 30%)" }} />
              <div className="text-center">
                <p className="font-semibold text-foreground text-base">L'IA prépare votre fiche complète…</p>
                <p className="text-xs mt-1.5">Cela peut prendre 20 à 40 secondes — la leçon sera très détaillée !</p>
              </div>
            </div>
          )}

          {parsedData != null && lastForm != null && renderContent(parseInt(lastForm.sequence), parsedData)}
        </div>
      )}
    </div>
  );
}
