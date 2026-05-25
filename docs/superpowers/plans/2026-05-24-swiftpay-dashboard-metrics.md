# Swiftpay — Dashboard Metrics + Audit

> **REQUIRED SUB-SKILL:** subagent-driven-development

**Goal:** Dashboard with financial metrics, graphs, audit log, and CSV export.

**Tech Stack:** Recharts, shadcn/ui, Lucide icons, .NET 9

---

### Task 1: AuditLog entity + Dashboard metrics endpoint

**Files:**
- Create: `src/Swiftpay.Api.Core/Entities/AuditLog.cs`
- Create: `src/Swiftpay.Api.Core/Data/Configurations/AuditLogConfiguration.cs`
- Create: `src/Swiftpay.Api.Gestao/Controllers/DashboardController.cs`
- Create: `src/Swiftpay.Api.Gestao/Controllers/AuditLogController.cs`
- Modify: `src/Swiftpay.Api.Core/Data/AppDbContext.cs`

- [ ] **Step 1: Create AuditLog entity + config + DbSet, commit**
- [ ] **Step 2: Create DashboardController with GET /api/v1/dashboard/summary (monthly revenue, fees, transactions), commit**
- [ ] **Step 3: Create AuditLogController with GET /api/v1/audit-logs (paginado), commit**

---

### Task 2: Install Recharts + create dashboard frontend

**Files:**
- Install: `recharts`
- Modify: `web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Install Recharts, commit**
- [ ] **Step 2: Rewrite dashboard page with metric cards + AreaChart (daily revenue) + PieChart (payment methods) + BarChart (transaction status)**

---

### Task 3: Audit log page + CSV export

**Files:**
- Create: `web/src/app/dashboard/settings/audit/page.tsx`
- Modify: `web/src/app/dashboard/layout.tsx`
- Modify: `web/src/app/dashboard/transactions/page.tsx`

- [ ] **Step 1: Create audit log page with table + date/action filters, commit**
- [ ] **Step 2: Add CSV export button to transactions page, commit**

---

### Task 4: Build + Push

```bash
cd /home/matspectrum-ai/OpenGateway
dotnet build 2>&1 | tail -3
dotnet test 2>&1 | grep -E "Passed!|Failed|Total"
cd web && npm run build 2>&1 | tail -10
cd ..
git add -A && git commit -m "feat: dashboard metrics, graphs, audit log, CSV export" && git push
```
