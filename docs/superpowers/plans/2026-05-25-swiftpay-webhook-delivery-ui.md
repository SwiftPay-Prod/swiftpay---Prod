# Swiftpay — Webhook Delivery UI

---

### Task 1: Backend — WebhookDeliveryLog entity + endpoints

**Files:**
- Create: `src/Swiftpay.Api.Core/Entities/WebhookDeliveryLog.cs`
- Create: `src/Swiftpay.Api.Core/Data/Configurations/WebhookDeliveryLogConfiguration.cs`
- Modify: `src/Swiftpay.Api.Core/Services/WebhookService.cs` (log deliveries)
- Modify: `src/Swiftpay.Api.Gestao/Controllers/WebhookConfigurationController.cs` (add delivery endpoints)
- Modify: `src/Swiftpay.Api.Core/Data/AppDbContext.cs`

- [ ] **Step 1: Create entity + config + update WebhookService + add endpoints + commit**

---

### Task 2: Frontend — Delivery page

**Files:**
- Create: `web/src/app/dashboard/settings/webhooks/delivery/page.tsx`
- Modify: `web/src/app/dashboard/layout.tsx` (add link)

- [ ] **Step 1: Create delivery page with table + retry button + commit**
