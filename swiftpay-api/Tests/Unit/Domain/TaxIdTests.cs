using swiftpay_api_core.Models.Domain;
using Xunit;

namespace swiftpay_api.Tests.Unit.Domain;

public class TaxIdTests
{
    [Theory]
    [InlineData("529.982.247-25", "52998224725", "529.982.247-25", TaxIdType.Cpf)]
    [InlineData("52998224725", "52998224725", "529.982.247-25", TaxIdType.Cpf)]
    [InlineData("00.000.000/0001-91", "00000000000191", "00.000.000/0001-91", TaxIdType.Cnpj)]
    [InlineData("00000000000191", "00000000000191", "00.000.000/0001-91", TaxIdType.Cnpj)]
    [InlineData("11.222.333/0001-81", "11222333000181", "11.222.333/0001-81", TaxIdType.Cnpj)]
    public void TryParse_ValidDocument_ReturnsTrueAndCorrectProperties(
        string input,
        string expectedDigits,
        string expectedFormatted,
        TaxIdType expectedType)
    {
        // Act
        var success = TaxId.TryParse(input, out var taxId);

        // Assert
        Assert.True(success);
        Assert.True(taxId.IsValid);
        Assert.Equal(expectedDigits, taxId.Digits);
        Assert.Equal(expectedFormatted, taxId.Formatted);
        Assert.Equal(expectedType, taxId.Type);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("123")]
    [InlineData("1234567890")] // 10 digits
    [InlineData("123456789012")] // 12 digits
    [InlineData("1234567890123")] // 13 digits
    [InlineData("123456789012345")] // 15 digits
    [InlineData("000.000.000-00")] // repeated digits
    [InlineData("111.111.111-11")] // repeated digits
    [InlineData("123.456.789-00")] // invalid CPF checksum
    [InlineData("11.222.333/0001-00")] // invalid CNPJ checksum
    [InlineData("abcdefghijk")] // letters
    public void TryParse_InvalidDocument_ReturnsFalseAndInvalidTaxId(string? input)
    {
        // Act
        var success = TaxId.TryParse(input, out var taxId);

        // Assert
        Assert.False(success);
        Assert.False(taxId.IsValid);
        Assert.Equal(string.Empty, taxId.Digits);
        Assert.Equal(string.Empty, taxId.Formatted);
    }

    [Fact]
    public void Create_ValidCpf_InstantiatesTaxId()
    {
        // Act
        var taxId = TaxId.Create("529.982.247-25");

        // Assert
        Assert.True(taxId.IsValid);
        Assert.Equal("52998224725", taxId.Digits);
        Assert.Equal("529.982.247-25", taxId.Formatted);
        Assert.Equal(TaxIdType.Cpf, taxId.Type);
    }

    [Fact]
    public void Create_InvalidDocument_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() => TaxId.Create("00000000000"));
        Assert.Contains("Documento (CPF/CNPJ) inválido", ex.Message);
    }

    [Fact]
    public void Equals_SameDocumentDifferentFormatting_ReturnsTrue()
    {
        // Arrange
        var taxId1 = TaxId.Create("529.982.247-25");
        var taxId2 = TaxId.Create("52998224725");

        // Assert
        Assert.Equal(taxId1, taxId2);
        Assert.True(taxId1 == taxId2);
    }

    [Fact]
    public void Equals_DefaultStructAndEmpty_ReturnsTrue()
    {
        // Arrange
        TaxId defaultStruct = default;
        var empty = TaxId.Empty;

        // Assert
        Assert.Equal(defaultStruct, empty);
        Assert.True(defaultStruct == empty);
    }
}
