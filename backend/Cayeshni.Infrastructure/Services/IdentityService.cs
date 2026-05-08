using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Infrastructure.Identity;
using Cayeshni.Infrastructure.Persistence.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Infrastructure.Services;

public class IdentityService : IIdentityService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly JwtOptions _jwtOptions;

    public IdentityService(UserManager<AppUser> userManager, IJwtService jwtService, JwtOptions jwtOptions)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _jwtOptions = jwtOptions;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            throw new UnauthorizedException("Email already in use.");

        // Map RegisterDto => AppUser
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

        return await IssueTokensAsync(appUser);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var appUser = await _userManager.FindByEmailAsync(dto.Email)
            ?? throw new UnauthorizedException("Invalid email or password.");

        var valid = await _userManager.CheckPasswordAsync(appUser, dto.Password);
        if (!valid)
            throw new UnauthorizedException("Invalid email or password.");

        return await IssueTokensAsync(appUser);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto)
    {
        var appUser = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshToken == dto.RefreshToken)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        if (appUser.RefreshTokenExpiry < DateTime.UtcNow)
        {
            // Clear expired token
            appUser.RefreshToken = null;
            appUser.RefreshTokenExpiry = null;
            await _userManager.UpdateAsync(appUser);

            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        return await IssueTokensAsync(appUser);
    }

    public async Task LogoutAsync(Guid userId)
    {
        var appUser = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException(nameof(AppUser), userId);

        appUser.RefreshToken = null;
        appUser.RefreshTokenExpiry = null;
        await _userManager.UpdateAsync(appUser);
    }

    // Helper function
    private async Task<AuthResponseDto> IssueTokensAsync(AppUser appUser)
    {
        var accessToken = _jwtService.GenerateAccessToken(appUser.Id, appUser.Email!);
        var refreshToken = _jwtService.GenerateRefreshToken();

        appUser.RefreshToken = refreshToken;
        appUser.RefreshTokenExpiry = DateTime.UtcNow.Add(_jwtOptions.RefreshExpiry);

        await _userManager.UpdateAsync(appUser);

        return new AuthResponseDto (
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            UserId: appUser.Id,
            Email: appUser.Email!,
            Name: appUser.Name
        );
    }
}