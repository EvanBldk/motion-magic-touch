

# Reformulation de ta demande

Tu veux deux choses :

1. **Vue programme semaine detaillee** — Pouvoir ouvrir chaque jour de la semaine et voir TOUS les exercices par phase (echauffement, force, cool-down), avec sets, reps, rest, cues, tempo. Actuellement le Dashboard ne montre que des tags de noms d'exercices sans detail.

2. **Explication personnalisee du programme** — Comprendre POURQUOI l'IA a choisi ces exercices pour toi. Quel est l'objectif de la semaine, pourquoi tel exercice de force, pourquoi tel travail de mobilite. Un texte de coaching qui donne du sens au programme.

---

# Solutions proposees

## Solution 1 — Page Programme Semaine (`/programme`)

Creer une page dediee accessible depuis le Dashboard et la navigation :

- **En-tete** : theme de la semaine, numero, date de debut
- **Section "Pourquoi ce programme"** : texte explicatif genere par l'IA (nouveau champ `rationale` dans le JSON)
- **Accordeons par jour** : chaque jour est un accordeon expandable
  - Sous-accordeons par phase (Echauffement / Force / Cool-down)
  - Chaque exercice affiche : nom, sets x reps, repos, tempo, cues (instructions techniques)
- **Lien "Demarrer"** sur le jour d'aujourd'hui

## Solution 2 — Enrichir le JSON de l'IA

Ajouter deux champs au schema de generation :

- `rationale` (string, au niveau racine) : 3-5 phrases expliquant la logique du programme (objectifs cibles, zones de mobilite travaillees, progression par rapport au niveau evalue)
- `day.rationale` (string, par jour) : 1-2 phrases expliquant le focus de cette seance

Cela ne necessite qu'une mise a jour du prompt et du schema tool calling dans l'Edge Function.

---

# Plan technique

### 1. Edge Function — Ajouter `rationale` au schema

**Fichier** : `supabase/functions/generate-program/index.ts`

- Ajouter dans le systemPrompt une instruction :
  > "Inclure un champ 'rationale' (3-5 phrases) expliquant pourquoi ce programme est adapte a l'utilisateur : objectifs vises, faiblesses identifiees, logique de progression. Inclure aussi un 'rationale' par jour (1-2 phrases) expliquant le focus de la seance."

- Ajouter dans le schema tool calling :
  - `rationale` (string, required) au niveau racine
  - `rationale` (string, required) dans chaque `day`

### 2. Interfaces TypeScript

**Fichier** : `src/hooks/useProgram.ts`

- Ajouter `rationale?: string` a `WeeklyProgram.ai_generated`
- Ajouter `rationale?: string` a `ProgramDay`

### 3. Page Programme (`/programme`)

**Nouveau fichier** : `src/pages/Programme.tsx`

Structure de la page :
- En-tete avec theme + semaine
- Carte "Pourquoi ce programme" avec le `rationale` global
- Liste de jours en accordeons (Collapsible) :
  - Titre du jour + badge "Aujourd'hui" si applicable + `rationale` du jour
  - Sous-sections par phase (Echauffement, Force, Cool-down)
  - Chaque exercice : nom, `sets × reps`, repos, tempo (si present), cues en italique
  - Bouton "Demarrer la seance" sur le jour courant

### 4. Navigation et routing

- Ajouter la route `/programme` dans `App.tsx`
- Ajouter un bouton "Voir le programme complet" sur le Dashboard (remplace ou complete la vue compacte actuelle)
- Ajouter l'entree dans la navigation bottom/sidebar

### 5. Dashboard — Lien vers Programme

Remplacer la section "Programme de la semaine" compacte par un lien vers `/programme` pour eviter la duplication.

---

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `supabase/functions/generate-program/index.ts` | Ajouter `rationale` au prompt + schema |
| `src/hooks/useProgram.ts` | Ajouter `rationale` aux interfaces |
| `src/pages/Programme.tsx` | Nouvelle page programme detaille |
| `src/App.tsx` | Ajouter route `/programme` |
| `src/pages/Dashboard.tsx` | Remplacer vue compacte par lien vers `/programme` |
| `src/components/layout/BottomNav.tsx` | Ajouter entree navigation |
| `src/components/layout/DesktopSidebar.tsx` | Ajouter entree navigation |

