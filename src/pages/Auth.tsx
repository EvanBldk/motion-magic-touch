import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Email de réinitialisation envoyé ! Vérifie ta boîte mail.");
        setMode("login");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifie tes emails pour confirmer.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Connexion réussie !");
        navigate("/");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Spartan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Connecte-toi pour reprendre ton entraînement."
              : mode === "signup"
                ? "Crée ton compte et commence à t'entraîner."
                : "Entre ton email pour réinitialiser ton mot de passe."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider font-oswald">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@spartan.com"
              className="rounded-sm border-border bg-background"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider font-oswald">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-sm border-border bg-background"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm font-oswald uppercase tracking-wider"
          >
            {submitting
              ? "Chargement…"
              : mode === "login"
                ? "Se connecter"
                : mode === "signup"
                  ? "Créer un compte"
                  : "Envoyer le lien"}
          </Button>
        </form>

        {/* Forgot password link */}
        {mode === "login" && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {/* Toggle mode */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline transition-colors"
          >
            {mode === "signup"
              ? "Déjà un compte ? Se connecter"
              : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
