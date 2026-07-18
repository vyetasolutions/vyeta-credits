import React from "react";

export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="rounded-xl2 border border-base-700 bg-base-850 shadow-card p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonBalance() {
  return (
    <div className="rounded-xl2 border border-base-700 bg-base-850 shadow-card p-5">
      <Skeleton className="h-3 w-28 mb-3" />
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-3 w-32 mb-5" />
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
    </div>
  );
}
