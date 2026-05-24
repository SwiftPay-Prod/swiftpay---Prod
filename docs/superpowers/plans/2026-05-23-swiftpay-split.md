# Swiftpay — Split de Pagamentos

**Goal:** Allow payment amount to be automatically split between multiple recipients via MagicPay's native split support.

---

### Task 1: PaymentSplit entity + MagicPay client split support

**Files:**
- Create: `src/Swiftpay.Api.Core/Entities/PaymentSplit.cs`
- Create: `src/Swiftpay.Api.Core/Data/Configurations/PaymentSplitConfiguration.cs`
- Modify: `src/Swiftpay.Api.Core/Providers/MagicPay/MagicPayClient.cs`
- Modify: `src/Swiftpay.Api.Core/Providers/MagicPay/Models/MagicPayModels.cs`
- Modify: `src/Swiftpay.Api.Core/Data/AppDbContext.cs`

- [ ] **Step 1: Create entity + config, commit**

### Task 2: Add split support to payment creation

**Files:**
- Modify: `src/Swiftpay.Api.Payment/Controllers/PaymentLinksController.cs`

- [ ] **Step 1: Accept splits in PayBySlug + commit**

### Task 3: Process splits in webhook

**Files:**
- Modify: `src/Swiftpay.Api.Payment/Controllers/InternalController.cs`

- [ ] **Step 1: Store split results from MagicPay webhook + commit**
