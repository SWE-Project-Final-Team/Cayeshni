using Cayeshni.Domain.Entities;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Tests.Domain.Entities;

public class TransactionTests
{
    [Fact]
    public void Transaction_ShouldInitialize_WithDefaultValues()
    {
        // Arrange & Act
        var transaction = new Transaction();

        // Assert (ID may be assigned by persistence layer; don't require non-empty here)
        Assert.Equal(Guid.Empty, transaction.GroupId); // GroupId doesn't auto-initialize
        Assert.Equal(Guid.Empty, transaction.PaidByUserId); // PaidByUserId not set until assigned
        Assert.Equal(TransactionCategory.Other, transaction.Category);
        Assert.NotNull(transaction.TransactionMembers);
        Assert.Empty(transaction.TransactionMembers);
    }

    [Fact]
    public void Transaction_ShouldSetProperties_Correctly()
    {
        // Arrange
        var groupId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        const decimal amount = 1000;
        const string description = "Dinner";

        // Act
        var transaction = new Transaction
        {
            GroupId = groupId,
            PaidByUserId = userId,
            TotalAmount = amount,
            Currency = Currency.USD,
            Category = TransactionCategory.Food,
            Description = description
        };

        // Assert
        Assert.Equal(groupId, transaction.GroupId);
        Assert.Equal(userId, transaction.PaidByUserId);
        Assert.Equal(amount, transaction.TotalAmount);
        Assert.Equal(Currency.USD, transaction.Currency);
        Assert.Equal(TransactionCategory.Food, transaction.Category);
        Assert.Equal(description, transaction.Description);
    }

    [Fact]
    public void Transaction_CanAddMembers()
    {
        // Arrange
        var transaction = new Transaction();
        var member = new TransactionMember
        {
            TransactionId = transaction.Id,
            UserId = Guid.NewGuid(),
            AmountOwed = 500
        };

        // Act
        transaction.TransactionMembers.Add(member);

        // Assert
        Assert.Single(transaction.TransactionMembers);
        Assert.Contains(member, transaction.TransactionMembers);
    }
}


