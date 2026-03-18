import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProgress } from "@/components/diagnostic/StepProgress";
import { StepWrapper } from "@/components/diagnostic/StepWrapper";
import { ScaleInput } from "@/components/diagnostic/ScaleInput";
import { PainQuestion } from "@/components/diagnostic/PainQuestion";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "Infos",
  "Poignets",
  "Épaules",
  "Colonne",
  "Postérieure",
  "Hanches",
  "Récapitulatif",
];

interface MobilityData {
  // Step 1
  age: number | "";
  activityLevel: string;
  hasInjuries: boolean | null;
  injuryDetails: string;
  // Step 2 - Poignets
  wristExtLeft: number | null;
  wristExtRight: number | null;
  wristExtPain: boolean | null;
  wristFlexLeft: number | null;
  wristFlexRight: number | null;
  wristFlexPain: boolean | null;
  // Step 3 - Épaules
  shoulderOverhead: number | null;
  shoulderOverheadPain: boolean | null;
  shoulderRotLeft: number | null;
  shoulderRotRight: number | null;
  shoulderRotPain: boolean | null;
  // Step 4 - Colonne & coudes
  thoracicExt: number | null;
  thoracicPain: boolean | null;
  bridge: number | null;
  elbowLeft: number | null;
  elbowRight: number | null;
  elbowPain: boolean | null;
  // Step 5 - Chaîne postérieure
  pike: number | null;
  pikePain: boolean | null;
  compression: number | null;
  // Step 6 - Hanches & chevilles
  deepSquat: number | null;
  deepSquatPain: boolean | null;
  hipLeft: number | null;
  hipRight: number | null;
  ankleLeft: number | null;
  ankleRight: number | null;
}

const initialData: MobilityData = {
  age: "",
  activityLevel: "",
  hasInjuries: null,
  injuryDetails: "",
  wristExtLeft: null,
  wristExtRight: null,
  wristExtPain: null,
  wristFlexLeft: null,
  wristFlexRight: null,
  wristFlexPain: null,
  shoulderOverhead: null,
  shoulderOverheadPain: null,
  shoulderRotLeft: null,
  shoulderRotRight: null,
  shoulderRotPain: null,
  thoracicExt: null,
  thoracicPain: null,
  bridge: null,
  elbowLeft: null,
  elbowRight: null,
  elbowPain: null,
  pike: null,
  pikePain: null,
  compression: null,
  deepSquat: null,
  deepSquatPain: null,
  hipLeft: null,
  hipRight: null,
  ankleLeft: null,
  ankleRight: null,
};

const DiagnosticMobilite = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<MobilityData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const hasStarted = useMemo(() => step > 0 || data.age !== "", [step, data.age]);
  useNavigationGuard(hasStarted && !submitting);

  const update = <K extends keyof MobilityData>(key: K, value: MobilityData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const isMobilityStepValid = (s: number): boolean => {
    switch (s) {
      case 0:
        return data.age !== "" && Number(data.age) > 0 && data.activityLevel !== "" && data.hasInjuries !== null;
      case 1:
        return data.wristExtLeft !== null || data.wristExtRight !== null || data.wristFlexLeft !== null || data.wristFlexRight !== null;
      case 2:
        return data.shoulderOverhead !== null || data.shoulderRotLeft !== null || data.shoulderRotRight !== null;
      case 3:
        return data.thoracicExt !== null || data.bridge !== null || data.elbowLeft !== null || data.elbowRight !== null;
      case 4:
        return data.pike !== null || data.compression !== null;
      case 5:
        return data.deepSquat !== null || data.hipLeft !== null || data.hipRight !== null || data.ankleLeft !== null || data.ankleRight !== null;
      default:
        return true;
    }
  };

  const mobilityStepValid = isMobilityStepValid(step);

  const next = () => { if (mobilityStepValid) setStep((s) => Math.min(s + 1, 6)); };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Tu dois être connecté pour soumettre.");
      return;
    }
    setSubmitting(true);

    // Compute average scores per zone (retro-compat)
    const avg = (vals: (number | null)[]) => {
      const valid = vals.filter((v): v is number => v !== null);
      return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
    };

    const painFlags: string[] = [];
    if (data.wristExtPain) painFlags.push("wrist_extension");
    if (data.wristFlexPain) painFlags.push("wrist_flexion");
    if (data.shoulderOverheadPain) painFlags.push("shoulder_overhead");
    if (data.shoulderRotPain) painFlags.push("shoulder_rotation");
    if (data.thoracicPain) painFlags.push("thoracic");
    if (data.elbowPain) painFlags.push("elbows");
    if (data.pikePain) painFlags.push("pike");
    if (data.deepSquatPain) painFlags.push("deep_squat");

    // Raw scores: all 21 individual scores + 8 pain flags + profile info
    const rawScores = {
      age: data.age,
      activityLevel: data.activityLevel,
      hasInjuries: data.hasInjuries,
      injuryDetails: data.injuryDetails,
      wristExtLeft: data.wristExtLeft,
      wristExtRight: data.wristExtRight,
      wristExtPain: data.wristExtPain,
      wristFlexLeft: data.wristFlexLeft,
      wristFlexRight: data.wristFlexRight,
      wristFlexPain: data.wristFlexPain,
      shoulderOverhead: data.shoulderOverhead,
      shoulderOverheadPain: data.shoulderOverheadPain,
      shoulderRotLeft: data.shoulderRotLeft,
      shoulderRotRight: data.shoulderRotRight,
      shoulderRotPain: data.shoulderRotPain,
      thoracicExt: data.thoracicExt,
      thoracicPain: data.thoracicPain,
      bridge: data.bridge,
      elbowLeft: data.elbowLeft,
      elbowRight: data.elbowRight,
      elbowPain: data.elbowPain,
      pike: data.pike,
      pikePain: data.pikePain,
      compression: data.compression,
      deepSquat: data.deepSquat,
      deepSquatPain: data.deepSquatPain,
      hipLeft: data.hipLeft,
      hipRight: data.hipRight,
      ankleLeft: data.ankleLeft,
      ankleRight: data.ankleRight,
      // Derived scores for convenience
      elbows_score: avg([data.elbowLeft, data.elbowRight]),
    };

    try {
      const insertData = {
        user_id: user.id,
        wrists_score: avg([data.wristExtLeft, data.wristExtRight, data.wristFlexLeft, data.wristFlexRight]),
        shoulders_score: avg([data.shoulderOverhead, data.shoulderRotLeft, data.shoulderRotRight]),
        thoracic_score: avg([data.thoracicExt, data.bridge]),
        posterior_score: avg([data.pike, data.compression]),
        hips_score: avg([data.deepSquat, data.hipLeft, data.hipRight]),
        ankles_score: avg([data.ankleLeft, data.ankleRight]),
        pain_flags: JSON.parse(JSON.stringify(painFlags)),
        raw_scores: JSON.parse(JSON.stringify(rawScores)),
      };
      const { error } = await supabase.from("mobility_evaluations").insert(insertData);
      if (error) throw error;
      toast.success("Évaluation de mobilité enregistrée !");
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Diagnostic Mobilité</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Évalue ta mobilité articulaire pour un programme adapté.
          </p>
        </div>

        <StepProgress currentStep={step} totalSteps={7} labels={STEP_LABELS} />

        <StepWrapper stepKey={step}>
          {step === 0 && <Step1Info data={data} update={update} />}
          {step === 1 && <Step2Wrists data={data} update={update} />}
          {step === 2 && <Step3Shoulders data={data} update={update} />}
          {step === 3 && <Step4Spine data={data} update={update} />}
          {step === 4 && <Step5Posterior data={data} update={update} />}
          {step === 5 && <Step6Hips data={data} update={update} />}
          {step === 6 && <Step7Summary data={data} />}
        </StepWrapper>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={prev}
            disabled={step === 0}
            className="gap-2 rounded-sm font-oswald uppercase tracking-wider text-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          {step < 6 ? (
            <div className="flex flex-col items-end gap-1">
              <Button
                onClick={next}
                disabled={!mobilityStepValid}
                className="gap-2 rounded-sm font-oswald uppercase tracking-wider text-xs"
              >
                Suivant <ArrowRight className="h-4 w-4" />
              </Button>
              {!mobilityStepValid && (
                <span className="text-[10px] text-muted-foreground">Complète tous les champs pour continuer</span>
              )}
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 rounded-sm font-oswald uppercase tracking-wider text-xs"
            >
              {submitting ? "Envoi…" : "Soumettre"} <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   STEP PROPS
   ============================================================ */

interface StepProps {
  data: MobilityData;
  update: <K extends keyof MobilityData>(key: K, value: MobilityData[K]) => void;
}

/* ============================================================
   STEP 1 — Informations Générales
   ============================================================ */

const Step1Info = ({ data, update }: StepProps) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Informations Générales</h2>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider font-oswald">Âge</Label>
      <Input
        type="number"
        min={10}
        max={80}
        value={data.age}
        onChange={(e) => update("age", e.target.value ? Number(e.target.value) : "")}
        placeholder="25"
        className="rounded-sm w-32"
      />
    </div>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider font-oswald">Niveau d'activité physique</Label>
      <Select value={data.activityLevel} onValueChange={(v) => update("activityLevel", v)}>
        <SelectTrigger className="rounded-sm">
          <SelectValue placeholder="Sélectionne ton niveau" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="debutant">Débutant</SelectItem>
          <SelectItem value="intermediaire">Intermédiaire</SelectItem>
          <SelectItem value="avance">Avancé</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-3">
      <Label className="text-xs uppercase tracking-wider font-oswald">
        Blessures actuelles ou antécédents médicaux ?
      </Label>
      <div className="flex gap-3">
        {[
          { label: "Oui", val: true },
          { label: "Non", val: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => update("hasInjuries", opt.val)}
            className={`rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${
              data.hasInjuries === opt.val
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {data.hasInjuries === true && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Input
              value={data.injuryDetails}
              onChange={(e) => update("injuryDetails", e.target.value)}
              placeholder="Précise la zone et la nature de la blessure…"
              className="rounded-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);

/* ============================================================
   STEP 2 — Poignets
   ============================================================ */

const Step2Wrists = ({ data, update }: StepProps) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Poignets</h2>
    <p className="text-xs text-muted-foreground">
      Ancrage : 1 = impossible / très limité · 5 = aucune limitation
    </p>

    <ScaleInput
      label="Extension du poignet (position de pompes, épaules en avant) — Gauche"
      value={data.wristExtLeft}
      onChange={(v) => update("wristExtLeft", v)}
    />
    <ScaleInput
      label="Extension du poignet — Droit"
      value={data.wristExtRight}
      onChange={(v) => update("wristExtRight", v)}
    />
    <PainQuestion
      visible={data.wristExtLeft !== null || data.wristExtRight !== null}
      value={data.wristExtPain}
      onChange={(v) => update("wristExtPain", v)}
      alertMessage="Le programme intégrera un protocole de renforcement préventif des poignets."
    />

    <ScaleInput
      label="Flexion du poignet (dos des mains collés, bras tendus) — Gauche"
      value={data.wristFlexLeft}
      onChange={(v) => update("wristFlexLeft", v)}
    />
    <ScaleInput
      label="Flexion du poignet — Droit"
      value={data.wristFlexRight}
      onChange={(v) => update("wristFlexRight", v)}
    />
    <PainQuestion
      visible={data.wristFlexLeft !== null || data.wristFlexRight !== null}
      value={data.wristFlexPain}
      onChange={(v) => update("wristFlexPain", v)}
      alertMessage="Le programme intégrera un protocole de renforcement préventif des poignets."
    />
  </div>
);

/* ============================================================
   STEP 3 — Épaules
   ============================================================ */

const Step3Shoulders = ({ data, update }: StepProps) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Épaules</h2>

    <ScaleInput
      label="Ouverture (overhead) : dos au mur, bras levés, toucher le mur"
      value={data.shoulderOverhead}
      onChange={(v) => update("shoulderOverhead", v)}
      anchorLow="Impossible"
      anchorHigh="Facilement"
    />
    <PainQuestion
      visible={data.shoulderOverhead !== null}
      value={data.shoulderOverheadPain}
      onChange={(v) => update("shoulderOverheadPain", v)}
      alertMessage="Le handstand libre sera différé dans le programme."
    />

    <ScaleInput
      label="Rotation interne/externe (attraper les deux mains dans le dos) — Gauche"
      value={data.shoulderRotLeft}
      onChange={(v) => update("shoulderRotLeft", v)}
    />
    <ScaleInput
      label="Rotation interne/externe — Droit"
      value={data.shoulderRotRight}
      onChange={(v) => update("shoulderRotRight", v)}
    />
    <PainQuestion
      visible={data.shoulderRotLeft !== null || data.shoulderRotRight !== null}
      value={data.shoulderRotPain}
      onChange={(v) => update("shoulderRotPain", v)}
      alertMessage="Le handstand libre sera différé dans le programme."
    />
  </div>
);

/* ============================================================
   STEP 4 — Colonne Vertébrale & Coudes
   ============================================================ */

const Step4Spine = ({ data, update }: StepProps) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Colonne Vertébrale & Coudes</h2>

    <ScaleInput
      label="Extension thoracique (bomber le torse, omoplates rapprochées)"
      value={data.thoracicExt}
      onChange={(v) => update("thoracicExt", v)}
    />
    <PainQuestion
      visible={data.thoracicExt !== null}
      value={data.thoracicPain}
      onChange={(v) => update("thoracicPain", v)}
      alertMessage="Les exercices en extension seront adaptés ou différés."
    />

    <ScaleInput
      label="Pont au sol (bridge)"
      value={data.bridge}
      onChange={(v) => update("bridge", v)}
      anchorLow="Impossible / douleur"
      anchorHigh="Facile, bras tendus"
      customAnchors={{
        1: "Impossible ou douleur lombaire",
        2: "Hanches à peine décollées",
        3: "Pont partiel, bloqué aux épaules",
        4: "Pont correct, bras légèrement pliés",
        5: "Pont complet facile, bras tendus",
      }}
    />

    <ScaleInput
      label="Extension des coudes en appui (planche ou dips) — Gauche"
      value={data.elbowLeft}
      onChange={(v) => update("elbowLeft", v)}
    />
    <ScaleInput
      label="Extension des coudes — Droit"
      value={data.elbowRight}
      onChange={(v) => update("elbowRight", v)}
    />
    <PainQuestion
      visible={data.elbowLeft !== null || data.elbowRight !== null}
      value={data.elbowPain}
      onChange={(v) => update("elbowPain", v)}
      alertMessage="Les exercices en extension seront adaptés ou différés."
    />
  </div>
);

/* ============================================================
   STEP 5 — Chaîne Postérieure
   ============================================================ */

const Step5Posterior = ({ data, update }: StepProps) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Chaîne Postérieure</h2>

    <ScaleInput
      label="Pike — toucher de sol jambes tendues"
      value={data.pike}
      onChange={(v) => update("pike", v)}
      customAnchors={{
        1: "Bloqué aux genoux",
        2: "Milieu des tibias",
        3: "Bout des doigts aux orteils",
        4: "Paumes au sol",
        5: "Poings au sol, torse contre les cuisses",
      }}
    />
    <PainQuestion
      visible={data.pike !== null}
      value={data.pikePain}
      onChange={(v) => update("pikePain", v)}
      alertMessage="Les exercices de compression seront progressifs."
    />

    <ScaleInput
      label="Compression abdominale (buste sur cuisses, assis jambes tendues)"
      value={data.compression}
      onChange={(v) => update("compression", v)}
    />
  </div>
);

/* ============================================================
   STEP 6 — Hanches, Genoux & Chevilles
   ============================================================ */

const Step6Hips = ({ data, update }: StepProps) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Hanches, Genoux & Chevilles</h2>

    <ScaleInput
      label="Deep squat — squat complet talons à plat"
      value={data.deepSquat}
      onChange={(v) => update("deepSquat", v)}
      anchorLow="Perte d'équilibre"
      anchorHigh="Confortable"
    />
    <PainQuestion
      visible={data.deepSquat !== null}
      value={data.deepSquatPain}
      onChange={(v) => update("deepSquatPain", v)}
      alertMessage="Les squats seront adaptés (talons surélevés ou amplitude réduite)."
    />

    <ScaleInput
      label="Ouverture de hanche — Gauche"
      value={data.hipLeft}
      onChange={(v) => update("hipLeft", v)}
    />
    <ScaleInput
      label="Ouverture de hanche — Droit"
      value={data.hipRight}
      onChange={(v) => update("hipRight", v)}
    />

    <ScaleInput
      label="Mobilité cheville / dorsiflexion — Gauche"
      value={data.ankleLeft}
      onChange={(v) => update("ankleLeft", v)}
    />
    <ScaleInput
      label="Mobilité cheville / dorsiflexion — Droit"
      value={data.ankleRight}
      onChange={(v) => update("ankleRight", v)}
    />
  </div>
);

/* ============================================================
   STEP 7 — Récapitulatif
   ============================================================ */

const getScoreColor = (score: number | null): string => {
  if (score === null) return "text-muted-foreground";
  if (score <= 2) return "text-destructive";
  if (score === 3) return "text-foreground";
  return "text-primary";
};

const ScoreRow = ({ label, value }: { label: string; value: number | null }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-semibold", getScoreColor(value))}>
      {value !== null ? `${value} / 5` : "—"}
    </span>
  </div>
);

const SummaryCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-sm border border-border p-4 space-y-2">
    <h3 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">{title}</h3>
    {children}
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{String(value)}</span>
  </div>
);

const PainFlag = ({ label, value }: { label: string; value: boolean | null }) => {
  if (value !== true) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-destructive">
      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
      Douleur signalée : {label}
    </div>
  );
};

const Step7Summary = ({ data }: { data: MobilityData }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-primary">Récapitulatif</h2>

    <SummaryCard title="Informations Générales">
      <SummaryRow label="Âge" value={data.age || "—"} />
      <SummaryRow label="Niveau" value={data.activityLevel || "—"} />
      <SummaryRow label="Blessures" value={data.hasInjuries ? `Oui — ${data.injuryDetails}` : "Non"} />
    </SummaryCard>

    <SummaryCard title="Poignets">
      <ScoreRow label="Extension — Gauche" value={data.wristExtLeft} />
      <ScoreRow label="Extension — Droit" value={data.wristExtRight} />
      <ScoreRow label="Flexion — Gauche" value={data.wristFlexLeft} />
      <ScoreRow label="Flexion — Droit" value={data.wristFlexRight} />
      <PainFlag label="Extension poignets" value={data.wristExtPain} />
      <PainFlag label="Flexion poignets" value={data.wristFlexPain} />
    </SummaryCard>

    <SummaryCard title="Épaules">
      <ScoreRow label="Ouverture overhead" value={data.shoulderOverhead} />
      <ScoreRow label="Rotation — Gauche" value={data.shoulderRotLeft} />
      <ScoreRow label="Rotation — Droit" value={data.shoulderRotRight} />
      <PainFlag label="Ouverture épaules" value={data.shoulderOverheadPain} />
      <PainFlag label="Rotation épaules" value={data.shoulderRotPain} />
    </SummaryCard>

    <SummaryCard title="Colonne & Coudes">
      <ScoreRow label="Extension thoracique" value={data.thoracicExt} />
      <ScoreRow label="Pont (bridge)" value={data.bridge} />
      <ScoreRow label="Coude — Gauche" value={data.elbowLeft} />
      <ScoreRow label="Coude — Droit" value={data.elbowRight} />
      <PainFlag label="Thoracique" value={data.thoracicPain} />
      <PainFlag label="Coudes" value={data.elbowPain} />
    </SummaryCard>

    <SummaryCard title="Chaîne Postérieure">
      <ScoreRow label="Pike" value={data.pike} />
      <ScoreRow label="Compression" value={data.compression} />
      <PainFlag label="Pike" value={data.pikePain} />
    </SummaryCard>

    <SummaryCard title="Hanches & Chevilles">
      <ScoreRow label="Deep squat" value={data.deepSquat} />
      <ScoreRow label="Hanche — Gauche" value={data.hipLeft} />
      <ScoreRow label="Hanche — Droit" value={data.hipRight} />
      <ScoreRow label="Cheville — Gauche" value={data.ankleLeft} />
      <ScoreRow label="Cheville — Droit" value={data.ankleRight} />
      <PainFlag label="Deep squat" value={data.deepSquatPain} />
    </SummaryCard>
  </div>
);

export default DiagnosticMobilite;
