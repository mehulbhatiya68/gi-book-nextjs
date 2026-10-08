"use client";

import React from "react";
import { IoTrashOutline, IoPencilOutline, IoEyeOutline } from "react-icons/io5";

interface ActionIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  size?: "sm" | "md" | "lg";
}

export const DeleteIconButton: React.FC<ActionIconButtonProps> = ({
  title = "Delete",
  className = "",
  size = "md",
  ...props
}) => {
  const iconSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`gi-action-btn-delete ${className}`}
      {...props}
    >
      <IoTrashOutline className={iconSizes[size]} />
    </button>
  );
};

export const EditIconButton: React.FC<ActionIconButtonProps> = ({
  title = "Edit",
  className = "",
  size = "md",
  ...props
}) => {
  const iconSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`gi-action-btn-edit ${className}`}
      {...props}
    >
      <IoPencilOutline className={iconSizes[size]} />
    </button>
  );
};

export const ViewIconButton: React.FC<ActionIconButtonProps> = ({
  title = "View",
  className = "",
  size = "md",
  ...props
}) => {
  const iconSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`gi-action-btn-edit ${className}`}
      {...props}
    >
      <IoEyeOutline className={iconSizes[size]} />
    </button>
  );
};

export interface DeleteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  loading?: boolean;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  label = "Delete",
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`gi-btn-delete ${className}`}
      {...props}
    >
      <IoTrashOutline className="text-base shrink-0" />
      <span>{loading ? "Deleting..." : label}</span>
    </button>
  );
};
