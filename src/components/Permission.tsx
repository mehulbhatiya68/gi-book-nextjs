"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

interface PermissionProps {
  module: string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Permission({
  module,
  action = "View",
  children,
  fallback = null,
}: PermissionProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
