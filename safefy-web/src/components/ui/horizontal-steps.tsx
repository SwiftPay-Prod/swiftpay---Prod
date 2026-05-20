"use client";

import type { ComponentProps } from "react";

import React from "react";
import { useControlledState } from "@react-stately/utils";
import { m, LazyMotion, domAnimation, AnimatePresence } from "framer-motion";
import { cn } from "@heroui/react";

export interface StepConfig {
  title: string;
}

export type StepColor = "primary" | "secondary" | "success" | "warning" | "danger";

export interface HorizontalStepsProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  steps: StepConfig[];
  color?: StepColor;
  currentStep?: number;
  defaultStep?: number;
  onStepChange?: (stepIndex: number) => void;
  isClickable?: boolean;
}

function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <m.path
        animate={{ pathLength: 1 }}
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        transition={{
          delay: 0.1,
          type: "tween",
          ease: "easeOut",
          duration: 0.3,
        }}
      />
    </svg>
  );
}

const colorMap: Record<StepColor, { bg: string; border: string; text: string }> = {
  primary: {
    bg: "bg-accent",
    border: "border-accent",
    text: "text-accent",
  },
  secondary: {
    bg: "bg-secondary",
    border: "border-secondary",
    text: "text-secondary",
  },
  success: {
    bg: "bg-success",
    border: "border-success",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning",
    border: "border-warning",
    text: "text-warning",
  },
  danger: {
    bg: "bg-danger",
    border: "border-danger",
    text: "text-danger",
  },
};

const HorizontalSteps = React.forwardRef<HTMLElement, HorizontalStepsProps>(
  (
    {
      color = "primary",
      steps = [],
      defaultStep = 0,
      onStepChange,
      currentStep: currentStepProp,
      isClickable = false,
      className,
      ...props
    },
    ref
  ) => {
    const [currentStep, setCurrentStep] = useControlledState(
      currentStepProp,
      defaultStep,
      onStepChange
    );

    const colors = colorMap[color];

    function handleStepClick(stepIdx: number) {
      if (isClickable && onStepChange) {
        setCurrentStep(stepIdx);
      }
    }

    return (
      <LazyMotion features={domAnimation}>
        <nav
          ref={ref}
          aria-label="Progress"
          className={cn("w-full overflow-x-auto", className)}
          {...props}
        >
          <ol className="flex items-start justify-center">
            {steps.map((step, stepIdx) => {
              const isComplete = stepIdx < currentStep;
              const isActive = stepIdx === currentStep;
              const isInactive = stepIdx > currentStep;
              const isLastStep = stepIdx === steps.length - 1;
              const canClick = isClickable && stepIdx !== currentStep;

              return (
                <li
                  key={stepIdx}
                  className={cn("relative flex items-start", !isLastStep && "flex-1")}
                >
                  <div 
                    className={cn(
                      "flex flex-col items-center",
                      canClick && "cursor-pointer"
                    )}
                    onClick={() => canClick && handleStepClick(stepIdx)}
                    onKeyDown={(e) => {
                      if (canClick && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        handleStepClick(stepIdx);
                      }
                    }}
                    role={canClick ? "button" : undefined}
                    tabIndex={canClick ? 0 : undefined}
                  >
                    <m.div
                      className={cn(
                        "relative z-10 m-2 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300",
                        isComplete && cn(colors.bg, colors.border, "text-white"),
                        isActive && cn("bg-transparent", colors.border, colors.text),
                        isInactive && "border-muted text-muted bg-transparent",
                        canClick && "hover:scale-110"
                      )}
                      initial={false}
                      animate={{
                        scale: isActive ? 1.05 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <AnimatePresence mode="wait">
                        {isComplete ? (
                          <m.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CheckIcon className="h-5 w-5" />
                          </m.div>
                        ) : (
                          <m.span
                            key="number"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {stepIdx + 1}
                          </m.span>
                        )}
                      </AnimatePresence>
                    </m.div>

                    <div className="mt-3 w-20 text-center">
                      <span
                        className={cn(
                          "text-sm font-medium leading-tight transition-colors duration-300",
                          (isComplete || isActive) && "text-foreground",
                          isInactive && "text-muted"
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>

                  {!isLastStep && (
                    <div className="relative mt-7 h-0.5 flex-1 bg-muted">
                      <m.div
                        className="absolute inset-y-0 left-0 h-full bg-accent"
                        initial={{ width: "0%" }}
                        animate={{ width: isComplete ? "100%" : "0%" }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </LazyMotion>
    );
  }
);

HorizontalSteps.displayName = "HorizontalSteps";

export { HorizontalSteps };

