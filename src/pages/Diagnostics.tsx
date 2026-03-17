import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Activity, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DiagStatus {
  force: boolean;
  mobility: boolean;
  loading: boolean;
}

const Diagnostics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<DiagStatus>({ force: false, mobility: false, loading: true });

  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      const [forceRes, mobRes] = await Promise.all([
        supabase.from("force_evaluations").select("id").eq("user_id", user.id).limit(1),
        supabase.from("mobility_evaluations").select("id").eq("user_id", user.id).limit(1),
      ]);
      setStatus({
        force: (forceRes.data?.length ?? 0) > 0,
        mobility: (mobRes.data?.length ?? 0) > 0,
        loading: false,
      });
    };
    fetchStatus();
  }, [user]);

  const cards = [
    {
      title: "Force & Skills",
      description: "Évalue tes capacités en traction, dips, push-ups, gainage et skills avancés.",
      icon: Dumbbell,
      completed: status.force,
      route: "/diagnostic-force",
    },
    {
      title: "Mobilité",
      description: "Évalue ta mobilité articulaire : poignets, épaules, colonne, hanches, chevilles.",
      icon: Activity,
      completed: status.mobility,
      route: "/diagnostic-mobilite",
    },
  ];

  const allDone = status.force && status.mobility;

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs font-oswald uppercase tracking-widest text-muted-foreground">
            Évaluation initiale
          </p>
          <h1 className="mt-1 text-2xl font-bold text-primary">Diagnostics</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complète les deux diagnostics pour permettre à l'IA de générer ton programme personnalisé.
          </p>
        </motion.div>

        {/* Status banner */}
        {!status.loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className={`rounded-sm border p-4 ${
              allDone
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-secondary/30"
            }`}
          >
            <div className="flex items-center gap-2">
              {allDone ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {allDone
                  ? "Tous les diagnostics sont complétés ✓"
                  : `${[status.force, status.mobility].filter(Boolean).length}/2 diagnostics complétés`}
              </span>
            </div>
          </motion.div>
        )}

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              className="flex flex-col rounded-sm border border-border p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <card.icon className="h-6 w-6 text-primary" />
                {!status.loading && (
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] font-oswald uppercase tracking-wider ${
                      card.completed
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {card.completed ? "Complété" : "À faire"}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
              </div>

              <Button
                onClick={() => navigate(card.route)}
                variant={card.completed ? "outline" : "default"}
                className="w-full gap-2 rounded-sm font-oswald uppercase tracking-wider"
              >
                {card.completed ? "Refaire le diagnostic" : "Commencer"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;
