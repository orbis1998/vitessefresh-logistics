import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period: string;
  };
  icon: LucideIcon;
  className?: string;
  variant?: "default" | "gradient" | "glass";
}

const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  className,
  variant = "default"
}: StatsCardProps) => {
  const variants = {
    default: "bg-background border border-border",
    gradient: "bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20",
    glass: "glass-card"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "p-6 rounded-2xl hover:shadow-lg transition-all duration-300",
        variants[variant],
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            change.type === "increase" 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          )}>
            {change.type === "increase" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change.value)}%
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">
          {value}
        </h3>
        <p className="text-muted-foreground text-sm">
          {title}
        </p>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            {change.period}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
