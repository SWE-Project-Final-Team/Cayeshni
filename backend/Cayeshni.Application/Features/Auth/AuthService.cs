using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;

namespace Cayeshni.Application.Features.Auth;

public class AuthService
{
    private readonly IIdentityService _identity;

    public AuthService(IIdentityService identity)
    {
        _identity = identity;
    }

    public Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length < 3)
        {
            throw new ValidationException("Name must be at least 3 characters.");
        }

        return _identity.RegisterAsync(dto with { Name = name });
    }

    public Task<AuthResponseDto> LoginAsync(LoginDto dto) => _identity.LoginAsync(dto);
    public Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto) => _identity.RefreshTokenAsync(dto);
    public Task LogoutAsync(Guid userId) => _identity.LogoutAsync(userId);
}