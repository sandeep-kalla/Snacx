// Migration example: How to gradually replace your existing FollowButton

import { useState } from "react";
import FollowButton from "./FollowButton"; // Your existing component
import OptimizedFollowButton from "./OptimizedFollowButton"; // New optimized component

interface MigrationFollowButtonProps {
  targetUserId: string;
  useOptimized?: boolean; // Feature flag to enable optimization
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function MigrationFollowButton({
  useOptimized = true, // Enable by default, but allow fallback
  ...props
}: MigrationFollowButtonProps) {
  const [hasError, setHasError] = useState(false);

  // Error boundary for graceful fallback
  if (hasError || !useOptimized) {
    return <FollowButton {...props} />;
  }

  try {
    return (
      <OptimizedFollowButton
        {...props}
        onError={() => setHasError(true)} // Add error handling
      />
    );
  } catch (error) {
    console.warn("Falling back to original FollowButton:", error);
    return <FollowButton {...props} />;
  }
}

// Usage examples:

// 1. Immediate replacement (recommended for new features)
export function NewUserProfile({ userId }: { userId: string }) {
  return (
    <div>
      {/* Use optimized version directly */}
      <OptimizedFollowButton targetUserId={userId} />
    </div>
  );
}

// 2. Gradual migration (safe for existing features)
export function ExistingUserProfile({ userId }: { userId: string }) {
  return (
    <div>
      {/* Feature flag approach */}
      <MigrationFollowButton
        targetUserId={userId}
        useOptimized={true} // Set to false if issues occur
      />
    </div>
  );
}

// 3. A/B testing approach
export function ABTestUserProfile({ userId }: { userId: string }) {
  const useOptimized = Math.random() > 0.5; // 50% split for testing

  return (
    <div>
      <MigrationFollowButton
        targetUserId={userId}
        useOptimized={useOptimized}
      />
    </div>
  );
}
