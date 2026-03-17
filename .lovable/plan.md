

# Audit Complet — Application Spartan (v2)

---

## 1. RECAPITULATIF PRODUIT

**Spartan** est une application web de coaching en callisthénie qui génère des programmes d'entraînement personnalisés via IA, basés sur des diagnostics de force et mobilité.

Parcours : Inscription → Diagnostics (Force + Mobilité) → Génération IA d'un programme hebdomadaire → Exécution des séances avec feedback → Suivi de progression.

### Fonctionnalités implémentées

| Domaine | Fonctionnalité | État |
|---|---|---|
| **Auth** | Inscription / Connexion email+mdp, routes protégées | Fonctionnel |
| **Diagnostic Force** | Wizard 6 étapes → INSERT en DB | Fonctionnel |
| **Diagnostic Mobilité** | Wizard 7 étapes → INSERT en DB | Fonctionnel |
| **Hub Diagnostics** | Page avec statut de complétion + liens vers les 2 diagnostics | Fonctionnel |
| **Dashboard** | Affichage programme réel (weekly_programs), séance du jour, stats (séances, streak) | Fonctionnel |
| **Dashboard** | Génération de programme via Edge Function + Lovable AI Gateway (Gemini 2.5 Flash) | Fonctionnel |
| **Dashboard** | Alerte si diagnostics incomplets | Fonctionnel |
| **Session Active** | Charge exercices depuis weekly_programs, checklist par phase, feedback persisté dans daily_sessions | Fonctionnel |
| **Profil** | Email, date inscription, historique diagnostics, bouton déconnexion | Fonctionnel |
| **Edge Function** | `generate-program` : auth JWT, fetch évaluations, appel LLM réel avec tool calling | Fonctionnel |

### Ce qui reste placeholder / non connecté

| Élément | Problème |
|---|---|
| `/workout` | Placeholder vide "À venir" |
| `Index.tsx` | Fichier orphelin (non utilisé, Dashboard est sur `/`) |
| Week day completion | `isCompleted: false` en dur (ligne 91 Dashboard) — pas connecté à daily_sessions |
| Today session badge | `todaySession` de `useCompletedSessions` n'est pas utilisé dans le Dashboard pour afficher "déjà fait" |

---

## 2. ARCHITECTURE ET NAVIGATION

### Pages

| Route | Composant | État |
|---|---|---|
| `/auth` | Auth.tsx | Complet |
| `/` | Dashboard.tsx | Complet (1 TODO restant) |
| `/diagnostics` | Diagnostics.tsx | Complet |
| `/diagnostic-force` | DiagnosticForce.tsx | Complet |
| `/diagnostic-mobilite` | DiagnosticMobilite.tsx | Complet |
| `/session-active` | SessionActive.tsx | Complet |
| `/profile` | Profile.tsx | Complet |
| `/workout` | Placeholder | Vide |

### Flux utilisateur

```text
/auth
  │
  ▼
/ (Dashboard)
  ├── [Diagnostics incomplets] → Alerte + lien /diagnostics
  ├── [Diagnostics OK, pas de programme] → Bouton "Générer" → Edge Function → reload
  ├── [Programme existant] → Séance du jour + "Démarrer" → /session-active
  │     └── Feedback → INSERT daily_sessions → retour /
  ├── [Nav] /diagnostics → Hub avec cartes Force/Mobilité
  │     ├── /diagnostic-force (wizard 6 étapes → INSERT → /)
  │     └── /diagnostic-mobilite (wizard 7 étapes → INSERT → /)
  ├── [Nav] /workout → Placeholder
  └── [Nav] /profile → Infos + déconnexion
```

---

## 3. PROPOSITIONS D'AMELIORATION

### A. Bugs / Lacunes fonctionnelles

1. **Week day completion non connectée** — Le Dashboard montre `isCompleted: false` pour tous les jours. Il faut croiser `daily_sessions` avec les jours de la semaine en cours pour marquer les jours complétés.

2. **Pas de garde "séance déjà faite"** — Si l'utilisateur a déjà complété la séance du jour (`todaySession` dans `useCompletedSessions`), le Dashboard affiche quand même "Démarrer la séance". Il faudrait afficher "Séance complétée" avec un résumé du feedback.

3. **`window.location.reload()` après génération** — Approche brutale. Il faudrait plutôt invalider le state local ou re-fetch le programme sans recharger la page.

4. **Fichier `Index.tsx` orphelin** — Non utilisé dans les routes, à supprimer.

5. **Pas de gestion d'erreur réseau** — Les hooks `useProgram` ne gèrent pas les erreurs Supabase (pas de try/catch, pas de state `error`).

### B. Fonctionnalités manquantes (par priorité)

6. **Page Workout / Historique** — Afficher l'historique des séances complétées avec : date, titre de la séance, RPE moyen, douleurs signalées, nombre d'exercices complétés. Données déjà disponibles dans `daily_sessions`.

7. **Visualisation programme complet** — Pouvoir consulter tous les jours de la semaine (pas seulement aujourd'hui). Un onglet ou un swipe jour par jour sur le Dashboard ou une page dédiée.

8. **Progression entre semaines** — Comparer les performances (reps, RPE) d'une semaine à l'autre pour un même exercice. Nécessite un historique structuré.

9. **Timer intégré dans Session Active** — Afficher un timer de repos automatique entre les séries (le champ `rest` est déjà dans les données).

10. **Dark mode** — Le CSS définit déjà les variables `.dark` mais aucun toggle n'existe dans l'UI. Ajouter un switch dans le Profil.

### C. Optimisations UX

11. **Confirmation avant quitter un diagnostic** — Aucun garde-fou. Utiliser `beforeunload` ou un prompt React Router.

12. **Skeleton loaders** — Remplacer les spinners textuels par des skeletons sur Dashboard, Diagnostics, Profil.

13. **Pull-to-refresh / re-fetch** — Les hooks ne se re-exécutent qu'au mount. Pas de moyen de rafraîchir sans naviguer.

14. **Feedback UX dans Session Active** — Le sheet de feedback liste TOUS les exercices d'un coup. Pour 12+ exercices c'est écrasant. Mieux : feedback par exercice inline quand on coche, ou par phase.

15. **Notifications / rappels** — Pas de système pour rappeler à l'utilisateur de s'entraîner (hors scope immédiat mais pertinent).

### D. Priorités suggérées

| Priorité | Action | Effort |
|---|---|---|
| 1 | Connecter la complétion des jours (week indicators) aux daily_sessions | Petit |
| 2 | Afficher "Séance déjà complétée" si todaySession existe | Petit |
| 3 | Remplacer `window.location.reload()` par un re-fetch propre | Petit |
| 4 | Créer la page Workout (historique des séances) | Moyen |
| 5 | Ajouter la visualisation du programme complet (tous les jours) | Moyen |
| 6 | Timer de repos dans Session Active | Moyen |
| 7 | Toggle dark mode dans le Profil | Petit |
| 8 | Supprimer `Index.tsx` orphelin | Trivial |
| 9 | Skeleton loaders + gestion d'erreur dans les hooks | Moyen |
| 10 | Feedback inline par exercice plutôt que sheet global | Moyen |

