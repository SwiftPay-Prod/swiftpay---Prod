# Swiftpay — Email Transacional (Resend)

**Goal:** Send email notifications when payments are received.

---

### Task 1: EmailService + SendCustomerEmailsConsumer

**Files:**
- Create: `src/Swiftpay.Api.Core/Services/EmailService.cs`
- Modify: `src/Swiftpay.Api.Core/Consumers/SendCustomerEmailsConsumer.cs`
- Modify: `src/Swiftpay.Api.Core/InfrastructureDI.cs`

- [ ] **Step 1: Install Resend package, create EmailService, update consumer, register DI**
- [ ] **Step 2: Build and test**

---

### Task 2: Commit + Push

```bash
dotnet build 2>&1 | tail -3
dotnet test 2>&1 | grep -E "Passed!|Failed|Total"
git add -A && git commit -m "feat: transactional email via Resend" && git push
```
