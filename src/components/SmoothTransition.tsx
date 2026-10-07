"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SmoothTransitionProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export default function SmoothTransition({
  children,
  className = "",
  duration = 0.2,
}: SmoothTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
