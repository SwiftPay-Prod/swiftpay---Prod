'use client';

import { Link } from "@heroui/react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Página Não Encontrada</h2>
      <p className="text-default-500 mb-8 max-w-md">
        A página que você está procurando não existe ou foi movida para outro
        endereço.
      </p>
      <Link href="/" className="button button--primary">
        Voltar ao Início
      </Link>
    </div>
  );
}

