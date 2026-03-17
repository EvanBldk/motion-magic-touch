import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Flame, Dumbbell, Target, Zap, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useCurrentProgram, useCompletedSessions, useDiagnosticStatus } from "@/hooks/useProgram";
import type { ProgramDay } from "@/hooks/useProgram";

const ICON_MAP = [Dumbbell, Target, Flame, Zap];

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

function getTodayDayIndex(): number {
  return new Date().getDay(); // 0=Sun
}

function getTodayProgram(days: ProgramDay[]): ProgramDay | null {
  const dayNames: Record<number, string[]> = {
    0: ["Dimanche"],
    1: ["Lundi"],
    2: ["Mardi"],
    3: ["Mercredi"],
    4: ["Jeudi"],
    5: ["Vendredi"],
    6: ["Samedi"],
  };
  const todayNames = dayNames[new Date().getDay()] ?? [];
  return days.find((d) => todayNames.some((n) => d.day.toLowerCase().startsWith(n.toLowerCase()))) ?? null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const { program, loading: progLoading } = useCurrentProgram();
  const { count: sessionsCompleted, streak, loading: sessLoading } = useCompletedSessions();
  const { bothDone: hasDiagnostics, loading: diagLoading } = useDiagnosticStatus();

  const isLoading = progLoading || sessLoading || diagLoading;

  const handleGenerate = async () => {
    if (!user) return;
    if (!hasDiagnostics) {
      toast({
        title: "Diagnostics requis",
        description: "Complète d'abord tes diagnostics Force et Mobilité avant de générer un programme.",
        variant: "destructive",
      });
      navigate("/diagnostics");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-program");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const prog = data.program;
      const { error: insertErr } = await supabase.from("weekly_programs").insert([{
        user_id: user.id,
        start_date: prog.start_date,
        ai_generated: JSON.parse(JSON.stringify(prog)),
      }]);
      if (insertErr) throw insertErr;

      toast({ title: "Programme généré", description: `Semaine "${prog.theme}" créée avec succès.` });
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const gen = program?.ai_generated;
  const todaySession = gen ? getTodayProgram(gen.days) : null;
  const todayIdx = getTodayDayIndex();

  // Build week days for display
  const trainingDayNames = new Set(gen?.days.map((d) => d.day.toLowerCase()) ?? []);
  const dayNameMap: Record<number, string> = { 0: "dimanche", 1: "lundi", 2: "mardi", 3: "mercredi", 4: "jeudi", 5: "vendredi", 6: "samedi" };

  const weekDays = DAY_LABELS.map((label, i) => ({
    label,
    isTraining: trainingDayNames.has(dayNameMap[i]),
    isCompleted: false, // TODO: connect to daily_sessions completion
  }));

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-xs font-oswald uppercase tracking-widest text-muted-foreground">
            {gen ? "Programme en cours" : "Bienvenue"}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary">
            {gen ? `Semaine ${gen.week_number} — ${gen.theme}` : "Spartan"}
          </h1>
        </motion.div>

        {/* No diagnostics warning */}
        {!hasDiagnostics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="flex items-start gap-3 rounded-sm border border-destructive/30 bg-destructive/5 p-4"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Diagnostics incomplets</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complète tes diagnostics Force et Mobilité pour débloquer la génération de programme.
              </p>
              <Button
                onClick={() => navigate("/diagnostics")}
                variant="outline"
                size="sm"
                className="mt-3 rounded-sm font-oswald uppercase tracking-wider text-xs"
              >
                Aller aux diagnostics
              </Button>
            </div>
          </motion.div>
        )}

        {/* No program yet */}
        {hasDiagnostics && !gen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-sm border border-border p-6 text-center space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Tes diagnostics sont complétés. Génère ton premier programme !
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="gap-2 rounded-sm py-6 text-base font-oswald uppercase tracking-wider"
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Génération en cours…</>
              ) : (
                <><Sparkles className="h-5 w-5" /> Générer mon programme</>
              )}
            </Button>
          </motion.div>
        )}

        {/* Week Day Indicators (only if program exists) */}
        {gen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="flex items-center justify-between gap-2"
          >
            {weekDays.map((day, i) => {
              const isToday = i === todayIdx;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className={cn("text-[10px] font-oswald uppercase tracking-wider", isToday ? "text-primary font-bold" : "text-muted-foreground")}>
                    {day.label}
                  </span>
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-sm border text-sm font-semibold transition-all",
                    isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    day.isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : day.isTraining
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                  )}>
                    {day.isCompleted ? "✓" : day.isTraining ? "•" : "—"}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Today's Session Card */}
        {gen && todaySession && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-4 rounded-sm border border-border p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-oswald uppercase tracking-widest text-muted-foreground">Séance du jour</p>
                <h2 className="mt-1 text-lg font-semibold text-primary">{todaySession.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {todaySession.phases
                .flatMap((p) => p.exercises)
                .slice(0, 4)
                .map((ex, i) => {
                  const Icon = ICON_MAP[i % ICON_MAP.length];
                  return (
                    <div key={i} className="flex items-center gap-2.5 rounded-sm border border-border bg-secondary/30 p-3">
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-xs font-medium text-foreground">{ex.name}</span>
                    </div>
                  );
                })}
            </div>

            <Button
              onClick={() => navigate("/session-active")}
              className="w-full gap-2 rounded-sm py-6 text-base font-oswald uppercase tracking-wider"
            >
              Démarrer la séance <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Rest day */}
        {gen && !todaySession && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-sm border border-border p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">Jour de repos — récupère bien 💪</p>
          </motion.div>
        )}

        {/* Generate new program (if one already exists) */}
        {gen && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              variant="outline"
              className="w-full gap-2 rounded-sm py-6 text-base font-oswald uppercase tracking-wider"
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Génération en cours…</>
              ) : (
                <><Sparkles className="h-5 w-5" /> Régénérer un programme</>
              )}
            </Button>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Séances", value: sessionsCompleted },
            { label: "Semaines", value: gen?.week_number ?? 0 },
            { label: "Série", value: `${streak}j` },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center rounded-sm border border-border p-4">
              <span className="text-2xl font-bold text-primary">{stat.value}</span>
              <span className="mt-1 text-[10px] font-oswald uppercase tracking-wider text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
