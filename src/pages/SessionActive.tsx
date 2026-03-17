import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, ChevronDown, ChevronUp, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProgram, useCompletedSessions } from "@/hooks/useProgram";
import { toast } from "@/hooks/use-toast";
import type { ProgramPhase } from "@/hooks/useProgram";
import { cleanExerciseName } from "@/hooks/useProgram";
import RestTimer from "@/components/session/RestTimer";
import InlineExerciseFeedback, { type ExerciseFeedbackData } from "@/components/session/InlineExerciseFeedback";
import PhaseFeedback, { type PhaseFeedbackData } from "@/components/session/PhaseFeedback";

/* ── Types ── */

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  cues?: string;
  tempo?: string;
}

interface Phase {
  title: string;
  type: "warmup" | "force" | "cooldown";
  exercises: Exercise[];
}

function detectPhaseType(title: string): Phase["type"] {
  const t = title.toLowerCase();
  if (/[ée]chauffement|warm/i.test(t)) return "warmup";
  if (/stretch|cool|retour|[ée]tirement/i.test(t)) return "cooldown";
  return "force";
}

function programPhasesToPhases(programPhases: ProgramPhase[]): Phase[] {
  let idx = 0;
  return programPhases.map((p) => ({
    title: p.name,
    type: detectPhaseType(p.name),
    exercises: p.exercises.map((ex) => ({
      id: `ex-${idx++}`,
      name: cleanExerciseName(ex.name),
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest,
      notes: ex.notes,
      cues: ex.cues,
      tempo: ex.tempo,
    })),
  }));
}

function getTodayDayName(): string {
  const names = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  return names[new Date().getDay()];
}

function parseRestSeconds(rest: string): number {
  const match = rest.match(/(\d+)/);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  if (rest.toLowerCase().includes("min")) return num * 60;
  return num;
}

/* ── Main component ── */

const SessionActive = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { program, loading: progLoading } = useCurrentProgram();
  const { todaySession, loading: sessLoading } = useCompletedSessions();

  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Inline feedback state
  const [activeFeedbackExId, setActiveFeedbackExId] = useState<string | null>(null);
  const [exerciseFeedbacks, setExerciseFeedbacks] = useState<Record<string, ExerciseFeedbackData>>({});
  const [phaseFeedbacks, setPhaseFeedbacks] = useState<Record<string, PhaseFeedbackData>>({});
  const [submittedPhaseFeedbacks, setSubmittedPhaseFeedbacks] = useState<Set<string>>(new Set());

  // Redirect if today's session is already done
  useEffect(() => {
    if (!sessLoading && todaySession) {
      toast({ title: "Séance déjà complétée", description: "Tu as déjà terminé ta séance du jour." });
      navigate("/", { replace: true });
    }
  }, [sessLoading, todaySession, navigate]);

  // Derive phases from program
  const gen = program?.ai_generated;
  const todayName = getTodayDayName();
  const todayDay = gen?.days.find((d) => d.day.toLowerCase().startsWith(todayName));
  const phases: Phase[] = todayDay ? programPhasesToPhases(todayDay.phases) : [];

  // Auto-expand first phase
  useEffect(() => {
    if (phases.length > 0 && expandedPhase === null) {
      setExpandedPhase(phases[0].title);
    }
  }, [phases.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePhase = (title: string) => setExpandedPhase((prev) => (prev === title ? null : title));
  const handleDismissTimer = useCallback(() => setRestTimer(null), []);

  const toggleExercise = (ex: Exercise, phase: Phase) => {
    const wasCompleted = completedExercises.has(ex.id);

    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(ex.id)) next.delete(ex.id);
      else next.add(ex.id);
      return next;
    });

    if (!wasCompleted) {
      // Start rest timer
      if (ex.rest) {
        const secs = parseRestSeconds(ex.rest);
        if (secs > 0) setRestTimer(secs);
      }

      // For force phases: show inline feedback for this exercise
      if (phase.type === "force") {
        setActiveFeedbackExId(ex.id);
      }
    } else {
      // Unchecking: clear feedback
      if (phase.type === "force") {
        setActiveFeedbackExId(null);
        setExerciseFeedbacks((prev) => {
          const next = { ...prev };
          delete next[ex.id];
          return next;
        });
      }
    }
  };

  const handleExerciseFeedbackSubmit = (exId: string, data: ExerciseFeedbackData) => {
    setExerciseFeedbacks((prev) => ({ ...prev, [exId]: data }));
    setActiveFeedbackExId(null);
  };

  const handlePhaseFeedbackSubmit = (phaseTitle: string, data: PhaseFeedbackData) => {
    setPhaseFeedbacks((prev) => ({ ...prev, [phaseTitle]: data }));
    setSubmittedPhaseFeedbacks((prev) => new Set(prev).add(phaseTitle));
  };

  const totalExercises = phases.reduce((sum, p) => sum + p.exercises.length, 0);
  const completedCount = completedExercises.size;
  const progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  const isPhaseComplete = (phase: Phase) => phase.exercises.every((ex) => completedExercises.has(ex.id));

  const handleFinishClick = () => {
    if (completedCount < totalExercises) {
      setConfirmOpen(true);
    } else {
      handleFinishSession();
    }
  };

  const handleFinishSession = async () => {
    if (!user || !program) return;
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      // Collect pain reports from exercise feedbacks
      const painParts: string[] = [];
      Object.values(exerciseFeedbacks).forEach((f) => {
        if (f.hasPain && f.painDescription) painParts.push(f.painDescription);
      });
      Object.entries(phaseFeedbacks).forEach(([phase, f]) => {
        if (f.hasPain && f.painDescription) painParts.push(`[${phase}] ${f.painDescription}`);
      });

      const todayDate = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("daily_sessions").upsert([{
        user_id: user.id,
        program_id: program.id,
        date: todayDate,
        is_completed: true,
        feedback_reps: JSON.parse(JSON.stringify({
          exercises: exerciseFeedbacks,
          phases: phaseFeedbacks,
        })),
        pain_reported: painParts.join("; ") || null,
      }], { onConflict: "user_id,date" });

      if (error) throw error;

      toast({ title: "Séance enregistrée", description: "Ton feedback a été sauvegardé." });
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (progLoading || sessLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!todayDay) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 space-y-4">
        <p className="text-sm text-muted-foreground">Pas de séance prévue aujourd'hui.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="rounded-sm font-oswald uppercase tracking-wider">
          Retour au dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {restTimer !== null && <RestTimer seconds={restTimer} onDone={handleDismissTimer} />}
      </AnimatePresence>

      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          <h1 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">
            {todayDay.title}
          </h1>
          <span className="text-xs text-muted-foreground">{completedCount}/{totalExercises}</span>
        </div>
        <div className="mx-auto mt-2 max-w-2xl">
          <div className="h-1 w-full overflow-hidden rounded-sm bg-secondary">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-3">
          {phases.map((phase, pi) => {
            const isExpanded = expandedPhase === phase.title;
            const phaseCompleted = isPhaseComplete(phase);
            const showPhaseFeedback =
              (phase.type === "warmup" || phase.type === "cooldown") &&
              phaseCompleted &&
              !submittedPhaseFeedbacks.has(phase.title);
            const phaseFeedbackDone = submittedPhaseFeedbacks.has(phase.title);

            return (
              <motion.div
                key={phase.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: pi * 0.05 }}
                className="rounded-sm border border-border overflow-hidden"
              >
                <button
                  onClick={() => togglePhase(phase.title)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
                    phaseCompleted ? "bg-primary/5" : "bg-secondary/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {phaseCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    <h2 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">
                      {phase.title}
                    </h2>
                    <span className="text-[10px] text-muted-foreground">
                      ({phase.exercises.length} exercices)
                    </span>
                    {phaseFeedbackDone && (
                      <span className="text-[10px] text-primary font-medium">✓ feedback</span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

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
                          const showFeedback = phase.type === "force" && activeFeedbackExId === ex.id;
                          const hasFeedback = !!exerciseFeedbacks[ex.id];

                          return (
                            <div key={ex.id}>
                              <div className={cn("flex items-start gap-3 px-4 py-3 transition-colors", done && "bg-primary/5")}>
                                <Checkbox
                                  checked={done}
                                  onCheckedChange={() => toggleExercise(ex, phase)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={cn("text-sm font-medium", done ? "text-muted-foreground line-through" : "text-foreground")}>
                                      {ex.name}
                                    </p>
                                    {hasFeedback && (
                                      <span className="text-[10px] text-primary font-medium">✓</span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span>{ex.sets} × {ex.reps}</span>
                                    {ex.tempo && <span className="font-mono text-[10px] text-primary/70">tempo {ex.tempo}</span>}
                                    {ex.rest !== "—" && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ex.rest}</span>}
                                  </div>
                                  {ex.cues && <p className="mt-1 text-[11px] italic text-muted-foreground/80">{ex.cues}</p>}
                                  {ex.notes && <p className="mt-1 text-[11px] italic text-muted-foreground">{ex.notes}</p>}
                                </div>
                              </div>

                              {/* Inline exercise feedback (force only) */}
                              <AnimatePresence>
                                {showFeedback && (
                                  <InlineExerciseFeedback
                                    exerciseName={ex.name}
                                    onSubmit={(data) => handleExerciseFeedbackSubmit(ex.id, data)}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                      {/* Phase feedback (warmup / cooldown) */}
                      <AnimatePresence>
                        {showPhaseFeedback && (
                          <PhaseFeedback
                            phaseTitle={phase.title}
                            onSubmit={(data) => handlePhaseFeedbackSubmit(phase.title, data)}
                          />
                        )}
                      </AnimatePresence>
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
          <Button
            onClick={handleFinishClick}
            disabled={submitting}
            className="w-full gap-2 rounded-sm py-5 font-oswald uppercase tracking-wider"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
            ) : (
              <><Flag className="h-4 w-4" /> Terminer la séance</>
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation dialog for incomplete exercises */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-oswald uppercase tracking-wider">
              Exercices incomplets
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tu as complété {completedCount}/{totalExercises} exercices. Terminer quand même ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm">Continuer</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishSession} className="rounded-sm">
              Terminer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionActive;
