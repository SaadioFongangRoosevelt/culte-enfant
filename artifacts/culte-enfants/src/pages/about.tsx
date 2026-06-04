import { GraduationCap, Lightbulb, Heart, BookOpen, Target, Cpu } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-10 max-w-3xl">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{ background: "linear-gradient(135deg, hsl(220 55% 28%) 0%, hsl(220 55% 18%) 100%)" }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4 w-40 h-40 rounded-full border-4 border-white" />
          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border-2 border-white" />
        </div>
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden shadow-xl border-4 border-white/30">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "hsl(43 88% 65%)" }}>
              Avant-propos
            </p>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
              APC Assist — Culte d'Enfants EEC
            </h1>
            <p className="text-white/70 text-sm italic leading-relaxed">
              "Laissez venir à moi les petits enfants, et ne les en empêchez pas."
              <span className="not-italic font-semibold text-white/90 ml-2">— Marc 10:14</span>
            </p>
          </div>
        </div>
      </div>

      {/* Avant-propos */}
      <div className="bg-card border border-border rounded-2xl p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(220 55% 30% / 0.1)" }}>
            <BookOpen className="h-5 w-5" style={{ color: "hsl(220 55% 30%)" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Pourquoi cette application ?</h2>
        </div>

        <div className="space-y-4 text-foreground leading-relaxed">
          <p>
            Tout a commencé dans les salles de cours de la{" "}
            <span className="font-semibold" style={{ color: "hsl(220 55% 30%)" }}>
              Faculté d'Informatique de Polytech Maroua
            </span>
            , au sein du Département Informatique, Réseaux et Télécommunications
            (IRT), où j'ai appris que la technologie est un levier puissant de
            transformation — pas uniquement économique, mais aussi sociale,
            culturelle et spirituelle.
          </p>

          <p>
            En parallèle de mes études, j'ai observé une réalité concrète au
            sein de l'
            <span className="font-semibold">Église Évangélique du Cameroun (EEC)</span>{" "}
            : les moniteurs du Culte d'Enfants — des bénévoles dévoués, souvent
            sans formation pédagogique formelle — consacrent des heures chaque
            semaine à préparer leurs leçons selon la méthodologie{" "}
            <span className="font-semibold" style={{ color: "hsl(220 55% 30%)" }}>
              APC (Approche par Compétence)
            </span>
            . Une approche exigeante, structurée en quatre séquences distinctes,
            qui demande une maîtrise technique et pédagogique réelle.
          </p>

          <p>
            Face à ce défi, une question s'est imposée à moi : et si
            l'intelligence artificielle pouvait servir la Parole de Dieu ?
            Et si quelques informations simples — un titre, une référence
            biblique, une tranche d'âge — pouvaient générer en quelques secondes
            une préparation complète, structurée et pédagogiquement adaptée ?
          </p>

          <p>
            C'est cette ambition qui a donné naissance à{" "}
            <span className="font-bold italic" style={{ color: "hsl(220 55% 30%)" }}>
              APC Assist
            </span>
            . Non pas pour remplacer le moniteur — car sa foi, son amour pour les
            enfants et sa relation personnelle avec Dieu sont irremplaçables —
            mais pour l'accompagner, l'équiper et lui faire gagner un temps
            précieux qu'il pourra réinvestir dans la prière, la relation avec les
            enfants et la méditation de la Parole.
          </p>

          <p className="italic text-muted-foreground border-l-4 pl-4 py-1" style={{ borderColor: "hsl(43 88% 52%)" }}>
            Ce projet est le fruit d'une conviction profonde : la technologie,
            quand elle est mise au service du bien commun et de la foi, devient
            un instrument de grâce.
          </p>
        </div>
      </div>

      {/* Étudiant card */}
      <div className="bg-card border border-border rounded-2xl p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(43 88% 52% / 0.12)" }}>
            <GraduationCap className="h-5 w-5" style={{ color: "hsl(43 70% 40%)" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Le développeur</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            icon={<GraduationCap className="h-4 w-4" />}
            label="Développeur"
            value="Caleb le Conquérant"
            color="blue"
          />
          <InfoCard
            icon={<Target className="h-4 w-4" />}
            label="Niveau"
            value="Niveau 3 (Licence)"
            color="blue"
          />
          <InfoCard
            icon={<GraduationCap className="h-4 w-4" />}
            label="Établissement"
            value="École Nationale Polytechnique de Maroua"
            color="blue"
          />
          <InfoCard
            icon={<Cpu className="h-4 w-4" />}
            label="Département"
            value="Informatique, Réseaux & Télécommunications (IRT)"
            color="gold"
          />
          <InfoCard
            icon={<Heart className="h-4 w-4" />}
            label="Mission"
            value="Équiper les moniteurs MCE de l'EEC avec l'IA"
            color="gold"
          />
        </div>
      </div>

      {/* Objectifs */}
      <div className="bg-card border border-border rounded-2xl p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(160 55% 38% / 0.1)" }}>
            <Lightbulb className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Ce que fait l'application</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Génère en quelques secondes une préparation APC complète",
            "Adapte le contenu à la tranche d'âge (Petits, Moyens, Grands)",
            "Couvre les 4 séquences de la méthode APC",
            "Sauvegarde toutes vos préparations en ligne",
            "Permet l'impression de la fiche de préparation",
            "Fonctionne 24h/24, disponible depuis n'importe quel appareil",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "hsl(220 25% 97%)" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "hsl(220 55% 30%)", color: "white" }}>
                <span className="text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slogan final */}
      <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, hsl(43 88% 52% / 0.12) 0%, hsl(220 55% 30% / 0.08) 100%)", border: "1px solid hsl(43 88% 52% / 0.3)" }}>
        <p className="text-2xl font-bold italic" style={{ color: "hsl(220 55% 28%)" }}>
          "De la Parole à l'enfant — en un clic."
        </p>
        <p className="text-sm text-muted-foreground mt-2">Slogan — APC Assist, Culte d'Enfants EEC</p>
      </div>

    </div>
  );
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: "blue" | "gold" }) {
  const bg = color === "blue" ? "hsl(220 55% 30% / 0.08)" : "hsl(43 88% 52% / 0.1)";
  const ic = color === "blue" ? "hsl(220 55% 30%)" : "hsl(43 70% 38%)";
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg, color: ic }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}
