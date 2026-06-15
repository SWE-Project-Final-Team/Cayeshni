using Cayeshni.Domain.Utilities;

namespace Cayeshni.Tests.Domain.Utilities;

public class InviteTokenGeneratorTests
{
    [Fact]
    public void GenerateToken_ShouldReturnNonEmptyString()
    {
        // Arrange
        var groupId = Guid.NewGuid();

        // Act
        var token = InviteTokenGenerator.GenerateToken(groupId);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void GenerateToken_ShouldAlwaysReturn8Characters()
    {
        // Arrange
        var groupIds = new[]
        {
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.Parse("550e8400-e29b-41d4-a716-446655440000"),
            Guid.Empty
        };

        // Act & Assert
        foreach (var groupId in groupIds)
        {
            var token = InviteTokenGenerator.GenerateToken(groupId);
            Assert.Equal(8, token.Length);
        }
    }

    [Fact]
    public void GenerateToken_ShouldBeDeterministic()
    {
        // Arrange
        var groupId = Guid.NewGuid();

        // Act
        var token1 = InviteTokenGenerator.GenerateToken(groupId);
        var token2 = InviteTokenGenerator.GenerateToken(groupId);
        var token3 = InviteTokenGenerator.GenerateToken(groupId);

        // Assert - Same group ID should always produce the same token
        Assert.Equal(token1, token2);
        Assert.Equal(token2, token3);
    }

    [Fact]
    public void GenerateToken_DifferentGroupIds_ShouldProduceDifferentTokens()
    {
        // Arrange
        var groupId1 = Guid.NewGuid();
        var groupId2 = Guid.NewGuid();
        var groupId3 = Guid.NewGuid();

        // Act
        var token1 = InviteTokenGenerator.GenerateToken(groupId1);
        var token2 = InviteTokenGenerator.GenerateToken(groupId2);
        var token3 = InviteTokenGenerator.GenerateToken(groupId3);

        // Assert
        Assert.NotEqual(token1, token2);
        Assert.NotEqual(token2, token3);
        Assert.NotEqual(token1, token3);
    }

    [Fact]
    public void GenerateToken_ShouldOnlyContainValidBase58Characters()
    {
        // Arrange
        const string validBase58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
        var groupIds = new[]
        {
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.Empty,
            Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff")
        };

        // Act & Assert
        foreach (var groupId in groupIds)
        {
            var token = InviteTokenGenerator.GenerateToken(groupId);
            foreach (var character in token)
            {
                Assert.Contains(character, validBase58Chars);
            }
        }
    }

    [Fact]
    public void GenerateToken_ShouldNotContainConfusingCharacters()
    {
        // Base58 excludes: 0 (zero), O (capital o), I (capital i), l (lowercase L)
        var groupIds = Enumerable.Range(0, 100)
            .Select(_ => Guid.NewGuid())
            .ToList();

        var confusingChars = new[] { '0', 'O', 'I', 'l' };

        // Act & Assert
        foreach (var groupId in groupIds)
        {
            var token = InviteTokenGenerator.GenerateToken(groupId);
            foreach (var confusingChar in confusingChars)
            {
                Assert.DoesNotContain(confusingChar, token);
            }
        }
    }

    [Fact]
    public void GenerateToken_WithEmptyGuid_ShouldStillProduceValidToken()
    {
        // Arrange
        var emptyGuid = Guid.Empty;

        // Act
        var token = InviteTokenGenerator.GenerateToken(emptyGuid);

        // Assert
        Assert.NotNull(token);
        Assert.Equal(8, token.Length);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void GenerateToken_WithMaxGuid_ShouldStillProduceValidToken()
    {
        // Arrange - All F's in hex representation
        var maxGuid = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        // Act
        var token = InviteTokenGenerator.GenerateToken(maxGuid);

        // Assert
        Assert.NotNull(token);
        Assert.Equal(8, token.Length);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void GenerateToken_TokensAreUrlSafe()
    {
        // Base58 alphabet only uses alphanumeric characters (no special chars)
        // This test ensures tokens can be safely used in URLs
        var groupIds = Enumerable.Range(0, 50)
            .Select(_ => Guid.NewGuid())
            .ToList();

        var unsafeUrlChars = new[] { '/', '\\', '?', '#', '&', '%', '+', ' ' };

        // Act & Assert
        foreach (var groupId in groupIds)
        {
            var token = InviteTokenGenerator.GenerateToken(groupId);
            foreach (var unsafeChar in unsafeUrlChars)
            {
                Assert.DoesNotContain(unsafeChar, token);
            }
        }
    }

    [Fact]
    public void GenerateToken_MultipleDistinctTokens_ShouldBeUnique()
    {
        // Arrange
        const int numberOfGroups = 1000;
        var groupIds = Enumerable.Range(0, numberOfGroups)
            .Select(_ => Guid.NewGuid())
            .ToList();

        // Act
        var tokens = groupIds
            .Select(id => InviteTokenGenerator.GenerateToken(id))
            .ToList();

        // Assert - All tokens should be unique (collision unlikely with 8 chars of base58)
        var uniqueTokens = tokens.Distinct().Count();
        Assert.Equal(numberOfGroups, uniqueTokens);
    }

    [Theory]
    [InlineData("550e8400-e29b-41d4-a716-446655440000")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    [InlineData("ffffffff-ffff-ffff-ffff-ffffffffffff")]
    [InlineData("12345678-1234-5678-1234-567812345678")]
    public void GenerateToken_KnownGuids_ShouldBeConsistent(string guidString)
    {
        // Arrange
        var guid = Guid.Parse(guidString);

        // Act
        var token1 = InviteTokenGenerator.GenerateToken(guid);
        var token2 = InviteTokenGenerator.GenerateToken(guid);

        // Assert
        Assert.Equal(token1, token2);
        Assert.Equal(8, token1.Length);
        Assert.NotEmpty(token1);
    }
}
