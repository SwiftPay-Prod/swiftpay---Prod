using FluentAssertions;
using safefy_api_payment.Endpoints.Utils;

namespace safefy_api_payment.Tests.Unit.Utils;

public sealed class PixUtilsTests
{
    [Fact]
    public void GenerateTxId_ShouldCreateValidTxId()
    {
        var txId = PixUtils.GenerateTxId();

        txId.Should().NotBeNullOrWhiteSpace();
        txId.Length.Should().Be(26);
        PixUtils.IsValidTxId(txId).Should().BeTrue();
    }

    [Fact]
    public void IsValidTxId_ShouldRejectInvalidCharacters()
    {
        var txId = "ABC123ABC123ABC123ABC12_";

        var isValid = PixUtils.IsValidTxId(txId);

        isValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("E123")]
    public void IsValidEndToEndId_ShouldRejectInvalidValues(string? value)
    {
        PixUtils.IsValidEndToEndId(value).Should().BeFalse();
    }

    [Fact]
    public void IsValidEndToEndId_ShouldAccept32CharsStartingWithE()
    {
        var value = "E12345678202401011234ABCDE123456";

        var isValid = PixUtils.IsValidEndToEndId(value);

        isValid.Should().BeTrue();
    }
}
