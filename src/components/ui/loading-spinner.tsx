"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8"
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <motion.div
        className="absolute inset-0 border-2 border-primary/20 rounded-full"
      />
      <motion.div
        className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute inset-1 border border-transparent border-t-primary/50 rounded-full"
        animate={{ rotate: -360 }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </motion.div>
  )
}

export function PulsingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1 items-center", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
} 