# Swiftpay — Cartão de Crédito

**Goal:** Add credit card payments via MagicPay — tokenization + charge + installments.

**Flow:** Frontend tokenizes card via MagicPay JS → sends token to backend → backend sends to MagicPay API.

---

### Task 1: PaymentCreditCard entity + EF Core config

**Files:**
- Create: `src/Swiftpay.Api.Core/Entities/PaymentCreditCard.cs`
- Create: `src/Swiftpay.Api.Core/Data/Configurations/PaymentCreditCardConfiguration.cs`
- Modify: `src/Swiftpay.Api.Core/Data/AppDbContext.cs`

- [ ] **Step 1: Create entity and commit**

---

### Task 2: CardTransactionService + Controller endpoint

**Files:**
- Create: `src/Swiftpay.Api.Core/Services/CardTransactionService.cs`
- Modify: `src/Swiftpay.Api.Payment/Controllers/PaymentLinksController.cs`

- [ ] **Step 1: Create service and endpoint, commit**

---

### Task 3: Checkout card form with tokenization

**Files:**
- Modify: `checkout/src/app/[slug]/page.tsx`
- Modify: `checkout/src/lib/api.ts`

- [ ] **Step 1: Add card form with MagicPay tokenization, commit**
