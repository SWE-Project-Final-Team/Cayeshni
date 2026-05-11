using Cayeshni.API.Application.Features.Transactions;
using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;
using Cayeshni.API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Transactions;

public class TransactionServiceTests
{
    private AppDbContext GetTestDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private async Task<(Guid UserId, Guid GroupId)> SetupTestDataAsync(AppDbContext context)
    {
        var userId = Guid.NewGuid();
        var groupId = Guid.NewGuid();

        var group = new Group
        {
            Id = groupId,
            Name = "Test Group",
            DefaultCurrency = Currency.USD,
            CreatedById = userId,
            InviteToken = Guid.NewGuid().ToString("N")
        };

        var member = new GroupMember { GroupId = groupId, UserId = userId };
        group.Members.Add(member);

        context.Groups.Add(group);
        await context.SaveChangesAsync();

        return (userId, groupId);
    }

    [Fact]
    public async Task CreateTransactionAsync_WithValidData_CreatesTransaction()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);
        
        var memberId = Guid.NewGuid();
        var member = new GroupMember { GroupId = groupId, UserId = memberId };
        context.GroupMembers.Add(member);
        await context.SaveChangesAsync();

        var dto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Lunch",
            new List<TransactionMemberDto> { new(memberId, 100m) }
        );

        // Act
        var result = await service.CreateTransactionAsync(userId, dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100m, result.TotalAmount);
        Assert.Equal("Lunch", result.Description);
        Assert.Equal(userId, result.PaidByUserId);
    }

    [Fact]
    public async Task CreateTransactionAsync_WithMembers_CreatesSplits()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);
        
        var memberId = Guid.NewGuid();
        var member = new GroupMember { GroupId = groupId, UserId = memberId };
        context.GroupMembers.Add(member);
        await context.SaveChangesAsync();

        var dto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Dinner",
            new List<TransactionMemberDto>
            {
                new(memberId, 100m)
            }
        );

        // Act
        var result = await service.CreateTransactionAsync(userId, dto);

        // Assert
        Assert.Single(result.Members);
        Assert.Equal(memberId, result.Members[0].UserId);
        Assert.Equal(100m, result.Members[0].AmountOwed);
    }

    [Fact]
    public async Task CreateTransactionAsync_InvalidCurrency_ThrowsException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);

        var memberId = Guid.NewGuid();
        var member = new GroupMember { GroupId = groupId, UserId = memberId };
        context.GroupMembers.Add(member);
        await context.SaveChangesAsync();

        var dto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.EUR, // Group is USD
            TransactionCategory.Food,
            "Dinner",
            new List<TransactionMemberDto> { new(memberId, 100m) }
        );

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateTransactionAsync(userId, dto)
        );
    }

    [Fact]
    public async Task CreateTransactionAsync_UserNotInGroup_ThrowsException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var userId = Guid.NewGuid();
        var groupId = Guid.NewGuid();

        var group = new Group
        {
            Id = groupId,
            Name = "Test Group",
            DefaultCurrency = Currency.USD,
            CreatedById = Guid.NewGuid(),
            InviteToken = Guid.NewGuid().ToString("N")
        };
        context.Groups.Add(group);
        await context.SaveChangesAsync();

        var dto = new CreateTransactionDto(groupId, 100m, Currency.USD, TransactionCategory.Food, null, null);

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateTransactionAsync(userId, dto)
        );
    }

    [Fact]
    public async Task CreateTransactionAsync_MemberSplitNotEqualTotal_ThrowsException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);

        var memberId = Guid.NewGuid();
        var member = new GroupMember { GroupId = groupId, UserId = memberId };
        context.GroupMembers.Add(member);
        await context.SaveChangesAsync();

        var dto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Dinner",
            new List<TransactionMemberDto>
            {
                new(memberId, 50m) // Total is 100 but member only owes 50
            }
        );

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.CreateTransactionAsync(userId, dto)
        );
    }

    [Fact]
    public async Task GetGroupTransactionsAsync_ReturnsAllGroupTransactions()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);

        var memberId = Guid.NewGuid();
        var member = new GroupMember { GroupId = groupId, UserId = memberId };
        context.GroupMembers.Add(member);
        await context.SaveChangesAsync();

        var trans1 = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Food",
            new List<TransactionMemberDto> { new(memberId, 100m) }
        );
        var trans2 = new CreateTransactionDto(
            groupId,
            50m,
            Currency.USD,
            TransactionCategory.Transport,
            "Uber",
            new List<TransactionMemberDto> { new(memberId, 50m) }
        );

        await service.CreateTransactionAsync(userId, trans1);
        await service.CreateTransactionAsync(userId, trans2);

        // Act
        var result = await service.GetGroupTransactionsAsync(groupId);

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetTransactionWithBalancesAsync_ShowsSettledAmounts()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);

        var memberId = Guid.NewGuid();
        var member = new GroupMember { GroupId = groupId, UserId = memberId };
        context.GroupMembers.Add(member);
        await context.SaveChangesAsync();

        var dto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Dinner",
            new List<TransactionMemberDto> { new(memberId, 100m) }
        );
        var transaction = await service.CreateTransactionAsync(userId, dto);

        // Add a settlement allocation
        var settlement = new Settlement
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            PayerUserId = memberId,
            PayeeUserId = userId,
            Amount = 60m,
            Currency = Currency.USD
        };
        context.Settlements.Add(settlement);

        var allocation = new SettlementAllocation
        {
            SettlementId = settlement.Id,
            TransactionId = transaction.Id,
            DebtorUserId = memberId,
            AllocatedAmount = 60m
        };
        context.SettlementAllocations.Add(allocation);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetTransactionWithBalancesAsync(transaction.Id);

        // Assert
        Assert.Single(result.Members);
        Assert.Equal(100m, result.Members[0].TotalOwed);
        Assert.Equal(60m, result.Members[0].SettledAmount);
        Assert.Equal(40m, result.Members[0].RemainingOwed);
    }

    [Fact]
    public async Task DeleteTransactionAsync_OnlyPayerCanDelete()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);

        var memberId = Guid.NewGuid();
        var member = new GroupMember { GroupId = groupId, UserId = memberId };
        context.GroupMembers.Add(member);
        await context.SaveChangesAsync();

        var dto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Dinner",
            new List<TransactionMemberDto> { new(memberId, 100m) }
        );
        var transaction = await service.CreateTransactionAsync(userId, dto);

        var otherUserId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.DeleteTransactionAsync(otherUserId, transaction.Id)
        );
    }

    [Fact]
    public async Task DeleteTransactionAsync_CannotDeleteWithSettlements()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);

        var memberId = Guid.NewGuid();
        var member = new GroupMember { GroupId = groupId, UserId = memberId };
        context.GroupMembers.Add(member);
        await context.SaveChangesAsync();

        var dto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Dinner",
            new List<TransactionMemberDto> { new(memberId, 100m) }
        );
        var transaction = await service.CreateTransactionAsync(userId, dto);

        // Add settlement allocation
        var settlement = new Settlement
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            PayerUserId = memberId,
            PayeeUserId = userId,
            Amount = 50m,
            Currency = Currency.USD
        };
        context.Settlements.Add(settlement);
        context.SettlementAllocations.Add(new SettlementAllocation
        {
            SettlementId = settlement.Id,
            TransactionId = transaction.Id,
            DebtorUserId = memberId,
            AllocatedAmount = 50m
        });
        await context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(
            () => service.DeleteTransactionAsync(userId, transaction.Id)
        );
    }

    [Fact]
    public async Task GetGroupDebtsAsync_CalculatesTotalAndRemainingDebts()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);

        var bobId = Guid.NewGuid();
        var bobMember = new GroupMember { GroupId = groupId, UserId = bobId };
        context.GroupMembers.Add(bobMember);
        await context.SaveChangesAsync();

        // Create two transactions where Bob owes
        var trans1Dto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Food",
            new List<TransactionMemberDto> { new(bobId, 100m) }
        );
        var trans1 = await service.CreateTransactionAsync(userId, trans1Dto);

        var trans2Dto = new CreateTransactionDto(
            groupId,
            60m,
            Currency.USD,
            TransactionCategory.Transport,
            "Uber",
            new List<TransactionMemberDto> { new(bobId, 60m) }
        );
        await service.CreateTransactionAsync(userId, trans2Dto);

        // Act
        var debts = await service.GetGroupDebtsAsync(groupId);

        // Assert
        var bobDebt = debts.First(d => d.UserId == bobId);
        Assert.Equal(160m, bobDebt.TotalOwed);
        Assert.Equal(0m, bobDebt.SettledAmount);
        Assert.Equal(160m, bobDebt.RemainingOwed);
    }

    [Fact]
    public async Task GetGroupDebtsAsync_WithSettlements_ReducesRemainingOwed()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new TransactionService(context);
        var (userId, groupId) = await SetupTestDataAsync(context);

        var bobId = Guid.NewGuid();
        var bobMember = new GroupMember { GroupId = groupId, UserId = bobId };
        context.GroupMembers.Add(bobMember);
        await context.SaveChangesAsync();

        var transDto = new CreateTransactionDto(
            groupId,
            100m,
            Currency.USD,
            TransactionCategory.Food,
            "Food",
            new List<TransactionMemberDto> { new(bobId, 100m) }
        );
        var trans = await service.CreateTransactionAsync(userId, transDto);

        // Add settlement for 60
        var settlement = new Settlement
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            PayerUserId = bobId,
            PayeeUserId = userId,
            Amount = 60m,
            Currency = Currency.USD
        };
        context.Settlements.Add(settlement);
        context.SettlementAllocations.Add(new SettlementAllocation
        {
            SettlementId = settlement.Id,
            TransactionId = trans.Id,
            DebtorUserId = bobId,
            AllocatedAmount = 60m
        });
        await context.SaveChangesAsync();

        // Act
        var debts = await service.GetGroupDebtsAsync(groupId);

        // Assert
        var bobDebt = debts.First(d => d.UserId == bobId);
        Assert.Equal(100m, bobDebt.TotalOwed);
        Assert.Equal(60m, bobDebt.SettledAmount);
        Assert.Equal(40m, bobDebt.RemainingOwed);
    }
}
