using Cayeshni.Domain.Enums;

namespace Cayeshni.Tests.Domain.Enums;

public class CurrencyEnumTests
{
    [Fact]
    public void Currency_ShouldHaveExpectedValues()
    {
        // Arrange & Act & Assert
        Assert.Equal(0, (int)Currency.USD);
        Assert.Equal(1, (int)Currency.EUR);
        Assert.Equal(2, (int)Currency.GBP);
        Assert.Equal(3, (int)Currency.EGP);
    }

    [Theory]
    [InlineData(Currency.USD)]
    [InlineData(Currency.EUR)]
    [InlineData(Currency.GBP)]
    [InlineData(Currency.EGP)]
    public void Currency_AllValues_ShouldBeDefined(Currency currency)
    {
        // Arrange & Act & Assert - just verify the enum value exists
        Assert.True(Enum.IsDefined(typeof(Currency), currency));
    }
}
