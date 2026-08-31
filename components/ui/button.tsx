import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border px-5 text-sm font-black tracking-wide transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-cyan-pop bg-[#123550] text-cyan-pop hover:bg-[#16425f]",
        orange: "border-orange-pop bg-[#302525] text-orange-pop hover:bg-[#3a2a23]",
        red: "border-[#ff3838] bg-[#351d2d] text-[#ff3838] hover:bg-[#402033]",
        ghost: "border-transparent bg-transparent text-[#aeb3c4] hover:text-white",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-9 rounded-[10px] px-3 text-xs",
        icon: "h-12 w-12 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
