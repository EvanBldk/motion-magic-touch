import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";

interface PainQuestionProps {
  visible: boolean;
  value: boolean | null;
  onChange: (val: boolean) => void;
  alertMessage?: string;
}

const PainQuestion = ({ visible, value, onChange, alertMessage }: PainQuestionProps) => {
  if (!visible) return null;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Ressens-tu une douleur (pas juste une tension) ?
      </label>
      <div className="flex gap-3">
        {[
          { label: "Oui", val: true },
          { label: "Non", val: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.val)}
            className={`rounded-sm border px-4 py-2 text-sm font-medium transition-colors ${
              value === opt.val
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {value === true && alertMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{alertMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { PainQuestion };
