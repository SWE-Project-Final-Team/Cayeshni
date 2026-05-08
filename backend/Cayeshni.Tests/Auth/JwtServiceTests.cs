using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Cayeshni.Infrastructure.Persistence.Options;
using Cayeshni.Infrastructure.Services;
using Microsoft.AspNetCore.WebUtilities;
using Xunit;

namespace Cayeshni.Tests.Auth;

public class JwtServiceTests
{
    [Fact]
    public void GenerateAccessToken_CreatesJwt_WithExpectedClaimsAndSettings()
    {
        var options = new JwtOptions
        {
            Issuer = "issuer-test",
            Audience = "audience-test",
            Secret = "super-secret-key-super-secret-key",
            Expiry = TimeSpan.FromMinutes(30)
        };

        var service = new JwtService(options);
        var userId = Guid.NewGuid();
        var email = "user@example.com";
        var before = DateTime.UtcNow;

        var tokenString = service.GenerateAccessToken(userId, email);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(tokenString);

        Assert.Equal("issuer-test", token.Issuer);
        Assert.Equal("audience-test", token.Audiences.Single());
        Assert.Equal("HS256", token.Header.Alg);
        Assert.Equal(userId.ToString(), token.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.Equal(email, token.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.True(token.ValidTo >= before.AddMinutes(29));
        Assert.True(token.ValidTo <= before.AddMinutes(31));
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsUrlSafe64ByteValue()
    {
        var service = new JwtService(new JwtOptions
        {
            Issuer = "issuer-test",
            Audience = "audience-test",
            Secret = "super-secret-key-super-secret-key"
        });

        var refreshToken = service.GenerateRefreshToken();

        Assert.False(string.IsNullOrWhiteSpace(refreshToken));
        Assert.DoesNotContain("+", refreshToken);
        Assert.DoesNotContain("/", refreshToken);
        Assert.DoesNotContain("=", refreshToken);

        var bytes = WebEncoders.Base64UrlDecode(refreshToken);
        Assert.Equal(64, bytes.Length);
    }
}
