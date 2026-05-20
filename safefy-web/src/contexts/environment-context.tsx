"use client";

import { createContext, useContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setSelectedEnvironment } from "@/auth/session";
import { updateSession } from "@/app/actions/session";
import { BaseCookie } from "@/constants/base";
import { PaymentEnvironment } from "@/types/enums";

interface EnvironmentContextValue {
  environment: PaymentEnvironment;
  isSandbox: boolean;
  isSandboxVisible: boolean;
  isPreviewMode: boolean;
  isChangingEnvironment: boolean;
  setEnvironment: (env: PaymentEnvironment) => Promise<void>;
  toggleEnvironment: () => void;
  enablePreviewMode: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

function getEnvironmentFromCookie(): PaymentEnvironment {
  if (typeof document === "undefined") {
    return PaymentEnvironment.Production;
  }
  
  const cookies = document.cookie.split("; ");
  const envCookie = cookies.find((c) => c.startsWith(`${BaseCookie.selectedEnvironment}=`));
  const value = envCookie?.split("=")[1];
  
  if (value === PaymentEnvironment.Sandbox) {
    return PaymentEnvironment.Sandbox;
  }
  return PaymentEnvironment.Production;
}

interface EnvironmentProviderProps {
  children: ReactNode;
  initialEnvironment?: PaymentEnvironment;
}

export function EnvironmentProvider({ children, initialEnvironment }: EnvironmentProviderProps) {
  const router = useRouter();
  const [environment, setEnvironmentState] = useState<PaymentEnvironment>(
    () => initialEnvironment ?? getEnvironmentFromCookie()
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isChangingEnvironment, setIsChangingEnvironment] = useState(false);

  const setEnvironmentFn = useCallback(async (env: PaymentEnvironment) => {
    if (env === environment) return;
    
    setIsChangingEnvironment(true);
    try {
      await setSelectedEnvironment(env);
      await updateSession({ environment: env });
      setEnvironmentState(env);
      setIsPreviewMode(false);
      router.refresh();
    } finally {
      setIsChangingEnvironment(false);
    }
  }, [environment, router]);

  const toggleEnvironment = useCallback(() => {
    const newEnv = environment === PaymentEnvironment.Production 
      ? PaymentEnvironment.Sandbox 
      : PaymentEnvironment.Production;
    setEnvironmentFn(newEnv);
  }, [environment, setEnvironmentFn]);

  const enablePreviewMode = useCallback(() => {
    setIsPreviewMode(true);
  }, []);

  const isSandbox = environment === PaymentEnvironment.Sandbox;
  const isSandboxVisible = isSandbox && !isPreviewMode;

  const value = useMemo(
    () => ({
      environment,
      isSandbox,
      isSandboxVisible,
      isPreviewMode,
      isChangingEnvironment,
      setEnvironment: setEnvironmentFn,
      toggleEnvironment,
      enablePreviewMode,
    }),
    [environment, isSandbox, isSandboxVisible, isPreviewMode, isChangingEnvironment, setEnvironmentFn, toggleEnvironment, enablePreviewMode]
  );

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider");
  }
  return context;
}

