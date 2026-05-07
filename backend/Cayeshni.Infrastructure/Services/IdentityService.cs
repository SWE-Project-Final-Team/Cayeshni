using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Domain.Entities;
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

        var token = _jwtService.GenerateAccessToken(appUser.Id, appUser.Email);

        return new AuthResponseDto (
            AccessToken: token,
            UserId: appUser.Id,
            Email: appUser.Email,
            Name: appUser.Name
        );
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var appUser = await _userManager.FindByEmailAsync(dto.Email)
            ?? throw new UnauthorizedException("Invalid email or password.");

        var valid = await _userManager.CheckPasswordAsync(appUser, dto.Password);
        if (!valid)
            throw new UnauthorizedException("Invalid email or password.");

        var token = _jwtService.GenerateAccessToken(appUser.Id, appUser.Email!);

        return new AuthResponseDto (
            AccessToken: token,
            UserId: appUser.Id,
            Email: appUser.Email!,
            Name: appUser.Name
        );
    }
}