import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const DEFAULT_ANCHORS: Record<number, string> = {
  1: "Impossible ou très limité",
  2: "Difficile, amplitude très réduite",
  3: "Possible mais inconfortable",
  4: "Confortable, légère restriction",
  5: "Aucune limitation",
};

interface ScaleInputProps {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
  anchorLow?: string;
  anchorHigh?: string;
  customAnchors?: Record<number, string>;
}

const ScaleInput = ({
  value,
  onChange,
  label,
  anchorLow = "Très limité",
  anchorHigh = "Aucune limitation",
  customAnchors,
}: ScaleInputProps) => {
  const anchors = customAnchors ?? DEFAULT_ANCHORS;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-sm border text-sm font-semibold transition-colors",
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-oswald">
        <span>{anchorLow}</span>
        <span>{anchorHigh}</span>
      </div>
      <AnimatePresence>
        {value !== null && anchors[value] && (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-muted-foreground italic"
          >
            {value}/5 — {anchors[value]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export { ScaleInput };
