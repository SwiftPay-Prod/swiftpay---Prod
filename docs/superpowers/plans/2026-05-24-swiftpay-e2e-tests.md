# Swiftpay — E2E Tests com MagicPay Mock

**Goal:** Validar fluxo completo de pagamento (PIX, Boleto, Cartao) usando MagicPay Mock, sem depender de loja real.

**Architecture:** Testes de integracao no `Swiftpay.WebApi.Tests` usando `CustomWebApplicationFactory` com InMemory DB + HttpClient apontando para o mock.

---

### Task 1: Configurar testes para usar mock

**Files:**
- Modify: `tests/Swiftpay.WebApi.Tests/CustomWebApplicationFactory.cs`

- [ ] **Step 1: Update factory to configure MagicPay URL**

Add to `ConfigureWebHost` in factory:
```csharp
builder.ConfigureAppConfiguration((context, config) =>
{
    config.AddInMemoryCollection(new Dictionary<string, string>
    {
        {"MagicPay:BaseUrl", "http://localhost:5199"},
        {"MagicPay:ApiKey", "mock_key"},
    });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/Swiftpay.WebApi.Tests/CustomWebApplicationFactory.cs
git commit -m "test: configure MagicPay mock URL in test factory"
```

---

### Task 2: PIX E2E test

**Files:**
- Create: `tests/Swiftpay.WebApi.Tests/Controllers/MagicPayPixFlowTests.cs`

- [ ] **Step 1: Create PIX flow test**

Write complete PIX integration test:
- Register a user
- Create a payment link
- Pay via PIX
- Assert QR Code and copy-paste returned
- Trigger webhook
- Assert status changed to PAID
- Assert balance updated

- [ ] **Step 2: Run and commit**

```bash
dotnet test --filter "MagicPayPixFlowTests" --configuration Release --verbosity normal 2>&1 | tail -10
git add tests/Swiftpay.WebApi.Tests/Controllers/MagicPayPixFlowTests.cs
git commit -m "test: PIX payment E2E flow with MagicPay mock"
```

---

### Task 3: Boleto + Card E2E tests

**Files:**
- Create: `tests/Swiftpay.WebApi.Tests/Controllers/MagicPayBoletoFlowTests.cs`
- Create: `tests/Swiftpay.WebApi.Tests/Controllers/MagicPayCardFlowTests.cs`

- [ ] **Step 1: Create Boleto flow test**
- [ ] **Step 2: Create Card flow test**
- [ ] **Step 3: Run all and commit**

---

### Task 4: Full build + push

- [ ] **Step 1: Build and run ALL tests**

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build --configuration Release 2>&1 | tail -3
dotnet test --configuration Release --verbosity normal 2>&1 | tail -10
git add -A
git commit -m "test: E2E integration tests for PIX, Boleto, and Credit Card via MagicPay mock"
git push origin main 2>&1
```
