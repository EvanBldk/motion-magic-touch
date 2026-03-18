import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";

interface Exercise {
  name: string;
  duration: string;
  cue: string;
}

interface WeakZone {
  zone: string;
  score: number;
  exercises: Exercise[];
}

interface MobilityScores {
  wrists: number;
  shoulders: number;
  thoracic: number;
  posterior: number;
  hips: number;
  ankles: number;
}

export function getRestDayExercises(mobilityScores: MobilityScores): WeakZone[] {
  const zones: WeakZone[] = [];

  // Toujours inclure les CARs de base
  zones.push({
    zone: "Global",
    score: 5,
    exercises: [
      { name: "Cercles d'épaules (CARs)", duration: "1 min", cue: "Cercles lents et complets, maximise l'amplitude" },
      { name: "Cercles de hanches (CARs)", duration: "1 min", cue: "Debout, cercles complets avec le genou levé" },
    ],
  });

  if (mobilityScores.shoulders <= 3) {
    zones.push({
      zone: "Épaules",
      score: mobilityScores.shoulders,
      exercises: [
        { name: "Posture du chiot (Puppy pose)", duration: "45s", cue: "À genoux, bras tendus devant, poitrine vers le sol" },
        { name: "Glissements muraux (Wall slides)", duration: "10 reps", cue: "Dos au mur, glisse les bras vers le haut sans décoller" },
      ],
    });
  }

  if (mobilityScores.thoracic <= 3) {
    zones.push({
      zone: "Thoracique",
      score: mobilityScores.thoracic,
      exercises: [
        { name: "Chat-Vache (Cat-Cow)", duration: "10 reps", cue: "4 pattes, alterner dos rond et dos creux lentement" },
        { name: "Fil dans l'aiguille (Thread the Needle)", duration: "6 par côté", cue: "4 pattes, passer le bras sous le corps puis ouvrir" },
      ],
    });
  }

  if (mobilityScores.hips <= 3) {
    zones.push({
      zone: "Hanches",
      score: mobilityScores.hips,
      exercises: [
        { name: "Squat profond maintenu", duration: "45s", cue: "Descends en squat, coudes contre les genoux, respire" },
        { name: "Posture du pigeon", duration: "45s par côté", cue: "Jambe avant pliée, jambe arrière étendue, descends le buste" },
      ],
    });
  }

  if (mobilityScores.posterior <= 3) {
    zones.push({
      zone: "Chaîne postérieure",
      score: mobilityScores.posterior,
      exercises: [
        { name: "Flexion avant debout", duration: "45s", cue: "Penche-toi en avant, laisse pendre les bras, respire dans l'étirement" },
      ],
    });
  }

  if (mobilityScores.ankles <= 3) {
    zones.push({
      zone: "Chevilles",
      score: mobilityScores.ankles,
      exercises: [
        { name: "Genou au mur (Knee-to-wall)", duration: "10 par cheville", cue: "Face au mur, avance le genou en gardant le talon au sol" },
      ],
    });
  }

  if (mobilityScores.wrists <= 3) {
    zones.push({
      zone: "Poignets",
      score: mobilityScores.wrists,
      exercises: [
        { name: "Cercles de poignets (CARs)", duration: "10 par direction", cue: "Poing fermé, cercles lents et complets" },
        { name: "Étirement extension poignet", duration: "20s", cue: "Main à plat au sol, avance les épaules doucement" },
      ],
    });
  }

  // Toujours finir par la respiration
  zones.push({
    zone: "Récupération",
    score: 5,
    exercises: [
      { name: "Respiration diaphragmatique", duration: "1 min", cue: "4s inspiration nez, 6s expiration bouche. Détends-toi." },
    ],
  });

  return zones;
}

interface RestDayRoutineProps {
  weakZones: WeakZone[];
}

const RestDayRoutine = ({ weakZones }: RestDayRoutineProps) => {
  const [started, setStarted] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [checkedExercises, setCheckedExercises] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);

  const totalExercises = weakZones.reduce((sum, z) => sum + z.exercises.length, 0);
  const doneCount = checkedExercises.size;
  const allDone = doneCount === totalExercises;

  const toggleExercise = (id: string) => {
    setCheckedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (skipped) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-sm border border-border p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">Jour de repos — récupère bien 💪</p>
      </motion.div>
    );
  }

  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-sm border border-primary/30 bg-primary/5 p-5 space-y-2"
      >
        <div className="flex items-center gap-2">
          <Stretch className="h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-primary">Routine mobilité terminée !</p>
        </div>
        <p className="text-xs text-muted-foreground">Bien joué — ton corps te remercie 🧘</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-sm border border-border p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-oswald uppercase tracking-widest text-muted-foreground">Jour de repos</p>
          <h2 className="mt-1 text-lg font-semibold text-primary">Routine mobilité (8 min)</h2>
          <p className="mt-1 text-xs text-muted-foreground">Garde le corps mobile sans fatiguer tes muscles</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {!started ? (
              <>
                {/* Preview zones */}
                <div className="space-y-2">
                  {weakZones.filter((z) => z.score <= 3).length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Exercices ciblés pour tes zones faibles :{" "}
                      <span className="font-medium text-foreground">
                        {weakZones.filter((z) => z.score <= 3).map((z) => z.zone).join(", ")}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {totalExercises} exercices • CARs + mobilité ciblée + respiration
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStarted(true)}
                    className="flex-1 gap-2 rounded-sm font-oswald uppercase tracking-wider text-xs"
                  >
                    <Stretch className="h-4 w-4" /> Commencer
                  </Button>
                  <Button
                    onClick={() => setSkipped(true)}
                    variant="outline"
                    className="rounded-sm font-oswald uppercase tracking-wider text-xs"
                  >
                    Passer
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${(doneCount / totalExercises) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-oswald uppercase tracking-wider text-muted-foreground">
                    {doneCount}/{totalExercises}
                  </span>
                </div>

                {/* Exercise list by zone */}
                <div className="space-y-4">
                  {weakZones.map((zone) => (
                    <div key={zone.zone} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-oswald text-xs font-semibold uppercase tracking-wider text-primary">
                          {zone.zone}
                        </h3>
                        {zone.score <= 3 && (
                          <span className="text-[9px] rounded-sm bg-destructive/10 text-destructive px-1.5 py-0.5 font-medium">
                            Score {zone.score}/5
                          </span>
                        )}
                      </div>
                      {zone.exercises.map((ex) => {
                        const id = `${zone.zone}-${ex.name}`;
                        const done = checkedExercises.has(id);
                        return (
                          <label
                            key={id}
                            className="flex items-start gap-3 rounded-sm border border-border p-3 cursor-pointer transition-colors hover:border-primary/50 has-[:checked]:border-primary/30 has-[:checked]:bg-primary/5"
                          >
                            <Checkbox
                              checked={done}
                              onCheckedChange={() => toggleExercise(id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {ex.name}
                                </span>
                                <span className="text-[10px] font-oswald uppercase tracking-wider text-muted-foreground shrink-0">
                                  {ex.duration}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{ex.cue}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RestDayRoutine;
