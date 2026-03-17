import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, BookOpen, Clock, Repeat, Timer, Info, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCurrentProgram } from "@/hooks/useProgram";
import { cleanExerciseName } from "@/hooks/useProgram";
import type { ProgramDay, ProgramPhase, ProgramExercise } from "@/hooks/useProgram";
import { cn } from "@/lib/utils";

const DAY_NAME_MAP: Record<number, string> = {
  0: "dimanche", 1: "lundi", 2: "mardi", 3: "mercredi",
  4: "jeudi", 5: "vendredi", 6: "samedi",
};

function isTodayDay(dayName: string): boolean {
  const todayName = DAY_NAME_MAP[new Date().getDay()];
  return dayName.toLowerCase().startsWith(todayName);
}

function ExerciseCard({ exercise }: { exercise: ProgramExercise }) {
  return (
    <div className="rounded-sm border border-border bg-secondary/20 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{cleanExerciseName(exercise.name)}</h4>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Repeat className="h-3 w-3" />
          {exercise.sets} × {exercise.reps}
        </span>
        <span className="flex items-center gap-1">
          <Timer className="h-3 w-3" />
          {exercise.rest}
        </span>
        {exercise.tempo && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {exercise.tempo}
          </span>
        )}
      </div>
      {exercise.cues && (
        <p className="text-xs italic text-muted-foreground leading-relaxed">{exercise.cues}</p>
      )}
      {exercise.notes && (
        <p className="text-xs text-muted-foreground/70">{exercise.notes}</p>
      )}
    </div>
  );
}

function PhaseSection({ phase }: { phase: ProgramPhase }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-oswald uppercase tracking-widest text-primary">{phase.name}</h3>
      <div className="space-y-2">
        {phase.exercises.map((ex, j) => (
          <ExerciseCard key={j} exercise={ex} />
        ))}
      </div>
    </div>
  );
}

function DayAccordion({ day, index }: { day: ProgramDay; index: number }) {
  const navigate = useNavigate();
  const isToday = isTodayDay(day.day);
  const totalExercises = day.phases.reduce((s, p) => s + p.exercises.length, 0);

  return (
    <AccordionItem value={`day-${index}`} className={cn("border border-border rounded-sm px-4", isToday && "border-primary/50 bg-primary/5")}>
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex flex-1 items-center justify-between pr-2">
          <div className="flex items-center gap-2">
            <span className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">{day.day}</span>
            {isToday && <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-oswald uppercase text-primary-foreground">Aujourd'hui</span>}
          </div>
          <span className="text-xs text-muted-foreground">{totalExercises} exercices</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4">
        <p className="text-xs text-muted-foreground">{day.title}</p>
        {day.objective && (
          <div className="flex items-start gap-2 rounded-sm bg-primary/10 border border-primary/20 p-3">
            <Target className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p className="text-xs font-medium text-foreground leading-relaxed">{day.objective}</p>
          </div>
        )}
        {day.rationale && (
          <div className="flex items-start gap-2 rounded-sm bg-secondary/50 p-3">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{day.rationale}</p>
          </div>
        )}
        {day.phases.map((phase, j) => (
          <PhaseSection key={j} phase={phase} />
        ))}
        {isToday && (
          <Button onClick={() => navigate("/session-active")} className="w-full gap-2 rounded-sm py-5 font-oswald uppercase tracking-wider">
            Démarrer la séance <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

const Programme = () => {
  const { program, loading } = useCurrentProgram();
  const navigate = useNavigate();
  const gen = program?.ai_generated;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col p-4 md:p-8">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-24 rounded-sm" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!gen) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Aucun programme généré pour le moment.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="rounded-sm font-oswald uppercase tracking-wider">
          Retour au dashboard
        </Button>
      </div>
    );
  }

  // Find today's day index for default open accordion
  const todayIndex = gen.days.findIndex((d) => isTodayDay(d.day));

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 pb-24 md:pb-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-xs font-oswald uppercase tracking-widest text-muted-foreground">Programme semaine {gen.week_number}</p>
          <h1 className="mt-1 text-2xl font-bold text-primary">{gen.theme}</h1>
        </motion.div>

        {/* Global rationale */}
        {gen.rationale && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-sm border border-primary/20 bg-primary/5 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-oswald uppercase tracking-widest text-primary">Pourquoi ce programme</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{gen.rationale}</p>
          </motion.div>
        )}

        {/* Weekly objectives */}
        {gen.weekly_objectives && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}
            className="rounded-sm border border-primary/20 bg-primary/5 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-oswald uppercase tracking-widest text-primary">Objectifs de la semaine</h2>
            </div>
            <ul className="space-y-1">
              {gen.weekly_objectives.split(";").map((obj, i) => {
                const trimmed = obj.trim();
                if (!trimmed) return null;
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {trimmed}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {/* Days accordion */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Accordion type="single" collapsible defaultValue={todayIndex >= 0 ? `day-${todayIndex}` : undefined} className="space-y-3">
            {gen.days.map((day, i) => (
              <DayAccordion key={i} day={day} index={i} />
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
};

export default Programme;
