"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  text = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <Loader2
        className={`animate-spin text-purple-400 ${sizeClasses[size]}`}
      />
      {text && (
        <p className={`text-gray-300 ${textSizeClasses[size]}`}>{text}</p>
      )}
    </div>
  );
}
