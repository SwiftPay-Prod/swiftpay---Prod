"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sad01Icon, RefreshIcon, AlertCircleIcon } from "@hugeicons/core-free-icons";

export type CheckoutErrorType = "not_found" | "expired" | "template_not_found" | "api_error";

interface CheckoutNotFoundProps {
  message?: string;
  errorType?: CheckoutErrorType;
}

const funnyMessages = [
  "Ops! Parece que esse checkout foi abduzido por aliens 👽",
  "Houston, temos um problema... esse checkout não existe! 🚀",
  "404: Checkout não encontrado. Será que foi tomar um café? ☕",
  "Esse checkout tirou férias e não deixou endereço 🏖️",
  "Procuramos embaixo do tapete, mas nada... 🧹",
  "Esse link está mais perdido que meias na máquina de lavar 🧦",
];

const templateNotFoundMessages = [
  "Template não encontrado... parece que alguém mexeu na configuração 🔧",
  "Ops! Esse template não existe. Fala com o desenvolvedor! 👨‍💻",
  "Template 404: Foi procurar a si mesmo e se perdeu 🗺️",
];

const expiredMessages = [
  "Este checkout expirou ⏰",
  "O tempo acabou! Esta oferta não está mais disponível 🕐",
  "Checkout encerrado. A promoção terminou! 📅",
];

const apiErrorMessages = [
  "Algo deu errado ao carregar o checkout 😵",
  "Nossos servidores estão de mau humor... tente novamente! 🔌",
  "Erro de comunicação. Será que a internet caiu? 📡",
];

function getMessagesForType(errorType?: CheckoutErrorType): string[] {
  switch (errorType) {
    case "template_not_found":
      return templateNotFoundMessages;
    case "expired":
      return expiredMessages;
    case "api_error":
      return apiErrorMessages;
    default:
      return funnyMessages;
  }
}

function getTitleForType(errorType?: CheckoutErrorType): string {
  switch (errorType) {
    case "template_not_found":
      return "Template não encontrado";
    case "expired":
      return "Checkout expirado";
    case "api_error":
      return "Ops, algo deu errado";
    default:
      return "Ué, cadê?";
  }
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function CheckoutNotFound({ message, errorType }: CheckoutNotFoundProps) {
  const randomMessage = useMemo(() => {
    if (message) return message;
    const messages = getMessagesForType(errorType);
    return getRandomMessage(messages);
  }, [message, errorType]);

  const title = getTitleForType(errorType);
  const IconComponent = errorType === "api_error" || errorType === "template_not_found" 
    ? AlertCircleIcon 
    : Sad01Icon;

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <HugeiconsIcon icon={IconComponent} className="w-32 h-32 text-zinc-300 dark:text-zinc-600 mx-auto" strokeWidth={1} />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 mb-4"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 min-h-7"
        >
          {randomMessage}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <HugeiconsIcon icon={RefreshIcon} className="w-4 h-4" />
            Tentar novamente
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-sm text-zinc-500 dark:text-zinc-300"
        >
          Se o problema persistir, entre em contato com o vendedor.
        </motion.p>
      </motion.div>
    </div>
  );
}
