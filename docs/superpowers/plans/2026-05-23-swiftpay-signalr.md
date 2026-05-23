# Swiftpay — SignalR Real-Time

**Goal:** Add real-time dashboard updates via SignalR — payment status changes and balance updates push instantly to the admin frontend.

**Tech Stack:** ASP.NET Core SignalR, @microsoft/signalr npm package

---

### Task 1: SignalR Hub (Backend)

**Files:**
- Create: `src/Swiftpay.Api.Payment/Hubs/DashboardHub.cs`
- Modify: `src/Swiftpay.Api.Payment/Program.cs` (register SignalR)

- [ ] **Step 1: Create DashboardHub**

Write `src/Swiftpay.Api.Payment/Hubs/DashboardHub.cs`:
```csharp
using Microsoft.AspNetCore.Authorization; using Microsoft.AspNetCore.SignalR;
namespace Swiftpay.Api.Payment.Hubs;
[Authorize]
public class DashboardHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var merchantId = Context.User?.FindFirst("company_id")?.Value;
        if (merchantId != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"merchant_{merchantId}");
        await base.OnConnectedAsync();
    }
}
```

- [ ] **Step 2: Register SignalR in Program.cs**

Add to `src/Swiftpay.Api.Payment/Program.cs`:
```csharp
builder.Services.AddSignalR();
```

And map the hub:
```csharp
app.MapHub<DashboardHub>("/hubs/dashboard");
```

- [ ] **Step 3: Commit**

```bash
git add src/Swiftpay.Api.Payment/Hubs/ src/Swiftpay.Api.Payment/Program.cs
git commit -m "feat: add SignalR DashboardHub for real-time updates"
```

---

### Task 2: Publish real-time events from PaymentCompletedConsumer

**Files:**
- Modify: `src/Swiftpay.Api.Core/Consumers/PaymentCompletedConsumer.cs`

- [ ] **Step 1: Inject IHubContext and send real-time updates**

In `PaymentCompletedConsumer`, after ledger settlement:
```csharp
private readonly IHubContext<DashboardHub> _hubContext;

// After successful ledger settlement:
await _hubContext.Clients.Group($"merchant_{msg.MerchantId}")
    .SendAsync("PaymentStatusChanged", new { paymentId = msg.PaymentId, status = msg.NewStatus, amount = msg.Amount }, ct);

await _hubContext.Clients.Group($"merchant_{msg.MerchantId}")
    .SendAsync("BalanceUpdated", new { available = /* fetch from ledger */, pending = /* fetch from ledger */ }, ct);
```

Note: IHubContext is in `Microsoft.AspNetCore.SignalR` namespace which requires the NuGet package. Add it to Core project.

- [ ] **Step 2: Commit**

```bash
git add src/Swiftpay.Api.Core/Consumers/PaymentCompletedConsumer.cs src/Swiftpay.Api.Core/Swiftpay.Api.Core.csproj
git commit -m "feat: publish real-time SignalR events from PaymentCompletedConsumer"
```

---

### Task 3: Connect admin dashboard frontend to SignalR

**Files:**
- Modify: `web/src/lib/api-client.ts` (add SignalR connection)
- Create: `web/src/lib/signalr-client.ts`
- Modify: `web/src/app/providers.tsx` (init SignalR)
- Modify: `web/src/app/dashboard/page.tsx` (listen to events)

- [ ] **Step 1: Create SignalR client**

Write `web/src/lib/signalr-client.ts`:
```typescript
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';

let connection: HubConnection | null = null;

export function getSignalRConnection(): HubConnection {
  if (!connection) {
    const token = localStorage.getItem('swiftpay_token');
    connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5002'}/hubs/dashboard`, {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect()
      .build();
  }
  return connection;
}

export async function startSignalR(): Promise<void> {
  const conn = getSignalRConnection();
  if (conn.state === 'Disconnected') {
    try { await conn.start(); }
    catch (err) { console.log('SignalR connection failed (will retry)', err); }
  }
}
```

- [ ] **Step 2: Init SignalR in providers**

In `web/src/app/providers.tsx`, add:
```typescript
import { startSignalR } from '@/lib/signalr-client';
// In useEffect: startSignalR();
```

- [ ] **Step 3: Listen to events in dashboard**

In `web/src/app/dashboard/page.tsx`, add:
```typescript
useEffect(() => {
  const conn = getSignalRConnection();
  conn.on('PaymentStatusChanged', (data: any) => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  });
  conn.on('BalanceUpdated', (data: any) => {
    queryClient.invalidateQueries({ queryKey: ['balance'] });
  });
  startSignalR();
  return () => { conn.off('PaymentStatusChanged'); conn.off('BalanceUpdated'); };
}, []);
```

- [ ] **Step 4: Build and verify**

```bash
cd /home/matspectrum-ai/OpenGateway/web && npm install @microsoft/signalr && npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit and push**

```bash
git add web/ src/
git commit -m "feat: add SignalR real-time dashboard updates

- Add DashboardHub with merchant group-based messaging
- Register SignalR in Payment API Program.cs
- Publish PaymentStatusChanged and BalanceUpdated events
- Connect admin frontend to SignalR with auto-reconnect
- Invalidate React Query on real-time events"
git push origin main 2>&1
```
