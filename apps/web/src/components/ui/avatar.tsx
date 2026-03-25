import * as React from "react";

import { cn } from "../../lib/utils";

export const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-secondary/80",
      className
    )}
    {...props}
  />
));

Avatar.displayName = "Avatar";

export const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt = "", ...props }, ref) => (
  <img
    ref={ref}
    alt={alt}
    className={cn("size-full object-cover", className)}
    {...props}
  />
));

AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex size-full items-center justify-center bg-primary/10 text-xs font-semibold uppercase text-primary",
      className
    )}
    {...props}
  />
));

AvatarFallback.displayName = "AvatarFallback";
