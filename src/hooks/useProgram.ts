import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface ProgramPhase {
  name: string;
  exercises: ProgramExercise[];
}

export interface ProgramDay {
  day: string;
  title: string;
  phases: ProgramPhase[];
}

export interface WeeklyProgram {
  id: string;
  start_date: string;
  ai_generated: {
    week_number: number;
    theme: string;
    start_date: string;
    days: ProgramDay[];
  };
}

export function useCurrentProgram() {
  const { user } = useAuth();
  const [program, setProgram] = useState<WeeklyProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("weekly_programs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const row = data[0];
        setProgram({
          id: row.id,
          start_date: row.start_date,
          ai_generated: row.ai_generated as unknown as WeeklyProgram["ai_generated"],
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { program, loading };
}

export function useCompletedSessions() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todaySession, setTodaySession] = useState<{ id: string; is_completed: boolean; feedback_reps: Json } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: sessions } = await supabase
        .from("daily_sessions")
        .select("id, date, is_completed, feedback_reps")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .order("date", { ascending: false });

      setCount(sessions?.length ?? 0);

      // Calculate streak
      if (sessions && sessions.length > 0) {
        let s = 0;
        const today = new Date();
        for (let i = 0; i < sessions.length; i++) {
          const d = new Date(sessions[i].date);
          const expected = new Date(today);
          expected.setDate(today.getDate() - i);
          if (d.toISOString().split("T")[0] === expected.toISOString().split("T")[0]) {
            s++;
          } else break;
        }
        setStreak(s);
      }

      // Today's session
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: todayData } = await supabase
        .from("daily_sessions")
        .select("id, is_completed, feedback_reps")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .limit(1);

      if (todayData && todayData.length > 0) {
        setTodaySession(todayData[0]);
      }

      setLoading(false);
    };
    fetch();
  }, [user]);

  return { count, streak, todaySession, loading };
}

export function useDiagnosticStatus() {
  const { user } = useAuth();
  const [hasForce, setHasForce] = useState(false);
  const [hasMobility, setHasMobility] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [f, m] = await Promise.all([
        supabase.from("force_evaluations").select("id").eq("user_id", user.id).limit(1),
        supabase.from("mobility_evaluations").select("id").eq("user_id", user.id).limit(1),
      ]);
      setHasForce((f.data?.length ?? 0) > 0);
      setHasMobility((m.data?.length ?? 0) > 0);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { hasForce, hasMobility, bothDone: hasForce && hasMobility, loading };
}
