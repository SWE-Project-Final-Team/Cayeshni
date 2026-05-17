using Cayeshni.API.Application.Features.Settlements;
using Cayeshni.API.Application.Features.Transactions;
using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;
using Cayeshni.API.Infrastructure.Persistence;
using Cayeshni.Tests.TestDoubles;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Settlements;

public class SettlementServiceTests
{
    private AppDbContext GetTestDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private async Task<(Guid UserId1, Guid UserId2, Guid GroupId, Guid TransactionId)> SetupTestDataAsync(AppDbContext context)
    {
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var groupId = Guid.NewGuid();

        var group = new Group
        {
            Id = groupId,
            Name = "Test Group",
            DefaultCurrency = Currency.USD,
            CreatedById = userId1,
            InviteToken = Guid.NewGuid().ToString("N")
        };

        var member1 = new GroupMember { GroupId = groupId, UserId = userId1 };
        var member2 = new GroupMember { GroupId = groupId, UserId = userId2 };
        group.Members.Add(member1);
        group.Members.Add(member2);

        context.Groups.Add(group);
        await context.SaveChangesAsync();

        // Create a transaction where userId2 owes userId1 $100
        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            PaidByUserId = userId1,
            TotalAmount = 100m,
            Currency = Currency.USD,
            Category = TransactionCategory.Food,
            Description = "Test expense",
            CreatedAt = DateTime.UtcNow
        };

        var member = new TransactionMember
        {
            TransactionId = transaction.Id,
            UserId = userId2,
            AmountOwed = 100m
        };
        transaction.TransactionMembers.Add(member);

        context.Transactions.Add(transaction);
        await context.SaveChangesAsync();

        return (userId1, userId2, groupId, transaction.Id);
    }

    [Fact]
    public async Task CreateSettlementAsync_WithValidData_CreatesSettlement()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto = new CreateSettlementDto(
            groupId,
            userId2, // payer
            userId1, // payee
            100m,
            Currency.USD,
            "Settled lunch",
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m)
            }
        );

        // Act
        var result = await service.CreateSettlementAsync(userId2, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100m, result.Amount);
        Assert.Equal(userId2, result.PayerUserId);
        Assert.Equal(userId1, result.PayeeUserId);
        Assert.Single(result.Allocations);
    }

    [Fact]
    public async Task CreateSettlementAsync_OnlyPayerCanCreate()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var otherId = Guid.NewGuid();

        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            100m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m)
            }
        );

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateSettlementAsync(otherId, dto)
        );
    }

    [Fact]
    public async Task CreateSettlementAsync_InvalidCurrency_ThrowsException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            100m,
            Currency.EUR, // Group is USD
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m)
            }
        );

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateSettlementAsync(userId2, dto)
        );
    }

    [Fact]
    public async Task CreateSettlementAsync_AllocationSumNotEqualAmount_ThrowsException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            100m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 60m) // Allocation sum is 60, but amount is 100
            }
        );

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateSettlementAsync(userId2, dto)
        );
    }

    [Fact]
    public async Task CreateSettlementAsync_AllocationExceedsRemainingOwed_ThrowsException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        // Create first settlement for 60
        var dto1 = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            60m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 60m)
            }
        );
        await service.CreateSettlementAsync(userId2, dto1);

        // Try to create second settlement for 50 (total would be 110, but only 100 owed)
        var dto2 = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            50m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 50m)
            }
        );

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateSettlementAsync(userId2, dto2)
        );
    }

    [Fact]
    public async Task GetGroupSettlementsAsync_ReturnsAllGroupSettlements()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto1 = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            50m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 50m)
            }
        );

        var dto2 = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            50m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 50m)
            }
        );

        await service.CreateSettlementAsync(userId2, dto1);
        await service.CreateSettlementAsync(userId2, dto2);

        // Act
        var result = await service.GetGroupSettlementsAsync(userId1, groupId);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetGroupSettlementsAsync_NonMember_Throws()
    {
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (_, _, groupId, _) = await SetupTestDataAsync(context);
        var outsider = Guid.NewGuid();

        await Assert.ThrowsAsync<ValidationException>(
            () => service.GetGroupSettlementsAsync(outsider, groupId));
    }

    [Fact]
    public async Task CreateSettlementAsync_PayerAndPayeeSame_Throws()
    {
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (_, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId2,
            100m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m)
            }
        );

        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateSettlementAsync(userId2, dto));
    }

    [Fact]
    public async Task DeleteSettlementAsync_OnlyPayerOrPayeeCanDelete()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            100m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m)
            }
        );

        var settlement = await service.CreateSettlementAsync(userId2, dto);
        var otherId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.DeleteSettlementAsync(otherId, settlement)
        );
    }

    [Fact]
    public async Task DeleteSettlementAsync_PayerCanDelete()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            100m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m)
            }
        );

        var settlement = await service.CreateSettlementAsync(userId2, dto);

        // Act
        await service.DeleteSettlementAsync(userId2, settlement);

        // Assert
        var deleted = await context.Settlements.FirstOrDefaultAsync(s => s.Id == settlement.Id);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task UpdateSettlementAsync_OnlyPayerCanUpdate()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            100m,
            Currency.USD,
            "Original note",
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m)
            }
        );

        var settlement = await service.CreateSettlementAsync(userId2, dto);

        var updateDto = new SettlementResponseDto(
            settlement.Id,
            settlement.GroupId,
            settlement.PayerUserId,
            settlement.PayeeUserId,
            settlement.Amount,
            settlement.Currency,
            settlement.CreatedAt,
            "Updated note",
            settlement.Allocations
        );

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.UpdateSettlementAsync(userId1, updateDto)
        );
    }

    [Fact]
    public async Task UpdateSettlementAsync_PayerCanUpdate()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            100m,
            Currency.USD,
            "Original note",
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m)
            }
        );

        var settlement = await service.CreateSettlementAsync(userId2, dto);

        var updateDto = new SettlementResponseDto(
            settlement.Id,
            settlement.GroupId,
            settlement.PayerUserId,
            settlement.PayeeUserId,
            settlement.Amount,
            settlement.Currency,
            settlement.CreatedAt,
            "Updated note",
            settlement.Allocations
        );

        // Act
        await service.UpdateSettlementAsync(userId2, updateDto);

        // Assert - verify the update persisted
        var updated = await context.Settlements.FirstOrDefaultAsync(s => s.Id == settlement.Id);
        Assert.NotNull(updated);
        Assert.Equal("Updated note", updated.note);
    }

    [Fact]
    public async Task CreateSettlementAsync_MultipleAllocations_SavesAllAllocations()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        // Create another transaction
        var transaction2 = new Transaction
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            PaidByUserId = userId1,
            TotalAmount = 50m,
            Currency = Currency.USD,
            Category = TransactionCategory.Transport,
            Description = "Uber",
            CreatedAt = DateTime.UtcNow
        };
        var member = new TransactionMember
        {
            TransactionId = transaction2.Id,
            UserId = userId2,
            AmountOwed = 50m
        };
        transaction2.TransactionMembers.Add(member);
        context.Transactions.Add(transaction2);
        await context.SaveChangesAsync();

        // Create settlement with multiple allocations
        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            150m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 100m),
                new(transaction2.Id, userId2, 50m)
            }
        );

        // Act
        var result = await service.CreateSettlementAsync(userId2, dto);

        // Assert
        Assert.Equal(2, result.Allocations.Count);
        Assert.Equal(100m, result.Allocations[0].AllocatedAmount);
        Assert.Equal(50m, result.Allocations[1].AllocatedAmount);
    }

    [Fact]
    public async Task CreateSettlement_WithPaymentTracking()
    {
        // Arrange
        var context = GetTestDbContext();
        var transactionService = new TransactionService(new FakeTransactionRepository(context));
        var settlementService = new SettlementService(new FakeSettlementRepository(context));
        var (userId1, userId2, groupId, transactionId) = await SetupTestDataAsync(context);

        // Create settlement
        var dto = new CreateSettlementDto(
            groupId,
            userId2,
            userId1,
            60m,
            Currency.USD,
            null,
            new List<SettlementAllocationDto>
            {
                new(transactionId, userId2, 60m)
            }
        );

        await settlementService.CreateSettlementAsync(userId2, dto);

        // Act - get transaction details with balances
        var result = await transactionService.GetTransactionWithBalancesAsync(transactionId);

        // Assert
        Assert.Single(result.Members);
        Assert.Equal(100m, result.Members[0].TotalOwed);
        Assert.Equal(60m, result.Members[0].SettledAmount);
        Assert.Equal(40m, result.Members[0].RemainingOwed);
    }
}
