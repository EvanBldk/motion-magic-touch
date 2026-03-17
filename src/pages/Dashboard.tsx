import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Flame, Dumbbell, Target, Zap, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

/* ============================================================
   MOCK DATA
   ============================================================ */

const WEEK_DATA = {
  weekNumber: 3,
  theme: "Force & Hypertrophie",
  days: [
    { label: "L", isTraining: true, isCompleted: true },
    { label: "M", isTraining: false, isCompleted: false },
    { label: "M", isTraining: true, isCompleted: true },
    { label: "J", isTraining: false, isCompleted: false },
    { label: "V", isTraining: true, isCompleted: false },
    { label: "S", isTraining: true, isCompleted: false },
    { label: "D", isTraining: false, isCompleted: false },
  ],
};

const TODAY_INDEX = 4; // vendredi (0-indexed)

const TODAY_SESSION = {
  title: "Upper Body — Push Focus",
  targets: [
    { icon: Dumbbell, label: "Dips progressifs" },
    { icon: Target, label: "Handstand work" },
    { icon: Flame, label: "Push-ups diamant" },
    { icon: Zap, label: "L-Sit isométrique" },
  ],
  duration: "45–55 min",
  difficulty: "Intermédiaire",
};

const STATS = {
  sessionsCompleted: 8,
  totalWeeks: 3,
  streak: 4,
};

/* ============================================================
   COMPONENT
   ============================================================ */

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs font-oswald uppercase tracking-widest text-muted-foreground">
            Programme en cours
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary">
            Semaine {WEEK_DATA.weekNumber} — {WEEK_DATA.theme}
          </h1>
        </motion.div>

        {/* Week Day Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-center justify-between gap-2"
        >
          {WEEK_DATA.days.map((day, i) => {
            const isToday = i === TODAY_INDEX;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "text-[10px] font-oswald uppercase tracking-wider",
                    isToday ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  {day.label}
                </span>
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-sm border text-sm font-semibold transition-all",
                    isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    day.isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : day.isTraining
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                  )}
                >
                  {day.isCompleted ? "✓" : day.isTraining ? "•" : "—"}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Today's Session Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4 rounded-sm border border-border p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-oswald uppercase tracking-widest text-muted-foreground">
                Séance du jour
              </p>
              <h2 className="mt-1 text-lg font-semibold text-primary">
                {TODAY_SESSION.title}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-oswald uppercase tracking-wider text-secondary-foreground">
                {TODAY_SESSION.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">
                {TODAY_SESSION.duration}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TODAY_SESSION.targets.map((target, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-sm border border-border bg-secondary/30 p-3"
              >
                <target.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-xs font-medium text-foreground">{target.label}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => navigate("/session-active")}
            className="w-full gap-2 rounded-sm py-6 text-base font-oswald uppercase tracking-wider"
          >
            Démarrer la séance <ChevronRight className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Séances", value: STATS.sessionsCompleted },
            { label: "Semaines", value: STATS.totalWeeks },
            { label: "Série", value: `${STATS.streak}j` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-sm border border-border p-4"
            >
              <span className="text-2xl font-bold text-primary">{stat.value}</span>
              <span className="mt-1 text-[10px] font-oswald uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
