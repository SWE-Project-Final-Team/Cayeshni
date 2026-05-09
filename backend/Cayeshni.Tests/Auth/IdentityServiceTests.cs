using System;
using System.Threading.Tasks;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Infrastructure.Identity;
using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Infrastructure.Persistence.Options;
using Cayeshni.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

namespace Cayeshni.Tests.Auth;

public class IdentityServiceTests
{
    [Fact]
    public async Task RefreshToken_ValidJwtToken_ReturnsNewTokens()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var user = AuthTestHelpers.CreateUser("test@example.com");
        ctx.Users.Add(user);
        await ctx.SaveChangesAsync();

        var options = new JwtOptions
        {
            Issuer = "test",
            Audience = "test",
            Secret = "super-secret-key-super-secret-key-super-secret-key",
            Expiry = TimeSpan.FromMinutes(15),
            RefreshExpiry = TimeSpan.FromDays(7)
        };

        var svc = new IdentityService(AuthTestHelpers.CreateUserManager(ctx), new JwtService(options));

        var result = await svc.RegisterAsync(new RegisterDto("new@test.com", "New User", "Secret123!"));
        var refreshedTokens = await svc.RefreshTokenAsync(result.RefreshToken);

        Assert.NotNull(refreshedTokens.AccessToken);
        Assert.NotNull(refreshedTokens.RefreshToken);
        Assert.True(refreshedTokens.AccessToken != result.AccessToken);
    }

    [Fact]
    public async Task RefreshToken_InvalidJwtToken_ThrowsUnauthorized()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var user = AuthTestHelpers.CreateUser("test@example.com");
        ctx.Users.Add(user);
        await ctx.SaveChangesAsync();

        var options = new JwtOptions
        {
            Issuer = "test",
            Audience = "test",
            Secret = "super-secret-key-super-secret-key-super-secret-key",
            Expiry = TimeSpan.FromMinutes(15),
            RefreshExpiry = TimeSpan.FromDays(7)
        };

        var svc = new IdentityService(AuthTestHelpers.CreateUserManager(ctx), new JwtService(options));

        var ex = await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => svc.RefreshTokenAsync("invalid-jwt-token"));
        Assert.Contains("Invalid", ex.Message);
    }

    [Fact]
    public async Task RefreshToken_ExpiredJwtToken_ThrowsUnauthorized()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var options = new JwtOptions
        {
            Issuer = "test",
            Audience = "test",
            Secret = "super-secret-key-super-secret-key-super-secret-key",
            Expiry = TimeSpan.FromMinutes(15),
            RefreshExpiry = TimeSpan.FromSeconds(1)
        };

        var svc = new IdentityService(AuthTestHelpers.CreateUserManager(ctx), new JwtService(options));
        var tokens = await svc.RegisterAsync(new RegisterDto("x@test.com", "X", "Secret123!"));

        await Task.Delay(1200);

        var ex = await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => svc.RefreshTokenAsync(tokens.RefreshToken));
        Assert.Contains("Invalid", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}
