import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, ChevronDown, ChevronUp, Flag, Loader2, Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProgram, useCompletedSessions } from "@/hooks/useProgram";
import { toast } from "@/hooks/use-toast";
import type { ProgramPhase } from "@/hooks/useProgram";
import { cleanExerciseName } from "@/hooks/useProgram";

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

interface ExerciseFeedback {
  completed: boolean;
  reps: number | "";
  rpe: string;
  hasPain: boolean | null;
  painDescription: string;
  painIntensity: number;
}

const emptyFeedback = (): ExerciseFeedback => ({
  completed: false, reps: "", rpe: "", hasPain: null, painDescription: "", painIntensity: 0,
});

function programPhasesToPhases(programPhases: ProgramPhase[]): Phase[] {
  let idx = 0;
  return programPhases.map((p) => ({
    title: p.name,
    exercises: p.exercises.map((ex) => ({
      id: `ex-${idx++}`,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest: ex.rest,
      notes: ex.notes,
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

const RestTimer = ({ seconds, onDone }: { seconds: number; onDone: () => void }) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 100;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 rounded-sm border border-border bg-background p-8 shadow-lg">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <span className="font-oswald text-sm uppercase tracking-wider text-muted-foreground">Repos</span>
        </div>
        <span className="text-5xl font-bold tabular-nums text-primary">
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
        <div className="h-1.5 w-48 overflow-hidden rounded-sm bg-secondary">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={onDone} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3 w-3" /> Passer
        </button>
      </div>
    </motion.div>
  );
};

const SessionActive = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { program, loading: progLoading } = useCurrentProgram();
  const { todaySession, loading: sessLoading } = useCompletedSessions();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, ExerciseFeedback>>({});
  const [submitting, setSubmitting] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);

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

  // Init feedbacks when phases load
  useEffect(() => {
    if (phases.length > 0 && Object.keys(feedbacks).length === 0) {
      const initial: Record<string, ExerciseFeedback> = {};
      phases.forEach((p) => p.exercises.forEach((ex) => { initial[ex.id] = emptyFeedback(); }));
      setFeedbacks(initial);
      setExpandedPhase(phases[0].title);
    }
  }, [phases.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePhase = (title: string) => setExpandedPhase((prev) => (prev === title ? null : title));
  const handleDismissTimer = useCallback(() => setRestTimer(null), []);

  const toggleExercise = (id: string, rest?: string) => {
    const wasCompleted = completedExercises.has(id);
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    if (!wasCompleted && rest) {
      const secs = parseRestSeconds(rest);
      if (secs > 0) setRestTimer(secs);
    }
  };

  const totalExercises = phases.reduce((sum, p) => sum + p.exercises.length, 0);
  const completedCount = completedExercises.size;
  const progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  const updateFeedback = (exId: string, field: keyof ExerciseFeedback, value: unknown) => {
    setFeedbacks((prev) => ({ ...prev, [exId]: { ...prev[exId], [field]: value } }));
  };

  const handleFinishSession = async () => {
    if (!user || !program) return;
    setSubmitting(true);
    try {
      const painReports = Object.values(feedbacks)
        .filter((f) => f.hasPain === true)
        .map((f) => f.painDescription)
        .filter(Boolean)
        .join("; ");

      const todayDate = new Date().toISOString().split("T")[0];

      // Use upsert to handle unique constraint
      const { error } = await supabase.from("daily_sessions").upsert([{
        user_id: user.id,
        program_id: program.id,
        date: todayDate,
        is_completed: true,
        feedback_reps: JSON.parse(JSON.stringify(feedbacks)),
        pain_reported: painReports || null,
      }], { onConflict: "user_id,date" });

      if (error) throw error;

      toast({ title: "Séance enregistrée", description: "Ton feedback a été sauvegardé." });
      setFeedbackOpen(false);
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
            const phaseCompleted = phase.exercises.every((ex) => completedExercises.has(ex.id));
            return (
              <motion.div key={phase.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: pi * 0.05 }} className="rounded-sm border border-border overflow-hidden">
                <button onClick={() => togglePhase(phase.title)} className={cn("flex w-full items-center justify-between px-4 py-3 text-left transition-colors", phaseCompleted ? "bg-primary/5" : "bg-secondary/30")}>
                  <div className="flex items-center gap-2">
                    {phaseCompleted && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    <h2 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">{phase.title}</h2>
                    <span className="text-[10px] text-muted-foreground">({phase.exercises.length} exercices)</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="divide-y divide-border">
                        {phase.exercises.map((ex) => {
                          const done = completedExercises.has(ex.id);
                          return (
                            <div key={ex.id} className={cn("flex items-start gap-3 px-4 py-3 transition-colors", done && "bg-primary/5")}>
                              <Checkbox checked={done} onCheckedChange={() => toggleExercise(ex.id, ex.rest)} className="mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium", done ? "text-muted-foreground line-through" : "text-foreground")}>{ex.name}</p>
                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <span>{ex.sets} × {ex.reps}</span>
                                  {ex.rest !== "—" && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ex.rest}</span>}
                                </div>
                                {ex.notes && <p className="mt-1 text-[11px] italic text-muted-foreground">{ex.notes}</p>}
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
                <SheetTitle className="font-oswald uppercase tracking-wider text-primary">Feedback de séance</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6 pb-6">
                {phases.map((phase) =>
                  phase.exercises.map((ex) => (
                    <FeedbackBlock key={ex.id} exercise={ex} feedback={feedbacks[ex.id] ?? emptyFeedback()} onUpdate={(field, value) => updateFeedback(ex.id, field, value)} />
                  ))
                )}
                <Button onClick={handleFinishSession} disabled={submitting} className="w-full gap-2 rounded-sm py-5 font-oswald uppercase tracking-wider">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> : "Soumettre le feedback"}
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
    <h3 className="font-oswald text-xs font-semibold uppercase tracking-wider text-primary">{exercise.name}</h3>
    <div className="space-y-1">
      <Label className="text-xs">Exercice complété ?</Label>
      <div className="flex gap-2">
        {[{ label: "Oui", val: true }, { label: "Non", val: false }].map((opt) => (
          <button key={opt.label} type="button" onClick={() => onUpdate("completed", opt.val)} className={cn("rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors", feedback.completed === opt.val ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary")}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
    <div className="space-y-1">
      <Label className="text-xs">Reps / Secondes réalisées</Label>
      <Input type="number" min={0} value={feedback.reps} onChange={(e) => onUpdate("reps", e.target.value ? Number(e.target.value) : "")} placeholder="0" className="rounded-sm w-32" />
    </div>
    <div className="space-y-1">
      <Label className="text-xs">Difficulté (RPE 1–10)</Label>
      <Select value={feedback.rpe} onValueChange={(v) => onUpdate("rpe", v)}>
        <SelectTrigger className="rounded-sm w-32"><SelectValue placeholder="RPE" /></SelectTrigger>
        <SelectContent>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <SelectItem key={n} value={String(n)}>{n} {n <= 3 ? "— Facile" : n <= 6 ? "— Modéré" : n <= 8 ? "— Difficile" : "— Max"}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label className="text-xs">Douleur ressentie ?</Label>
      <div className="flex gap-2">
        {[{ label: "Oui", val: true }, { label: "Non", val: false }].map((opt) => (
          <button key={opt.label} type="button" onClick={() => onUpdate("hasPain", opt.val)} className={cn("rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors", feedback.hasPain === opt.val ? (opt.val ? "border-destructive bg-destructive/10 text-destructive" : "border-primary bg-primary text-primary-foreground") : "border-border text-muted-foreground hover:border-primary")}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
    <AnimatePresence>
      {feedback.hasPain === true && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Décris la douleur</Label>
            <Input value={feedback.painDescription} onChange={(e) => onUpdate("painDescription", e.target.value)} placeholder="Zone et type de douleur…" className="rounded-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Intensité NPRS : {feedback.painIntensity}/10</Label>
            <input type="range" min={0} max={10} value={feedback.painIntensity} onChange={(e) => onUpdate("painIntensity", Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-[10px] text-muted-foreground font-oswald"><span>Aucune</span><span>Insupportable</span></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default SessionActive;
