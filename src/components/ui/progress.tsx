"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showAnimation?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showAnimation = false, ...props }, ref) => {
    const percentage = Math.round((value / max) * 100);
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted",
          className
        )}
        {...props}
      >
        <motion.div
          className={cn(
            "h-full bg-gradient-to-r from-primary via-primary/90 to-primary transition-all duration-500 ease-out relative",
            showAnimation && percentage > 0 && percentage < 100 && "progress-enhanced"
          )}
          initial={{ width: 0 }}
          animate={{ 
            width: `${percentage}%`,
            boxShadow: percentage > 0 ? "0 0 10px hsl(var(--primary) / 0.5)" : "none"
          }}
          transition={{ 
            duration: 0.5, 
            ease: [0.4, 0, 0.2, 1] 
          }}
        >
          {/* Shimmer effect for active progress */}
          {showAnimation && percentage > 0 && percentage < 100 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          )}
        </motion.div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress } 