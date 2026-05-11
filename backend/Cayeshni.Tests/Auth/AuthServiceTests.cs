using System;
using System.Threading.Tasks;
using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Domain.Enums;
using Xunit;

namespace Cayeshni.Tests.Auth;

public class AuthServiceTests
{
    private class FakeIdentity : IIdentityService
    {
        public RegisterDto? LastRegisterDto;

        public Task<TokenPairDto> RegisterAsync(RegisterDto dto)
        {
            LastRegisterDto = dto;
            return Task.FromResult(new TokenPairDto("at", "rt"));
        }

        public Task<TokenPairDto> LoginAsync(LoginDto dto)
        {
            return Task.FromResult(new TokenPairDto("at", "rt"));
        }

        public Task<TokenPairDto> RefreshTokenAsync(string refreshToken)
        {
            return Task.FromResult(new TokenPairDto("at", "new_rt"));
        }

        public Task LogoutAsync() => Task.CompletedTask;
        public Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) => Task.CompletedTask;
        public Task ForgotPasswordAsync(string email) => Task.CompletedTask;
        public Task ResetPasswordAsync(ResetPasswordDto dto) => Task.CompletedTask;
        public Task ConfirmEmailAsync(ConfirmEmailDto dto) => Task.CompletedTask;
        public Task ResendConfirmationAsync(string email) => Task.CompletedTask;
    }

    [Fact]
    public async Task Register_TrimsName_And_CallsIdentity()
    {
        var fake = new FakeIdentity();
        var svc = new AuthService(fake);

        var dto = new RegisterDto("u@ex.com", "  Bob  ", "secret", Currency.USD);
        var res = await svc.RegisterAsync(dto);

        Assert.NotNull(fake.LastRegisterDto);
        Assert.Equal("Bob", fake.LastRegisterDto!.Name);
        Assert.Equal(dto.Email, fake.LastRegisterDto.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("ab")]
    public async Task Register_InvalidName_Throws(string name)
    {
        var fake = new FakeIdentity();
        var svc = new AuthService(fake);

        var dto = new RegisterDto("u@ex.com", name, "p", Currency.USD);
        await Assert.ThrowsAsync<ValidationException>(() => svc.RegisterAsync(dto));
    }

    [Fact]
    public async Task Login_ForwardsToIdentity()
    {
        var fake = new FakeIdentity();
        var svc = new AuthService(fake);

        var dto = new LoginDto("x@y.com", "p");
        var res = await svc.LoginAsync(dto);

        Assert.Equal("at", res.AccessToken);
    }

    [Fact]
    public async Task Login_WhenIdentityThrows_PropagatesException()
    {
        var identity = new ThrowingLoginIdentity();
        var svc = new AuthService(identity);

        await Assert.ThrowsAsync<UnauthorizedException>(() => svc.LoginAsync(new LoginDto("x@y.com", "bad")));
    }

    [Fact]
    public async Task Register_WhenIdentityThrows_PropagatesException()
    {
        var identity = new ThrowingRegisterIdentity();
        var svc = new AuthService(identity);

        await Assert.ThrowsAsync<UnauthorizedException>(() => svc.RegisterAsync(new RegisterDto("u@ex.com", "Bob", "bad", Currency.USD)));
    }

    [Fact]
    public async Task RefreshToken_ForwardsToIdentity()
    {
        var fake = new FakeIdentity();
        var svc = new AuthService(fake);

        var res = await svc.RefreshTokenAsync("rtoken");

        Assert.Equal("at", res.AccessToken);
        Assert.Equal("new_rt", res.RefreshToken);
    }

    [Fact]
    public async Task RefreshToken_WhenIdentityThrows_PropagatesException()
    {
        var identity = new ThrowingIdentity();
        var svc = new AuthService(identity);

        await Assert.ThrowsAsync<UnauthorizedException>(() => svc.RefreshTokenAsync("bad"));
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

    private class ThrowingLoginIdentity : IIdentityService
    {
        public Task<TokenPairDto> RegisterAsync(RegisterDto dto) => throw new NotImplementedException();
        public Task<TokenPairDto> LoginAsync(LoginDto dto) => throw new UnauthorizedException();
        public Task<TokenPairDto> RefreshTokenAsync(string refreshToken) => throw new NotImplementedException();
        public Task LogoutAsync() => Task.CompletedTask;
        public Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) => Task.CompletedTask;
        public Task ForgotPasswordAsync(string email) => Task.CompletedTask;
        public Task ResetPasswordAsync(ResetPasswordDto dto) => Task.CompletedTask;
        public Task ConfirmEmailAsync(ConfirmEmailDto dto) => Task.CompletedTask;
        public Task ResendConfirmationAsync(string email) => Task.CompletedTask;
    }

    private class ThrowingRegisterIdentity : IIdentityService
    {
        public Task<TokenPairDto> RegisterAsync(RegisterDto dto) => throw new UnauthorizedException();
        public Task<TokenPairDto> LoginAsync(LoginDto dto) => throw new NotImplementedException();
        public Task<TokenPairDto> RefreshTokenAsync(string refreshToken) => throw new NotImplementedException();
        public Task LogoutAsync() => Task.CompletedTask;
        public Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) => Task.CompletedTask;
        public Task ForgotPasswordAsync(string email) => Task.CompletedTask;
        public Task ResetPasswordAsync(ResetPasswordDto dto) => Task.CompletedTask;
        public Task ConfirmEmailAsync(ConfirmEmailDto dto) => Task.CompletedTask;
        public Task ResendConfirmationAsync(string email) => Task.CompletedTask;
    }
}
