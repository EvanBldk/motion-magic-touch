# AGENTS.md — Motion Magic Touch

## Règles architecturales

- TypeScript strict, jamais de `any`

- Mobile-first : base → md: → lg:

- Modifier UNIQUEMENT les fichiers explicitement nommés

- Supabase RLS obligatoire sur chaque table

## Règles métier

- Les seuils de classification force sont : Pull-ups (0-7 Débutant, 8-14 Intermédiaire, 15+ Avancé), Dips (0-9 Débutant, 10-19 Intermédiaire, 20+ Avancé), Push-ups (0-14 Débutant, 15-29 Intermédiaire, 30+ Avancé)

- Le nombre de séances hebdomadaires DOIT correspondre au champ daysPerWeek du formulaire force, PAS être hardcodé à 4

- Les scores de mobilité doivent être stockés individuellement (21 scores bruts), JAMAIS moyennés

- Le feedback des sessions passées DOIT être injecté dans le prompt de génération de programme

## Conventions de nommage

- Tables Supabase : snake_case

- Composants React : PascalCase

- Hooks : camelCase avec préfixe use

- Edge Functions : kebab-case

## Design

- Utiliser les composants shadcn/ui existants

- Animations via Framer Motion (déjà installé)

- Font Oswald pour les labels uppercase
