import { cn } from "@/lib/utils";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepProgress = ({ currentStep, totalSteps, labels }: StepProgressProps) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-oswald uppercase tracking-wider text-muted-foreground">
          Étape {currentStep + 1} / {totalSteps}
        </span>
        <span className="text-xs font-oswald uppercase tracking-wider text-primary font-semibold">
          {labels[currentStep]}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export { StepProgress };
