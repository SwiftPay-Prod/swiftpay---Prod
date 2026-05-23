namespace Swiftpay.Domain.Tests.Entities;

public class PaymentTests
{
    [Fact]
    public void CreatePayment_Should_HavePendingStatus()
    {
        var p = new Payment { Id = Guid.NewGuid(), Amount = 5000, MerchantId = Guid.NewGuid(), Method = "PIX" };

        p.Status.Should().Be("PENDING");
    }

    [Fact]
    public void CreatePaymentPix_Should_StoreQrCode()
    {
        var p = new PaymentPix { Id = Guid.NewGuid(), PaymentId = Guid.NewGuid(), CopyAndPaste = "000201010212..." };

        p.CopyAndPaste.Should().Be("000201010212...");
    }

    [Fact]
    public void Payment_Status_Should_TransitionToPaid()
    {
        var p = new Payment { Id = Guid.NewGuid(), Amount = 5000, MerchantId = Guid.NewGuid(), Method = "PIX" };

        p.Status = "PAID";
        p.PaidAt = DateTime.UtcNow;

        p.Status.Should().Be("PAID");
        p.PaidAt.Should().NotBeNull();
    }
}
