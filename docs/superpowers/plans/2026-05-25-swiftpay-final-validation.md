# Swiftpay — Validacao Final + Carga

**Goal:** Fix last stub, start all services, run extreme load tests.

---

### Task 1: Fix GetPixStatusAsync (the only remaining stub)

**Files:**
- Modify: `MagicPayPixService.cs`
- Modify: `MagicPayClient.cs`
- Modify: `MagicPayResponseParser.cs`
- Test: verify

- [ ] **Step 1: Implement GetPixStatusAsync + test + commit**

---

### Task 2: Start ALL services + verify

- [ ] **Step 1: Kill all, restart everything, verify HTTP 200 everywhere**

---

### Task 3: Extreme load test (k6)

**Files:**
- Create: `tests/load-test.js`

- [ ] **Step 1: Install k6, run load test with 1000 concurrent users, 100 transactions/sec**
