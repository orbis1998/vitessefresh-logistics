import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
  variant?: "default" | "compact";
}

const ProgressIndicator = ({ 
  steps, 
  currentStep, 
  className,
  variant = "default"
}: ProgressIndicatorProps) => {
  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      {variant === "default" && (
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <motion.div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  index <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: index === currentStep ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              >
                {index + 1}
              </motion.div>
              <span className={cn(
                "text-xs mt-2 text-center max-w-20",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        
        {/* Step Markers */}
        <div className="absolute top-0 w-full flex justify-between">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-4 h-4 rounded-full -mt-1 transition-colors",
                index <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {variant === "compact" && (
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <span
              key={step}
              className={cn(
                "text-xs",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
