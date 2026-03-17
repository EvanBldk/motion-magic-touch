

# Feedback inline par phase/exercice

## Comportement cible

| Type de phase | Quand le feedback apparait |
|---|---|
| **Echauffement** | Un seul formulaire de feedback apres avoir coche TOUS les exercices de la phase |
| **Force** | Un mini-formulaire inline apres chaque exercice individuel (quand on le coche) |
| **Stretching / Cool-down** | Un seul formulaire de feedback apres avoir coche TOUS les exercices de la phase |

## Comment ca marche dans l'UI

### Force — feedback par exercice
Quand l'utilisateur coche un exercice de force, un mini-formulaire s'ouvre juste en dessous avec : RPE, reps realisees, douleur oui/non (+ details si oui). Le formulaire se replie quand l'utilisateur passe au suivant ou clique "Valider".

### Echauffement / Stretching — feedback par phase
Quand le dernier exercice de la phase est coche, un formulaire de feedback global de la phase s'affiche en bas de la phase : RPE global, douleur oui/non. Plus simple que le feedback exercice par exercice (pas de reps a renseigner pour l'echauffement).

### Bouton "Terminer la seance"
Le sheet global de fin de seance est supprime. Le bouton "Terminer" enregistre directement les feedbacks deja collectes inline. Si des exercices n'ont pas ete completes, une confirmation s'affiche.

## Fichier modifie

**`src/pages/SessionActive.tsx`** — refactoring complet du flow de feedback :

1. **Detecter le type de phase** : regex sur le titre (`echauffement|warm` → warmup, `stretching|cool|retour` → cooldown, sinon → force)
2. **Composant `InlineExerciseFeedback`** : mini-form qui s'affiche sous un exercice coche (RPE, reps, douleur) — utilise pour les phases force
3. **Composant `PhaseFeedback`** : formulaire simplifie qui s'affiche quand toute la phase est completee (RPE global, douleur) — utilise pour echauffement et stretching
4. **State** : `activeFeedbackExId` pour tracker quel exercice montre son feedback inline
5. **Suppression du Sheet global** : le bouton "Terminer" fait directement le submit avec les feedbacks collectes

