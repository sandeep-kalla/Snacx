"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface ClientOnlyDateProps {
  date: number | Date;
  addSuffix?: boolean;
  className?: string;
}

export default function ClientOnlyDate({ 
  date, 
  addSuffix = true, 
  className = "" 
}: ClientOnlyDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return <span className={className}>...</span>;
  }

  return (
    <span className={className}>
      {formatDistanceToNow(date, { addSuffix })}
    </span>
  );
}
