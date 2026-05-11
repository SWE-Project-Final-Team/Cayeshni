using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Cayeshni.API.Infrastructure.Persistence.Options;
using Cayeshni.API.Infrastructure.Services;
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
        var before = DateTime.UtcNow;

    var tokenString = service.GenerateAccessToken(userId, emailConfirmed: true);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(tokenString);

        Assert.Equal("issuer-test", token.Issuer);
        Assert.Equal("audience-test", token.Audiences.Single());
        Assert.Equal("HS256", token.Header.Alg);
        Assert.Equal(userId.ToString(), token.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.Equal("true", token.Claims.Single(c => c.Type == "email_confirmed").Value);
        Assert.True(token.ValidTo >= before.AddMinutes(29));
        Assert.True(token.ValidTo <= before.AddMinutes(31));
    }

    [Fact]
    public void GenerateAccessToken_WhenEmailNotConfirmed_WritesFalseClaim()
    {
        var options = new JwtOptions
        {
            Issuer = "issuer-test",
            Audience = "audience-test",
            Secret = "super-secret-key-super-secret-key",
            Expiry = TimeSpan.FromMinutes(30)
        };

        var service = new JwtService(options);

        var tokenString = service.GenerateAccessToken(Guid.NewGuid(), emailConfirmed: false);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(tokenString);

        Assert.Equal("false", token.Claims.Single(c => c.Type == "email_confirmed").Value);
    }

    [Fact]
    public void GenerateRefreshToken_CreatesJwt_WithExpectedClaimsAndSettings()
    {
        var options = new JwtOptions
        {
            Issuer = "issuer-test",
            Audience = "audience-test",
            Secret = "super-secret-key-super-secret-key",
            RefreshExpiry = TimeSpan.FromDays(7)
        };

        var service = new JwtService(options);
        var userId = Guid.NewGuid();
        var before = DateTime.UtcNow;

        var tokenString = service.GenerateRefreshToken(userId);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(tokenString);

        Assert.Equal("issuer-test", token.Issuer);
        Assert.Equal("audience-test", token.Audiences.Single());
        Assert.Equal("HS256", token.Header.Alg);
        Assert.Equal(userId.ToString(), token.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.True(token.ValidTo >= before.AddDays(6).AddHours(23));
        Assert.True(token.ValidTo <= before.AddDays(7).AddHours(1));
    }
}

