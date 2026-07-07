"use client";

import { Button, Card } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Icon } from '@/components/ui/icon';
import { AlertCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SwiftPayBrandLogo } from '@/components/ui/swiftpay-brand-logo';
import { Routes } from '@/router/routes';

interface ConfirmEmailContentProps {
  status: "success" | "error";
  message: string;
}

function SwiftPayLogo() {
  return <SwiftPayBrandLogo iconSize={30} textClassName="text-3xl text-white" />;
}

export function ConfirmEmailContent({
  status,
  message,
}: ConfirmEmailContentProps) {
  const router = useRouter();

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(15, 23, 42)"
      gradientBackgroundEnd="rgb(30, 58, 138)"
      firstColor="59, 130, 246"
      secondColor="6, 182, 212"
      thirdColor="99, 102, 241"
      fourthColor="14, 165, 233"
      fifthColor="139, 92, 246"
      pointerColor="56, 189, 248"
      size="80%"
      blendingValue="hard-light"
      interactive={true}
      containerClassName="min-h-screen"
    >
      <div className="absolute inset-0 z-50 flex flex-col">
        <div className="flex justify-between items-center p-4 lg:p-6">
          <SwiftPayLogo />
          <ThemeToggle />
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center backdrop-blur-sm bg-background/80">
            {status === "success" && (
              <>
                <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
                  <Icon icon={CheckmarkCircle02Icon} className="icon-lg text-success" />
                </div>
                <h1 className="text-xl font-semibold">Email Confirmado</h1>
                <p className="text-default-500">{message}</p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onPress={() => router.push(Routes.home)}
                >
                  Ir para o início
                </Button>
              </>
            )}
            {status === "error" && (
              <>
                <div className="flex size-16 items-center justify-center rounded-full bg-danger/10">
                  <Icon icon={AlertCircleIcon} className="icon-lg text-danger" />
                </div>
                <h1 className="text-xl font-semibold">Erro na Confirmação</h1>
                <p className="text-default-500">{message}</p>
                <Button
                  variant="danger"
                  className="mt-4"
                  onPress={() => router.push(Routes.home)}
                >
                  Ir para o início
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}

