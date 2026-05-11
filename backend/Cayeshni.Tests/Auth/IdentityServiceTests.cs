using System;
using System.Linq;
using System.Threading.Tasks;
using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Application.Features.Auth;
using Cayeshni.API.Domain.Enums;
using Cayeshni.API.Infrastructure.Persistence.Options;
using Microsoft.AspNetCore.Identity;
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

        var svc = AuthTestHelpers.CreateIdentityService(ctx, requireEmailConfirmation: false);

        var result = await svc.RegisterAsync(new RegisterDto("new@test.com", "New User", "Secret123!", Currency.USD));
        var refreshedTokens = await svc.RefreshTokenAsync(result.RefreshToken);

        Assert.NotNull(refreshedTokens.AccessToken);
        Assert.NotNull(refreshedTokens.RefreshToken);
        Assert.NotEqual(result.AccessToken, refreshedTokens.AccessToken);
    }

    [Fact]
    public async Task RefreshToken_InvalidJwtToken_ThrowsUnauthorized()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var svc = AuthTestHelpers.CreateIdentityService(ctx);

        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() => svc.RefreshTokenAsync("invalid-jwt-token"));
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

        var svc = AuthTestHelpers.CreateIdentityService(ctx, jwtOptions: options);
        var tokens = await svc.RegisterAsync(new RegisterDto("x@test.com", "X", "Secret123!", Currency.USD));

        await Task.Delay(1200);

        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() => svc.RefreshTokenAsync(tokens.RefreshToken));
        Assert.Contains("Invalid", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Register_WhenConfirmationDisabled_ConfirmsUser_AndSkipsEmail()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var email = new AuthTestHelpers.RecordingEmailService();
        var svc = AuthTestHelpers.CreateIdentityService(ctx, requireEmailConfirmation: false, emailService: email);

        await svc.RegisterAsync(new RegisterDto("new@test.com", "New User", "Secret123!", Currency.USD));

        Assert.Equal(0, email.SendCount);
        Assert.True(ctx.Users.First().EmailConfirmed);
    }

    [Fact]
    public async Task Register_WhenConfirmationEnabled_SendsEmail_AndLeavesUserUnconfirmed()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var email = new AuthTestHelpers.RecordingEmailService();
        var svc = AuthTestHelpers.CreateIdentityService(ctx, requireEmailConfirmation: true, emailService: email);

        await svc.RegisterAsync(new RegisterDto("new@test.com", "New User", "Secret123!", Currency.USD));

        Assert.False(ctx.Users.First().EmailConfirmed);
    }

    [Fact]
    public async Task Login_WhenConfirmationDisabled_AllowsUnconfirmedUser()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var user = AuthTestHelpers.CreateUser("login@test.com");
        user.EmailConfirmed = false;
        var manager = AuthTestHelpers.CreateUserManager(ctx);
        var result = await manager.CreateAsync(user, "Secret123!");
        Assert.True(result.Succeeded);

        var svc = AuthTestHelpers.CreateIdentityService(ctx, requireEmailConfirmation: false);
        var tokens = await svc.LoginAsync(new LoginDto("login@test.com", "Secret123!"));

        Assert.NotNull(tokens.AccessToken);
        Assert.NotNull(tokens.RefreshToken);
    }

    [Fact]
    public async Task Login_WhenConfirmationEnabled_UnconfirmedUser_ThrowsUnauthorized()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var user = AuthTestHelpers.CreateUser("login@test.com");
        user.EmailConfirmed = false;
        var manager = AuthTestHelpers.CreateUserManager(ctx);
        var result = await manager.CreateAsync(user, "Secret123!");
        Assert.True(result.Succeeded);

        var svc = AuthTestHelpers.CreateIdentityService(ctx, requireEmailConfirmation: true);

        await Assert.ThrowsAsync<UnauthorizedException>(() => svc.LoginAsync(new LoginDto("login@test.com", "Secret123!")));
    }

    [Fact]
    public async Task ForgotPassword_WhenConfirmationDisabled_ReturnsValidationError()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var svc = AuthTestHelpers.CreateIdentityService(ctx, requireEmailConfirmation: false);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => svc.ForgotPasswordAsync("x@test.com"));
        Assert.Contains("Not enabled", ex.Message);
    }

    [Fact]
    public async Task ResendConfirmation_WhenConfirmationDisabled_ReturnsValidationError()
    {
        await using var ctx = AuthTestHelpers.CreateContext();
        var svc = AuthTestHelpers.CreateIdentityService(ctx, requireEmailConfirmation: false);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => svc.ResendConfirmationAsync(Guid.NewGuid()));
        Assert.Contains("Not enabled", ex.Message);
    }
}

