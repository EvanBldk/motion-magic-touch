import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   MOCK DATA
   ============================================================ */

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

interface Phase {
  title: string;
  exercises: Exercise[];
}

const PHASES: Phase[] = [
  {
    title: "Échauffement",
    exercises: [
      { id: "w1", name: "Cercles d'épaules", sets: 2, reps: "10 chaque sens", rest: "—" },
      { id: "w2", name: "Cat-Cow", sets: 2, reps: "8", rest: "—" },
      { id: "w3", name: "Scapular pulls", sets: 2, reps: "8", rest: "30s" },
    ],
  },
  {
    title: "Skill Work",
    exercises: [
      { id: "s1", name: "Handstand face au mur", sets: 4, reps: "20–30s", rest: "90s", notes: "Focus sur l'alignement" },
      { id: "s2", name: "L-Sit au sol", sets: 3, reps: "10–15s", rest: "60s" },
    ],
  },
  {
    title: "Force Principale",
    exercises: [
      { id: "f1", name: "Dips aux barres parallèles", sets: 4, reps: "6–8", rest: "120s", notes: "Descente contrôlée 3s" },
      { id: "f2", name: "Tractions pronation", sets: 4, reps: "5–7", rest: "120s" },
      { id: "f3", name: "Push-ups diamant", sets: 3, reps: "8–12", rest: "90s" },
      { id: "f4", name: "Rows horizontaux (anneaux)", sets: 3, reps: "8–10", rest: "90s" },
    ],
  },
  {
    title: "Cool-down",
    exercises: [
      { id: "c1", name: "Étirement pectoraux (porte)", sets: 2, reps: "30s/côté", rest: "—" },
      { id: "c2", name: "Hang passif", sets: 2, reps: "30s", rest: "—" },
      { id: "c3", name: "Pike stretch", sets: 2, reps: "30s", rest: "—" },
    ],
  },
];

/* ============================================================
   FEEDBACK TYPES
   ============================================================ */

interface ExerciseFeedback {
  completed: boolean;
  reps: number | "";
  rpe: string;
  hasPain: boolean | null;
  painDescription: string;
  painIntensity: number;
}

const emptyFeedback = (): ExerciseFeedback => ({
  completed: false,
  reps: "",
  rpe: "",
  hasPain: null,
  painDescription: "",
  painIntensity: 0,
});

/* ============================================================
   SESSION ACTIVE PAGE
   ============================================================ */

const SessionActive = () => {
  const navigate = useNavigate();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(PHASES[0].title);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Feedback state for all exercises
  const [feedbacks, setFeedbacks] = useState<Record<string, ExerciseFeedback>>(() => {
    const initial: Record<string, ExerciseFeedback> = {};
    PHASES.forEach((phase) =>
      phase.exercises.forEach((ex) => {
        initial[ex.id] = emptyFeedback();
      })
    );
    return initial;
  });

  const togglePhase = (title: string) => {
    setExpandedPhase((prev) => (prev === title ? null : title));
  };

  const toggleExercise = (id: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalExercises = PHASES.reduce((sum, p) => sum + p.exercises.length, 0);
  const completedCount = completedExercises.size;
  const progress = (completedCount / totalExercises) * 100;

  const updateFeedback = (exId: string, field: keyof ExerciseFeedback, value: unknown) => {
    setFeedbacks((prev) => ({
      ...prev,
      [exId]: { ...prev[exId], [field]: value },
    }));
  };

  const handleFinishSession = () => {
    console.log("Session feedback:", feedbacks);
    setFeedbackOpen(false);
    navigate("/");
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          <h1 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">
            Séance en cours
          </h1>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalExercises}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mx-auto mt-2 max-w-2xl">
          <div className="h-1 w-full overflow-hidden rounded-sm bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-3">
          {PHASES.map((phase, pi) => {
            const isExpanded = expandedPhase === phase.title;
            const phaseCompleted = phase.exercises.every((ex) =>
              completedExercises.has(ex.id)
            );

            return (
              <motion.div
                key={phase.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: pi * 0.05 }}
                className="rounded-sm border border-border overflow-hidden"
              >
                {/* Phase header */}
                <button
                  onClick={() => togglePhase(phase.title)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
                    phaseCompleted ? "bg-primary/5" : "bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {phaseCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    <h2 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">
                      {phase.title}
                    </h2>
                    <span className="text-[10px] text-muted-foreground">
                      ({phase.exercises.length} exercices)
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Exercises */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="divide-y divide-border">
                        {phase.exercises.map((ex) => {
                          const done = completedExercises.has(ex.id);
                          return (
                            <div
                              key={ex.id}
                              className={cn(
                                "flex items-start gap-3 px-4 py-3 transition-colors",
                                done && "bg-primary/5"
                              )}
                            >
                              <Checkbox
                                checked={done}
                                onCheckedChange={() => toggleExercise(ex.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "text-sm font-medium",
                                    done
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  )}
                                >
                                  {ex.name}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <span>{ex.sets} × {ex.reps}</span>
                                  {ex.rest !== "—" && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> {ex.rest}
                                    </span>
                                  )}
                                </div>
                                {ex.notes && (
                                  <p className="mt-1 text-[11px] italic text-muted-foreground">
                                    {ex.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Finish button */}
      <div className="sticky bottom-16 md:bottom-0 border-t border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <Sheet open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <SheetTrigger asChild>
              <Button className="w-full gap-2 rounded-sm py-5 font-oswald uppercase tracking-wider">
                <Flag className="h-4 w-4" /> Terminer la séance
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-sm">
              <SheetHeader>
                <SheetTitle className="font-oswald uppercase tracking-wider text-primary">
                  Feedback de séance
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6 pb-6">
                {PHASES.map((phase) =>
                  phase.exercises.map((ex) => (
                    <FeedbackBlock
                      key={ex.id}
                      exercise={ex}
                      feedback={feedbacks[ex.id]}
                      onUpdate={(field, value) => updateFeedback(ex.id, field, value)}
                    />
                  ))
                )}

                <Button
                  onClick={handleFinishSession}
                  className="w-full gap-2 rounded-sm py-5 font-oswald uppercase tracking-wider"
                >
                  Soumettre le feedback
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   FEEDBACK BLOCK
   ============================================================ */

interface FeedbackBlockProps {
  exercise: Exercise;
  feedback: ExerciseFeedback;
  onUpdate: (field: keyof ExerciseFeedback, value: unknown) => void;
}

const FeedbackBlock = ({ exercise, feedback, onUpdate }: FeedbackBlockProps) => (
  <div className="space-y-3 rounded-sm border border-border p-4">
    <h3 className="font-oswald text-xs font-semibold uppercase tracking-wider text-primary">
      {exercise.name}
    </h3>

    {/* Completed? */}
    <div className="space-y-1">
      <Label className="text-xs">Exercice complété ?</Label>
      <div className="flex gap-2">
        {[
          { label: "Oui", val: true },
          { label: "Non", val: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onUpdate("completed", opt.val)}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors",
              feedback.completed === opt.val
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>

    {/* Reps achieved */}
    <div className="space-y-1">
      <Label className="text-xs">Reps / Secondes réalisées</Label>
      <Input
        type="number"
        min={0}
        value={feedback.reps}
        onChange={(e) => onUpdate("reps", e.target.value ? Number(e.target.value) : "")}
        placeholder="0"
        className="rounded-sm w-32"
      />
    </div>

    {/* RPE */}
    <div className="space-y-1">
      <Label className="text-xs">Difficulté (RPE 1–10)</Label>
      <Select value={feedback.rpe} onValueChange={(v) => onUpdate("rpe", v)}>
        <SelectTrigger className="rounded-sm w-32">
          <SelectValue placeholder="RPE" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} {n <= 3 ? "— Facile" : n <= 6 ? "— Modéré" : n <= 8 ? "— Difficile" : "— Max"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Pain */}
    <div className="space-y-2">
      <Label className="text-xs">Douleur ressentie ?</Label>
      <div className="flex gap-2">
        {[
          { label: "Oui", val: true },
          { label: "Non", val: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onUpdate("hasPain", opt.val)}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors",
              feedback.hasPain === opt.val
                ? opt.val
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>

    <AnimatePresence>
      {feedback.hasPain === true && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label className="text-xs">Décris la douleur</Label>
            <Input
              value={feedback.painDescription}
              onChange={(e) => onUpdate("painDescription", e.target.value)}
              placeholder="Zone et type de douleur…"
              className="rounded-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              Intensité NPRS : {feedback.painIntensity}/10
            </Label>
            <input
              type="range"
              min={0}
              max={10}
              value={feedback.painIntensity}
              onChange={(e) => onUpdate("painIntensity", Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-oswald">
              <span>Aucune</span>
              <span>Insupportable</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default SessionActive;
