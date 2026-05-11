using Cayeshni.Application.Features.Auth;

namespace Cayeshni.Application.Common.Interfaces;

public interface IIdentityService
{
    // Auth
    Task<TokenPairDto> RegisterAsync(RegisterDto dto);
    Task<TokenPairDto> LoginAsync(LoginDto dto);
    Task<TokenPairDto> RefreshTokenAsync(string refreshToken);
    Task LogoutAsync();

    // Identity operations
    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
    Task ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(ResetPasswordDto dto);
    Task ConfirmEmailAsync(ConfirmEmailDto dto);
    Task ResendConfirmationAsync(string email);
}
