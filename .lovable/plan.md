

# Plan — Exercices lisibles et descriptions claires

## Probleme identifie

Les exercices generes par l'IA utilisent des codes catalogue internes (`MOB_PG_001`, `PUSH_H_004`, etc.) comme noms. Exemples reels en base :
- `MOB_PG_001 (Wrist CARs)` → devrait etre "Cercles de poignets (Wrist CARs)"
- `PUSH_H_004 (Pompe standard)` → devrait etre "Pompe standard"
- `USH_V_001 (Pike push-up)` → typo + code inutile
- `False grip hang (anneaux/barre si possible)` → celui-ci est OK

De plus, il n'y a **aucune description d'execution** pour guider l'utilisateur sur la technique.

## Solution en 2 volets

### 1. Ameliorer le prompt IA (Edge Function)

Modifier les instructions dans `generate-program/index.ts` pour :
- Demander explicitement des **noms en francais lisibles** (pas de codes catalogue)
- Ajouter un champ `cues` (indices techniques) obligatoire a chaque exercice
- Ajouter un champ `tempo` quand pertinent

Ajouter dans le systemPrompt une regle explicite :
> "Les noms d'exercices doivent etre en francais courant, sans codes catalogue. Chaque exercice doit inclure 1-2 phrases de cues techniques dans le champ `cues`."

Mettre a jour le schema JSON du tool calling pour inclure :
- `cues` (string, required) : 1-2 phrases d'instruction technique
- `tempo` (string, optional) : cadence d'execution

### 2. Afficher les descriptions dans l'UI (SessionActive + Dashboard)

- **SessionActive** : afficher le champ `cues` sous chaque exercice (texte italique, petite taille)
- **SessionActive** : afficher le `tempo` a cote des sets/reps si present
- **Dashboard** (programme semaine) : pas de changement majeur, les noms seront deja lisibles
- **Hooks** : ajouter `cues` et `tempo` aux interfaces `ProgramExercise`

### 3. Nettoyer les programmes existants (optionnel)

Ajouter une fonction utilitaire cote client qui strip les codes catalogue des noms existants (regex `/^[A-Z_]+\d+ \((.+)\)$/` → capture group 1). Cela rend les anciens programmes lisibles sans regeneration.

## Fichiers modifies

| Fichier | Modification |
|---|---|
| `supabase/functions/generate-program/index.ts` | Ajouter regle de nommage dans systemPrompt + `cues`/`tempo` dans le schema tool calling |
| `src/hooks/useProgram.ts` | Ajouter `cues?` et `tempo?` a `ProgramExercise` |
| `src/pages/SessionActive.tsx` | Afficher `cues` et `tempo` sous chaque exercice |
| `src/pages/Dashboard.tsx` | Ajouter fonction de nettoyage des codes pour les noms affiches |

## Details techniques

**Regex de nettoyage** (pour les anciens programmes) :
```typescript
function cleanExerciseName(name: string): string {
  const match = name.match(/^[A-Z_]+\d+\s*\((.+)\)$/);
  return match ? match[1] : name;
}
```

**Ajout au systemPrompt** (apres les regles systeme existantes) :
```
11. Les noms d'exercices doivent etre en FRANCAIS COURANT, sans codes catalogue (pas de PUSH_H_004, MOB_PG_001, etc.). Exemple : "Pompe standard", "Cercles de poignets", "Traction stricte".
12. Chaque exercice DOIT inclure un champ "cues" contenant 1-2 phrases courtes d'instructions techniques pour guider l'execution.
```

**Schema tool calling** — ajout dans `exercises.items.properties` :
```json
"cues": { "type": "string", "description": "1-2 phrases d'instructions techniques" },
"tempo": { "type": "string", "description": "Cadence d'execution, ex: 2-1-2" }
```
Et ajouter `"cues"` dans le `required` des exercices.

