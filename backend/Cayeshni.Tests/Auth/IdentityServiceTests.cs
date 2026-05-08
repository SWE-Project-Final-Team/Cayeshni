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
    private static IJwtService FakeJwt() => new FakeJwtService();

    [Fact]
    public async Task RefreshToken_Expired_ClearsTokenAndThrowsUnauthorized()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var user = AuthTestHelpers.CreateUser("expired-token", DateTime.UtcNow.AddDays(-1));
        ctx.Users.Add(user);
        await ctx.SaveChangesAsync();

        var svc = new IdentityService(AuthTestHelpers.CreateUserManager(ctx), FakeJwt(), new JwtOptions());

        var ex = await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => svc.RefreshTokenAsync(new RefreshTokenDto("expired-token")));
        Assert.Contains("expired", ex.Message, StringComparison.OrdinalIgnoreCase);

        // reload user from db and assert token cleared
        var refreshed = await ctx.Users.FirstAsync(u => u.Id == user.Id);
        Assert.Null(refreshed.RefreshToken);
        Assert.Null(refreshed.RefreshTokenExpiry);
    }

    [Fact]
    public async Task RefreshToken_Valid_RotatesTokenAndPersistsNewValues()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var oldExpiry = DateTime.UtcNow.AddDays(3);
        var user = AuthTestHelpers.CreateUser("valid-token", oldExpiry);
        ctx.Users.Add(user);
        await ctx.SaveChangesAsync();

        var svc = new IdentityService(AuthTestHelpers.CreateUserManager(ctx), FakeJwt(), new JwtOptions());

        var result = await svc.RefreshTokenAsync(new RefreshTokenDto("valid-token"));

        Assert.Equal("access", result.AccessToken);
        Assert.Equal("refresh", result.RefreshToken);

        var refreshed = await ctx.Users.FirstAsync(u => u.Id == user.Id);
        Assert.Equal("refresh", refreshed.RefreshToken);
        Assert.NotNull(refreshed.RefreshTokenExpiry);
        Assert.True(refreshed.RefreshTokenExpiry > DateTime.UtcNow);
        Assert.True(refreshed.RefreshTokenExpiry > oldExpiry.AddSeconds(-1));
    }

    [Fact]
    public async Task RefreshToken_InvalidToken_ThrowsUnauthorized()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        ctx.Users.Add(AuthTestHelpers.CreateUser("different-token", DateTime.UtcNow.AddDays(1)));
        await ctx.SaveChangesAsync();

        var svc = new IdentityService(AuthTestHelpers.CreateUserManager(ctx), FakeJwt(), new JwtOptions());

        var ex = await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => svc.RefreshTokenAsync(new RefreshTokenDto("missing-token")));
        Assert.Contains("Invalid refresh token", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private class FakeJwtService : IJwtService
    {
        public string GenerateAccessToken(Guid userId, string email) => "access";
        public string GenerateRefreshToken() => "refresh";
    }
}
