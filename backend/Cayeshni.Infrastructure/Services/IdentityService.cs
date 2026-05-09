using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace Cayeshni.Infrastructure.Services;

public class IdentityService : IIdentityService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtService _jwtService;

    public IdentityService(UserManager<AppUser> userManager, IJwtService jwtService)
    {
        _userManager = userManager;
        _jwtService = jwtService;
    }

    public async Task<TokenPairDto> RegisterAsync(RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            throw new UnauthorizedException("Email already in use.");

        var appUser = new AppUser
        {
            Email = dto.Email,
            UserName = dto.Email,
            Name = dto.Name,
        };

        var result = await _userManager.CreateAsync(appUser, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new UnauthorizedException(errors);
        }

        return IssueTokens(appUser.Id);
    }

    public async Task<TokenPairDto> LoginAsync(LoginDto dto)
    {
        var appUser = await _userManager.FindByEmailAsync(dto.Email)
            ?? throw new UnauthorizedException("Invalid email or password.");

        var valid = await _userManager.CheckPasswordAsync(appUser, dto.Password);
        if (!valid)
            throw new UnauthorizedException("Invalid email or password.");

        return IssueTokens(appUser.Id);
    }

    public Task<TokenPairDto> RefreshTokenAsync(string refreshToken)
    {
        var userId = _jwtService.ValidateRefreshToken(refreshToken) 
            ?? throw new UnauthorizedException("Invalid refresh token.");

        return Task.FromResult(IssueTokens(userId));
    }

    public Task LogoutAsync()
    {
        // Since we're using stateless JWTs, there's no server-side session to clear.
        // To "logout", the client should simply discard the tokens (by deleting cookie).
        // cookie deleletion handled in the controller
        // Future improvement: Implement token blacklisting to invalidate tokens on logout.
        return Task.CompletedTask;
    }

    private TokenPairDto IssueTokens(Guid userId)
    {
        var accessToken = _jwtService.GenerateAccessToken(userId);
        var refreshToken = _jwtService.GenerateRefreshToken(userId);

        return new TokenPairDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken
        );
    }
}