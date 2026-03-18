import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Mail, Calendar, Dumbbell, Activity, RefreshCw, Moon, Sun, TrendingUp, Save, Pencil, AlertTriangle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "@/hooks/useDarkMode";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";

interface ForceEval {
  id: string;
  first_name: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  experience: string | null;
  days_per_week: number;
  session_duration: string | null;
  pull_ups: number;
  dips: number;
  push_ups: number;
  l_sit: number;
  hollow: number;
  goals: Json;
  skills: Json;
  created_at: string;
}

interface MobilityEval {
  wrists_score: number;
  shoulders_score: number;
  thoracic_score: number;
  posterior_score: number;
  hips_score: number;
  ankles_score: number;
  pain_flags: Json;
  created_at: string;
}

const getForceLevel = (exercise: string, reps: number): string => {
  if (reps === 0) return "Débutant";
  if (exercise === "pullUps") return reps >= 15 ? "Avancé" : reps >= 8 ? "Intermédiaire" : "Débutant";
  if (exercise === "dips") return reps >= 20 ? "Avancé" : reps >= 10 ? "Intermédiaire" : "Débutant";
  if (exercise === "pushUps") return reps >= 30 ? "Avancé" : reps >= 15 ? "Intermédiaire" : "Débutant";
  return "";
};

const experienceLabels: Record<string, string> = {
  none: "Aucune",
  less_6m: "Moins de 6 mois",
  "6m_2y": "6 mois à 2 ans",
  more_2y: "Plus de 2 ans",
};

const mobilityScoreColor = (score: number): string => {
  if (score <= 2) return "text-destructive";
  if (score >= 4) return "text-primary";
  return "text-muted-foreground";
};

const SummaryCard = ({ title, icon: Icon, children, delay = 0 }: { title: string; icon: React.ElementType; children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }} className="rounded-sm border border-border p-4 space-y-2">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const SummaryRow = ({ label, value, className }: { label: string; value: string | number; className?: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-medium text-foreground", className)}>{String(value)}</span>
  </div>
);

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [forceEval, setForceEval] = useState<ForceEval | null>(null);
  const [mobilityEval, setMobilityEval] = useState<MobilityEval | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [f, m] = await Promise.all([
        supabase.from("force_evaluations").select("id, first_name, age, weight_kg, height_cm, experience, days_per_week, session_duration, pull_ups, dips, push_ups, l_sit, hollow, goals, skills, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("mobility_evaluations").select("wrists_score, shoulders_score, thoracic_score, posterior_score, hips_score, ankles_score, pain_flags, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setForceEval(f.data as ForceEval | null);
      setMobilityEval(m.data as MobilityEval | null);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSaveWeight = async () => {
    if (!forceEval || !weightInput) return;
    setSavingWeight(true);
    const { error } = await supabase
      .from("force_evaluations")
      .update({ weight_kg: Number(weightInput) })
      .eq("id", forceEval.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setForceEval({ ...forceEval, weight_kg: Number(weightInput) });
      setEditingWeight(false);
      toast({ title: "Poids mis à jour", description: `${weightInput} kg enregistré.` });
    }
    setSavingWeight(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const goals = forceEval?.goals as { primary?: string; secondary?: string; horizon?: string } | null;
  const skills = forceEval?.skills as { prioritySkill?: string } | null;
  const painFlags = mobilityEval?.pain_flags as string[] | null;

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-xs font-oswald uppercase tracking-widest text-muted-foreground">Mon compte</p>
          <h1 className="mt-1 text-2xl font-bold text-primary">Profil</h1>
        </motion.div>

        {/* User info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="space-y-4 rounded-sm border border-border p-5">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] font-oswald uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] font-oswald uppercase tracking-wider text-muted-foreground">Membre depuis</p>
              <p className="text-sm font-medium text-foreground">
                {user?.created_at ? formatDate(user.created_at) : "—"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Force profile card */}
        {!loading && forceEval && (
          <SummaryCard title="Mon profil" icon={Dumbbell} delay={0.1}>
            <SummaryRow label="Prénom" value={forceEval.first_name || "—"} />
            <SummaryRow label="Âge" value={forceEval.age ?? "—"} />
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Poids</span>
              {editingWeight ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step={0.1}
                    min={30}
                    max={200}
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="h-7 w-20 rounded-sm text-sm"
                    placeholder="kg"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveWeight} disabled={savingWeight || !weightInput} className="h-7 w-7 p-0">
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">{forceEval.weight_kg ? `${forceEval.weight_kg} kg` : "—"}</span>
                  <button
                    onClick={() => { setWeightInput(String(forceEval.weight_kg ?? "")); setEditingWeight(true); }}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <SummaryRow label="Taille" value={forceEval.height_cm ? `${forceEval.height_cm} cm` : "—"} />
            <SummaryRow label="Expérience" value={experienceLabels[forceEval.experience ?? ""] ?? forceEval.experience ?? "—"} />
            <SummaryRow label="Jours / semaine" value={forceEval.days_per_week} />
            <SummaryRow label="Durée séance" value={forceEval.session_duration || "—"} />
          </SummaryCard>
        )}

        {/* Force levels card */}
        {!loading && forceEval && (
          <SummaryCard title="Niveau Force" icon={Dumbbell} delay={0.15}>
            <SummaryRow label="Tractions" value={`${forceEval.pull_ups} reps — ${getForceLevel("pullUps", forceEval.pull_ups)}`} />
            <SummaryRow label="Dips" value={`${forceEval.dips} reps — ${getForceLevel("dips", forceEval.dips)}`} />
            <SummaryRow label="Pompes" value={`${forceEval.push_ups} reps — ${getForceLevel("pushUps", forceEval.push_ups)}`} />
            <SummaryRow label="L-Sit" value={`${forceEval.l_sit}s`} />
            <SummaryRow label="Hollow Hold" value={`${forceEval.hollow}s`} />
          </SummaryCard>
        )}

        {/* Mobility card */}
        {!loading && mobilityEval && (
          <SummaryCard title="Mobilité" icon={Activity} delay={0.2}>
            {([
              { label: "Poignets", score: mobilityEval.wrists_score },
              { label: "Épaules", score: mobilityEval.shoulders_score },
              { label: "Thoracique", score: mobilityEval.thoracic_score },
              { label: "Postérieure", score: mobilityEval.posterior_score },
              { label: "Hanches", score: mobilityEval.hips_score },
              { label: "Chevilles", score: mobilityEval.ankles_score },
            ] as const).map((m) => (
              <SummaryRow key={m.label} label={m.label} value={`${m.score} / 5`} className={mobilityScoreColor(m.score)} />
            ))}
            {painFlags && painFlags.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 p-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <p className="text-xs text-destructive">{painFlags.join(", ")}</p>
              </div>
            )}
          </SummaryCard>
        )}

        {/* Goals card */}
        {!loading && forceEval && goals && (
          <SummaryCard title="Objectifs" icon={Target} delay={0.25}>
            <SummaryRow label="Principal" value={goals.primary || "—"} />
            <SummaryRow label="Secondaire" value={goals.secondary || "—"} />
            <SummaryRow label="Horizon" value={goals.horizon || "—"} />
            <SummaryRow label="Skill prioritaire" value={skills?.prioritySkill || "—"} />
          </SummaryCard>
        )}

        {/* Diagnostics refaire */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="space-y-3">
            <h2 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">Diagnostics</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-sm border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Force & Skills</span>
                </div>
                <p className="text-xs text-muted-foreground">{forceEval ? formatDate(forceEval.created_at) : "Non complété"}</p>
                <Button onClick={() => navigate("/diagnostic-force")} variant="outline" size="sm" className="w-full gap-1 rounded-sm font-oswald uppercase tracking-wider text-xs">
                  <RefreshCw className="h-3 w-3" /> Refaire
                </Button>
              </div>
              <div className="rounded-sm border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Mobilité</span>
                </div>
                <p className="text-xs text-muted-foreground">{mobilityEval ? formatDate(mobilityEval.created_at) : "Non complété"}</p>
                <Button onClick={() => navigate("/diagnostic-mobilite")} variant="outline" size="sm" className="w-full gap-1 rounded-sm font-oswald uppercase tracking-wider text-xs">
                  <RefreshCw className="h-3 w-3" /> Refaire
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Link to progression */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
          <Button onClick={() => navigate("/progression")} variant="outline" className="w-full gap-2 rounded-sm py-5 text-base font-oswald uppercase tracking-wider">
            <TrendingUp className="h-5 w-5" /> Voir ma progression
          </Button>
        </motion.div>

        {/* Dark mode toggle */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.38 }} className="rounded-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              <div>
                <p className="text-sm font-medium text-foreground">Mode sombre</p>
                <p className="text-xs text-muted-foreground">{isDark ? "Activé" : "Désactivé"}</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleDark} />
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full gap-2 rounded-sm py-5 text-base font-oswald uppercase tracking-wider text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <LogOut className="h-5 w-5" /> Déconnexion
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
