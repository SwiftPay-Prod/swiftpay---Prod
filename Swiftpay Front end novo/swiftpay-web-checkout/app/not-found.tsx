"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileNotFoundIcon, Home01Icon, Search01Icon } from "@hugeicons/core-free-icons";

const funnyMessages = [
  "Essa página decidiu virar astronauta e está no espaço 🌌",
  "Parece que você encontrou a dimensão errada 🌀",
  "Error 404: Página foi buscar pão e não voltou 🥖",
  "Você descobriu um portal para o nada 🕳️",
  "Essa URL está tão perdida quanto minha motivação na segunda-feira 😴",
];

export default function NotFound() {
  // eslint-disable-next-line react-hooks/purity
  const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

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
                rotate: [0, 10, -10, 0],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <HugeiconsIcon icon={FileNotFoundIcon} className="w-32 h-32 text-zinc-300 dark:text-zinc-600 mx-auto" strokeWidth={1} />
            </motion.div>
            <motion.div
              className="absolute top-0 left-0"
              animate={{ 
                x: [0, 60, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <HugeiconsIcon icon={Search01Icon} className="w-8 h-8 text-accent" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-2"
        >
          <span className="text-8xl font-black bg-linear-to-r from-accent to-emerald-600 bg-clip-text text-transparent">
            404
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4"
        >
          Página não encontrada
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-zinc-600 dark:text-zinc-400 mb-8"
        >
          {randomMessage}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
          >
            <HugeiconsIcon icon={Home01Icon} className="w-4 h-4" />
            Ir para a demo
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
