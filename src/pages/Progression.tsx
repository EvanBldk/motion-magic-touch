import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Info } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompletedSessions } from "@/hooks/useProgram";
import { useCurrentProgram } from "@/hooks/useProgram";

interface ForcePoint {
  date: string;
  label: string;
  pull_ups: number;
  dips: number;
  push_ups: number;
}

interface MobilityPoint {
  subject: string;
  score: number;
  firstScore?: number;
}

const Progression = () => {
  const { user } = useAuth();
  const { count: sessionsCompleted, streak } = useCompletedSessions();
  const { program } = useCurrentProgram();
  const [forceData, setForceData] = useState<ForcePoint[]>([]);
  const [mobilityData, setMobilityData] = useState<MobilityPoint[]>([]);
  const [hasMultipleMobility, setHasMultipleMobility] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [forceRes, mobilityRes] = await Promise.all([
        supabase
          .from("force_evaluations")
          .select("pull_ups, dips, push_ups, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("mobility_evaluations")
          .select("wrists_score, shoulders_score, thoracic_score, posterior_score, hips_score, ankles_score, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      // Force data
      if (forceRes.data && forceRes.data.length > 0) {
        setForceData(
          forceRes.data.map((row) => {
            const d = new Date(row.created_at);
            return {
              date: row.created_at,
              label: `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`,
              pull_ups: row.pull_ups,
              dips: row.dips,
              push_ups: row.push_ups,
            };
          })
        );
      }

      // Mobility data
      if (mobilityRes.data && mobilityRes.data.length > 0) {
        const last = mobilityRes.data[mobilityRes.data.length - 1];
        const first = mobilityRes.data.length > 1 ? mobilityRes.data[0] : null;
        setHasMultipleMobility(mobilityRes.data.length > 1);

        const axes: { key: string; label: string }[] = [
          { key: "wrists_score", label: "Poignets" },
          { key: "shoulders_score", label: "Épaules" },
          { key: "thoracic_score", label: "Thoracique" },
          { key: "posterior_score", label: "Postérieure" },
          { key: "hips_score", label: "Hanches" },
          { key: "ankles_score", label: "Chevilles" },
        ];

        setMobilityData(
          axes.map((a) => ({
            subject: a.label,
            score: (last as Record<string, number>)[a.key] ?? 0,
            ...(first ? { firstScore: (first as Record<string, number>)[a.key] ?? 0 } : {}),
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const weekNumber = program?.ai_generated?.week_number ?? 0;
  const hasSingleEval = forceData.length === 1 || mobilityData.length > 0;
  const hasNoData = forceData.length === 0 && mobilityData.length === 0;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col p-4 md:p-8">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-sm" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-sm" />
          <Skeleton className="h-64 rounded-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-xs font-oswald uppercase tracking-widest text-muted-foreground">Suivi</p>
          <h1 className="mt-1 text-2xl font-bold text-primary">Progression</h1>
        </motion.div>

        {/* Stats counters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="grid grid-cols-3 gap-3">
          {[
            { label: "Séances", value: sessionsCompleted },
            { label: "Semaine", value: weekNumber },
            { label: "Série", value: `${streak}j` },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center rounded-sm border border-border p-4">
              <span className="text-2xl font-bold text-primary">{stat.value}</span>
              <span className="mt-1 text-[10px] font-oswald uppercase tracking-wider text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* No data */}
        {hasNoData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="rounded-sm border border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Complète tes diagnostics pour voir ta progression ici.</p>
          </motion.div>
        )}

        {/* Single eval encouragement */}
        {!hasNoData && hasSingleEval && forceData.length <= 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="flex items-start gap-3 rounded-sm border border-border bg-secondary/30 p-4">
            <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Refais tes diagnostics dans quelques semaines pour voir ta progression ici.
            </p>
          </motion.div>
        )}

        {/* Force LineChart */}
        {forceData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="space-y-3">
            <h2 className="text-sm font-oswald uppercase tracking-wider text-muted-foreground">Évolution Force</h2>
            <div className="rounded-sm border border-border p-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={forceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "2px",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontFamily: "Oswald", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  />
                  <Line type="monotone" dataKey="pull_ups" name="Tractions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  <Line type="monotone" dataKey="dips" name="Dips" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--muted-foreground))" }} />
                  <Line type="monotone" dataKey="push_ups" name="Pompes" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--destructive))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Mobility RadarChart */}
        {mobilityData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="space-y-3">
            <h2 className="text-sm font-oswald uppercase tracking-wider text-muted-foreground">Profil Mobilité</h2>
            <div className="rounded-sm border border-border p-4">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={mobilityData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  {hasMultipleMobility && (
                    <Radar
                      name="Première éval."
                      dataKey="firstScore"
                      stroke="hsl(var(--muted-foreground))"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.15}
                      strokeWidth={1}
                    />
                  )}
                  <Radar
                    name="Dernière éval."
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontFamily: "Oswald", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Progression;
