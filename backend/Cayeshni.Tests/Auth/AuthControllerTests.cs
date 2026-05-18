using System.Security.Claims;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Domain.Enums;
using Cayeshni.Infrastructure.Persistence.Options;
using Cayeshni.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cayeshni.Tests.Auth;

public class AuthControllerTests
{
    private class FakeIdentity : IIdentityService
    {
        public bool LogoutCalled;
        public RegisterDto? LastRegisterDto;
        public LoginDto? LastLoginDto;
        public string? LastRefreshToken;

        public Task<TokenPairDto> RegisterAsync(RegisterDto dto)
        {
            LastRegisterDto = dto;
            return Task.FromResult(new TokenPairDto(CreateAccessToken(emailConfirmed: false), "refresh_token"));
        }

        public Task<TokenPairDto> LoginAsync(LoginDto dto)
        {
            LastLoginDto = dto;
            return Task.FromResult(new TokenPairDto(CreateAccessToken(emailConfirmed: true), "refresh_token"));
        }

        public Task<TokenPairDto> RefreshTokenAsync(string refreshToken)
        {
            LastRefreshToken = refreshToken;
            return Task.FromResult(new TokenPairDto(CreateAccessToken(emailConfirmed: true), "new_refresh_token"));
        }

        public Task LogoutAsync()
        {
            LogoutCalled = true;
            return Task.CompletedTask;
        }

        public Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) => Task.CompletedTask;
        public Task ForgotPasswordAsync(string email) => Task.CompletedTask;
        public Task ResetPasswordAsync(ResetPasswordDto dto) => Task.CompletedTask;
        public Task ConfirmEmailAsync(ConfirmEmailDto dto) => Task.CompletedTask;
        public Task ResendConfirmationAsync(string email) => Task.CompletedTask;

        private static string CreateAccessToken(bool emailConfirmed)
        {
            var jwt = new JwtService(new JwtOptions
            {
                Issuer = "test-issuer",
                Audience = "test-audience",
                Secret = "super-secret-key-super-secret-key-super-secret-key",
                Expiry = TimeSpan.FromMinutes(15),
                RefreshExpiry = TimeSpan.FromDays(7)
            });

            return jwt.GenerateAccessToken(Guid.NewGuid(), emailConfirmed);
        }
    }

    [Fact]
    public void Logout_ReturnsNoContent_WhenAuthorized()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        var result = controller.Logout();

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task RefreshToken_ReturnsOk_WhenIdentityReturnsToken()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        controller.Request.Headers["Cookie"] = "refreshToken=rtok";
        var result = await controller.Refresh();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.NotNull(value.AccessToken);
    }

    [Fact]
    public async Task RefreshToken_PropagatesException_WhenIdentityThrows()
    {
        var throwing = new ThrowingIdentity();
        var controller = AuthTestHelpers.CreateController(throwing);

        controller.Request.Headers["Cookie"] = "refreshToken=bad";
        await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => controller.Refresh());
    }

    [Fact]
    public async Task Register_ReturnsOk_WithCreatedUser()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        var dto = new RegisterDto("new@test.com", "  New Name  ", "Secret123!", Currency.USD);
        var result = await controller.Register(dto);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.NotNull(value.AccessToken);
        Assert.Equal("New Name", fakeId.LastRegisterDto!.Name);
    }

    [Fact]
    public async Task Login_ReturnsOk_WithAuthenticatedUser()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        var dto = new LoginDto("login@test.com", "Secret123!");
        var result = await controller.Login(dto);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.NotNull(value.AccessToken);
        Assert.Equal(dto.Email, fakeId.LastLoginDto!.Email);
    }

    [Fact]
    public async Task Register_PropagatesException_WhenIdentityThrows()
    {
        var controller = AuthTestHelpers.CreateController(new ThrowingRegisterIdentity());

        await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => controller.Register(new RegisterDto("u@test.com", "Bob", "bad", Currency.USD)));
    }

    [Fact]
    public async Task Login_PropagatesException_WhenIdentityThrows()
    {
        var controller = AuthTestHelpers.CreateController(new ThrowingLoginIdentity());

        await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => controller.Login(new LoginDto("u@test.com", "bad")));
    }

    private class ThrowingIdentity : IIdentityService
    {
        public Task<TokenPairDto> RegisterAsync(RegisterDto dto) => throw new NotImplementedException();
        public Task<TokenPairDto> LoginAsync(LoginDto dto) => throw new NotImplementedException();
        public Task<TokenPairDto> RefreshTokenAsync(string refreshToken) => throw new Cayeshni.Application.Common.Exceptions.UnauthorizedException();
        public Task LogoutAsync() => Task.CompletedTask;
        public Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) => Task.CompletedTask;
        public Task ForgotPasswordAsync(string email) => Task.CompletedTask;
        public Task ResetPasswordAsync(ResetPasswordDto dto) => Task.CompletedTask;
        public Task ConfirmEmailAsync(ConfirmEmailDto dto) => Task.CompletedTask;
        public Task ResendConfirmationAsync(string email) => Task.CompletedTask;
    }

    private class ThrowingRegisterIdentity : IIdentityService
    {
        public Task<TokenPairDto> RegisterAsync(RegisterDto dto) => throw new Cayeshni.Application.Common.Exceptions.UnauthorizedException();
        public Task<TokenPairDto> LoginAsync(LoginDto dto) => throw new NotImplementedException();
        public Task<TokenPairDto> RefreshTokenAsync(string refreshToken) => throw new NotImplementedException();
        public Task LogoutAsync() => Task.CompletedTask;
        public Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) => Task.CompletedTask;
        public Task ForgotPasswordAsync(string email) => Task.CompletedTask;
        public Task ResetPasswordAsync(ResetPasswordDto dto) => Task.CompletedTask;
        public Task ConfirmEmailAsync(ConfirmEmailDto dto) => Task.CompletedTask;
        public Task ResendConfirmationAsync(string email) => Task.CompletedTask;
    }

    private class ThrowingLoginIdentity : Cayeshni.Application.Common.Interfaces.IIdentityService
    {
        public Task<TokenPairDto> RegisterAsync(RegisterDto dto) => throw new NotImplementedException();
        public Task<TokenPairDto> LoginAsync(LoginDto dto) => throw new Cayeshni.Application.Common.Exceptions.UnauthorizedException();
        public Task<TokenPairDto> RefreshTokenAsync(string refreshToken) => throw new NotImplementedException();
        public Task LogoutAsync() => Task.CompletedTask;
        public Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) => Task.CompletedTask;
        public Task ForgotPasswordAsync(string email) => Task.CompletedTask;
        public Task ResetPasswordAsync(ResetPasswordDto dto) => Task.CompletedTask;
        public Task ConfirmEmailAsync(ConfirmEmailDto dto) => Task.CompletedTask;
        public Task ResendConfirmationAsync(string email) => Task.CompletedTask;
    }
}


