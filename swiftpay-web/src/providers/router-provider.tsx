"use client";

import { RouterProvider as ReactAriaRouterProvider } from "react-aria-components";
import { useRouter } from "next/navigation";

interface RouterProviderProps {
  children: React.ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps) {
  const router = useRouter();

  function navigate(href: string, opts?: { replace?: boolean }) {
    if (opts?.replace) {
      router.replace(href);
      return;
    }

    router.push(href);
  }

  return (
    <ReactAriaRouterProvider navigate={navigate}>
      {children}
    </ReactAriaRouterProvider>
  );
}

