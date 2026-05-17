using Cayeshni.Application.Features.Dashboard;
using Cayeshni.Domain.Entities;
using Cayeshni.Domain.Enums;
using Cayeshni.Infrastructure.Identity;
using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Tests.TestDoubles;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Dashboard;

public class DashboardServiceBalanceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static void SeedUser(AppDbContext ctx, Guid id, string email, string name)
    {
        ctx.Users.Add(new AppUser
        {
            Id = id,
            UserName = email,
            NormalizedUserName = email.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            Name = name,
            SecurityStamp = Guid.NewGuid().ToString(),
            EmailConfirmed = true,
        });
    }

    [Fact]
    public async Task GetGroupBalancesAsync_AfterFullSettlement_DebtorOwesZero()
    {
        var ctx = NewDb();
        var aliceId = Guid.NewGuid();
        var bobId = Guid.NewGuid();
        SeedUser(ctx, aliceId, "alice@test.com", "Alice");
        SeedUser(ctx, bobId, "bob@test.com", "Bob");

        var groupId = Guid.NewGuid();
        var group = new Group
        {
            Id = groupId,
            Name = "Trip",
            CreatedById = aliceId,
            DefaultCurrency = Currency.USD,
            InviteToken = "testinvitetoken123",
        };
        group.Members.Add(new GroupMember { GroupId = groupId, UserId = aliceId });
        group.Members.Add(new GroupMember { GroupId = groupId, UserId = bobId });
        ctx.Groups.Add(group);

        var txId = Guid.NewGuid();
        var tx = new Transaction
        {
            Id = txId,
            GroupId = groupId,
            PaidByUserId = aliceId,
            TotalAmount = 100m,
            Currency = Currency.USD,
            Category = TransactionCategory.Food,
        };
        tx.TransactionMembers.Add(new TransactionMember
        {
            TransactionId = txId,
            UserId = bobId,
            AmountOwed = 100m,
        });
        ctx.Transactions.Add(tx);

        ctx.Settlements.Add(new Settlement
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            PayerUserId = bobId,
            PayeeUserId = aliceId,
            Amount = 100m,
            Currency = Currency.USD,
        });

        await ctx.SaveChangesAsync();

        var sut = new DashboardService(new FakeDashboardRepository(ctx));

        var bobRow = (await sut.GetGroupBalancesAsync(bobId)).Single();
        Assert.Equal(0m, bobRow.YouOwe);
        Assert.Equal(0m, bobRow.YouAreOwed);

        var aliceRow = (await sut.GetGroupBalancesAsync(aliceId)).Single();
        Assert.Equal(0m, aliceRow.YouOwe);
        Assert.Equal(0m, aliceRow.YouAreOwed);
    }
}

