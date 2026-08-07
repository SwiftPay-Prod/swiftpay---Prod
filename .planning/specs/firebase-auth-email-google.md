# Plano: Firebase Auth — Email + Google com verificação de email

**Data:** 2026-08-06
**Status:** Aguardando aprovação do CEO
**Escopo aprovado pelo CEO (via decisões):**
- Firebase como **fonte de identidade**; backend .NET valida o ID token do Firebase e emite o JWT de sessão da plataforma (mantém device trust, onboarding, roles, status).
- Verificação de email **enforced no backend .NET** (guard nas requisições), não apenas no frontend.

## Contexto atual (verificado no código)

- Backend `swiftpay-api` (.NET / FastEndpoints) tem auth próprio: `POST /v1/auth/signin` (email+senha BCrypt), `signup`, `verify-device`, `confirm-email`, `forgot-password`, `reset-password`. Sessão = JWT HMAC próprio (`TokenService`) + validação via `SessionValidationMiddleware` (Redis via `ISessionService`).
- **Device flow real (verificado):** `SignInEndpoint.HandleAsync` **não envia código nenhum** — auto-trusta o primeiro device, reusa device confiável, e auto-trusta device novo ("device verification disabled"). O fluxo de código (`VerifyDevice`/`ResendDeviceCode`) existe em endpoints separados e só é acionado em outros caminhos. O plan deve replicar exatamente esse comportamento no firebase-signin, sem prometer device-verification-por-código.
- `User` (EF, `swiftpay-api-core/Models/Database/Primary/User.cs`): `EmailVerified`, `Password` (BCrypt), `IsLockedOut`, `FailedLoginAttempts`, `LastLoginIpAddress`, etc.
- **Frontend deployado** = `swiftpay-web` (raiz; `start.sh` roda `npx next dev --port 5001`). O diretório `Swiftpay Front end novo/` é cópia de dev com forms idênticos.
- Firebase já configurado no frontend (`src/lib/firebase.ts`) **apenas para Messaging** — sem `getAuth`, sem Google.
- Login atual: `SignInForm` → `fetch('/api/auth/signin')` → cookies httpOnly. Auth page: `src/app/auth-page-client.tsx`.
- **Gating existente:** `swiftpay-web/src/app/panel/layout.tsx` redireciona para home quando `!session || !session.emailVerified || !accessToken`. Portanto um usuário **não verificado SEM JWT de plataforma** NÃO consegue abrir `/panel/verify-email` hoje.

## Decisões de arquitetura

| Decisão | Escolha |
|---|---|
| Fonte de identidade | Firebase Auth (email/senha + Google) |
| Integração com backend | Backend valida o ID token do Firebase → emite o JWT de sessão da plataforma |
| Verificação de email | Backend rejeita sign-in (não emite JWT) para usuário **email/password não verificado**; Google passa direto |
| Chave de identidade do usuário | **Email da plataforma** (único). Firebase UID e provider são anexados ao `User` resolvido por email |
| Usuários legados (beta) | **Todos deletados — inclusive o admin** (decisão CEO). Wipe total do banco de dados de beta. Usuários novos passam a entrar exclusivamente via Firebase. |
| `User.Password` | Mantido (não-nulo para schema). Todo `User` criado/provisionado via Firebase recebe hash BCrypt aleatório (placeholder). |
| Admin | **N/D — a conta admin é removida junto** (decisão CEO). Nenhum provisioning inicial; admin futuro é criado via Firebase. |
| Provisionamento de Google (decisão CEO) | **Primeiro login = provisioning.** Google sem conta de plataforma coleta dados mínimos e cria o `User` via `/firebase-signup` com o mesmo token |
| Coexistência provider/email (decisão CEO) | **Email-first.** Mesmo email loga por email OU Google; email não verificado bloqueado, Google passa; `FirebaseProvider` = último login |
| Escopo imediato (decisão CEO) | **Implementar SOMENTE o backend .NET agora.** O frontend está sendo reconstruído externamente — não tocar em `swiftpay-web` nesta etapa. |

## Backend (.NET) — mudanças

### 1. Verificação do ID token do Firebase (novo `IFirebaseAuthService`)

- NuGet `FirebaseAdmin` para validação server-side de ID token.
- `Task<FirebaseTokenClaims?> VerifyIdTokenAsync(string idToken)`. Claims: `sub` (UID), `email`, `email_verified`, `firebase.sign_in_provider` (`password` | `google.com`).
- Config `FirebaseSettings { ProjectId }` em `appsettings.json`; credenciais por env `GOOGLE_APPLICATION_CREDENTIALS` (secreto) ou `FirebaseSettings:ServiceAccountJson`.
- Fallback dev (sem credencial): verify manual RS256 com chaves públicas `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com` — **selecionar o certificado pelo `kid` do header do token**, validar `iss` (`https://securetoken.google.com/<ProjectId>`), `aud` (== ProjectId), `exp`, e **cachear o metadata endpoint com TTL curto (~1h)** para não re-fetchar por request e suportar rotação de chaves. **[INFERENCE: mecanismo padrão Google]**

### 2. Novo endpoint `POST /v1/auth/firebase-signin`

Request: `{ idToken, deviceId }` — **mesmo nome de campo `idToken` em todos os endpoints Firebase** (signin e signup), evitando ambiguidade.

1. `VerifyIdTokenAsync` → inválido → 401 `"Sessão do Firebase inválida ou expirada."`
2. Resolver `User` por email normalizado (como no signin atual).
   - Não encontrado → 404 com `error.code = "USER_NOT_FOUND"` (frontend oferece cadastro).
3. **Guard de verificação (backend):** se `firebase.sign_in_provider == "password"` E `email_verified == false` → 403 com `error.code = "EMAIL_NOT_VERIFIED"`. Se `google.com` → passa (verificação é da conta Google). **[INFERENCE: Google sempre gera email_verified=true]**
4. Checagens espelho do signin legado: `IsLockedOut`, `Status` (inactive/suspended).
5. Device trust espelhando o `SignInEndpoint` real: primeiro login → auto-trust; device confiável → reutiliza; device novo → auto-trust. **Sem envio de código** (o fluxo de código não faz parte do signin atual). `CompleteLoginAsync` + `CreateSessionAsync` + `TokenService`.
6. Sincronizar identidade Firebase antes de emitir token: `user.FirebaseUid = sub`; `user.FirebaseProvider = sign_in_provider`; **`user.EmailVerified = email_verified` sempre (idempotente)** a cada sign-in bem-sucedido; `LastLoginAt/Ip/UserAgent/Location`.
7. Resposta idêntica ao `SignInResponse` (`AuthResponse` | `DeviceVerificationInfo`).

Sendo `user.EmailVerified` sincronizado com o claim `email_verified` a cada sign-in, o dado no DB é sempre o do Firebase e há um único caminho de atualização (re-logar com ID token fresco).

### 3. Novo endpoint `POST /v1/auth/firebase-signup` e provisioning

- `POST /v1/auth/firebase-signup` com `{ idToken, name, whatsApp, deviceId, refCode }`: valida token → se `User` já existe com o email → 409 `error.code = "USER_ALREADY_EXISTS"` (frontend vai para sign-in) → senão cria `User` com `FirebaseUid`, `FirebaseProvider`, `Password = BCrypt(random)` placeholder, referral validation reaproveitada e email único (schema).
- **Regra de emissão de JWT (crítica, consistente com a seção 2.3):** para `sign_in_provider == "password"` com `email_verified == false`, o `firebase-signup` **NÃO emite JWT/sessão de plataforma** (não chama `CreateSessionAsync`/`GenerateToken`) — responde `requiresEmailVerification: true` e o frontend envia o usuário a `/verify-email` **sem sessão da plataforma** (essa tela é dirigida pela sessão Firebase do client). Apenas a via de provisioning Google (decisão CEO confirmada) auto-emite JWT legitimamente (Google sempre verificado).
- **Primeiro sign-in Google sem conta (USER_NOT_FOUND):** o frontend, ao receber `USER_NOT_FOUND` de um sign-in Google, coleta dados mínimos (nome, whatsApp, refCode opcional) numa tela de onboarding anexo e chama `/api/auth/firebase-signup` com o MESMO `idToken` Google — o backend dá o `User` criado e vincula o `FirebaseUid`/`FirebaseProvider = google.com` na primeira resposta. Multi-subject: como o UID Google é persistido no `User` criado, não há colisão (o subject é o mesmo do token usado no signup). **[aprovado pelo CEO]**
- `POST /v1/auth/signup` legado (email+senha): **mantido por compatibilidade de API** mas não é mais o caminho primário do frontend. **[INFERENCE: nada a remover]**

### 3b. Limpeza total dos dados de beta (execução em produção, aprovada pelo CEO)

- Script de migração (SQL/EF) que remove **TODOS os dados de beta** — todos os `User` (incluindo `admin@swiftpay.com.br`), merchants, checkouts, ledger, saldos, referências, dispositivos, caches — wipe do banco principal. Banco **vazio** = clean slate.
- **Backup obrigatório antes:** `pg_dump` do `swiftpaydb` (principal) e do `swiftpaylogsdb`, versionado com timestamp. Ainda assim, destrutivo e irreversível — rodar via /land-and-deploy após backup e NÃO é parte do código de rota.
- Volume verificado na VPS em 2026-08-06: 20 usuários, 11 merchants, 13 checkouts, 7 `LedgerTransactions`, 13 `LedgerEntries` — dados de teste/beta, sem perda real. **[INFERENCE: baixo valor]**
- Após o wipe, a conta `admin` da plataforma deixa de existir; o próximo admin é provido via Firebase signup (decisão CEO).

### 4. Guard de email verificado nas requisições (defesa em profundidade)

- Como o backend **já recusa emitir JWT** para email/password não verificado (seção 2.3 e regra de signup), uma sessão com `EmailVerified == false` só pode existir para Google (sempre verificado) — na prática a condição é quase inalcançável.
- Ainda assim, para defesa: adicionar um **allowlist dedicado** `EmailVerifiedExemptPaths` (NAO reutilizar `ExcludedPaths`) e bloquear **qualquer** sessão com `UserSession.EmailVerified == false` que não esteja no allowlist. Não depender de FirebaseProvider — condição só no `emailVerified` do Redis session (`UserSession` já carrega `EmailVerified`).
- **NAO adicionar `signout`/`session` ao `ExcludedPaths`:** `ExcludedPaths` pula a validação inteira (não popula `UserSession`/`SessionId`); adicioná-las quebraria a invalidação server-side de signout (`GetSessionId()`) e o read/update de sessão (`GetUserSession()`). O guard de email usável um allowlist separado que AINDA valida a sessão, ou — dado que as rotas de verificação/signin/signup Firebase são Anonymous (sem Bearer, o middleware as pula) — **nenhum path do backend precisa de exemption** hoje. Decisão padrão: sem exemption; qualquer sessão `EmailVerified == false` é bloqueada (404/403 EMAIL_NOT_VERIFIED) e o cliente usa a rota pública `/verify-email`.

### 5. Migration EF

- `AddFirebaseAuthColumns`: `FirebaseUid` (string?, índice único onde não-nula), `FirebaseProvider` (string?).

### 6. Colisões de identidade (duas contas Firebase, mesmo email)

Regra do backend (documentar explicitamente):
- **Chave de identidade da plataforma = email.** Tanto email/password quanto Google que resolvem para o mesmo email de plataforma atualizam o MESMO `User`.
- `FirebaseUid`/`FirebaseProvider` = **última conta que logou** (write idempotente no sign-in). Se usuário alterna Google↔email no mesmo email plataforma, `FirebaseProvider` reflete o provider atual e `EmailVerified` é sincronizado do claim — Google (verificado) e email não verificado podem coexistir; quem estiver não verificado no `password` é bloqueado, mas Google passa. **[INFERENCE: escolha conservadora; validar com o CEO se o login por senha deve ser desabilitado após um login Google no mesmo email]** — Registrar como pergunta aberta para o CEO.

## Frontend (`swiftpay-web`) — mudanças

### 1. `src/lib/firebase.ts` — adicionar Auth

- Importar `getAuth`, `signInWithEmailAndPassword`, `GoogleAuthProvider`, `signInWithPopup`, `createUserWithEmailAndPassword`, `sendEmailVerification`, `sendPasswordResetEmail`, `getIdToken`, `onAuthStateChanged`.
- `getFirebaseAuth()` (lazy, client), `getFirebaseIdToken()`, helpers tipados.

### 2. `src/app/api/auth/firebase-signin/route.ts` (novo proxy)

- POST `{ idToken }` → backend `/v1/auth/firebase-signin` → replica o fluxo de cookies do `signin/route.ts` (accessToken httpOnly, expiresAt, deviceId, status modal).
- Propaga `EMAIL_NOT_VERIFIED` e `USER_NOT_FOUND` como `{ error: { code } }` com status apropriado.

### 3. `SignInForm` — dois caminhos de login (Firebase-only)

- **Email/senha:** `signInWithEmailAndPassword` → `getIdToken` → POST `/api/auth/firebase-signin`.
  - Se `auth/user-not-found` → mensagem clara pt-BR "conta não encontrada" (não há fallback BCrypt — usuários legados foram removidos); [INFERENCE: nenhuma conta legada sobrevive além do admin, provisionado em Firebase]
  - Se `EMAIL_NOT_VERIFIED` → `sendEmailVerification` (Firebase) → navega para /verify-email.
- **Google:** botão "Continuar com Google" → `signInWithPopup(GoogleAuthProvider)` → `getIdToken` → `/api/auth/firebase-signin` (sem checagem de email).
  - Se `USER_NOT_FOUND` → coleta nome/whatsApp/refCode → `/api/auth/firebase-signup` com o mesmo token (provisioning, decisão CEO).
- Erros Firebase (`auth/...`) mapeados para pt-BR; spinner; popup bloqueado → orientação clara (fallback `signInWithRedirect` **fora de escopo**, documentar).

### 4. `SignUpForm` — cadastro via Firebase

- Campos atuais (nome, email, whatsApp, senha, refCode).
- `createUserWithEmailAndPassword` → `sendEmailVerification` → `getIdToken` → POST `/api/auth/firebase-signup`.
- Se `auth/email-already-in-use` → avisa "já registrado, faça login"; backend `USER_ALREADY_EXISTS` → mesmo.
- Pós-cadastro: resposta do `firebase-signup` com `requiresEmailVerification: true` (sem JWT) → frontend envia o usuário a `/verify-email` (dirigida pela sessão Firebase, sem plataforma). Só após `email_verified` o `firebase-signin` emite JWT e libera o painel.

### 5. `ForgotPasswordForm` — reset via Firebase

- Trocar fluxo para `sendPasswordResetEmail` (Firebase) — caminho único, sem fallback legado (usuários legados removidos). Endpoints legados `forgot-password`/`reset-password` permanecem no backend por compatibilidade de API, sem uso primário. **[INFERENCE]**
- Emails não encontrados no Firebase retornam mensagem genérica de segurança (não revela se o email existe).

### 6. Tela verify-email — acessível SEM JWT de plataforma

**Problema corrigido:** `/panel/verify-email` hoje está em `/panel/(auth-status)` e o layout do `panel` redireciona `!emailVerified` → home. Para o fluxo Firebase (usuario recém-criado SEM plataforma JWT), a tela de verificação precisa ser pública e baseada na sessão Firebase do cliente, não no JWT da plataforma.

**Mudança:**
- Criar rota pública `/verify-email` (raiz, tipo `Open`/`Public`) para o fluxo Firebase, 100% dirigida pela sessão Firebase do cliente (`onAuthStateChanged`). **Rota única** — a `/panel/verify-email` legada é inalcançável hoje (o `panel/layout.tsx` redireciona `!session.emailVerified` → home) e não é usada pelo novo fluxo.
  - Resend: `sendEmailVerification()`.
  - Refresh com token FRESCO (correção crítica): `reload()` no currentUser → se `emailVerified === true` → **`getIdToken(true)`** (forceRefresh — o `getIdToken()` sem arg retorna o token cacheado com claim `email_verified=false` obsoleto, e o guard do backend veria falso para sempre, em loop) → `/api/auth/firebase-signin` (backend gera JWT com claim fresco → ok) → redirect painel. Sem `refreshSession`/SignalR (incompatível com zero JWT).

### 7. `panel/layout.tsx` gating

- Não acoplaro: o gating `!session.emailVerified → home` continua valendo para o painel priscipal (usuarios verificados). A rota pública `/verify-email` nova é fora do layout `panel`, então não é bloqueada. **[INFERENCE: menor mudança; verificar se algum middle guard global requer emailVerified antes de /verify-email publico]**

### 8. Config de domínio (operacional)

- Autorizar domínio para Auth redirect/popup no console Firebase (fora do repo; manual, documentado em `docs/`). Dev local usa `localhost` — inspeiar incluído. **[INFERENCE: passo operacional de setup]**

## Decisões do CEO (2026-08-06, consolidadas)

1. **Wipe total dos dados de beta:** deletar TODOS os usuários (inclusive o admin) e organizações. Banco vai a zero. Sem fallback BCrypt — nova identidade via Firebase a partir do zero.
2. **Fallback legado:** descartado — não há dados legados a preservar (banco zerado).
3. **Primeiro sign-in Google:** provisioning aprovado — `firebase-signup` com o mesmo token Google e dados mínimos coletados no client.
4. **Coexistência provider/email:** email-first.
5. **Escopo imediato:** implementar SOMENTE o backend .NET. O frontend (`swiftpay-web`) está sendo reconstruído externamente e NÃO será alterado nesta etapa.

## Fora de escopo (explicitamente)

- **NÃO tocar no frontend `swiftpay-web`** (reconstrução externa em andamento, decisão CEO).
- **Não migrar senhas BCrypt / não preservar dados** — banco é zerado.
- Não mexer na cópia `Swiftpay Front end novo/`.
- Não remover endpoints legados de auth do backend (signin senha, confirm-email, forgot/reset) — mantidos por compatibilidade de API; o wipe remove os dados, não as rotas.
- Sem PWA/redirect mobile para Google.
- Sem `signInWithRedirect` fallback (registrar popup bloqueado com mensagem clara).
- Configuração do domínio no console Firebase — passo operacional (documentado), não código.

## Risco e mitigação

| Risco | Mitigação |
|---|---|
| Wipe irreversível do banco | Backup pg_dump antes; dados são de teste/beta (verificado na VPS) |
| Firebase Admin exige service account | Fallback manual RS256 com chaves públicas Google (kid + TTL cache) |
| Colisão mesmo-email multi-provider | Regra email-first (decisão CEO): `FirebaseProvider` = último login |
| Frontend em reconstrução externa pode divergir do contrato | Contratos documentados neste plano (campos `idToken`, códigos de erro `EMAIL_NOT_VERIFIED`/`USER_NOT_FOUND`/`USER_ALREADY_EXISTS`, `requiresEmailVerification`) para o frontend externo consumir |

## Revisão adversarial (spec review loop)

- Round 1: 6 issues (2 contratuais) — todos corrigidos (fallback legado, rota pública `/verify-email`, middleware sem dep FirebaseProvider, device auto-trust real, sync idempotente, regra email-first).
- Round 2: 5 issues (1 contratual) — todos corrigidos (`getIdToken(true)` forceRefresh, provisioning Google, campo `idToken` unificado, rota única `/verify-email`, kid+TTL cache RS256).
- Round 3: 2 issues — corrigidos (signup não emite JWT para não verificado; allowlist separado sem `ExcludedPaths`), convergência com **score 8/10**.
- Decisões do CEO (wipe total, backend-only, provisioning Google, email-first) aplicadas após o loop; mudança de escopo refletida acima e na seção "Decisões do CEO". **[INFERENCE: revisão adversarial cobriu o desenho Firebase; o wipe é operação de deploy, não código]**
- `[INFERENCE]` onde aplicável rotulado no texto.

## Verificação (esta etapa — backend only)

1. Backend compila e testes de integração de auth legados continuam passando.
2. Novo guard: teste de integração `EMAIL_NOT_VERIFIED` (email/password não verificado → 403; google → OK); `USER_NOT_FOUND`; `USER_ALREADY_EXISTS`; signup sem JWT para não verificado.
3. Contratos documentados para o frontend externo (campos e códigos de erro acima).
4. Produção (após /land-and-deploy): backup + wipe total (20→0); validação de login Firebase do admin recriado.