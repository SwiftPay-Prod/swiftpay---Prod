"use client";

import type { ComponentProps } from "react";
import { Button, Spinner } from "@heroui/react";

type ButtonProps = ComponentProps<typeof Button>;

interface AsyncButtonProps extends ButtonProps {
  isPending?: boolean;
}

export function AsyncButton({ isPending, children, isDisabled, ...props }: AsyncButtonProps) {
  return (
    <Button {...props} isPending={isPending} isDisabled={isDisabled || isPending}>
      {isPending ? <Spinner color="current" size="sm" /> : children}
    </Button>
  );
}

