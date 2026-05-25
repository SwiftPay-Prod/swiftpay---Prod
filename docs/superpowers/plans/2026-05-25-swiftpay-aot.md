# Swiftpay — Native AOT

**Goal:** Compile both APIs as native AOT binaries for 5x less RAM, 40x faster startup.

---

### Task 1: Configure .csproj for AOT + JSON source gen

**Files:**
- Modify: `src/Swiftpay.Api.Gestao/Swiftpay.Api.Gestao.csproj`
- Modify: `src/Swiftpay.Api.Payment/Swiftpay.Api.Payment.csproj`
- Modify: `src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj`

- [ ] **Step 1: Add PublishAot + trimming + JSON source gen references**

---

### Task 2: Configure Program.cs for AOT compatibility

**Files:**
- Modify: both `Program.cs`

- [ ] **Step 1: Remove Swashbuckle, add Microsoft.AspNetCore.OpenApi, configure trimming roots**

---

### Task 3: Dockerfile update

**Files:**
- Modify: `Dockerfile` (add AOT publish step)

- [ ] **Step 1: Update Dockerfile to use `dotnet publish -aot`**

---

### Task 4: Build + Test + Commit
