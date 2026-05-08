using Cayeshni.Application.Features.Auth;

namespace Cayeshni.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto);
    Task LogoutAsync(Guid userId);
}
