using Cayeshni.Application.Features.Auth;

namespace Cayeshni.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<TokenPairDto> RegisterAsync(RegisterDto dto);
    Task<TokenPairDto> LoginAsync(LoginDto dto);
    Task<TokenPairDto> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync();
}
