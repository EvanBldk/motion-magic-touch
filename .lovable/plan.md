

# Audit — Objectifs de semaine + Incoherences programme/reviews

## Problemes identifies

### 1. Pas d'objectifs concrets (semaine + seance)

Le champ `rationale` explique **pourquoi** le programme est adapte, mais pas **vers quoi** on progresse. L'utilisateur veut savoir :
- **Objectif semaine** : "Cette semaine, on vise +2 reps sur les tractions, et on consolide la pike push-up pour preparer le HSPU"
- **Objectif seance** : "Aujourd'hui, focus sur le volume de poussee horizontale — objectif : 3×10 pompes completes"

**Solution** : Ajouter deux champs au schema IA :
- `weekly_objectives` (string) : objectifs concrets de la semaine (reps, series, progression vers un mouvement)
- `day.objective` (string) : objectif actionnable de la seance

### 2. Incoherences programme ↔ reviews (bugs)

Trois problemes majeurs dans la facon dont le feedback est sauvegarde et relu :

**a) Structure JSON cassee pour la lecture**
Le feedback est sauvegarde comme `{ exercises: { "ex-0": {...} }, phases: { "Echauffement": {...} } }` mais `parseAvgRpe()` et `countExercises()` dans `Workout.tsx` s'attendent a un objet plat `{ [key]: { rpe, completed } }`. Resultat : RPE moyen = "—" et 0 exercices completes affiches, meme apres une seance validee.

**b) IDs ephemeres sans nom d'exercice**
Les cles de feedback sont `ex-0`, `ex-1`... generes a chaque render. Le nom de l'exercice n'est pas stocke dans le feedback. Impossible de savoir quel exercice a eu quel RPE.

**c) Reps = un seul nombre pour N series**
Le feedback demande "Reps realisees" (un chiffre), mais l'exercice prescrit `3 × 8`. On perd l'info par serie.

---

## Plan de correction

### 1. Edge Function — Ajouter objectifs au schema

**Fichier** : `supabase/functions/generate-program/index.ts`

- Ajouter au prompt :
  > "Inclure un champ 'weekly_objectives' (2-3 objectifs concrets mesurables pour la semaine). Inclure un champ 'objective' par jour (1 phrase actionnable)."

- Ajouter au schema tool calling :
  - `weekly_objectives` (string, required) au niveau racine
  - `objective` (string, required) dans chaque `day`

### 2. Interfaces TypeScript

**Fichier** : `src/hooks/useProgram.ts`

- Ajouter `weekly_objectives?: string` a `WeeklyProgram.ai_generated`
- Ajouter `objective?: string` a `ProgramDay`

### 3. Page Programme — Afficher les objectifs

**Fichier** : `src/pages/Programme.tsx`

- Ajouter une carte "Objectifs de la semaine" sous le rationale global
- Afficher le `day.objective` dans chaque accordeon de jour (au-dessus du rationale)

### 4. Corriger le feedback — Stocker le nom d'exercice

**Fichier** : `src/pages/SessionActive.tsx`

- Changer la cle de feedback de `ex-0` vers le nom d'exercice (slug)
- Stocker `exerciseName` dans chaque `ExerciseFeedbackData`
- Pour les reps : garder un champ simple (pas par serie, ca serait trop lourd UX), mais le label dira "Reps par serie" pour etre clair

### 5. Corriger la lecture des feedbacks

**Fichier** : `src/pages/Workout.tsx`

- Mettre a jour `parseAvgRpe()` pour naviguer la structure `{ exercises: {...}, phases: {...} }`
- Mettre a jour `countExercises()` pour compter les cles dans `exercises`
- Afficher les noms d'exercices dans les cartes de session

---

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `supabase/functions/generate-program/index.ts` | Ajouter `weekly_objectives` + `day.objective` au prompt et schema |
| `src/hooks/useProgram.ts` | Ajouter `weekly_objectives`, `objective` aux interfaces |
| `src/pages/Programme.tsx` | Afficher objectifs semaine + objectif par jour |
| `src/pages/SessionActive.tsx` | Stocker le nom d'exercice dans le feedback, corriger les cles |
| `src/components/session/InlineExerciseFeedback.tsx` | Renommer label "Reps par serie" |
| `src/pages/Workout.tsx` | Corriger `parseAvgRpe` et `countExercises` pour la bonne structure JSON |

