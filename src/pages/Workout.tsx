import { motion } from "framer-motion";
import { Calendar, Activity, AlertTriangle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCompletedSessions } from "@/hooks/useProgram";
import type { CompletedSession } from "@/hooks/useProgram";
import type { Json } from "@/integrations/supabase/types";

function parseAvgRpe(feedbackReps: Json): string {
  if (!feedbackReps || typeof feedbackReps !== "object" || Array.isArray(feedbackReps)) return "—";
  const fb = feedbackReps as Record<string, Json>;
  const rpes: number[] = [];

  // Exercise feedbacks (nested under "exercises" key)
  const exercises = fb.exercises;
  if (exercises && typeof exercises === "object" && !Array.isArray(exercises)) {
    Object.values(exercises).forEach((e) => {
      if (e && typeof e === "object" && !Array.isArray(e)) {
        const rpe = Number((e as Record<string, unknown>).rpe);
        if (!isNaN(rpe) && rpe > 0) rpes.push(rpe);
      }
    });
  }

  // Phase feedbacks (nested under "phases" key)
  const phases = fb.phases;
  if (phases && typeof phases === "object" && !Array.isArray(phases)) {
    Object.values(phases).forEach((p) => {
      if (p && typeof p === "object" && !Array.isArray(p)) {
        const rpe = Number((p as Record<string, unknown>).rpe);
        if (!isNaN(rpe) && rpe > 0) rpes.push(rpe);
      }
    });
  }

  // Fallback: flat structure (legacy data)
  if (rpes.length === 0) {
    Object.values(fb).forEach((e) => {
      if (e && typeof e === "object" && !Array.isArray(e)) {
        const rpe = Number((e as Record<string, unknown>).rpe);
        if (!isNaN(rpe) && rpe > 0) rpes.push(rpe);
      }
    });
  }

  if (rpes.length === 0) return "—";
  return (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1);
}

function countExercises(feedbackReps: Json): number {
  if (!feedbackReps || typeof feedbackReps !== "object" || Array.isArray(feedbackReps)) return 0;
  const fb = feedbackReps as Record<string, Json>;

  // New structure: count entries in "exercises"
  const exercises = fb.exercises;
  if (exercises && typeof exercises === "object" && !Array.isArray(exercises)) {
    return Object.values(exercises).filter((e) =>
      e && typeof e === "object" && !Array.isArray(e) && (e as Record<string, unknown>).completed === true
    ).length;
  }

  // Fallback: flat structure (legacy)
  return Object.values(fb).filter((e) =>
    e && typeof e === "object" && !Array.isArray(e) && (e as Record<string, unknown>).completed === true
  ).length;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

const SessionCard = ({ session }: { session: CompletedSession }) => {
  const avgRpe = parseAvgRpe(session.feedback_reps);
  const exerciseCount = countExercises(session.feedback_reps);

  return (
    <div className="rounded-sm border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground capitalize">{formatDate(session.date)}</span>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          <span>RPE moy. {avgRpe}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {exerciseCount} exercice{exerciseCount > 1 ? "s" : ""} complété{exerciseCount > 1 ? "s" : ""}
        </div>
        {session.pain_reported && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Douleur</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Workout = () => {
  const { sessions, count, streak, loading, error } = useCompletedSessions();

  if (loading) {
    return (
      <div className="flex flex-1 flex-col p-4 md:p-8">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-sm" />
            <Skeleton className="h-20 rounded-sm" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-xs font-oswald uppercase tracking-widest text-muted-foreground">Historique</p>
          <h1 className="mt-1 text-2xl font-bold text-primary">Mes séances</h1>
        </motion.div>

        {/* Stats summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center rounded-sm border border-border p-4">
            <span className="text-2xl font-bold text-primary">{count}</span>
            <span className="mt-1 text-[10px] font-oswald uppercase tracking-wider text-muted-foreground">Séances totales</span>
          </div>
          <div className="flex flex-col items-center rounded-sm border border-border p-4">
            <span className="text-2xl font-bold text-primary">{streak}j</span>
            <span className="mt-1 text-[10px] font-oswald uppercase tracking-wider text-muted-foreground">Série en cours</span>
          </div>
        </motion.div>

        {/* Session list */}
        {sessions.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="rounded-sm border border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Aucune séance complétée pour l'instant.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <motion.div key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 + i * 0.03 }}>
                <SessionCard session={session} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workout;
