import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, X } from "lucide-react";

interface Props {
  seconds: number;
  onDone: () => void;
}

const RestTimer = ({ seconds, onDone }: Props) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-6 rounded-sm border border-border bg-background p-8 shadow-lg">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <span className="font-oswald text-sm uppercase tracking-wider text-muted-foreground">Repos</span>
        </div>
        <span className="text-5xl font-bold tabular-nums text-primary">
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
        <div className="h-1.5 w-48 overflow-hidden rounded-sm bg-secondary">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={onDone} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3 w-3" /> Passer
        </button>
      </div>
    </motion.div>
  );
};

export default RestTimer;
