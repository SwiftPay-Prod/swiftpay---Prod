using Microsoft.AspNetCore.SignalR;

namespace safefy_api_payment.Hubs;

public sealed class PaymentStatusHub : Hub
{
	public override async Task OnConnectedAsync()
	{
		var paymentId = Context.GetHttpContext()?.Request.Query["paymentId"].ToString();
		if (!string.IsNullOrEmpty(paymentId))
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, $"payment_{paymentId}");
		}

		await base.OnConnectedAsync();
	}

	public override async Task OnDisconnectedAsync(Exception? exception)
	{
		var paymentId = Context.GetHttpContext()?.Request.Query["paymentId"].ToString();
		if (!string.IsNullOrEmpty(paymentId))
		{
			await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"payment_{paymentId}");
		}

		await base.OnDisconnectedAsync(exception);
	}
}
