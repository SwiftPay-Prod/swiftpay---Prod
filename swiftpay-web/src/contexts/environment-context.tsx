"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { PaymentEnvironment } from "@/types/enums";

// Sandbox desativado na plataforma: o ambiente é sempre Produção.
// O contexto permanece apenas para expor `environment`/`isSandboxVisible`
// aos consumidores existentes, agora constantes.
interface EnvironmentContextValue {
  environment: PaymentEnvironment;
  isSandbox: boolean;
  isSandboxVisible: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

interface EnvironmentProviderProps {
  children: ReactNode;
  initialEnvironment?: PaymentEnvironment;
}

export function EnvironmentProvider({ children }: EnvironmentProviderProps) {
  const value = useMemo<EnvironmentContextValue>(
    () => ({
      environment: PaymentEnvironment.Production,
      isSandbox: false,
      isSandboxVisible: false,
    }),
    []
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
