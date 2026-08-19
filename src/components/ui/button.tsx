"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 active:scale-[0.98] transition-transform",
  {
    variants: {
      variant: {
        primary: "bg-sage text-white hover:bg-sage-deep shadow-sm shadow-sage/20",
        soft: "bg-sage-soft text-sage-deep hover:bg-sage-soft/70",
        outline: "border border-line bg-surface text-ink hover:bg-paper-deep",
        ghost: "text-ink-soft hover:bg-paper-deep hover:text-ink",
        quiet: "text-ink-soft hover:text-ink underline underline-offset-4",
      },
      size: {
        sm: "h-10 px-4 text-sm [&_svg]:size-4",
        md: "h-11 px-5 text-[15px] [&_svg]:size-[18px]",
        lg: "h-13 px-6 text-base [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
