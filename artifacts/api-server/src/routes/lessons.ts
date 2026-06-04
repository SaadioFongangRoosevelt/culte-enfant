import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { lessonsTable } from "@workspace/db";
import { desc, eq, count } from "drizzle-orm";
import {
  ListLessonsResponseItem,
  CreateLessonBody,
  GetLessonParams,
  DeleteLessonParams,
  GenerateLessonBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/lessons", async (req, res) => {
  const lessons = await db
    .select()
    .from(lessonsTable)
    .orderBy(desc(lessonsTable.createdAt));
  const parsed = lessons.map((l) =>
    ListLessonsResponseItem.parse({
      id: l.id,
      titre: l.titre,
      reference: l.reference,
      trancheAge: l.trancheAge,
      sequence: l.sequence,
      contenu: l.contenu,
      createdAt: l.createdAt.toISOString(),
    })
  );
  res.json(parsed);
});

router.get("/lessons/stats", async (req, res) => {
  const all = await db.select().from(lessonsTable).orderBy(desc(lessonsTable.createdAt));

  const parSequence = { sequence1: 0, sequence2: 0, sequence3: 0, sequence4: 0 };
  const parTranche = { petits: 0, moyens: 0, grands: 0 };

  for (const l of all) {
    const key = `sequence${l.sequence}` as keyof typeof parSequence;
    if (key in parSequence) parSequence[key]++;
    const ta = l.trancheAge as keyof typeof parTranche;
    if (ta in parTranche) parTranche[ta]++;
  }

  const recentes = all.slice(0, 5).map((l) => ({
    id: l.id,
    titre: l.titre,
    reference: l.reference,
    trancheAge: l.trancheAge,
    sequence: l.sequence,
    contenu: l.contenu,
    createdAt: l.createdAt.toISOString(),
  }));

  res.json({
    total: all.length,
    parSequence,
    parTranche,
    recentes,
  });
});

router.post("/lessons/generate", async (req, res) => {
  const body = GenerateLessonBody.parse(req.body);
  const { titre, reference, trancheAge, sequence, contexteLecon } = body;

  const trancheLabel =
    trancheAge === "petits"
      ? "petits (Maternelle à CE1, 4-8 ans)"
      : trancheAge === "moyens"
        ? "moyens (CE2 à CM1, 9-11 ans)"
        : "grands (CM2 et plus, 12 ans et plus)";

  const systemPrompt = `Tu es un expert senior en pédagogie chrétienne pour enfants, spécialisé dans l'Approche par Compétence (APC) de l'Église Évangélique du Cameroun (EEC).

Tu formes des moniteurs du Culte d'Enfants (MCE) avec plus de 15 ans d'expérience dans l'enseignement biblique auprès des enfants au Cameroun.

TON RÔLE : Générer des fiches de préparation de leçon COMPLÈTES, RICHES, PRATIQUES et IMMÉDIATEMENT UTILISABLES par un moniteur.

PRINCIPES PÉDAGOGIQUES APC FONDAMENTAUX :
- La leçon part toujours d'une SITUATION DE VIE réelle et locale (contexte camerounais ou africain)
- L'enfant construit lui-même ses connaissances par des QUESTIONS guidées (maïeutique)
- Chaque activité a un but précis : installer, découvrir, consolider, évaluer
- Le MESSAGE CENTRAL est la vérité spirituelle que l'enfant doit retenir et appliquer
- La COMPÉTENCE est ce que l'enfant sait FAIRE après la leçon (verbe d'action mesurable)
- Le PARADOXE crée la tension dramatique qui accroche l'attention des enfants
- La liaison familiale prolonge l'apprentissage à la maison

STYLE DE GÉNÉRATION :
- Langage adapté aux ${trancheLabel}
- Exemples concrets tirés du quotidien africain/camerounais (marché, école, famille, village)
- Activités créatives variées (dessin, chant, jeu de rôle, mime, bricolage)
- Ton chaleureux, encourageant pour le moniteur
- Contenu fidèle aux Écritures, théologiquement solide

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

  let userPrompt = "";

  if (sequence === 1) {
    userPrompt = `Prépare une fiche COMPLÈTE de SÉQUENCE 1 (Installation des ressources — Découverte du texte biblique) pour :
- Titre de la leçon : "${titre}"
- Référence biblique : ${reference}
- Tranche d'âge : ${trancheLabel}
- Durée totale : 45 à 60 minutes
${contexteLecon ? `- Contexte particulier : ${contexteLecon}` : ""}

Génère un JSON riche avec EXACTEMENT cette structure :

{
  "objectifsSpecifiques": [
    "À la fin de cette séquence, l'enfant sera capable de... (objectif 1)",
    "À la fin de cette séquence, l'enfant sera capable de... (objectif 2)",
    "À la fin de cette séquence, l'enfant sera capable de... (objectif 3)"
  ],
  "competence": "Compétence globale à développer (commence par un verbe d'action : identifier, expliquer, démontrer, appliquer...)",
  "materielNecessaire": [
    "Bible (version Louis Segond ou Semeur)",
    "Tableau/ardoise",
    "Matériel spécifique à la leçon 1",
    "Matériel spécifique à la leçon 2"
  ],
  "priere": {
    "ouverture": "Prière courte et adaptée aux enfants pour ouvrir la séance (3-5 phrases max, ton simple et sincère)",
    "intercession": "Point de prière spécifique en lien avec le message de la leçon"
  },
  "chantsDeLouange": [
    {
      "titre": "Titre du chant 1",
      "lien": "En lien avec le thème de la leçon",
      "paroles": "Premier couplet ou refrain principal"
    },
    {
      "titre": "Titre du chant 2",
      "lien": "En lien avec le thème",
      "paroles": "Premier couplet ou refrain"
    }
  ],
  "situationDeVie": {
    "contexte": "Lieu et époque de l'histoire d'accroche (quartier, marché, école, village...)",
    "cible": "Nom du personnage principal de l'histoire d'accroche et son profil",
    "paradoxe": "Le problème, le dilemme ou l'obstacle qui crée la tension dramatique",
    "tache": "La question posée aux enfants : 'Que ferait-on à la place de [personnage] ?'",
    "histoire": "Histoire d'accroche vivante et captivante (6-8 lignes), avec dialogue si possible, qui crée le BESOIN d'apprendre",
    "questions": [
      "Question 1 pour activer la réflexion des enfants (réponse ouverte)",
      "Question 2 pour stimuler l'empathie ou l'identification",
      "Question 3 pour faire le pont avec le texte biblique"
    ]
  },
  "lectureTexte": {
    "strategie": "Comment lire le texte (lecture dramatique, lecture alternée, lecture chuchotée...)",
    "motsCles": [
      {"mot": "Mot clé 1 du texte", "definition": "Définition simple pour les enfants"},
      {"mot": "Mot clé 2 du texte", "definition": "Définition simple"},
      {"mot": "Mot clé 3 du texte", "definition": "Définition simple"}
    ]
  },
  "exploitationTexte": {
    "questions": [
      {"question": "Question de compréhension littérale (Qui ? Quoi ? Où ?)", "reponseAttendue": "Réponse précise tirée du texte", "verset": "Verset de référence"},
      {"question": "Question d'analyse (Pourquoi ? Comment ?)", "reponseAttendue": "Réponse complète", "verset": "Verset de référence"},
      {"question": "Question d'application (Et toi ? Dans ta vie ?)", "reponseAttendue": "Réponse ouverte guidée", "verset": "Verset de référence"},
      {"question": "Question de synthèse (Qu'est-ce que Dieu nous enseigne ici ?)", "reponseAttendue": "Réponse spirituelle", "verset": "Verset de référence"},
      {"question": "Question de mémorisation (Verset clé)", "reponseAttendue": "Le verset à mémoriser", "verset": "Référence exacte du verset mémoire"}
    ]
  },
  "retenons": "Formule courte, percutante et mémorisable (15 mots max) résumant la leçon — peut rimer ou avoir un rythme",
  "messageCentral": "Pour l'édification de ma foi chrétienne, ce texte (${reference}) m'apprend que... [développement complet de 3-4 lignes, profond et inspirant]",
  "activiteCreative": {
    "type": "Dessin / Jeu de rôle / Mime / Bricolage / Chant / Quiz",
    "description": "Description détaillée de l'activité créative en lien direct avec le message",
    "duree": "X minutes",
    "materiel": ["Matériel 1", "Matériel 2"]
  },
  "elaboration": {
    "dureeTotal": "45-60 minutes",
    "etapes": [
      {"phase": "1. ACCUEIL ET MISE EN TRAIN", "duree": "5 min", "description": "Comment accueillir les enfants, créer l'ambiance, chant d'ouverture, prière"},
      {"phase": "2. SITUATION DE VIE (Mise en situation)", "duree": "8-10 min", "description": "Déroulé précis de l'histoire d'accroche, comment la raconter avec émotion"},
      {"phase": "3. DÉCOUVERTE DU TEXTE BIBLIQUE", "duree": "10-12 min", "description": "Comment présenter et lire le texte, stratégie de lecture, gestion des mots clés"},
      {"phase": "4. EXPLOITATION DU TEXTE (Questions-Réponses)", "duree": "10-12 min", "description": "Comment animer le dialogue avec les enfants, comment gérer les bonnes et mauvaises réponses"},
      {"phase": "5. RETENONS ET MESSAGE CENTRAL", "duree": "5 min", "description": "Comment faire mémoriser le retenons, comment présenter le message central avec impact"},
      {"phase": "6. ACTIVITÉ CRÉATIVE", "duree": "8-10 min", "description": "Déroulé pas à pas de l'activité, ce que le moniteur dit et fait"},
      {"phase": "7. PRIÈRE ET CLÔTURE", "duree": "3-5 min", "description": "Comment clore la séance, présentation de la liaison familiale, prière de clôture"}
    ]
  },
  "conseilsMoniteur": [
    "Conseil pratique 1 spécifique à cette leçon (gestion de classe, astuce pédagogique...)",
    "Conseil pratique 2 (comment capter l'attention, gérer les enfants difficiles...)",
    "Conseil pratique 3 (comment rendre le message mémorable, spiritual insight...)",
    "Conseil pratique 4 (erreur à éviter pour cette leçon spécifique)"
  ]
}`;
  } else if (sequence === 2) {
    userPrompt = `Prépare une fiche COMPLÈTE de SÉQUENCE 2 (Évaluation sommative, Activité d'intégration et Liaison familiale) pour :
- Titre de la leçon : "${titre}"
- Référence biblique : ${reference}
- Tranche d'âge : ${trancheLabel}
- Durée totale : 45 à 60 minutes
${contexteLecon ? `- Contexte particulier : ${contexteLecon}` : ""}

Génère un JSON riche avec EXACTEMENT cette structure :

{
  "objectifsSequence": "Ce que cette séquence vise à consolider et évaluer",
  "priere": {
    "ouverture": "Prière courte d'ouverture liée à la leçon",
    "intercession": "Point de prière pour que les enfants vivent la vérité de la leçon"
  },
  "rappelSequence1": {
    "resumeBref": "Résumé de la Séquence 1 en 3-4 lignes pour faire le lien",
    "questionRevision": "Une question rapide pour vérifier ce que les enfants ont retenu",
    "chantRappel": "Un chant déjà appris en Séquence 1 à reprendre"
  },
  "evaluationSommative": {
    "consigneMoniteur": "Comment administrer l'évaluation (oral, écrit, jeu...)",
    "questionsHistoire": [
      {"question": "Question de rappel 1 sur les faits de l'histoire biblique", "reponseAttendue": "Réponse précise", "pointsAttention": "Ce à quoi le moniteur doit être attentif"},
      {"question": "Question de rappel 2 sur les personnages et leurs actions", "reponseAttendue": "Réponse précise", "pointsAttention": "Signe que l'enfant a bien compris"},
      {"question": "Question sur le sens spirituel de l'histoire", "reponseAttendue": "Réponse développée", "pointsAttention": "Niveau de compréhension attendu"},
      {"question": "Question sur le verset mémoire de la Séquence 1", "reponseAttendue": "Citation exacte + référence", "pointsAttention": "Encourager même une récitation partielle"}
    ],
    "questionMessageCentral": {
      "question": "Comment expliques-tu à quelqu'un ce que la leçon de ${reference} t'apprend pour ta vie ?",
      "reponseAttendue": "Reformulation personnelle du message central avec au moins 2 éléments clés",
      "pointsAttention": "L'enfant doit parler à la première personne"
    },
    "questionApplication": "À la lumière de ${reference} et du message '${titre}', décris deux actions concrètes que tu vas mener cette semaine pour vivre ce que tu as appris"
  },
  "activiteIntegration": {
    "consigneMoniteur": "Comment introduire l'activité d'intégration, ce que le moniteur dit exactement",
    "situationProbleme": {
      "contexte": "Nouveau contexte local (différent de la Séquence 1, toujours du quotidien camerounais)",
      "cible": "Nouveau personnage fictif avec son profil",
      "paradoxe": "Le nouveau problème qui nécessite l'application de la compétence apprise",
      "tache": "La mission confiée aux enfants pour résoudre le problème en s'appuyant sur la leçon",
      "histoire": "Histoire complète de la situation-problème (6-8 lignes, vivante, avec tension)"
    },
    "questions": [
      {"question": "Question 1 : analyse de la situation (Quel est le problème de [personnage] ?)", "guidanceReponse": "Ce que le moniteur attend et comment relancer si l'enfant bloque"},
      {"question": "Question 2 : mobilisation des connaissances (Qu'est-ce que la Bible dit sur ce sujet ?)", "guidanceReponse": "Pistes de réponse basées sur la leçon apprise"},
      {"question": "Question 3 : conseil chrétien (Que conseilles-tu à [personnage] selon ce que tu as appris ?)", "guidanceReponse": "Réponse attendue intégrant le message central"},
      {"question": "Question 4 : engagement personnel (Et toi, qu'aurais-tu fait ?)", "guidanceReponse": "Réponse personnelle et concrète"},
      {"question": "Question 5 (production) : Réalise une production (dessin, slogan, petit témoignage, chant, affiche) qui montre ce que la leçon t'a appris", "guidanceReponse": "Description de la production attendue et critères de réussite"}
    ]
  },
  "liaisonFamiliale": {
    "objectif": "Impliquer la famille dans la continuation de l'apprentissage spirituel",
    "resumeRecit": "Résumé clair du récit biblique pour que les parents comprennent même s'ils n'étaient pas là (5-6 lignes)",
    "messageCentralEtCompetence": "Le message central et la compétence développée, expliqués simplement pour les parents",
    "discussionEnFamille": [
      "Question de discussion 1 à poser en famille (liée au quotidien)",
      "Question de discussion 2 (pour approfondir la foi)",
      "Activité pratique en famille (prière commune, lecture biblique, geste de solidarité, etc.)"
    ],
    "versetAMediter": "Verset de ${reference} à lire ensemble en famille cette semaine",
    "messageParents": "Message d'encouragement court pour les parents (2-3 lignes, chaleureux)"
  },
  "elaboration": {
    "dureeTotal": "45-60 minutes",
    "etapes": [
      {"phase": "1. ACCUEIL ET RAPPEL", "duree": "8-10 min", "description": "Accueil, chant de rappel, question de révision rapide pour réchauffer la mémoire"},
      {"phase": "2. ÉVALUATION SOMMATIVE", "duree": "15-18 min", "description": "Comment administrer l'évaluation avec bienveillance, comment gérer les enfants qui n'ont pas retenu"},
      {"phase": "3. ACTIVITÉ D'INTÉGRATION", "duree": "18-20 min", "description": "Introduction de la situation-problème, animation du dialogue, gestion de la production"},
      {"phase": "4. LIAISON FAMILIALE ET CLÔTURE", "duree": "5-7 min", "description": "Distribution ou présentation de la liaison familiale, prière de clôture, encouragements"}
    ]
  },
  "conseilsMoniteur": [
    "Conseil 1 sur la gestion de l'évaluation (bienveillance, encouragement, pas de moquerie)",
    "Conseil 2 sur comment animer l'activité d'intégration pour qu'elle soit dynamique",
    "Conseil 3 sur comment impliquer les enfants timides",
    "Conseil 4 sur la remise de la liaison familiale aux parents"
  ]
}`;
  } else if (sequence === 3) {
    userPrompt = `Prépare une fiche COMPLÈTE de SÉQUENCE 3 (Retour sur les intégrations — Partage du moniteur et Vérification) pour :
- Titre de la leçon : "${titre}"
- Référence biblique : ${reference}
- Tranche d'âge : ${trancheLabel}
- Durée totale : 45 à 60 minutes
${contexteLecon ? `- Contexte particulier : ${contexteLecon}` : ""}

Génère un JSON riche avec EXACTEMENT cette structure :

{
  "objectifsSequence": "Ce que cette séquence cherche à vérifier et à consolider",
  "priere": {
    "ouverture": "Prière d'ouverture invitant l'Esprit-Saint à enseigner et révéler",
    "intercession": "Prière pour que les enfants aient VRAIMENT mis en pratique la leçon"
  },
  "partageMoniteur": {
    "titre": "Mon témoignage de la semaine — le moniteur partage EN PREMIER",
    "description": "Le moniteur partage comment IL/ELLE a appliqué la leçon dans sa propre vie cette semaine (l'IA génère un exemple concret et authentique de mise en pratique personnelle liée à la leçon)",
    "exemples": [
      "Exemple concret de mise en pratique 1 (situation du quotidien africain/camerounais)",
      "Exemple concret de mise en pratique 2 (défi rencontré et comment la foi a aidé)"
    ],
    "difficultes": [
      "Difficulté honnête que le moniteur peut partager pour humaniser son témoignage",
      "Ce que le moniteur a appris de cette difficulté"
    ],
    "consigne": "Le moniteur invite ensuite les enfants : 'Et vous, comment avez-vous vécu cette leçon cette semaine ?'"
  },
  "recueilTemoignages": {
    "questions": [
      "Question 1 pour inviter les enfants à partager leurs témoignages de la semaine",
      "Question 2 pour approfondir les témoignages partagés",
      "Question 3 pour encourager ceux qui n'ont pas réussi à appliquer"
    ],
    "gestionParole": "Comment le moniteur gère la prise de parole, valorise chaque témoignage et recadre si nécessaire"
  },
  "verificationIntegrations": {
    "consigneMoniteur": "Comment collecter et vérifier les productions des Séquences 1 et 2 avec bienveillance",
    "corrigeIntegration": [
      {"question": "Question 1 de l'intégration (Séquence 2)", "reponseAttendue": "Corrigé type complet et détaillé", "critere": "Ce qu'on évalue précisément"},
      {"question": "Question 2 de l'intégration", "reponseAttendue": "Corrigé type complet et détaillé", "critere": "Ce qu'on évalue précisément"},
      {"question": "Question 3 de l'intégration", "reponseAttendue": "Corrigé type complet et détaillé", "critere": "Ce qu'on évalue précisément"},
      {"question": "Question 4 (production créative)", "reponseAttendue": "Description de ce qu'une bonne production contient", "critere": "Critères d'appréciation de la production"}
    ],
    "criteresEvaluation": [
      "Critère 1 : L'enfant a retenu le message central (comment le vérifier)",
      "Critère 2 : L'enfant a appliqué la compétence dans sa vie (signe observable)",
      "Critère 3 : L'enfant est capable de transmettre la leçon à quelqu'un d'autre",
      "Critère 4 : La production de l'enfant reflète une compréhension personnelle"
    ]
  },
  "liaisonFamilialeVerification": {
    "questionsVerification": [
      "Question pour vérifier si la discussion en famille a eu lieu",
      "Question pour savoir ce que les parents ont dit",
      "Question pour savoir si l'activité pratique en famille a été réalisée"
    ],
    "activitePratique": "Nouvelle activité pratique proposée pour la semaine à venir, en lien avec la leçon",
    "messageEncouragement": "Message pour encourager les enfants dont les parents n'ont pas participé"
  },
  "pointsAttention": [
    "Point d'attention 1 : signe que certains enfants n'ont pas compris (et comment y remédier dès maintenant)",
    "Point d'attention 2 : comment gérer les enfants qui n'ont pas fait les activités à la maison",
    "Point d'attention 3 : comment valoriser les progrès même partiels",
    "Point d'attention 4 : erreur pédagogique fréquente à cette étape et comment l'éviter"
  ],
  "elaboration": {
    "dureeTotal": "45-60 minutes",
    "etapes": [
      {"phase": "1. ACCUEIL ET PRIÈRE", "duree": "5 min", "description": "Accueil chaleureux, chant, prière d'ouverture"},
      {"phase": "2. PARTAGE DU MONITEUR", "duree": "5-7 min", "description": "Le moniteur partage EN PREMIER son témoignage personnel, crée un espace de confiance"},
      {"phase": "3. TÉMOIGNAGES DES ENFANTS", "duree": "10-12 min", "description": "Recueil des témoignages, valorisation, encadrement bienveillant"},
      {"phase": "4. VÉRIFICATION DES INTÉGRATIONS", "duree": "15-18 min", "description": "Collecte et correction des productions, corrigé participatif"},
      {"phase": "5. VÉRIFICATION LIAISON FAMILIALE", "duree": "5 min", "description": "Discussion sur les activités en famille, encouragement"},
      {"phase": "6. CLÔTURE ET PRIÈRE", "duree": "3-5 min", "description": "Résumé de ce qui a été appris, prière de clôture, annonce de la prochaine séance"}
    ]
  },
  "conseilsMoniteur": [
    "Conseil 1 : l'importance cruciale du partage du moniteur EN PREMIER (donne l'exemple, crée la confiance)",
    "Conseil 2 : comment créer un espace safe où les enfants n'ont pas peur de partager leurs échecs",
    "Conseil 3 : comment valoriser tout témoignage, même imparfait",
    "Conseil 4 : comment gérer un enfant qui n'a rien fait à la maison sans le humilier"
  ]
}`;
  } else {
    userPrompt = `Prépare une fiche COMPLÈTE de SÉQUENCE 4 (Remédiation — Renforcement et consolidation des acquis) pour :
- Titre de la leçon : "${titre}"
- Référence biblique : ${reference}
- Tranche d'âge : ${trancheLabel}
- Durée totale : 45 à 60 minutes
${contexteLecon ? `- Contexte particulier : ${contexteLecon}` : ""}

Génère un JSON riche avec EXACTEMENT cette structure :

{
  "objectifsRemediation": "Ce que cette séquence de remédiation cherche à consolider définitivement",
  "priere": {
    "ouverture": "Prière d'ouverture pour la paix et la compréhension",
    "intercession": "Prière pour que chaque enfant, quelle que soit sa difficulté, soit touché par la vérité de la Parole"
  },
  "diagnosticDifficultés": {
    "description": "Comment le moniteur identifie rapidement qui a besoin de remédiation",
    "signesAlerte": [
      "Signe 1 qu'un enfant n'a pas bien assimilé (comportement observable)",
      "Signe 2 (réponse type révélatrice d'une incompréhension)",
      "Signe 3 (absence de pratique observable)"
    ]
  },
  "difficultesCourantes": [
    {
      "difficulte": "Difficulté principale identifiée pour cette leçon spécifique",
      "cause": "Pourquoi cette difficulté est fréquente (développement cognitif, culturel, spirituel...)",
      "solutionRemediation": "Solution concrète, pas à pas, pour aider l'enfant à surmonter cette difficulté",
      "exempleActivite": "Une micro-activité spécifique pour remédier à cette difficulté précise"
    },
    {
      "difficulte": "Deuxième difficulté fréquente",
      "cause": "Cause probable",
      "solutionRemediation": "Solution concrète et bienveillante",
      "exempleActivite": "Activité de remédiation ciblée"
    },
    {
      "difficulte": "Troisième difficulté fréquente",
      "cause": "Cause probable",
      "solutionRemediation": "Solution pratique",
      "exempleActivite": "Activité spécifique"
    }
  ],
  "methodesRemediation": [
    {
      "methode": "Nom de la méthode (ex: Reformulation par les pairs, Dessin biblique, Récit choral...)",
      "description": "Comment appliquer cette méthode avec cette leçon précise, étape par étape",
      "pourQui": "Pour quels enfants cette méthode est particulièrement adaptée",
      "materielNecessaire": ["Matériel 1", "Matériel 2"]
    },
    {
      "methode": "Deuxième méthode de remédiation",
      "description": "Application concrète avec cette leçon",
      "pourQui": "Profil d'enfants concernés",
      "materielNecessaire": ["Matériel 1"]
    },
    {
      "methode": "Troisième méthode (plus créative ou ludique)",
      "description": "Application concrète",
      "pourQui": "Pour les apprenants visuels ou kinesthésiques",
      "materielNecessaire": ["Matériel 1", "Matériel 2"]
    }
  ],
  "activiteConsolidation": {
    "titre": "Titre de l'activité de consolidation finale",
    "description": "Activité récapitulative ludique qui reprend les 4 éléments clés de la leçon",
    "deroulement": "Déroulé pas à pas (3-5 étapes)",
    "duree": "X minutes"
  },
  "recapitulatifLecon": {
    "messageCentral": "Reformulation du message central de toute la leçon (4 séquences)",
    "competenceVisee": "Compétence finale attendue après les 4 séquences",
    "pointsCles": [
      "Point clé 1 : Vérité biblique fondamentale à retenir de cette leçon",
      "Point clé 2 : Application pratique principale",
      "Point clé 3 : Engagement spirituel pour la vie",
      "Point clé 4 : Lien avec la communauté de foi (Église, famille)"
    ],
    "versetsMemorise": "Verset(s) que tous les enfants doivent pouvoir citer après ces 4 séquences"
  },
  "celebrationDesProgres": {
    "description": "Comment célébrer et valoriser les progrès de tous les enfants à la fin du cycle",
    "ideesCelebration": [
      "Idée de célébration 1 (diplôme, attestation, moment spécial...)",
      "Idée de célébration 2 (témoignage public, présentation aux parents...)"
    ]
  },
  "elaboration": {
    "dureeTotal": "45-60 minutes",
    "etapes": [
      {"phase": "1. ACCUEIL ET DIAGNOSTIC", "duree": "5-7 min", "description": "Quiz rapide ou dessin pour identifier les niveaux et besoins de remédiation"},
      {"phase": "2. REMÉDIATION CIBLÉE (groupes)", "duree": "15-18 min", "description": "Travail en petits groupes selon les difficultés identifiées, le moniteur circule"},
      {"phase": "3. ACTIVITÉ DE CONSOLIDATION", "duree": "12-15 min", "description": "Activité commune récapitulative pour tous les enfants ensemble"},
      {"phase": "4. RÉCAPITULATIF ET CÉLÉBRATION", "duree": "8-10 min", "description": "Synthèse des 4 séquences, célébration des progrès, mots d'encouragement"},
      {"phase": "5. PRIÈRE ET ENVOI", "duree": "3-5 min", "description": "Prière finale, engagement, envoi avec bénédiction"}
    ]
  },
  "encouragements": "Message profond et chaleureux pour les moniteurs — reconnaître leur travail, les encourager à continuer malgré les difficultés, rappeler l'impact éternel de leur service (5-7 lignes, sincères et inspirantes)",
  "conseilsMoniteur": [
    "Conseil 1 : comment aborder la remédiation sans décourager les enfants en difficulté",
    "Conseil 2 : comment valoriser les enfants qui ont bien réussi tout en aidant les autres",
    "Conseil 3 : comment adapter la leçon si BEAUCOUP d'enfants ont des difficultés",
    "Conseil 4 : l'importance de la prière personnelle du moniteur avant cette séquence difficile"
  ]
}`;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "Error generating lesson");
    res.write(`data: ${JSON.stringify({ error: "Erreur lors de la génération. Vérifiez votre connexion et réessayez." })}\n\n`);
  }

  res.end();
});

router.post("/lessons", async (req, res) => {
  const body = CreateLessonBody.parse(req.body);
  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      titre: body.titre,
      reference: body.reference,
      trancheAge: body.trancheAge,
      sequence: body.sequence,
      contenu: body.contenu,
    })
    .returning();
  res.status(201).json({
    ...lesson,
    createdAt: lesson!.createdAt.toISOString(),
  });
});

router.get("/lessons/:id", async (req, res) => {
  const { id } = GetLessonParams.parse({ id: Number(req.params.id) });
  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, id));
  if (!lesson) {
    res.status(404).json({ error: "Leçon introuvable" });
    return;
  }
  res.json({ ...lesson, createdAt: lesson.createdAt.toISOString() });
});

router.delete("/lessons/:id", async (req, res) => {
  const { id } = DeleteLessonParams.parse({ id: Number(req.params.id) });
  const [deleted] = await db
    .delete(lessonsTable)
    .where(eq(lessonsTable.id, id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Leçon introuvable" });
    return;
  }
  res.status(204).send();
});

export default router;
