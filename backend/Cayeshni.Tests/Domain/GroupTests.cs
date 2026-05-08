using Cayeshni.Domain.Entities;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Tests.Domain.Entities;

public class GroupTests
{
    [Fact]
    public void Group_ShouldInitialize_WithDefaultValues()
    {
        // Arrange & Act
        var group = new Group();

        // Assert
        Assert.NotEqual(Guid.Empty, group.Id);
        Assert.NotNull(group.Name);
        Assert.Equal(Currency.USD, group.DefaultCurrency);
        Assert.NotNull(group.InviteToken);
        Assert.NotNull(group.Members);
        Assert.Empty(group.Members);
    }

    [Fact]
    public void Group_ShouldSetProperties_Correctly()
    {
        // Arrange
        var groupId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var groupName = "Trip to Egypt";

        // Act
        var group = new Group
        {
            Id = groupId,
            Name = groupName,
            CreatedById = userId,
            DefaultCurrency = Currency.EGP
        };

        // Assert
        Assert.Equal(groupId, group.Id);
        Assert.Equal(groupName, group.Name);
        Assert.Equal(userId, group.CreatedById);
        Assert.Equal(Currency.EGP, group.DefaultCurrency);
    }

    [Fact]
    public void Group_InviteToken_ShouldNotBeEmpty()
    {
        // Arrange & Act
        var group = new Group();

        // Assert
        Assert.False(string.IsNullOrEmpty(group.InviteToken));
        Assert.True(group.InviteToken.Length > 0);
    }
}
