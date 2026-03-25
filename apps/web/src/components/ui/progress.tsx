import * as React from "react";

import { cn } from "../../lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const normalizedValue = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
        className={cn(
          "relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/80",
          className
        )}
        {...props}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";
