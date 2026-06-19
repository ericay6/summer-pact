import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunset-300",
  {
    variants: {
      variant: {
        primary:
          "bg-sunset-500 text-white shadow-cozy hover:bg-sunset-600",
        secondary:
          "bg-white text-ink border border-sand-200 hover:bg-sand-50",
        ghost: "text-ink/80 hover:bg-sand-100",
        lagoon: "bg-lagoon-500 text-white hover:bg-lagoon-600 shadow-cozy",
        berry: "bg-berry-500 text-white hover:bg-berry-400 shadow-cozy",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { buttonVariants };
