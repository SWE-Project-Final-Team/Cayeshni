using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Cayeshni.API.Controller;
using Cayeshni.Application.Features.Auth;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Cayeshni.Tests.Auth;

public class AuthControllerTests
{
    private class FakeIdentity : Cayeshni.Application.Common.Interfaces.IIdentityService
    {
        public bool LogoutCalled;
        public RegisterDto? LastRegisterDto;
        public LoginDto? LastLoginDto;
        public RefreshTokenDto? LastRefreshTokenDto;

        public Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            LastRegisterDto = dto;
            return Task.FromResult(new AuthResponseDto("a", "b", Guid.NewGuid(), dto.Email, dto.Name));
        }

        public Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            LastLoginDto = dto;
            return Task.FromResult(new AuthResponseDto("a", "b", Guid.NewGuid(), dto.Email, "n"));
        }

        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto)
        {
            LastRefreshTokenDto = dto;
            return Task.FromResult(new AuthResponseDto("a", "b", Guid.NewGuid(), "e", "n"));
        }

        public Task LogoutAsync(Guid userId)
        {
            LogoutCalled = true;
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task Logout_ReturnsUnauthorized_WhenNoUserClaim()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        controller.ControllerContext = AuthTestHelpers.CreateControllerContext();

        var result = await controller.Logout();

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task Logout_CallsServiceAndReturnsNoContent_WhenUserClaimPresent()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        var id = Guid.NewGuid();
        controller.ControllerContext = AuthTestHelpers.CreateControllerContext(AuthTestHelpers.PrincipalWithClaim(ClaimTypes.NameIdentifier, id.ToString()));

        var result = await controller.Logout();

        Assert.IsType<NoContentResult>(result);
        Assert.True(fakeId.LogoutCalled);
    }

    [Fact]
    public async Task RefreshToken_ReturnsOk_WhenIdentityReturnsToken()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        var dto = new RefreshTokenDto("rtok");
        var result = await controller.RefreshToken(dto);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.Equal("a", value.AccessToken);
        Assert.Equal("rtok", fakeId.LastRefreshTokenDto!.RefreshToken);
    }

    [Fact]
    public async Task RefreshToken_PropagatesException_WhenIdentityThrows()
    {
        var throwing = new ThrowingIdentity();
        var controller = new AuthController(new Cayeshni.Application.Features.Auth.AuthService(throwing));

        await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => controller.RefreshToken(new RefreshTokenDto("bad")));
    }

    [Fact]
    public async Task Register_ReturnsOk_WithCreatedUser()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        var dto = new RegisterDto("new@test.com", "  New Name  ", "Secret123!");
        var result = await controller.Register(dto);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var value = Assert.IsType<AuthResponseDto>(ok.Value);
        Assert.Equal(dto.Email, value.Email);
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
        Assert.Equal(dto.Email, value.Email);
        Assert.Equal(dto.Email, fakeId.LastLoginDto!.Email);
    }

    [Fact]
    public async Task Register_PropagatesException_WhenIdentityThrows()
    {
        var controller = new AuthController(new Cayeshni.Application.Features.Auth.AuthService(new ThrowingRegisterIdentity()));

        await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => controller.Register(new RegisterDto("u@test.com", "Bob", "bad")));
    }

    [Fact]
    public async Task Login_PropagatesException_WhenIdentityThrows()
    {
        var controller = new AuthController(new Cayeshni.Application.Features.Auth.AuthService(new ThrowingLoginIdentity()));

        await Assert.ThrowsAsync<Cayeshni.Application.Common.Exceptions.UnauthorizedException>(() => controller.Login(new LoginDto("u@test.com", "bad")));
    }

    [Fact]
    public async Task Logout_ThrowsFormatException_WhenClaimValueIsNotGuid()
    {
        var fakeId = new FakeIdentity();
        var controller = AuthTestHelpers.CreateController(fakeId);

        controller.ControllerContext = AuthTestHelpers.CreateControllerContext(
            AuthTestHelpers.PrincipalWithClaim(ClaimTypes.NameIdentifier, "not-a-guid"));

        await Assert.ThrowsAsync<FormatException>(() => controller.Logout());
    }

    private class ThrowingIdentity : Cayeshni.Application.Common.Interfaces.IIdentityService
    {
        public Task<AuthResponseDto> RegisterAsync(RegisterDto dto) => throw new NotImplementedException();
        public Task<AuthResponseDto> LoginAsync(LoginDto dto) => throw new NotImplementedException();
        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto) => throw new Cayeshni.Application.Common.Exceptions.UnauthorizedException();
        public Task LogoutAsync(Guid userId) => Task.CompletedTask;
    }

    private class ThrowingRegisterIdentity : Cayeshni.Application.Common.Interfaces.IIdentityService
    {
        public Task<AuthResponseDto> RegisterAsync(RegisterDto dto) => throw new Cayeshni.Application.Common.Exceptions.UnauthorizedException();
        public Task<AuthResponseDto> LoginAsync(LoginDto dto) => throw new NotImplementedException();
        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto) => throw new NotImplementedException();
        public Task LogoutAsync(Guid userId) => Task.CompletedTask;
    }

    private class ThrowingLoginIdentity : Cayeshni.Application.Common.Interfaces.IIdentityService
    {
        public Task<AuthResponseDto> RegisterAsync(RegisterDto dto) => throw new NotImplementedException();
        public Task<AuthResponseDto> LoginAsync(LoginDto dto) => throw new Cayeshni.Application.Common.Exceptions.UnauthorizedException();
        public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto) => throw new NotImplementedException();
        public Task LogoutAsync(Guid userId) => Task.CompletedTask;
    }
}
