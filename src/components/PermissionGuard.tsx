"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/AccessDenied";

interface PermissionGuardProps {
  module: string;
  action?: string;
  children: React.ReactNode;
}

export default function PermissionGuard({ module, action = "View", children }: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  if (hasPermission(module, action)) {
    return <>{children}</>;
  }

  return <AccessDenied moduleName={module} />;
}
