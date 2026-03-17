

# Audit Complet v3 — Spartan

---

## 1. ETAT ACTUEL

Application de coaching callisthénie : Auth → Diagnostics (Force + Mobilité) → Génération IA (Gemini 2.5 Flash via Lovable AI) → Séances avec feedback → Historique.

### Pages et fonctionnalités

| Route | Etat | Remarques |
|---|---|---|
| `/auth` | Complet | Login/signup, redirect si auth |
| `/` (Dashboard) | Complet | Programme réel, week indicators connectés, today done guard, stats, skeleton loader |
| `/diagnostics` | Complet | Hub avec statut Force/Mobilité |
| `/diagnostic-force` | Complet | Wizard 6 étapes → DB |
| `/diagnostic-mobilite` | Complet | Wizard 7 étapes → DB |
| `/session-active` | Complet | Exercices depuis weekly_programs, rest timer, feedback → daily_sessions |
| `/workout` | Complet | Historique séances, RPE moyen, count, streak |
| `/profile` | Complet | Email, date, diagnostics, dark mode, déconnexion |

### Ce qui a été corrigé depuis v2
- Week day completion connectée aux `daily_sessions` (via `completedDates`)
- Guard "séance déjà complétée" sur le Dashboard
- `window.location.reload()` remplacé par `refetchProgram()`
- `Index.tsx` orphelin supprimé
- Page Workout fonctionnelle
- Dark mode toggle
- Rest timer dans Session Active

---

## 2. PROBLEMES RESTANTS

### A. Bugs / Lacunes techniques

1. **Duplicate daily_sessions** — Rien n'empêche d'insérer deux sessions pour la même date (pas de contrainte UNIQUE `(user_id, date)` en DB, et pas de check client avant INSERT dans SessionActive).

2. **Session Active accessible même si séance déjà faite** — Le Dashboard affiche bien "Séance complétée" mais l'utilisateur peut naviguer directement vers `/session-active` et refaire un INSERT.

3. **`useDiagnosticStatus` ne supporte pas refetch** — Pas de `useCallback` + `refetch` comme les autres hooks. Si l'utilisateur complète un diagnostic et revient au Dashboard sans reload, le statut reste stale.

4. **Streak ne compte que les jours consécutifs depuis aujourd'hui** — Si l'utilisateur n'a pas encore fait sa séance aujourd'hui mais a une série de 5 jours avant, le streak affiche 0 au lieu de 5.

5. **Page 404 non stylée** — Texte en anglais ("Oops! Page not found"), pas de cohérence visuelle avec le reste de l'app.

6. **Pas de gestion d'erreur visible** — Les hooks exposent `error` mais aucune page ne l'affiche (Dashboard, Workout, etc.).

7. **Pas de garde avant quitter un diagnostic** — `beforeunload` / `useBlocker` absents.

### B. Fonctionnalités manquantes

8. **Vue programme semaine complète** — On ne voit que la séance du jour. Pas moyen de consulter les autres jours du programme.

9. **Détail d'une séance passée** — Le Workout liste les sessions mais sans vue détaillée (quels exercices, reps par exercice, douleurs).

10. **Progression / courbes** — Aucune visualisation de l'évolution (RPE moyen par semaine, volume, streak chart).

11. **Feedback inline par exercice** — Actuellement un sheet global en fin de séance avec TOUS les exercices. Pour 10+ exercices, c'est lourd. Mieux : feedback contextuel quand on coche un exercice.

12. **Pas de mot de passe oublié** — Aucun lien "Mot de passe oublié" sur la page Auth.

13. **Pas de profil enrichi** — Le profil ne contient que email et date. Pas de nom, photo, poids, taille — données utiles pour la personnalisation.

---

## 3. PROPOSITIONS D'AMELIORATION

### Priorité 1 — Robustesse (petit effort, gros impact)

| # | Action | Effort |
|---|---|---|
| 1a | Ajouter une contrainte UNIQUE `(user_id, date)` sur `daily_sessions` + upsert côté client | Petit |
| 1b | Bloquer `/session-active` si la séance du jour est déjà faite (redirect vers Dashboard) | Petit |
| 1c | Ajouter `refetch` à `useDiagnosticStatus` (comme les autres hooks) | Trivial |
| 1d | Corriger le streak pour compter la série jusqu'à hier si aujourd'hui pas encore fait | Petit |
| 1e | Afficher les erreurs (state `error`) avec un composant alert sur Dashboard/Workout | Petit |

### Priorité 2 — UX polish (effort moyen)

| # | Action | Effort |
|---|---|---|
| 2a | Vue programme complet : tabs ou accordion pour voir tous les jours de la semaine | Moyen |
| 2b | Page 404 en français, stylée avec le design Spartan | Trivial |
| 2c | Lien "Mot de passe oublié" sur `/auth` (via `supabase.auth.resetPasswordForEmail`) | Petit |
| 2d | Garde avant quitter un diagnostic (`beforeunload` + navigation block) | Petit |

### Priorité 3 — Fonctionnalités avancées

| # | Action | Effort |
|---|---|---|
| 3a | Vue détail séance passée dans `/workout` (expandable ou sous-page) | Moyen |
| 3b | Feedback inline par exercice (mini-form contextuel au check) au lieu du sheet global | Moyen |
| 3c | Graphiques de progression (RPE moyen, séances/semaine) avec recharts | Moyen |
| 3d | Profil enrichi (nom, poids, taille) stocké dans `profiles` | Moyen |

