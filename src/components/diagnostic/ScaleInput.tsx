import { cn } from "@/lib/utils";

interface ScaleInputProps {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
  anchorLow?: string;
  anchorHigh?: string;
}

const ScaleInput = ({
  value,
  onChange,
  label,
  anchorLow = "Très limité",
  anchorHigh = "Aucune limitation",
}: ScaleInputProps) => {
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
    </div>
  );
};

export { ScaleInput };
