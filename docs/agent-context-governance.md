# Governança de contexto para agentes

## Objetivo

A SwiftPay exige continuidade verificável entre agentes, máquinas e sessões. O repositório Git é a fonte durável de contexto. Conversas, memória local, logs de terminal e artefatos fora do repositório são auxiliares e podem desaparecer.

Esta governança impede quatro falhas recorrentes:

1. um agente repetir investigação já concluída;
2. uma decisão perder sua justificativa;
3. trabalho parcial ser apresentado como concluído;
4. outro agente alterar código sem conhecer riscos, bloqueios ou estado de produção.

## Escopo absoluto

A regra cobre toda atividade assistida por agente:

- ideação e planejamento;
- implementação e refatoração;
- correção de bugs;
- revisão, segurança e QA;
- infraestrutura, deploy e canário;
- documentação e pesquisa;
- experimentos somente leitura;
- tarefas delegadas e revisões independentes.

Não existe exceção por tamanho, urgência ou duração da tarefa.

## Fontes canônicas

### `TODOS.md`

Ledger operacional. Deve responder, sem consultar chat:

- o que está em andamento;
- o que foi concluído;
- o que está bloqueado;
- o que foi abandonado e por quê;
- qual é o próximo passo;
- qual branch e quais arquivos contêm trabalho parcial;
- quais verificações foram executadas.

Cada pedido enumerado pelo usuário vira uma entrada separada. Não agrupe itens para reduzir o ledger.

### `docs/decisions/`

Decisões duráveis. Cada registro contém:

- data e status;
- problema;
- decisão;
- alternativas consideradas;
- justificativa;
- consequências e riscos;
- condições que exigem revisão;
- evidências e links para código ou documentação.

Uma mudança de decisão não apaga a anterior. O registro antigo passa para `Superseded` e aponta para o substituto.

### `docs/architecture/`

Estado atual do sistema. Deve acompanhar alterações em serviços, dados, filas, contratos, segurança, implantação e fluxos de usuário. Diagramas desatualizados são bugs de documentação.

### Instruções de agentes

- `AGENTS.md`: contrato universal.
- `CLAUDE.md`: governança gstack obrigatória.
- `.github/copilot-instructions.md`: índice do Copilot.
- instruções locais de cada módulo: convenções específicas dos arquivos tocados.

## Ciclo obrigatório de uma tarefa

### 1. Recuperar contexto

Antes de agir:

1. leia `AGENTS.md` e `CLAUDE.md`;
2. leia `TODOS.md`;
3. leia decisões e arquitetura relacionadas;
4. leia instruções do módulo;
5. confira trabalho parcial e preserve mudanças que não pertencem à tarefa;
6. registre lacunas ou contradições antes de resolver qualquer uma delas.

### 2. Registrar escopo

Antes da primeira mudança:

- registre cada item solicitado;
- defina critérios observáveis de aceite;
- identifique artefatos que precisarão ser atualizados;
- marque riscos e dependências externas;
- registre explicitamente o que não será alterado.

### 3. Registrar decisões

Crie ou atualize um registro quando houver escolha de:

- arquitetura;
- fornecedor ou ferramenta;
- modelo de dados;
- contrato de API;
- política de segurança;
- estratégia de migração;
- compatibilidade ou corte limpo;
- custo, região ou infraestrutura;
- comportamento visível ao usuário.

Decisões triviais de formatação não precisam de ADR. Todo trade-off que outro agente poderia reabrir precisa.

### 4. Manter estado durante execução

Use estes estados no `TODOS.md`:

- `PENDING`: conhecido, ainda não iniciado;
- `IN_PROGRESS`: execução ativa;
- `BLOCKED`: depende de pessoa, credencial, serviço ou decisão externa;
- `DONE`: aceite observado e evidência registrada;
- `DROPPED`: deliberadamente removido, com razão;
- `SUPERSEDED`: substituído por uma decisão ou tarefa posterior.

Atualize imediatamente quando o fato mudar. Não espere o final da sessão.

### 5. Registrar verificação

Toda alegação comportamental precisa de evidência proporcional:

| Mudança | Evidência mínima |
|---|---|
| Bug | reprodução antes e confirmação depois |
| API permanente | teste do contrato e chamada real do caminho alterado |
| UI | cenário no navegador e estado visual observado |
| Infraestrutura | validação de sintaxe mais cenário real ou dry-run aplicável |
| Investigação | comando ou experimento e saída observada |
| Documentação | links descobríveis, referências válidas e ausência de segredos |

Registre comando/cenário, data, resultado e limite da cobertura. `Um teste passou` não significa `o sistema inteiro passou`.

### 6. Atualizar documentação afetada

Antes de concluir:

- contratos e variáveis novas devem aparecer em referência;
- procedimentos operacionais devem aparecer em how-to;
- decisões e trade-offs devem aparecer em explicação/ADR;
- fluxos novos devem atualizar diagramas;
- TODOs concluídos devem manter evidência e data;
- dívida descoberta deve virar tarefa, não comentário perdido.

### 7. Produzir handoff

Um handoff válido segue este formato:

```text
Estado: DONE | BLOCKED | IN_PROGRESS
Objetivo:
Concluído:
Decisões:
Arquivos alterados:
Verificação observada:
Riscos:
Bloqueios:
Trabalho restante:
Próxima ação única:
Leia primeiro:
```

O handoff deve ser gravado no `TODOS.md` ou no documento de trabalho correspondente antes da resposta final.

## Trabalho delegado

O agente principal continua responsável pelo contexto.

Antes de delegar:

- documente contrato, arquivos-alvo, não objetivos e critérios de aceite;
- forneça ao agente os caminhos canônicos;
- proíba alterações ou validações fora do escopo quando necessário.

Depois da delegação:

- verifique afirmações e mudanças;
- registre achados aceitos ou rejeitados;
- não trate `agente terminou` como prova de funcionamento.

## Segurança e privacidade

Nunca grave valores de:

- senhas;
- chaves de API;
- códigos OAuth;
- tokens JWT ou refresh tokens;
- chaves privadas;
- credenciais de banco;
- dados pessoais não necessários.

Registre somente metadados seguros, por exemplo:

```text
Secret: Resend SMTP credential
Storage: production secret environment
Owner: operations
State: configured, domain verification pending
Last validation: SMTP authentication not exercised
```

Se um segredo aparecer em saída, documentação ou histórico recente, abra uma tarefa de saneamento e rotação sem copiar o valor.

## Descoberta e manutenção

- `README.md` deve apontar para `AGENTS.md`, `TODOS.md` e esta governança.
- `CLAUDE.md` e o índice do Copilot devem repetir a regra absoluta e apontar para esta página.
- Mudanças nesta governança exigem decisão registrada em `docs/decisions/`.
- Agentes devem verificar links e descoberta ao alterar os arquivos de entrada.
- O Git preserva o histórico; não reescreva decisões para ocultar tentativas anteriores.

## Critério de conclusão

Contexto está completo quando um agente novo consegue responder, apenas lendo o repositório:

1. qual problema está sendo resolvido;
2. por que a abordagem atual foi escolhida;
3. o que já foi tentado;
4. o que funciona e como foi provado;
5. o que ainda falta;
6. quais riscos e bloqueios existem;
7. qual é a próxima ação concreta;
8. onde estão as instruções aplicáveis.

Se qualquer resposta depender exclusivamente da conversa anterior, a documentação ainda está incompleta.
