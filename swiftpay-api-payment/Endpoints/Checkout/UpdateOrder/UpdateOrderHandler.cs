using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.UpdateOrder;

public sealed class UpdateOrderHandler(PrimaryDbContext dbContext)
{
    public async Task<(UpdateOrderResponse response, int statusCode)> HandleAsync(UpdateOrderRequest req, CancellationToken ct)
    {
        var checkout = await dbContext.Checkouts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ShortId == req.ShortId, ct);

        if (checkout == null)
        {
            return (new UpdateOrderResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        var now = DateTime.UtcNow;

        var order = await dbContext.Orders
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o =>
                o.Id == req.OrderId &&
                o.CheckoutId == checkout.Id &&
                o.Status == OrderStatus.Reserved &&
                o.ExpiresAt > now, ct);

        if (order == null)
        {
            return (new UpdateOrderResponse
            {
                Error = new ApiErrorResponse("Pedido não encontrado ou reserva expirada.", "order_not_found")
            }, 404);
        }

        var wasUpdated = false;

        // Update customer data
        if (req.Customer != null && order.Customer != null)
        {
            wasUpdated = UpdateCustomer(order.Customer, req.Customer) || wasUpdated;
        }

        // Update shipping address
        if (req.Address != null)
        {
            order.ShippingAddress ??= new OrderShippingAddress();
            wasUpdated = UpdateAddress(order.ShippingAddress, req.Address) || wasUpdated;
        }

        // Update selected payment method
        if (req.SelectedPaymentMethod.HasValue && order.SelectedPaymentMethod != req.SelectedPaymentMethod)
        {
            order.SelectedPaymentMethod = req.SelectedPaymentMethod;
            wasUpdated = true;
        }

        if (wasUpdated)
        {
            order.UpdatedAt = DateTime.UtcNow;
            if (order.Customer != null)
            {
                order.Customer.UpdatedAt = DateTime.UtcNow;
            }
            await dbContext.SaveChangesAsync(ct);
        }

        var data = new UpdateOrderData
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber ?? string.Empty,
            SelectedPaymentMethod = order.SelectedPaymentMethod,
            Customer = order.Customer != null ? new UpdateOrderCustomerData
            {
                Id = order.Customer.Id,
                Name = order.Customer.Name,
                Email = order.Customer.Email,
                Phone = order.Customer.Phone,
                Document = order.Customer.Document
            } : null,
            Address = order.ShippingAddress != null ? new UpdateOrderAddressData
            {
                ZipCode = order.ShippingAddress.ZipCode,
                Street = order.ShippingAddress.Street,
                Number = order.ShippingAddress.Number,
                Complement = order.ShippingAddress.Complement,
                Neighborhood = order.ShippingAddress.Neighborhood,
                City = order.ShippingAddress.City,
                State = order.ShippingAddress.State
            } : null,
            UpdatedAt = order.UpdatedAt
        };

        return (new UpdateOrderResponse
        {
            Data = data
        }, 200);
    }

    private static bool UpdateCustomer(Customer customer, UpdateOrderCustomerRequest req)
    {
        var wasUpdated = false;

        if (!string.IsNullOrEmpty(req.Name) && customer.Name != req.Name)
        {
            customer.Name = req.Name;
            wasUpdated = true;
        }

        if (!string.IsNullOrEmpty(req.Email))
        {
            var normalizedEmail = req.Email.ToLower().Trim();
            if (customer.Email != normalizedEmail)
            {
                // Allow updating from placeholder email or to any other email
                if (customer.Email.Contains("@checkout.safefy.app") || !normalizedEmail.Contains("@checkout.safefy.app"))
                {
                    customer.Email = normalizedEmail;
                    wasUpdated = true;
                }
            }
        }

        if (!string.IsNullOrEmpty(req.Phone) && customer.Phone != req.Phone)
        {
            customer.Phone = req.Phone;
            wasUpdated = true;
        }

        if (!string.IsNullOrEmpty(req.Document) && customer.Document != req.Document)
        {
            customer.Document = req.Document;
            wasUpdated = true;
        }

        return wasUpdated;
    }

    private static bool UpdateAddress(OrderShippingAddress address, UpdateOrderAddressRequest req)
    {
        var wasUpdated = false;

        if (req.ZipCode != null && address.ZipCode != req.ZipCode)
        {
            address.ZipCode = req.ZipCode;
            wasUpdated = true;
        }

        if (req.Street != null && address.Street != req.Street)
        {
            address.Street = req.Street;
            wasUpdated = true;
        }

        if (req.Number != null && address.Number != req.Number)
        {
            address.Number = req.Number;
            wasUpdated = true;
        }

        if (req.Complement != null && address.Complement != req.Complement)
        {
            address.Complement = req.Complement;
            wasUpdated = true;
        }

        if (req.Neighborhood != null && address.Neighborhood != req.Neighborhood)
        {
            address.Neighborhood = req.Neighborhood;
            wasUpdated = true;
        }

        if (req.City != null && address.City != req.City)
        {
            address.City = req.City;
            wasUpdated = true;
        }

        if (req.State != null && address.State != req.State)
        {
            address.State = req.State;
            wasUpdated = true;
        }

        return wasUpdated;
    }
}
