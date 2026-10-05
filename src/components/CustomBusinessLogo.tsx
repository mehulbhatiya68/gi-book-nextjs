"use client";

import React, { useState, useEffect } from "react";
import { IoStorefrontOutline } from "react-icons/io5";

export function formatImageUrl(input?: any): string {
  if (!input) return "";
  let urlStr = "";
  if (typeof input === "string") {
    urlStr = input.trim();
  } else if (typeof input === "object" && input !== null) {
    urlStr = (input.url || input.path || input.full_url || input.file_path || "").toString().trim();
  }
  if (!urlStr) return "";

  if (
    urlStr.startsWith("http://") ||
    urlStr.startsWith("https://") ||
    urlStr.startsWith("data:") ||
    urlStr.startsWith("blob:")
  ) {
    return urlStr;
  }

  const cleanPath = urlStr.startsWith("/") ? urlStr : `/${urlStr}`;
  const envBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  let origin = envBase;
  try {
    if (envBase.startsWith("http")) {
      origin = new URL(envBase).origin;
    }
  } catch (_) {}

  return `${origin}${cleanPath}`;
}

export interface CustomBusinessLogoProps {
  logoPath?: any;
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "none";
  name?: string | null;
  size?: number;
  className?: string;
  shape?: "circle" | "rounded";
}

export default function CustomBusinessLogo({
  logoPath,
  width = 80,
  height = 80,
  fit = "cover",
  name,
  size,
  className = "",
  shape = "circle",
}: CustomBusinessLogoProps) {
  const [imgError, setImgError] = useState(false);

  // If size prop is explicitly provided, use size for width and height; otherwise use width & height
  const logoWidth = size || width;
  const logoHeight = size || height;

  const rawPath = (
    typeof logoPath === "string"
      ? logoPath
      : logoPath?.url || logoPath?.path || logoPath?.business_logo || ""
  )
    .toString()
    .trim();

  const formattedUrl = formatImageUrl(rawPath);

  // Validate path matching Flutter logic
  const hasValidPath =
    formattedUrl.length > 0 &&
    rawPath !== "assets/images/Image.png" &&
    !rawPath.endsWith("media_image.png");

  // Reset imgError when logoPath changes
  useEffect(() => {
    setImgError(false);
  }, [logoPath]);

  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const initial = name && name.trim().length > 0 ? name.trim()[0].toUpperCase() : "";

  if (!hasValidPath || imgError) {
    return (
      <div
        className={`shrink-0 flex items-center justify-center font-semibold gi-surface-secondary gi-text-primary border gi-divider shadow-xs ${roundedClass} ${className}`}
        style={{
          width: `${logoWidth}px`,
          height: `${logoHeight}px`,
          fontSize: `${logoWidth * 0.4}px`,
        }}
      >
        {initial ? (
          <span>{initial}</span>
        ) : (
          <IoStorefrontOutline style={{ fontSize: `${logoWidth * 0.5}px` }} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 border gi-divider shadow-xs ${roundedClass} ${className}`}
      style={{ width: `${logoWidth}px`, height: `${logoHeight}px` }}
    >
      <img
        src={formattedUrl}
        alt={name || "Business Logo"}
        onError={() => {
          console.warn("[CustomBusinessLogo] Failed to load image URL:", formattedUrl);
          setImgError(true);
        }}
        style={{ objectFit: fit }}
        className="w-full h-full p-0.5"
      />
    </div>
  );
}
