This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Governança e contexto do projeto

Todo agente ou colaborador deve começar por estes artefatos:

- [`AGENTS.md`](AGENTS.md): contrato universal e obrigatório para agentes;
- [`CLAUDE.md`](CLAUDE.md): governança gstack;
- [`TODOS.md`](TODOS.md): tarefas, bloqueios, evidências e handoff atuais;
- [`docs/agent-context-governance.md`](docs/agent-context-governance.md): ciclo de contexto durável;
- [`docs/decisions/`](docs/decisions/): decisões e justificativas;
- [`docs/architecture/`](docs/architecture/): mapas do sistema.

Nenhuma tarefa ou decisão pode existir somente em chat ou memória local. Não registre segredos nesses documentos.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and client.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
