import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  variant?: "default" | "glass" | "gradient";
}

const AnimatedCard = ({ 
  children, 
  className, 
  delay = 0, 
  hover = true,
  variant = "default"
}: AnimatedCardProps) => {
  const variants = {
    default: "bg-background rounded-2xl border border-border",
    glass: "glass-card rounded-2xl",
    gradient: "bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className={cn(
        variants[variant],
        hover && "hover:border-primary/30 hover:shadow-lg transition-all duration-300",
        className
      )}
      whileHover={hover ? { y: -5, transition: { duration: 0.3 } } : undefined}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
