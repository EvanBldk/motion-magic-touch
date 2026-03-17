

# Audit Complet — Application Spartan

---

## 1. RECAPITULATIF PRODUIT

**Spartan** est une application web de coaching en callisthénie (street workout) qui génère des programmes d'entraînement personnalisés basés sur des diagnostics de force et de mobilité de l'utilisateur.

L'application guide l'athlète à travers un parcours complet : évaluation initiale (diagnostics) → génération d'un programme hebdomadaire par IA → exécution des séances avec suivi en temps réel et collecte de feedback.

### Fonctionnalités implémentées

| Domaine | Fonctionnalité | État |
|---|---|---|
| **Auth** | Inscription / Connexion email+mdp | Fonctionnel (Lovable Cloud) |
| **Auth** | Routes protégées + redirection `/auth` | Fonctionnel |
| **Diagnostic Force** | Wizard 6 étapes (profil, objectifs, tests force, gainage, skills, récap) | Fonctionnel, INSERT en DB |
| **Diagnostic Mobilité** | Wizard 7 étapes (infos, poignets, épaules, colonne, postérieure, hanches, récap) | Fonctionnel, INSERT en DB |
| **Dashboard** | Affichage semaine en cours (données mock statiques) | Partiellement fonctionnel |
| **Dashboard** | Bouton "Générer mon programme" → Edge Function | Fonctionnel (retourne un mock structuré) |
| **Dashboard** | Stats rapides (données mock statiques) | Affichage uniquement |
| **Session Active** | Exécution séance avec checklist par phase (données mock) | UI fonctionnelle, pas de persistance |
| **Session Active** | Feedback post-séance (reps, RPE, douleur) | UI fonctionnelle, `console.log` uniquement |
| **Edge Function** | `generate-program` : auth JWT, fetch évaluations, systemPrompt avec KB force+mobilité | Déployée, retourne un mock (pas d'appel LLM réel) |
| **Rôles** | Table `user_roles` + enum `admin | athlete` + fonction `has_role` | Schema prêt, pas utilisé côté UI |

### Tables DB existantes

`profiles`, `user_roles`, `force_evaluations`, `mobility_evaluations`, `weekly_programs`, `daily_sessions`

---

## 2. ARCHITECTURE ET NAVIGATION

### Inventaire des pages

| Route | Composant | Contenu |
|---|---|---|
| `/auth` | `Auth.tsx` | Formulaire login/signup, non protégé |
| `/` | `Dashboard.tsx` | Tableau de bord principal (données mock) |
| `/diagnostics` | `Placeholder` | Page vide "À venir" |
| `/diagnostic-force` | `DiagnosticForce.tsx` | Wizard 6 étapes |
| `/diagnostic-mobilite` | `DiagnosticMobilite.tsx` | Wizard 7 étapes |
| `/workout` | `Placeholder` | Page vide "À venir" |
| `/session-active` | `SessionActive.tsx` | Exécution séance mock |
| `/profile` | `Placeholder` | Page vide "À venir" |
| `*` | `NotFound.tsx` | 404 |

### Layout

- **Desktop** : sidebar gauche fixe (`DesktopSidebar`) + contenu principal
- **Mobile** : barre de navigation fixe en bas (`BottomNav`) + contenu principal
- Navigation : 4 entrées — Dashboard, Diagnostics, Workout, Profil

### Flux utilisateur actuel

```text
/auth (login/signup)
  │
  ▼
/ (Dashboard)
  ├── [Bouton "Démarrer la séance"] ──► /session-active
  │     └── [Terminer + feedback] ──► / (console.log, pas de persistance)
  ├── [Bouton "Générer programme"] ──► Edge Function → INSERT weekly_programs
  │
  ├── [Nav] /diagnostics ──► Placeholder vide
  │     (pas de lien vers /diagnostic-force ou /diagnostic-mobilite)
  │
  ├── [Nav] /workout ──► Placeholder vide
  └── [Nav] /profile ──► Placeholder vide

/diagnostic-force ──► Wizard 6 étapes ──► INSERT force_evaluations ──► /
/diagnostic-mobilite ──► Wizard 7 étapes ──► INSERT mobility_evaluations ──► /
```

---

## 3. PROPOSITIONS D'AMELIORATION

### A. Ruptures critiques dans le flux

1. **Page `/diagnostics` inutile** — C'est un placeholder sans lien vers les deux diagnostics existants. Il faudrait en faire un hub avec deux cartes cliquables (Force / Mobilité) + indicateur de complétion.

2. **Dashboard 100% mock** — Les données affichées (semaine, séance du jour, stats) sont statiques. Le programme généré et stocké dans `weekly_programs` n'est jamais relu ni affiché. Le Dashboard devrait charger le dernier `weekly_programs` de l'utilisateur.

3. **Session Active déconnectée** — La séance affichée est en dur (mock). Elle devrait charger les exercices du jour depuis `weekly_programs.ai_generated`. Le feedback n'est pas persisté (simple `console.log`) alors que la table `daily_sessions` existe pour ça.

4. **Pas d'appel LLM réel** — L'Edge Function contient le systemPrompt complet avec les deux knowledge bases mais retourne un programme mock. Il faut connecter un modèle IA (Gemini ou GPT via Lovable AI).

### B. Fonctionnalités logiques manquantes

5. **Onboarding guidé** — Aucun mécanisme ne guide un nouvel utilisateur vers les diagnostics avant de générer un programme. Un premier accueil devrait détecter l'absence de diagnostics et proposer de les compléter.

6. **Page Profil** — Placeholder vide. Devrait afficher : email, date d'inscription, historique des diagnostics, bouton déconnexion (actuellement nulle part dans l'UI), possibilité de refaire un diagnostic.

7. **Page Workout** — Placeholder vide. Devrait lister l'historique des séances complétées (`daily_sessions`), avec stats agrégées (volume, streak, progression).

8. **Bouton de déconnexion** — La fonction `signOut` existe dans `useAuth` mais n'est exposée nulle part dans l'interface.

### C. Optimisations UX

9. **Confirmation avant de quitter un diagnostic** — Aucun garde-fou si l'utilisateur quitte un wizard en cours (perte de données).

10. **Indicateur de chargement global** — Le `ProtectedRoute` affiche "Chargement…" en texte brut. Un skeleton ou spinner serait plus professionnel.

11. **Gestion d'erreur sur le Dashboard** — Si l'utilisateur n'a pas de diagnostics et clique "Générer", l'Edge Function retourne une erreur 400 mais le message n'est pas explicite (devrait dire "Complète d'abord tes diagnostics").

### D. Priorités suggérées

| Priorité | Action |
|---|---|
| 1 | Créer la page hub `/diagnostics` avec statut de complétion |
| 2 | Connecter le Dashboard aux données réelles (`weekly_programs`) |
| 3 | Connecter la Session Active au programme généré + persister le feedback dans `daily_sessions` |
| 4 | Remplacer le mock de l'Edge Function par un appel LLM réel |
| 5 | Ajouter le bouton déconnexion + page Profil basique |
| 6 | Implémenter un onboarding conditionnel pour les nouveaux utilisateurs |

