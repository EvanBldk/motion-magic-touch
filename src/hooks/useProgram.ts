import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  cues?: string;
  tempo?: string;
}

/** Strip catalogue codes like "PUSH_H_004 (Pompe standard)" → "Pompe standard" */
export function cleanExerciseName(name: string): string {
  const match = name.match(/^[A-Z_]+\d+\s*\((.+)\)$/);
  return match ? match[1] : name;
}

export interface ProgramPhase {
  name: string;
  exercises: ProgramExercise[];
}

export interface ProgramDay {
  day: string;
  title: string;
  rationale?: string;
  objective?: string;
  phases: ProgramPhase[];
}

export interface WeeklyProgram {
  id: string;
  start_date: string;
  ai_generated: {
    week_number: number;
    theme: string;
    rationale?: string;
    start_date: string;
    days: ProgramDay[];
  };
}

export function useCurrentProgram() {
  const { user } = useAuth();
  const [program, setProgram] = useState<WeeklyProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("weekly_programs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (err) throw err;

      if (data && data.length > 0) {
        const row = data[0];
        setProgram({
          id: row.id,
          start_date: row.start_date,
          ai_generated: row.ai_generated as unknown as WeeklyProgram["ai_generated"],
        });
      } else {
        setProgram(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  return { program, loading, error, refetch };
}

export interface CompletedSession {
  id: string;
  date: string;
  is_completed: boolean;
  feedback_reps: Json;
  pain_reported: string | null;
  program_id: string;
}

export function useCompletedSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [count, setCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todaySession, setTodaySession] = useState<CompletedSession | null>(null);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: allSessions, error: err } = await supabase
        .from("daily_sessions")
        .select("id, date, is_completed, feedback_reps, pain_reported, program_id")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .order("date", { ascending: false });

      if (err) throw err;

      const list = (allSessions ?? []) as CompletedSession[];
      setSessions(list);
      setCount(list.length);

      // Completed dates set
      setCompletedDates(new Set(list.map((s) => s.date)));

      // Calculate streak — count consecutive days ending today OR yesterday
      if (list.length > 0) {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const yesterdayDate = new Date(today);
        yesterdayDate.setDate(today.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

        // Determine starting point: if today is done, start from today; else from yesterday
        const hasTodaySession = list.some((s) => s.date === todayStr);
        const startDate = hasTodaySession ? today : (list.some((s) => s.date === yesterdayStr) ? yesterdayDate : null);

        if (startDate) {
          let s = 0;
          const dateSet = new Set(list.map((sess) => sess.date));
          for (let i = 0; i < 365; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(startDate.getDate() - i);
            const checkStr = checkDate.toISOString().split("T")[0];
            if (dateSet.has(checkStr)) {
              s++;
            } else {
              break;
            }
          }
          setStreak(s);
        } else {
          setStreak(0);
        }
      } else {
        setStreak(0);
      }

      // Today's session
      const todayStr = new Date().toISOString().split("T")[0];
      const todayS = list.find((s) => s.date === todayStr) ?? null;
      setTodaySession(todayS);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  return { sessions, count, streak, todaySession, completedDates, loading, error, refetch };
}

export function useDiagnosticStatus() {
  const { user } = useAuth();
  const [hasForce, setHasForce] = useState(false);
  const [hasMobility, setHasMobility] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [f, m] = await Promise.all([
      supabase.from("force_evaluations").select("id").eq("user_id", user.id).limit(1),
      supabase.from("mobility_evaluations").select("id").eq("user_id", user.id).limit(1),
    ]);
    setHasForce((f.data?.length ?? 0) > 0);
    setHasMobility((m.data?.length ?? 0) > 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  return { hasForce, hasMobility, bothDone: hasForce && hasMobility, loading, refetch };
}
