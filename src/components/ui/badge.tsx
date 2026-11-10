import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 max-w-full",
  {
    variants: {
      variant: {
        default: "bg-purple-100 text-purple-800 border border-purple-200/60",
        secondary: "bg-neutral-100 text-neutral-800 border border-neutral-200",
        destructive: "bg-rose-100 text-rose-800 border border-rose-200",
        outline: "text-neutral-700 border border-neutral-300",
        warning: "bg-amber-100 text-amber-900 border border-amber-200",
        campus: "bg-blue-100 text-blue-800 border border-blue-200",
        accent: "bg-orange-500 text-white shadow-xs",
        dark: "bg-neutral-900 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
