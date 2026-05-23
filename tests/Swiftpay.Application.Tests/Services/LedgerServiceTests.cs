using Swiftpay.Application.Common;
using Swiftpay.Application.Services;
using Swiftpay.Domain.Entities;
using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Application.Tests.Services;

public class LedgerServiceTests
{
    private readonly Mock<IAccountRepository> _accountRepo = new();
    private readonly Mock<ILedgerRepository> _ledgerRepo = new();
    private readonly LedgerService _service;
    private readonly Guid _merchantId = Guid.NewGuid();
    private readonly Guid _merchantAcquirerId = Guid.NewGuid();
    private readonly Guid _paymentId = Guid.NewGuid();

    public LedgerServiceTests()
    {
        _service = new LedgerService(_accountRepo.Object, _ledgerRepo.Object);
    }

    private void SetupGetOrCreate(AccountType type, long balance = 0)
    {
        _accountRepo.Setup(r => r.GetOrCreateAsync(type, _merchantId, null, _merchantAcquirerId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Account { Id = Guid.NewGuid(), Type = type, Balance = balance });
    }

    private void SetupAcquirerAccount(long balance = 0)
    {
        _accountRepo.Setup(r => r.GetOrCreateAsync(AccountType.AcquirerSettlement, null, _merchantAcquirerId, null, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Account { Id = Guid.NewGuid(), Type = AccountType.AcquirerSettlement, Balance = balance });
    }

    [Fact]
    public async Task RecordPaymentPendingAsync_Should_CreditMerchantPending()
    {
        SetupGetOrCreate(AccountType.MerchantPending);
        _ledgerRepo.Setup(r => r.TransactionExistsAsync(_paymentId, LedgerOperation.PixIn, "Pending", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _ledgerRepo.Setup(r => r.CreateTransactionWithAtomicBalanceUpdateAsync(It.IsAny<LedgerTransaction>(), It.IsAny<List<(Account, long)>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(LedgerTransactionResult.Ok("tx-test", 3000));

        var result = await _service.RecordPaymentPendingAsync(_paymentId, _merchantId, _merchantAcquirerId, 3000, "production", CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task RecordPaymentPendingAsync_Should_Skip_When_AlreadyRecorded()
    {
        _ledgerRepo.Setup(r => r.TransactionExistsAsync(_paymentId, LedgerOperation.PixIn, "Pending", It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _service.RecordPaymentPendingAsync(_paymentId, _merchantId, _merchantAcquirerId, 3000, "production", CancellationToken.None);

        result.IsSuccess.Should().BeTrue(); // Idempotent
    }

    [Fact]
    public async Task RecordPaymentReceivedAsync_Should_TransferPendingToAvailable()
    {
        SetupGetOrCreate(AccountType.MerchantPending, 10000);
        SetupGetOrCreate(AccountType.MerchantAvailable);
        SetupGetOrCreate(AccountType.MerchantReserved);
        SetupAcquirerAccount();
        _ledgerRepo.Setup(r => r.TransactionExistsAsync(_paymentId, LedgerOperation.PixIn, "Approved", It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _ledgerRepo.Setup(r => r.CreateTransactionWithAtomicBalanceUpdateAsync(It.IsAny<LedgerTransaction>(), It.IsAny<List<(Account, long)>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(LedgerTransactionResult.Ok("tx-rec", 9500));

        var result = await _service.RecordPaymentReceivedAsync(_paymentId, _merchantId, _merchantAcquirerId, 10000, 9500, 500, "production", CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task GetMerchantAvailableBalanceAsync_Should_SumAccounts()
    {
        _accountRepo.Setup(r => r.GetMerchantAccountsAsync(_merchantId, "production", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Account>
            {
                new() { Type = AccountType.MerchantAvailable, Balance = 5000 },
                new() { Type = AccountType.MerchantAvailable, Balance = 3000 },
                new() { Type = AccountType.MerchantPending, Balance = 2000 },
            });

        var balance = await _service.GetMerchantAvailableBalanceAsync(_merchantId, "production", CancellationToken.None);
        balance.Should().Be(8000);
    }
}
