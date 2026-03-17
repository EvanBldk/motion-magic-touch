import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Mail, Calendar, Dumbbell, Activity, RefreshCw, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "@/hooks/useDarkMode";

interface DiagInfo {
  forceDate: string | null;
  mobilityDate: string | null;
  loading: boolean;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [diag, setDiag] = useState<DiagInfo>({ forceDate: null, mobilityDate: null, loading: true });

  useEffect(() => {
    if (!user) return;
    const fetchDiag = async () => {
      const [f, m] = await Promise.all([
        supabase.from("force_evaluations").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("mobility_evaluations").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      ]);
      setDiag({
        forceDate: f.data?.[0]?.created_at ?? null,
        mobilityDate: m.data?.[0]?.created_at ?? null,
        loading: false,
      });
    };
    fetchDiag();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Non complété";
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <p className="text-xs font-oswald uppercase tracking-widest text-muted-foreground">Mon compte</p>
          <h1 className="mt-1 text-2xl font-bold text-primary">Profil</h1>
        </motion.div>

        {/* User info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="space-y-4 rounded-sm border border-border p-5"
        >
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
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Diagnostics history */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">Diagnostics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-sm border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Force & Skills</span>
              </div>
              <p className="text-xs text-muted-foreground">{diag.loading ? "Chargement…" : formatDate(diag.forceDate)}</p>
              <Button
                onClick={() => navigate("/diagnostic-force")}
                variant="outline"
                size="sm"
                className="w-full gap-1 rounded-sm font-oswald uppercase tracking-wider text-xs"
              >
                <RefreshCw className="h-3 w-3" /> Refaire
              </Button>
            </div>
            <div className="rounded-sm border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Mobilité</span>
              </div>
              <p className="text-xs text-muted-foreground">{diag.loading ? "Chargement…" : formatDate(diag.mobilityDate)}</p>
              <Button
                onClick={() => navigate("/diagnostic-mobilite")}
                variant="outline"
                size="sm"
                className="w-full gap-1 rounded-sm font-oswald uppercase tracking-wider text-xs"
              >
                <RefreshCw className="h-3 w-3" /> Refaire
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
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
