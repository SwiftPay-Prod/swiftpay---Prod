# Roadmap — Rebranding Safefy → SwiftPay

**6 fases** | **46 requisitos** | Todos v1 cobertos ✓

| # | Fase | Goal | Requirements | Critérios |
|---|------|------|-------------|-----------|
| 1 | Namespaces .NET | Renomear todos os namespaces e assemblies C# | REBRAND-01–06 | 3 |
| 2 | Arquivos e Diretórios | Renomear arquivos, diretórios e paths com "safefy" | REBRAND-07–12 | 3 |
| 3 | Frontend e Assets | Substituir assets visuais e atualizar componentes React | REBRAND-13–21 | 3 |
| 4 | Mensageria e Webhooks | Renomear filas RabbitMQ e headers de webhook | REBRAND-22–36 | 3 |
| 5 | Config, Testes e Docs | Atualizar env vars, testes e documentação | REBRAND-37–42 | 3 |
| 6 | Validação Final | Build, verificação e rename do diretório pai | REBRAND-43–46 | 3 |

---

## Detalhamento das Fases

### Fase 1: Namespaces .NET
**Goal:** Todos os namespaces, assembly names e root namespaces atualizados de `safefy_*` para `swiftpay_*`
**Mode:** mvp
**Requirements:** REBRAND-01, REBRAND-02, REBRAND-03, REBRAND-04, REBRAND-05, REBRAND-06
**Success Criteria:**
1. `grep -r "safefy_api" --include="*.cs"` retorna 0 ocorrências
2. `dotnet build` em `swiftpay-api` compila sem erros
3. `dotnet build` em `swiftpay-api-core` compila sem erros
4. `dotnet build` em `swiftpay-api-payment` compila sem erros

### Fase 2: Arquivos e Diretórios
**Goal:** Todos os arquivos com "safefy" no nome renomeados para "swiftpay"
**Mode:** mvp
**Requirements:** REBRAND-07, REBRAND-08, REBRAND-09, REBRAND-10, REBRAND-11, REBRAND-12
**Success Criteria:**
1. `find . -name '*safefy*' -not -path './.git/*' -not -path './.planning/*'` retorna 0 resultados
2. Arquivos `.http` renomeados e funcionais
3. Componentes renomeados sem quebra de imports

### Fase 3: Frontend e Assets
**Goal:** Logos, ícones e componentes React atualizados com a nova marca SwiftPay
**Mode:** mvp
**Requirements:** REBRAND-13, REBRAND-14, REBRAND-15, REBRAND-16, REBRAND-17, REBRAND-18, REBRAND-19, REBRAND-20, REBRAND-21
**Success Criteria:**
1. Logos SwiftPay no lugar dos antigos Safefy em ambos os projetos web
2. Componente `swiftpay-brand-logo` renderiza sem referências a Safefy
3. `npm run build` em `swiftpay-web` completa sem erros
4. `npm run build` em `swiftpay-web-checkout` completa sem erros

### Fase 4: Mensageria e Webhooks
**Goal:** Filas RabbitMQ e headers de webhook renomeados para SwiftPay
**Mode:** mvp
**Requirements:** REBRAND-22, REBRAND-23, REBRAND-24, REBRAND-25, REBRAND-26, REBRAND-27, REBRAND-28, REBRAND-29, REBRAND-30, REBRAND-31, REBRAND-32, REBRAND-33, REBRAND-34, REBRAND-35, REBRAND-36
**Success Criteria:**
1. Nenhuma referência a `safefy.` em configurações de mensageria
2. Nenhuma referência a `X-Safefy-` no código
3. `dotnet build` compila sem erros

### Fase 5: Config, Testes e Docs
**Goal:** Env vars, testes e documentação consistentes com SwiftPay
**Mode:** mvp
**Requirements:** REBRAND-37, REBRAND-38, REBRAND-39, REBRAND-40, REBRAND-41, REBRAND-42
**Success Criteria:**
1. Nenhuma env var com `SAFEFY_` no código
2. `SafefyApiFactory` renomeada e referências atualizadas
3. Documentação reflete SwiftPay

### Fase 6: Validação Final
**Goal:** Build completo, verificação de resíduos e rename do diretório pai
**Mode:** mvp
**Requirements:** REBRAND-43, REBRAND-44, REBRAND-45, REBRAND-46
**Success Criteria:**
1. `dotnet build` em todas as APIs → sucesso
2. `npm run build` em ambos os frontends → sucesso
3. `grep -ri "safefy" --include="*.{cs,ts,tsx,js,jsx,json,csproj,sln,env,yml,yaml,md}"` → 0 ocorrências
4. Diretório pai renomeado para `swiftpay-main`
