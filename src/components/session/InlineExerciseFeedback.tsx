import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExerciseFeedbackData {
  reps: number | "";
  rpe: string;
  hasPain: boolean | null;
  painDescription: string;
  painIntensity: number;
}

interface Props {
  exerciseName: string;
  onSubmit: (data: ExerciseFeedbackData) => void;
}

const InlineExerciseFeedback = ({ exerciseName, onSubmit }: Props) => {
  const [reps, setReps] = useState<number | "">("");
  const [rpe, setRpe] = useState("");
  const [hasPain, setHasPain] = useState<boolean | null>(null);
  const [painDescription, setPainDescription] = useState("");
  const [painIntensity, setPainIntensity] = useState(0);

  const handleSubmit = () => {
    onSubmit({ reps, rpe, hasPain, painDescription, painIntensity });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-border bg-secondary/20 px-4 py-3 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Reps par série</Label>
          <Input
            type="number"
            min={0}
            value={reps}
            onChange={(e) => setReps(e.target.value ? Number(e.target.value) : "")}
            placeholder="0"
            className="rounded-sm w-24 h-8 text-sm"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">RPE</Label>
          <Select value={rpe} onValueChange={setRpe}>
            <SelectTrigger className="rounded-sm w-full h-8 text-sm">
              <SelectValue placeholder="RPE" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {n <= 3 ? "— Facile" : n <= 6 ? "— Modéré" : n <= 8 ? "— Difficile" : "— Max"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Douleur ?</Label>
        <div className="flex gap-2">
          {([
            { label: "Non", val: false },
            { label: "Oui", val: true },
          ] as const).map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setHasPain(opt.val)}
              className={cn(
                "rounded-sm border px-3 py-1 text-xs font-medium transition-colors",
                hasPain === opt.val
                  ? opt.val
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {hasPain === true && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Input
              value={painDescription}
              onChange={(e) => setPainDescription(e.target.value)}
              placeholder="Zone et type de douleur…"
              className="rounded-sm h-8 text-sm"
            />
            <div className="space-y-1">
              <Label className="text-xs">Intensité : {painIntensity}/10</Label>
              <input
                type="range"
                min={0}
                max={10}
                value={painIntensity}
                onChange={(e) => setPainIntensity(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="sm"
        onClick={handleSubmit}
        className="gap-1 rounded-sm font-oswald uppercase tracking-wider text-xs h-8"
      >
        <Check className="h-3 w-3" /> Valider
      </Button>
    </motion.div>
  );
};

export default InlineExerciseFeedback;
