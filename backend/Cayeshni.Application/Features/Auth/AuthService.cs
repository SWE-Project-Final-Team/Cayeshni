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
        if (string.IsNullOrWhiteSpace(dto.Name.Trim()) || dto.Name.Length < 3)
        {
            throw new ValidationException("Name must be at least 3 characters.");
        }

        return _identity.RegisterAsync(dto);
    }

    public Task<AuthResponseDto> LoginAsync(LoginDto dto) => _identity.LoginAsync(dto);
}