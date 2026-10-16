"use client";

import { ReactNode } from "react";

interface SmoothTransitionProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export default function SmoothTransition({
  children,
  className = "",
}: SmoothTransitionProps) {
  return <div className={className}>{children}</div>;
}
