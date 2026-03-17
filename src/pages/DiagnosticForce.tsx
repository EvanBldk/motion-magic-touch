import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProgress } from "@/components/diagnostic/StepProgress";
import { StepWrapper } from "@/components/diagnostic/StepWrapper";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, Send } from "lucide-react";

const STEP_LABELS = ["Profil", "Objectifs", "Force", "Gainage", "Skills", "Récapitulatif"];

const EXPERIENCE_OPTIONS = [
  "Aucune (je commence)",
  "Moins de 6 mois",
  "6 mois à 2 ans",
  "Plus de 2 ans",
];

const DURATION_OPTIONS = [
  "Moins de 30 minutes",
  "30 à 45 minutes",
  "45 à 60 minutes",
  "Plus de 60 minutes",
];

const EQUIPMENT_OPTIONS = [
  "Barre de traction",
  "Barres parallèles",
  "Anneaux",
  "Élastiques de résistance",
  "Lest (ceinture ou gilet)",
  "Aucun matériel (sol uniquement)",
];

const GOAL_OPTIONS = [
  "Développer la force pure",
  "Prendre du muscle",
  "Apprendre une figure spécifique (skill)",
  "Améliorer ma condition physique générale",
];

const HORIZON_OPTIONS = [
  "1 à 3 mois",
  "3 à 6 mois",
  "6 mois à 1 an",
  "Plus d'1 an / pas de deadline",
];

interface ForceTestData {
  reps: number | "";
  formConfirmed: boolean;
  asymmetry: boolean | null;
  asymmetryDetail: string;
}

const emptyTest = (): ForceTestData => ({
  reps: "",
  formConfirmed: false,
  asymmetry: null,
  asymmetryDetail: "",
});

type SkillLevel = string;

interface SkillData {
  level: SkillLevel;
  duration: number | "";
  reps: number | "";
  progression: string;
}

const emptySkill = (): SkillData => ({
  level: "",
  duration: "",
  reps: "",
  progression: "",
});

interface FormData {
  // Step 1
  firstName: string;
  age: number | "";
  experience: string;
  daysPerWeek: number;
  sessionDuration: string;
  equipment: string[];
  // Step 2
  primaryGoal: string;
  secondaryGoal: string;
  horizon: string;
  // Step 3
  pullUps: ForceTestData;
  dips: ForceTestData;
  pushUps: ForceTestData;
  // Step 4
  lSit: ForceTestData & { tucked: boolean };
  hollowHold: ForceTestData;
  // Step 5
  handstand: SkillData;
  muscleUp: SkillData;
  frontLever: SkillData;
  backLever: SkillData;
  planche: SkillData;
  prioritySkill: string;
}

const initialData: FormData = {
  firstName: "",
  age: "",
  experience: "",
  daysPerWeek: 3,
  sessionDuration: "",
  equipment: [],
  primaryGoal: "",
  secondaryGoal: "",
  horizon: "",
  pullUps: emptyTest(),
  dips: emptyTest(),
  pushUps: emptyTest(),
  lSit: { ...emptyTest(), tucked: false },
  hollowHold: emptyTest(),
  handstand: emptySkill(),
  muscleUp: emptySkill(),
  frontLever: emptySkill(),
  backLever: emptySkill(),
  planche: emptySkill(),
  prioritySkill: "",
};

const DiagnosticForce = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Warn before leaving if user has started filling data
  const hasStarted = useMemo(() => data.firstName !== "" || step > 0, [data.firstName, step]);
  useNavigationGuard(hasStarted && !submitting);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleEquipment = (item: string) => {
    setData((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter((e) => e !== item)
        : [...prev.equipment, item],
    }));
  };

  const updateTest = (
    key: "pullUps" | "dips" | "pushUps" | "hollowHold",
    field: keyof ForceTestData,
    value: unknown
  ) => {
    setData((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const updateLSit = (field: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      lSit: { ...prev.lSit, [field]: value },
    }));
  };

  const updateSkill = (key: keyof FormData, field: keyof SkillData, value: unknown) => {
    setData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as SkillData), [field]: value },
    }));
  };

  const isStepValid = (s: number): boolean => {
    switch (s) {
      case 0:
        return (
          data.firstName.trim() !== "" &&
          data.age !== "" && Number(data.age) > 0 &&
          data.experience !== "" &&
          data.sessionDuration !== "" &&
          data.equipment.length > 0
        );
      case 1:
        return data.primaryGoal !== "" && data.horizon !== "";
      case 2:
        return data.pullUps.formConfirmed && data.dips.formConfirmed && data.pushUps.formConfirmed;
      case 3:
        return data.lSit.formConfirmed && data.hollowHold.formConfirmed;
      case 4: {
        const skills = [data.handstand, data.muscleUp, data.frontLever, data.backLever, data.planche];
        return skills.some((sk) => sk.level !== "") && data.prioritySkill !== "";
      }
      default:
        return true;
    }
  };

  const stepValid = isStepValid(step);

  const next = () => { if (stepValid) setStep((s) => Math.min(s + 1, 5)); };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Tu dois être connecté pour soumettre.");
      return;
    }
    setSubmitting(true);
    const experienceMap: Record<string, string> = {
      "Aucune (je commence)": "none",
      "Moins de 6 mois": "less_6m",
      "6 mois à 2 ans": "6m_2y",
      "Plus de 2 ans": "more_2y",
    };

    try {
      const insertData = {
        user_id: user.id,
        first_name: data.firstName || null,
        age: data.age ? Number(data.age) : null,
        experience: experienceMap[data.experience] || null,
        days_per_week: data.daysPerWeek,
        session_duration: data.sessionDuration || null,
        pull_ups: Number(data.pullUps.reps) || 0,
        dips: Number(data.dips.reps) || 0,
        push_ups: Number(data.pushUps.reps) || 0,
        l_sit: Number(data.lSit.reps) || 0,
        hollow: Number(data.hollowHold.reps) || 0,
        equipment: JSON.parse(JSON.stringify(data.equipment)),
        goals: JSON.parse(JSON.stringify({
          primary: data.primaryGoal,
          secondary: data.secondaryGoal,
          horizon: data.horizon,
        })),
        skills: JSON.parse(JSON.stringify({
          handstand: data.handstand,
          muscleUp: data.muscleUp,
          frontLever: data.frontLever,
          backLever: data.backLever,
          planche: data.planche,
          prioritySkill: data.prioritySkill,
        })),
        raw_answers: JSON.parse(JSON.stringify(data)),
      };
      const { error } = await supabase.from("force_evaluations").insert(insertData);
      if (error) throw error;
      toast.success("Évaluation de force enregistrée !");
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
          <h1 className="text-2xl font-bold text-primary">Diagnostic Force & Skills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Évalue ton niveau pour un programme personnalisé.
          </p>
        </div>

        <StepProgress currentStep={step} totalSteps={6} labels={STEP_LABELS} />

        <StepWrapper stepKey={step}>
          {step === 0 && <Step1Profile data={data} update={update} toggleEquipment={toggleEquipment} />}
          {step === 1 && <Step2Goals data={data} update={update} />}
          {step === 2 && <Step3Force data={data} updateTest={updateTest} />}
          {step === 3 && <Step4Core data={data} updateTest={updateTest} updateLSit={updateLSit} />}
          {step === 4 && <Step5Skills data={data} updateSkill={updateSkill} update={update} />}
          {step === 5 && <Step6Summary data={data} />}
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
          {step < 5 ? (
            <Button
              onClick={next}
              className="gap-2 rounded-sm font-oswald uppercase tracking-wider text-xs"
            >
              Suivant <ArrowRight className="h-4 w-4" />
            </Button>
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
   STEP 1 — Profil & Logistique
   ============================================================ */

interface Step1Props {
  data: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  toggleEquipment: (item: string) => void;
}

const Step1Profile = ({ data, update, toggleEquipment }: Step1Props) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Profil & Logistique</h2>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider font-oswald">Prénom</Label>
      <Input
        value={data.firstName}
        onChange={(e) => update("firstName", e.target.value)}
        placeholder="Ton prénom"
        className="rounded-sm"
      />
    </div>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider font-oswald">Âge</Label>
      <Input
        type="number"
        min={10}
        max={80}
        value={data.age}
        onChange={(e) => update("age", e.target.value ? Number(e.target.value) : "")}
        placeholder="25"
        className="rounded-sm"
      />
    </div>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider font-oswald">Expérience en callisthénie</Label>
      <Select value={data.experience} onValueChange={(v) => update("experience", v)}>
        <SelectTrigger className="rounded-sm">
          <SelectValue placeholder="Sélectionne ton niveau" />
        </SelectTrigger>
        <SelectContent>
          {EXPERIENCE_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider font-oswald">
        Jours d'entraînement / semaine : {data.daysPerWeek}
      </Label>
      <input
        type="range"
        min={1}
        max={7}
        value={data.daysPerWeek}
        onChange={(e) => update("daysPerWeek", Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground font-oswald">
        <span>1</span><span>7</span>
      </div>
    </div>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider font-oswald">Durée par séance</Label>
      <Select value={data.sessionDuration} onValueChange={(v) => update("sessionDuration", v)}>
        <SelectTrigger className="rounded-sm">
          <SelectValue placeholder="Sélectionne une durée" />
        </SelectTrigger>
        <SelectContent>
          {DURATION_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-3">
      <Label className="text-xs uppercase tracking-wider font-oswald">Matériel à disposition</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EQUIPMENT_OPTIONS.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-center gap-3 rounded-sm border border-border p-3 transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <Checkbox
              checked={data.equipment.includes(item)}
              onCheckedChange={() => toggleEquipment(item)}
            />
            <span className="text-sm">{item}</span>
          </label>
        ))}
      </div>
    </div>
  </div>
);

/* ============================================================
   STEP 2 — Objectifs
   ============================================================ */

interface Step2Props {
  data: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

const Step2Goals = ({ data, update }: Step2Props) => {
  const secondaryOptions = GOAL_OPTIONS.filter((g) => g !== data.primaryGoal);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-primary">Objectifs</h2>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-oswald">Objectif principal</Label>
        <Select value={data.primaryGoal} onValueChange={(v) => update("primaryGoal", v)}>
          <SelectTrigger className="rounded-sm">
            <SelectValue placeholder="Choisis ton objectif principal" />
          </SelectTrigger>
          <SelectContent>
            {GOAL_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-oswald">Objectif secondaire</Label>
        <Select
          value={data.secondaryGoal}
          onValueChange={(v) => update("secondaryGoal", v)}
          disabled={!data.primaryGoal}
        >
          <SelectTrigger className="rounded-sm">
            <SelectValue placeholder="Choisis ton objectif secondaire" />
          </SelectTrigger>
          <SelectContent>
            {secondaryOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-oswald">Horizon temporel</Label>
        <Select value={data.horizon} onValueChange={(v) => update("horizon", v)}>
          <SelectTrigger className="rounded-sm">
            <SelectValue placeholder="Choisis un horizon" />
          </SelectTrigger>
          <SelectContent>
            {HORIZON_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

/* ============================================================
   STEP 3 — Tests de Force
   ============================================================ */

interface ForceTestBlockProps {
  title: string;
  description: string;
  testData: ForceTestData;
  onChange: (field: keyof ForceTestData, value: unknown) => void;
}

const ForceTestBlock = ({ title, description, testData, onChange }: ForceTestBlockProps) => (
  <div className="space-y-4 rounded-sm border border-border p-4">
    <h3 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">{title}</h3>
    <p className="text-xs text-muted-foreground">{description}</p>

    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider font-oswald">Répétitions</Label>
      <Input
        type="number"
        min={0}
        value={testData.reps}
        onChange={(e) => onChange("reps", e.target.value ? Number(e.target.value) : "")}
        placeholder="0"
        className="rounded-sm w-32"
      />
    </div>

    <AnimatePresence>
      {testData.reps === 0 && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="text-xs text-muted-foreground italic"
        >
          Le programme proposera des exercices de progression adaptés.
        </motion.p>
      )}
    </AnimatePresence>

    <label className="flex items-center gap-2">
      <Checkbox
        checked={testData.formConfirmed}
        onCheckedChange={(v) => onChange("formConfirmed", !!v)}
      />
      <span className="text-xs">Je confirme avoir respecté la forme décrite</span>
    </label>

    <div className="space-y-2">
      <Label className="text-xs">Déséquilibre gauche/droite ressenti ?</Label>
      <div className="flex gap-2">
        {[
          { label: "Oui", val: true },
          { label: "Non", val: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange("asymmetry", opt.val)}
            className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
              testData.asymmetry === opt.val
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>

    <AnimatePresence>
      {testData.asymmetry === true && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
          <Input
            value={testData.asymmetryDetail}
            onChange={(e) => onChange("asymmetryDetail", e.target.value)}
            placeholder="Précise le déséquilibre ressenti…"
            className="rounded-sm text-sm"
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface Step3Props {
  data: FormData;
  updateTest: (key: "pullUps" | "dips" | "pushUps" | "hollowHold", field: keyof ForceTestData, value: unknown) => void;
}

const Step3Force = ({ data, updateTest }: Step3Props) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Tests de Force Pure</h2>

    <ForceTestBlock
      title="Tractions (Pull-ups)"
      description="Bras tendus en bas, menton au-dessus de la barre en haut, sans élan."
      testData={data.pullUps}
      onChange={(f, v) => updateTest("pullUps", f, v)}
    />
    <ForceTestBlock
      title="Dips"
      description="Bras tendus en haut, descente jusqu'à 90° de flexion des coudes, sans balancement."
      testData={data.dips}
      onChange={(f, v) => updateTest("dips", f, v)}
    />
    <ForceTestBlock
      title="Pompes (Push-ups)"
      description="Corps aligné, poitrine qui touche le sol, coudes à environ 45° du corps."
      testData={data.pushUps}
      onChange={(f, v) => updateTest("pushUps", f, v)}
    />
  </div>
);

/* ============================================================
   STEP 4 — Gainage & Stabilité
   ============================================================ */

interface Step4Props {
  data: FormData;
  updateTest: (key: "pullUps" | "dips" | "pushUps" | "hollowHold", field: keyof ForceTestData, value: unknown) => void;
  updateLSit: (field: string, value: unknown) => void;
}

const Step4Core = ({ data, updateTest, updateLSit }: Step4Props) => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-primary">Gainage & Stabilité</h2>

    <div className="space-y-4 rounded-sm border border-border p-4">
      <h3 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">L-Sit</h3>
      <p className="text-xs text-muted-foreground">
        Assis au sol ou aux barres, jambes tendues et parallèles au sol, hanches décollées.
      </p>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-oswald">Secondes de maintien</Label>
        <Input
          type="number"
          min={0}
          value={data.lSit.reps}
          onChange={(e) => updateLSit("reps", e.target.value ? Number(e.target.value) : "")}
          placeholder="0"
          className="rounded-sm w-32"
        />
      </div>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={data.lSit.tucked}
          onCheckedChange={(v) => updateLSit("tucked", !!v)}
        />
        <span className="text-xs">Version genoux pliés (tucked)</span>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={data.lSit.formConfirmed}
          onCheckedChange={(v) => updateLSit("formConfirmed", !!v)}
        />
        <span className="text-xs">Je confirme avoir respecté la forme décrite</span>
      </label>
      <div className="space-y-2">
        <Label className="text-xs">Déséquilibre gauche/droite ressenti ?</Label>
        <div className="flex gap-2">
          {[{ label: "Oui", val: true }, { label: "Non", val: false }].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => updateLSit("asymmetry", opt.val)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                data.lSit.asymmetry === opt.val
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {data.lSit.asymmetry === true && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Input
              value={data.lSit.asymmetryDetail}
              onChange={(e) => updateLSit("asymmetryDetail", e.target.value)}
              placeholder="Précise le déséquilibre…"
              className="rounded-sm text-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <ForceTestBlock
      title="Hollow Body Hold"
      description="Dos au sol, bas du dos collé au sol, bras et jambes tendus et soulevés."
      testData={data.hollowHold}
      onChange={(f, v) => updateTest("hollowHold", f, v)}
    />
  </div>
);

/* ============================================================
   STEP 5 — Skills
   ============================================================ */

interface SkillBlockProps {
  title: string;
  levels: { value: string; label: string; showDuration?: boolean; showReps?: boolean; showProgression?: boolean }[];
  skillData: SkillData;
  onChange: (field: keyof SkillData, value: unknown) => void;
}

const SkillBlock = ({ title, levels, skillData, onChange }: SkillBlockProps) => {
  const selected = levels.find((l) => l.value === skillData.level);
  return (
    <div className="space-y-3 rounded-sm border border-border p-4">
      <h3 className="font-oswald text-sm font-semibold uppercase tracking-wider text-primary">{title}</h3>
      <Select value={skillData.level} onValueChange={(v) => onChange("level", v)}>
        <SelectTrigger className="rounded-sm">
          <SelectValue placeholder="Sélectionne ton niveau" />
        </SelectTrigger>
        <SelectContent>
          {levels.map((l) => (
            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <AnimatePresence>
        {selected?.showDuration && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Input
              type="number" min={0}
              value={skillData.duration}
              onChange={(e) => onChange("duration", e.target.value ? Number(e.target.value) : "")}
              placeholder="Durée en secondes"
              className="rounded-sm w-48"
            />
          </motion.div>
        )}
        {selected?.showReps && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Input
              type="number" min={0}
              value={skillData.reps}
              onChange={(e) => onChange("reps", e.target.value ? Number(e.target.value) : "")}
              placeholder="Nombre de répétitions"
              className="rounded-sm w-48"
            />
          </motion.div>
        )}
        {selected?.showProgression && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Input
              value={skillData.progression}
              onChange={(e) => onChange("progression", e.target.value)}
              placeholder="Précise la progression (tuck planche, advanced tuck…)"
              className="rounded-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Step5Props {
  data: FormData;
  updateSkill: (key: keyof FormData, field: keyof SkillData, value: unknown) => void;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

const HANDSTAND_LEVELS = [
  { value: "not_started", label: "Pas encore commencé" },
  { value: "wall", label: "Je tiens contre le mur", showDuration: true },
  { value: "free", label: "Je tiens en libre", showDuration: true },
];

const MUSCLE_UP_LEVELS = [
  { value: "not_started", label: "Pas encore commencé" },
  { value: "band", label: "Je travaille avec élastique" },
  { value: "unassisted", label: "Je le réalise sans aide", showReps: true },
];

const FRONT_LEVER_LEVELS = [
  { value: "not_started", label: "Pas encore commencé" },
  { value: "tucked", label: "Version tucked (genoux pliés)" },
  { value: "one_leg", label: "Version une jambe tendue" },
  { value: "full", label: "Version complète", showDuration: true },
];

const BACK_LEVER_LEVELS = [
  { value: "not_started", label: "Pas encore commencé" },
  { value: "tucked", label: "Version tucked" },
  { value: "full", label: "Version complète", showDuration: true },
];

const PLANCHE_LEVELS = [
  { value: "not_started", label: "Pas encore commencé" },
  { value: "progressions", label: "Je travaille les progressions", showProgression: true },
  { value: "full", label: "Version complète", showDuration: true },
];

const ALL_SKILLS = ["Handstand", "Muscle-up", "Front Lever", "Back Lever", "Planche"];

const Step5Skills = ({ data, updateSkill, update }: Step5Props) => {
  // Filter out skills already at full/free/unassisted level for priority selection
  const completedSkills: string[] = [];
  if (data.handstand.level === "free") completedSkills.push("Handstand");
  if (data.muscleUp.level === "unassisted") completedSkills.push("Muscle-up");
  if (data.frontLever.level === "full") completedSkills.push("Front Lever");
  if (data.backLever.level === "full") completedSkills.push("Back Lever");
  if (data.planche.level === "full") completedSkills.push("Planche");
  const priorityOptions = ALL_SKILLS.filter((s) => !completedSkills.includes(s));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-primary">Compétences (Skills)</h2>

      <div className="space-y-1">
        <h3 className="font-oswald text-xs font-semibold uppercase tracking-wider text-muted-foreground">Équilibre</h3>
        <SkillBlock title="Handstand" levels={HANDSTAND_LEVELS} skillData={data.handstand} onChange={(f, v) => updateSkill("handstand", f, v)} />
      </div>

      <div className="space-y-1">
        <h3 className="font-oswald text-xs font-semibold uppercase tracking-wider text-muted-foreground">Traction / Tirage</h3>
        <SkillBlock title="Muscle-up" levels={MUSCLE_UP_LEVELS} skillData={data.muscleUp} onChange={(f, v) => updateSkill("muscleUp", f, v)} />
        <SkillBlock title="Front Lever" levels={FRONT_LEVER_LEVELS} skillData={data.frontLever} onChange={(f, v) => updateSkill("frontLever", f, v)} />
        <SkillBlock title="Back Lever" levels={BACK_LEVER_LEVELS} skillData={data.backLever} onChange={(f, v) => updateSkill("backLever", f, v)} />
      </div>

      <div className="space-y-1">
        <h3 className="font-oswald text-xs font-semibold uppercase tracking-wider text-muted-foreground">Poussée / Appui</h3>
        <SkillBlock title="Planche" levels={PLANCHE_LEVELS} skillData={data.planche} onChange={(f, v) => updateSkill("planche", f, v)} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-oswald">Figure prioritaire à travailler</Label>
        <Select value={data.prioritySkill} onValueChange={(v) => update("prioritySkill", v)}>
          <SelectTrigger className="rounded-sm">
            <SelectValue placeholder="Choisis ta priorité" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

/* ============================================================
   STEP 6 — Récapitulatif
   ============================================================ */

const getForceLevel = (exercise: string, reps: number | ""): string => {
  if (reps === "" || reps === 0) return "Débutant";
  const r = Number(reps);
  if (exercise === "pullUps") return r >= 15 ? "Avancé" : r >= 8 ? "Intermédiaire" : "Débutant";
  if (exercise === "dips") return r >= 20 ? "Avancé" : r >= 10 ? "Intermédiaire" : "Débutant";
  if (exercise === "pushUps") return r >= 30 ? "Avancé" : r >= 15 ? "Intermédiaire" : "Débutant";
  return "";
};

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

const Step6Summary = ({ data }: { data: FormData }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-primary">Récapitulatif</h2>

    <SummaryCard title="Profil">
      <SummaryRow label="Prénom" value={data.firstName || "—"} />
      <SummaryRow label="Âge" value={data.age || "—"} />
      <SummaryRow label="Expérience" value={data.experience || "—"} />
      <SummaryRow label="Jours / semaine" value={data.daysPerWeek} />
      <SummaryRow label="Durée séance" value={data.sessionDuration || "—"} />
      <SummaryRow label="Matériel" value={data.equipment.join(", ") || "—"} />
    </SummaryCard>

    <SummaryCard title="Objectifs">
      <SummaryRow label="Principal" value={data.primaryGoal || "—"} />
      <SummaryRow label="Secondaire" value={data.secondaryGoal || "—"} />
      <SummaryRow label="Horizon" value={data.horizon || "—"} />
    </SummaryCard>

    <SummaryCard title="Force Pure">
      <SummaryRow label="Tractions" value={`${data.pullUps.reps || 0} reps — ${getForceLevel("pullUps", data.pullUps.reps)}`} />
      <SummaryRow label="Dips" value={`${data.dips.reps || 0} reps — ${getForceLevel("dips", data.dips.reps)}`} />
      <SummaryRow label="Pompes" value={`${data.pushUps.reps || 0} reps — ${getForceLevel("pushUps", data.pushUps.reps)}`} />
    </SummaryCard>

    <SummaryCard title="Gainage">
      <SummaryRow label="L-Sit" value={`${data.lSit.reps || 0}s${data.lSit.tucked ? " (tucked)" : ""}`} />
      <SummaryRow label="Hollow Hold" value={`${data.hollowHold.reps || 0}s`} />
    </SummaryCard>

    <SummaryCard title="Skills">
      <SummaryRow label="Handstand" value={data.handstand.level || "—"} />
      <SummaryRow label="Muscle-up" value={data.muscleUp.level || "—"} />
      <SummaryRow label="Front Lever" value={data.frontLever.level || "—"} />
      <SummaryRow label="Back Lever" value={data.backLever.level || "—"} />
      <SummaryRow label="Planche" value={data.planche.level || "—"} />
      <SummaryRow label="Priorité" value={data.prioritySkill || "—"} />
    </SummaryCard>
  </div>
);

export default DiagnosticForce;
