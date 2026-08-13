"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useLoading } from "@/components/providers/LoadingProvider"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow hover:bg-blue-700",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline:
          "border border-gray-300 bg-white shadow-sm hover:bg-gray-50",
        secondary:
          "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200",
        ghost: "hover:bg-gray-100",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  useGlobalLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, loadingText, useGlobalLoading = true, onClick, disabled, children, ...props }, ref) => {
    let loadingContext: any = null;
    try {
      loadingContext = useLoading();
    } catch (e) {
      // Fallback if not wrapped in LoadingProvider (e.g. some isolated tests)
      useGlobalLoading = false;
    }

    React.useEffect(() => {
      if (useGlobalLoading && loadingContext) {
        if (isLoading) {
          loadingContext.startLoading(loadingText);
        } else {
          loadingContext.stopLoading();
        }
      }
      return () => {
        if (useGlobalLoading && isLoading && loadingContext) {
          loadingContext.stopLoading();
        }
      }
    }, [isLoading, loadingText, useGlobalLoading, loadingContext]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (!onClick) return;
      
      const result = onClick(e) as any;
      if (result && typeof result.then === 'function') {
        if (useGlobalLoading && loadingContext) loadingContext.startLoading(loadingText);
        result.finally(() => {
          if (useGlobalLoading && loadingContext) loadingContext.stopLoading();
        });
      }
    };

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    const showInlineLoading = isLoading && !useGlobalLoading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {showInlineLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
