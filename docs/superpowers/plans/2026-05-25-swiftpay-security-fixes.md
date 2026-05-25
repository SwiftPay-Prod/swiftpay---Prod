# Swiftpay — Security & Architecture Fixes

**Goal:** Apply 7 critical security and architecture corrections.

### Task 1: Webhook HMAC + Idempotency (CRITICAL)
**Files:** `InternalController.cs`

### Task 2: Optimistic Concurrency + RowVersion (CRITICAL)
**Files:** `Account.cs`, `AccountConfiguration.cs`, `LedgerRepository.cs`

### Task 3: Insufficient Balance Check + Refund Ledger (HIGH)
**Files:** `WalletController.cs`, `LedgerService.cs`

### Task 4: Config Extraction + Polly HttpClient (MEDIUM)
**Files:** `FeeCalculationService.cs`, `InfrastructureDI.cs`, `appsettings.json`

### Task 5: Rename IPixProvider -> IPaymentProvider (LOW)
**Files:** `IPixProvider.cs`, `MagicPayPixService.cs`, `PixProviderFactory.cs`, `InfrastructureDI.cs`

### Task 6: Build + Test + Commit + Push
