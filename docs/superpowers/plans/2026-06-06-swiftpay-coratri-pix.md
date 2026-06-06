# Swiftpay — Coratri PIX Provider

**Goal:** Integrate Coratri as the primary PIX provider (QR Code + copy-paste + webhook).

**Architecture:** 3-layer pattern (Service → Client → Parser) following SAFEFY acquirer integration pattern.

---

### Task 1: CoratriClient + CoratriResponseParser + Models

**Files:**
- Create: `src/Swiftpay.Api.Core/Providers/Coratri/Models/CoratriModels.cs`
- Create: `src/Swiftpay.Api.Core/Providers/Coratri/CoratriResponseParser.cs`
- Create: `src/Swiftpay.Api.Core/Providers/Coratri/CoratriClient.cs`

- [ ] **Step 1: Create models, parser, client — commit**

---

### Task 2: CoratriPixService + Webhook + DI registration

**Files:**
- Create: `src/Swiftpay.Api.Core/Providers/Coratri/CoratriPixService.cs`
- Create: `src/Swiftpay.Api.Payment/Controllers/CoratriWebhookController.cs`
- Modify: `src/Swiftpay.Api.Core/InfrastructureDI.cs`

- [ ] **Step 1: Create service, webhook controller, register DI — commit**

---

### Task 3: Test real Coratri API + commit

- [ ] **Step 1: Test PIX creation, verify QR code response, commit**
