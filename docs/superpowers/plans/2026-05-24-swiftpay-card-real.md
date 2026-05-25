# Swiftpay — Cartao Real (MagicPay Tokenization)

**Goal:** Replace simulated card tokenization with real MagicPay JS tokenization in the checkout.

---

### Task 1: Add MagicPay tokenization to checkout

**Files:**
- Modify: `checkout/src/app/[slug]/page.tsx`

- [ ] **Step 1: Update the checkout page with real MagicPay JS tokenization**

Add the MagicPay script to the head (via next/script) and update handlePay to use real tokenization with simulated fallback.

- [ ] **Step 2: Commit**

---

### Task 2: Build + Push

```bash
cd checkout && npm run build 2>&1 | tail -10
git add -A
git commit -m "feat: real MagicPay card tokenization in checkout with simulated fallback"
git push origin main 2>&1
```
