using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Models.Orders;

namespace swiftpay_api_payment.Endpoints.Checkout.CreateOrder;

public sealed class CreateOrderHandler(
    PrimaryDbContext dbContext,
    IOrderService orderService,
    IStockService stockService
)
{
    public async Task<(CreateOrderResponse response, int statusCode)> HandleAsync(CreateOrderRequest req, string? requestOrigin, CancellationToken ct)
    {
        var checkout = await dbContext.Checkouts
            .Include(c => c.CheckoutTemplate)
            .Include(c => c.Config)
            .Include(c => c.CheckoutProducts)
                .ThenInclude(p => p.Product)
                    .ThenInclude(p => p!.Variants)
            .Include(c => c.CheckoutProducts)
                .ThenInclude(p => p.Variant)
            .Include(c => c.Coupons)
            .FirstOrDefaultAsync(c => c.ShortId == req.ShortId, ct);

        if (checkout == null)
        {
            return (new CreateOrderResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        if (checkout.Status != CheckoutStatus.Active)
        {
            return (new CreateOrderResponse
            {
                Error = new ApiErrorResponse("Este checkout não está mais disponível.", "checkout_inactive")
            }, 410);
        }

        var now = DateTime.UtcNow;
        var template = checkout.CheckoutTemplate;
        var config = checkout.Config;

        if (template == null || config == null)
        {
            return (new CreateOrderResponse
            {
                Error = new ApiErrorResponse("Configuração do checkout incompleta.", "checkout_invalid_config")
            }, 400);
        }

        var allowedMethods = GetAllowedMethods(config);
        if (!allowedMethods.Contains(req.Method))
        {
            return (new CreateOrderResponse
            {
                Error = new ApiErrorResponse($"Método de pagamento '{req.Method}' não permitido para este checkout.", "payment_method_not_allowed")
            }, 400);
        }

        List<CreateOrderItemInput> items;

        if (template.Type == CheckoutTemplateType.SingleOrder)
        {
            items = checkout.CheckoutProducts
                .Where(cp => cp.Product != null)
                .Select(cp => new CreateOrderItemInput
                {
                    ProductId = cp.ProductId,
                    VariantId = cp.VariantId,
                    Quantity = cp.Quantity,
                    UnitPrice = cp.CustomPrice ?? cp.Variant?.Price ?? cp.Product?.Price
                })
                .ToList();
        }
        else
        {
            if (req.Items == null || req.Items.Count == 0)
            {
                return (new CreateOrderResponse
                {
                    Error = new ApiErrorResponse("Os itens são obrigatórios para este tipo de checkout.", "items_required")
                }, 400);
            }

            var checkoutProducts = checkout.CheckoutProducts.ToDictionary(cp => (cp.ProductId, cp.VariantId));
            var availableProducts = checkout.CheckoutProducts.Select(p => p.ProductId).ToHashSet();
            var invalidProducts = req.Items.Where(i => !availableProducts.Contains(i.ProductId)).ToList();

            if (invalidProducts.Count > 0)
            {
                return (new CreateOrderResponse
                {
                    Error = new ApiErrorResponse("Um ou mais produtos não estão disponíveis neste checkout.", "invalid_products")
                }, 400);
            }

            items = req.Items.Select(i =>
            {
                checkoutProducts.TryGetValue((i.ProductId, i.VariantId), out var cp);

                return new CreateOrderItemInput
                {
                    ProductId = i.ProductId,
                    VariantId = i.VariantId,
                    Quantity = i.Quantity,
                    UnitPrice = cp?.CustomPrice ?? cp?.Variant?.Price ?? cp?.Product?.Price
                };
            }).ToList();
        }

        if (items.Count == 0)
        {
            return (new CreateOrderResponse
            {
                Error = new ApiErrorResponse("Nenhum item válido foi encontrado.", "no_valid_items")
            }, 400);
        }

        Order? existingOrder = null;
        if (req.OrderId.HasValue)
        {
            existingOrder = await dbContext.Orders
                .Include(o => o.Items)
                .Include(o => o.Customer)
                .FirstOrDefaultAsync(o =>
                    o.Id == req.OrderId.Value &&
                    o.CheckoutId == checkout.Id &&
                    o.Status == OrderStatus.Reserved &&
                    o.ExpiresAt > now, ct);

            if (existingOrder == null)
            {
                return (new CreateOrderResponse
                {
                    Error = new ApiErrorResponse("A reserva expirou ou não foi encontrada. Por favor, tente novamente.", "reservation_expired")
                }, 410);
            }
        }

        Guid customerId;
        if (existingOrder != null)
        {
            customerId = await UpdateExistingOrderCustomerAsync(existingOrder, req.Customer, ct);

            var hasDigitalProducts = existingOrder.Items.Any(i => i.Product?.Type == ProductType.Digital);
            if (hasDigitalProducts)
            {
                var digitalResult = await stockService.ReserveDigitalItemsAsync(existingOrder, ct);
                if (!digitalResult)
                {
                    await stockService.ReleaseReservationAsync(existingOrder.Id, "Falha ao reservar itens digitais", ct);
                    return (new CreateOrderResponse
                    {
                        Error = new ApiErrorResponse("Não há itens digitais disponíveis em quantidade suficiente.", "insufficient_digital_items")
                    }, 400);
                }
            }
        }
        else
        {
            customerId = await GetOrCreateCustomerAsync(checkout.MerchantId, checkout.Environment, req.Customer, ct);
        }

        OrderShippingAddress? shippingAddress = null;
        if (req.Address != null)
        {
            shippingAddress = new OrderShippingAddress
            {
                Street = req.Address.Street,
                Number = req.Address.Number,
                Complement = req.Address.Complement,
                Neighborhood = req.Address.Neighborhood,
                City = req.Address.City,
                State = req.Address.State,
                ZipCode = req.Address.ZipCode,
                Country = "BR"
            };

            if (existingOrder != null)
            {
                existingOrder.ShippingAddress = shippingAddress;
                existingOrder.UpdatedAt = DateTime.UtcNow;
            }

            var customerToUpdate = await dbContext.Customers
                .FirstOrDefaultAsync(c => c.Id == customerId, ct);

            if (customerToUpdate != null)
            {
                if (!string.IsNullOrWhiteSpace(req.Address.Street))
                {
                    customerToUpdate.AddressStreet = req.Address.Street;
                }

                if (!string.IsNullOrWhiteSpace(req.Address.Number))
                {
                    customerToUpdate.AddressNumber = req.Address.Number;
                }

                if (!string.IsNullOrWhiteSpace(req.Address.Complement))
                {
                    customerToUpdate.AddressComplement = req.Address.Complement;
                }

                if (!string.IsNullOrWhiteSpace(req.Address.Neighborhood))
                {
                    customerToUpdate.AddressNeighborhood = req.Address.Neighborhood;
                }

                if (!string.IsNullOrWhiteSpace(req.Address.City))
                {
                    customerToUpdate.AddressCity = req.Address.City;
                }

                if (!string.IsNullOrWhiteSpace(req.Address.State))
                {
                    customerToUpdate.AddressState = req.Address.State;
                }

                if (!string.IsNullOrWhiteSpace(req.Address.ZipCode))
                {
                    customerToUpdate.AddressPostalCode = req.Address.ZipCode;
                }

                customerToUpdate.AddressCountry = "BR";
                customerToUpdate.UpdatedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync(ct);
            }
        }

        var shippingAmount = config.ShippingEnabled && config.FixedShippingAmount.HasValue
            ? config.FixedShippingAmount.Value
            : 0L;

        var orderInput = new CreateOrderInput
        {
            ExistingOrderId = existingOrder?.Id,
            MerchantId = checkout.MerchantId,
            CustomerId = customerId,
            CheckoutId = checkout.Id,
            CheckoutTemplateFeeMode = template.FeeMode,
            CheckoutTemplateFeeFixed = template.FeeFixed,
            CheckoutTemplateFeePercentage = template.FeePercentage,
            Environment = checkout.Environment,
            RequestOrigin = requestOrigin,
            Items = existingOrder != null
                ? existingOrder.Items.Select(i => new CreateOrderItemInput
                {
                    ProductId = i.ProductId,
                    VariantId = i.VariantId,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
                : items,
            CouponCode = req.CouponCode,
            ShippingAddress = shippingAddress,
            ShippingAmount = existingOrder?.ShippingAmount ?? shippingAmount,
            Notes = null,
            PaymentMethod = req.Method,
            Description = template.Name,
            CallbackUrl = config.CallbackUrl,
            ExpirationMinutes = req.PixExpirationMinutes ?? config.PixExpirationMinutes,
            BoletoDueDate = req.BoletoDueDate,
            BoletoInstructions = req.BoletoInstructions
        };

        if (existingOrder == null)
        {
            foreach (var item in items)
            {
                var validation = await stockService.ValidateAvailabilityAsync(
                    item.ProductId,
                    item.VariantId,
                    item.Quantity,
                    null,
                    ct);

                if (!validation.IsValid)
                {
                    return (new CreateOrderResponse
                    {
                        Error = new ApiErrorResponse(validation.ErrorMessage ?? "Estoque insuficiente.", "insufficient_stock")
                    }, 400);
                }
            }
        }

        var result = await orderService.CreateFromCheckoutAsync(orderInput);

        if (!result.Success || result.Order == null || result.Payment == null)
        {
            return (new CreateOrderResponse
            {
                Error = new ApiErrorResponse(
                    result.ErrorMessage ?? "Erro ao criar pedido.",
                    result.ErrorCode ?? "order_creation_failed")
            }, result.StatusCode);
        }

        var orderData = MapToOrderData(result.Payment, result.PaymentPix, result.Payment?.PaymentBoleto, result.Order);

        return (new CreateOrderResponse
        {
            Data = orderData
        }, 201);
    }

    private async Task<Guid> UpdateExistingOrderCustomerAsync(
        Order existingOrder,
        CheckoutCustomerRequest? customerData,
        CancellationToken ct)
    {
        if (customerData == null)
            return existingOrder.CustomerId;

        var customer = existingOrder.Customer;
        if (customer == null)
        {
            customer = await dbContext.Customers.FindAsync([existingOrder.CustomerId], ct);
            if (customer == null)
                return existingOrder.CustomerId;
        }

        var wasUpdated = false;

        if (!string.IsNullOrEmpty(customerData.Name) && customer.Name != customerData.Name)
        {
            customer.Name = customerData.Name;
            wasUpdated = true;
        }

        if (!string.IsNullOrEmpty(customerData.Email))
        {
            var normalizedEmail = customerData.Email.ToLower().Trim();
            if (customer.Email != normalizedEmail && !customer.Email.Contains("@checkout.swiftpay.app"))
            {
                customer.Email = normalizedEmail;
                wasUpdated = true;
            }
            else if (customer.Email.Contains("@checkout.swiftpay.app"))
            {
                customer.Email = normalizedEmail;
                wasUpdated = true;
            }
        }

        if (!string.IsNullOrEmpty(customerData.Phone) && customer.Phone != customerData.Phone)
        {
            customer.Phone = customerData.Phone;
            wasUpdated = true;
        }

        if (!string.IsNullOrEmpty(customerData.Document) && customer.Document != customerData.Document)
        {
            customer.Document = customerData.Document;
            wasUpdated = true;
        }

        if (wasUpdated)
        {
            customer.UpdatedAt = DateTime.UtcNow;
            existingOrder.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }

        return customer.Id;
    }

    private async Task<Guid> GetOrCreateCustomerAsync(
        Guid merchantId,
        ApiEnvironment environment,
        CheckoutCustomerRequest? customerData,
        CancellationToken ct)
    {
        if (customerData == null)
        {
            var anonymousCustomer = await dbContext.Customers
                .FirstOrDefaultAsync(c =>
                    c.MerchantId == merchantId &&
                    c.Email == "anonymous@checkout.swiftpay.app", ct);

            if (anonymousCustomer != null)
                return anonymousCustomer.Id;

            anonymousCustomer = new Customer
            {
                Id = Guid.CreateVersion7(),
                MerchantId = merchantId,
                Environment = environment,
                Name = "Cliente Anônimo",
                Email = "anonymous@checkout.swiftpay.app",
                Status = CustomerStatus.Active
            };

            dbContext.Customers.Add(anonymousCustomer);
            await dbContext.SaveChangesAsync(ct);
            return anonymousCustomer.Id;
        }

        Customer? customer = null;

        if (!string.IsNullOrEmpty(customerData.Document))
        {
            customer = await dbContext.Customers
                .FirstOrDefaultAsync(c =>
                    c.MerchantId == merchantId &&
                    c.Document == customerData.Document, ct);
        }

        if (customer == null && !string.IsNullOrEmpty(customerData.Email))
        {
            customer = await dbContext.Customers
                .FirstOrDefaultAsync(c =>
                    c.MerchantId == merchantId &&
                    c.Email == customerData.Email.ToLower().Trim(), ct);
        }

        if (customer != null)
        {
            if (!string.IsNullOrEmpty(customerData.Name) && string.IsNullOrEmpty(customer.Name))
                customer.Name = customerData.Name;
            if (!string.IsNullOrEmpty(customerData.Email) && (string.IsNullOrEmpty(customer.Email) || customer.Email.Contains("@checkout.swiftpay.app")))
                customer.Email = customerData.Email.ToLower().Trim();
            if (!string.IsNullOrEmpty(customerData.Phone) && string.IsNullOrEmpty(customer.Phone))
                customer.Phone = customerData.Phone;
            if (!string.IsNullOrEmpty(customerData.Document) && string.IsNullOrEmpty(customer.Document))
                customer.Document = customerData.Document;

            await dbContext.SaveChangesAsync(ct);
            return customer.Id;
        }

        customer = new Customer
        {
            Id = Guid.CreateVersion7(),
            MerchantId = merchantId,
            Environment = environment,
            Name = customerData.Name ?? "",
            Email = customerData.Email?.ToLower().Trim() ?? $"checkout-{Guid.NewGuid():N}@checkout.swiftpay.app",
            Phone = customerData.Phone,
            Document = customerData.Document,
            Status = CustomerStatus.Active
        };

        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync(ct);
        return customer.Id;
    }

    private static List<PaymentMethod> GetAllowedMethods(CheckoutConfig config)
    {
        var methods = new List<PaymentMethod>();

        if (config.PixEnabled) methods.Add(PaymentMethod.Pix);
        if (config.CreditCardEnabled) methods.Add(PaymentMethod.CreditCard);
        if (config.BoletoEnabled) methods.Add(PaymentMethod.Boleto);

        return methods;
    }

    private static OrderData MapToOrderData(
        Payment payment,
        PaymentPix? pix,
        PaymentBoleto? boleto,
        swiftpay_api_core.Models.Database.Order order)
    {
        var data = new OrderData
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber ?? string.Empty,
            PaymentId = payment.Id,
            ExternalId = payment.ExternalId,
            Method = payment.Method,
            Amount = payment.Amount,
            Fee = payment.PlatformFee + payment.CheckoutTemplateFee,
            NetAmount = payment.NetAmount,
            Currency = payment.Currency.ToString(),
            Status = payment.Status,
            Description = payment.Description,
            Environment = payment.Environment,
            ExpiresAt = payment.ExpiresAt,
            CreatedAt = payment.CreatedAt,
            CompletedAt = payment.CompletedAt,
            CustomerId = payment.CustomerId
        };

        if (pix != null)
        {
            data.Pix = new PixOrderData
            {
                TxId = pix.TxId,
                QrCode = pix.CopyAndPaste,
                CopyAndPaste = pix.CopyAndPaste,
                ExpiresAt = pix.ExpiresAt
            };
        }

        if (boleto != null)
        {
            data.Boleto = new BoletoOrderData
            {
                Barcode = boleto.Barcode,
                DigitableLine = boleto.DigitableLine,
                PdfUrl = boleto.PdfUrl,
                DueDate = boleto.DueDate
            };
        }

        return data;
    }
}
