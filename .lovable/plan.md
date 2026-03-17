

## Plan : Insérer les bases de connaissances dans le systemPrompt de l'Edge Function

### Contexte
Les deux fichiers markdown (~1400 et ~1200 lignes) contiennent les bases de connaissances Force et Mobilité. Ils doivent être intégrés dans la variable `systemPrompt` de `supabase/functions/generate-program/index.ts` (ligne 88-92).

### Approche
Remplacer le bloc `systemPrompt` (lignes 83-92) par une version complète contenant :

1. **Le contenu intégral** de `force_knowledge_base_v2.md` en template literal
2. **Le contenu intégral** de `mobility_knowledge_base_v2.md` en template literal
3. **Les données utilisateur** injectées dynamiquement (`forceEval`, `mobilityEval`)
4. **Les instructions de génération** : format JSON attendu, structure jour/phase/exercice

### Structure du systemPrompt

```
const systemPrompt = `
[Règles système + instructions de sortie JSON]

=== BASE DE CONNAISSANCES FORCE ===
[contenu complet du MD force]

=== BASE DE CONNAISSANCES MOBILITÉ ===
[contenu complet du MD mobilité]

=== DONNÉES UTILISATEUR ===
Force: ${JSON.stringify(forceEval)}
Mobilité: ${JSON.stringify(mobilityEval)}

Génère un programme JSON structuré...
`;
```

### Détails techniques
- Le contenu sera inséré comme string literal directement dans le fichier `index.ts` — pas de lecture de fichier externe au runtime
- Les backticks dans le markdown (s'il y en a) seront échappés avec `\``
- Le fichier `index.ts` deviendra volumineux (~2600+ lignes) mais c'est acceptable pour une edge function monolithique
- Aucun autre fichier modifié

### Fichier modifié
- `supabase/functions/generate-program/index.ts` — remplacement des lignes 83-92

