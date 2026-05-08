using System;
using System.Threading.Tasks;
using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Xunit;

namespace Cayeshni.Tests.Auth;

public class AuthServiceTests
{
    private class FakeIdentity : IIdentityService
    {
        public RegisterDto? LastRegisterDto;

        public Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            LastRegisterDto = dto;
            return Task.FromResult(new AuthResponseDto("at", "rt", Guid.NewGuid(), dto.Email, dto.Name));
        }

        public Task<AuthResponseDto> LoginAsync(LoginDto dto)
            => Task.FromResult(new AuthResponseDto("at", "rt", Guid.NewGuid(), dto.Email, "name"));

        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto)
            => Task.FromResult(new AuthResponseDto("at", "rt", Guid.NewGuid(), "e", "n"));

        public Task LogoutAsync(Guid userId) => Task.CompletedTask;
    }

    [Fact]
    public async Task Register_TrimsName_And_CallsIdentity()
    {
        var fake = new FakeIdentity();
        var svc = new AuthService(fake);

        var dto = new RegisterDto("u@ex.com", "  Bob  ", "secret");
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

        var dto = new RegisterDto("u@ex.com", name, "p");
        await Assert.ThrowsAsync<ValidationException>(() => svc.RegisterAsync(dto));
    }

    [Fact]
    public async Task Login_ForwardsToIdentity()
    {
        var fake = new FakeIdentity();
        var svc = new AuthService(fake);

        var dto = new LoginDto("x@y.com", "p");
        var res = await svc.LoginAsync(dto);

        Assert.Equal(dto.Email, res.Email);
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

        await Assert.ThrowsAsync<UnauthorizedException>(() => svc.RegisterAsync(new RegisterDto("u@ex.com", "Bob", "bad")));
    }

    [Fact]
    public async Task RefreshToken_ForwardsToIdentity()
    {
        var fake = new FakeIdentity();
        var svc = new AuthService(fake);

        var dto = new RefreshTokenDto("rtoken");
        var res = await svc.RefreshTokenAsync(dto);

        Assert.Equal("at", res.AccessToken);
    }

    [Fact]
    public async Task RefreshToken_WhenIdentityThrows_PropagatesException()
    {
        var identity = new ThrowingIdentity();
        var svc = new AuthService(identity);

        await Assert.ThrowsAsync<UnauthorizedException>(() => svc.RefreshTokenAsync(new RefreshTokenDto("bad")));
    }

    private class ThrowingIdentity : IIdentityService
    {
        public Task<AuthResponseDto> RegisterAsync(RegisterDto dto) => throw new NotImplementedException();
        public Task<AuthResponseDto> LoginAsync(LoginDto dto) => throw new NotImplementedException();
        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto) => throw new Cayeshni.Application.Common.Exceptions.UnauthorizedException();
        public Task LogoutAsync(Guid userId) => Task.CompletedTask;
    }

    private class ThrowingLoginIdentity : IIdentityService
    {
        public Task<AuthResponseDto> RegisterAsync(RegisterDto dto) => throw new NotImplementedException();
        public Task<AuthResponseDto> LoginAsync(LoginDto dto) => throw new UnauthorizedException();
        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto) => throw new NotImplementedException();
        public Task LogoutAsync(Guid userId) => Task.CompletedTask;
    }

    private class ThrowingRegisterIdentity : IIdentityService
    {
        public Task<AuthResponseDto> RegisterAsync(RegisterDto dto) => throw new UnauthorizedException();
        public Task<AuthResponseDto> LoginAsync(LoginDto dto) => throw new NotImplementedException();
        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto) => throw new NotImplementedException();
        public Task LogoutAsync(Guid userId) => Task.CompletedTask;
    }
}
