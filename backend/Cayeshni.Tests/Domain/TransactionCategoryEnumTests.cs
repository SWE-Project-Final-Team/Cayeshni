using Cayeshni.Domain.Enums;

namespace Cayeshni.Tests.Domain.Enums;

public class TransactionCategoryEnumTests
{
    [Fact]
    public void TransactionCategory_ShouldHaveExpectedValues()
    {
        // Arrange & Act & Assert
        Assert.True(Enum.IsDefined(typeof(TransactionCategory), TransactionCategory.Food));
        Assert.True(Enum.IsDefined(typeof(TransactionCategory), TransactionCategory.Entertainment));
        Assert.True(Enum.IsDefined(typeof(TransactionCategory), TransactionCategory.Accommodation));
        Assert.True(Enum.IsDefined(typeof(TransactionCategory), TransactionCategory.Other));
    }

    [Theory]
    [InlineData(TransactionCategory.Food)]
    [InlineData(TransactionCategory.Entertainment)]
    [InlineData(TransactionCategory.Accommodation)]
    [InlineData(TransactionCategory.Other)]
    public void TransactionCategory_AllValues_ShouldBeDefined(TransactionCategory category)
    {
        // Arrange & Act & Assert - just verify the enum value exists
        Assert.True(Enum.IsDefined(typeof(TransactionCategory), category));
    }
}
