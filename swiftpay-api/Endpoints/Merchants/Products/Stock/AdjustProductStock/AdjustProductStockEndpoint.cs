using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Products.Stock.AdjustProductStock;

public sealed class AdjustProductStockEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<AdjustProductStockRequest, AdjustProductStockResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/products/{productId:guid}/stock/adjust");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(AdjustProductStockRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new AdjustProductStockResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new AdjustProductStockResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new AdjustProductStockResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        int currentStock;
        int newStock;

        if (req.VariantId.HasValue)
        {
            var variant = await dbContext.Variants
                .OrderBy(v => v.Id)
                .FirstOrDefaultAsync(v => v.Id == req.VariantId.Value && v.ProductId == req.ProductId, ct);

            if (variant == null)
            {
                await Send.ResponseAsync(new AdjustProductStockResponse
                {
                    Error = new("Variante não encontrada.")
                }, 404, ct);
                return;
            }

            currentStock = variant.StockQuantity ?? 0;

            if (req.Type == StockMovementType.In)
            {
                newStock = currentStock + req.Quantity;
            }
            else if (req.Type == StockMovementType.Out)
            {
                newStock = currentStock - req.Quantity;
                if (newStock < 0)
                {
                    await Send.ResponseAsync(new AdjustProductStockResponse
                    {
                        Error = new($"Estoque insuficiente. Disponível: {currentStock}, Solicitado: {req.Quantity}")
                    }, 400, ct);
                    return;
                }
            }
            else
            {
                newStock = req.Quantity;
            }

            variant.StockQuantity = newStock;
        }
        else
        {
            currentStock = product.StockQuantity ?? 0;

            if (req.Type == StockMovementType.In)
            {
                newStock = currentStock + req.Quantity;
            }
            else if (req.Type == StockMovementType.Out)
            {
                newStock = currentStock - req.Quantity;
                if (newStock < 0)
                {
                    await Send.ResponseAsync(new AdjustProductStockResponse
                    {
                        Error = new($"Estoque insuficiente. Disponível: {currentStock}, Solicitado: {req.Quantity}")
                    }, 400, ct);
                    return;
                }
            }
            else
            {
                newStock = req.Quantity;
            }

            product.StockQuantity = newStock;
        }

        var movement = new StockMovement
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            ProductId = req.ProductId,
            VariantId = req.VariantId,
            Type = req.Type,
            Quantity = req.Quantity,
            ReferenceType = StockMovementReferenceType.Manual,
            BalanceBefore = currentStock,
            BalanceAfter = newStock,
            Notes = req.Notes,
            Environment = product.Environment,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.StockMovements.Add(movement);
        await dbContext.SaveChangesAsync(ct);

        var typeLabel = req.Type switch
        {
            StockMovementType.In => "Entrada",
            StockMovementType.Out => "Saída",
            StockMovementType.Adjustment => "Ajuste",
            _ => "Movimentação"
        };

        await Send.OkAsync(new AdjustProductStockResponse
        {
            Data = new StockAdjustmentData
            {
                MovementId = movement.Id,
                ProductId = movement.ProductId,
                VariantId = movement.VariantId,
                Type = movement.Type,
                Quantity = movement.Quantity,
                BalanceBefore = movement.BalanceBefore,
                BalanceAfter = movement.BalanceAfter,
                Notes = movement.Notes,
                CreatedAt = movement.CreatedAt
            },
            Message = $"{typeLabel} de estoque registrada com sucesso!"
        }, ct);
    }
}
