import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface StepWrapperProps {
  stepKey: number;
  children: ReactNode;
}

const variants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const StepWrapper = ({ stepKey, children }: StepWrapperProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export { StepWrapper };
