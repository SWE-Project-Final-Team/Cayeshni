using System.Text.RegularExpressions;
using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;

namespace Cayeshni.Application.Features.Auth;

public class AuthService
{
    private readonly IIdentityService _identity;
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$", RegexOptions.Compiled);

    public AuthService(IIdentityService identity)
    {
        _identity = identity;
    }

    public async Task<TokenPairDto> RegisterAsync(RegisterDto dto)
    {
        var name = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length < 3)
        {
            throw new ValidationException("Name must be at least 3 characters.");
        }
        
        // Validate email format
        if (string.IsNullOrWhiteSpace(dto.Email) || !EmailRegex.IsMatch(dto.Email))
        {
            throw new ValidationException("Please enter a valid email address.");
        }
        
        return await _identity.RegisterAsync(dto with { Name = name });
    }

    public Task<TokenPairDto> LoginAsync(LoginDto dto) => _identity.LoginAsync(dto);
    
    public Task<TokenPairDto> RefreshTokenAsync(string refreshToken) => _identity.RefreshTokenAsync(refreshToken);

    public Task LogoutAsync() => _identity.LogoutAsync();

    // Account/Identity operations
    public Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) =>
        _identity.ChangePasswordAsync(userId, dto);

    public Task ForgotPasswordAsync(string email) =>
        _identity.ForgotPasswordAsync(email);

    public Task ResetPasswordAsync(ResetPasswordDto dto) =>
        _identity.ResetPasswordAsync(dto);

    public Task ConfirmEmailAsync(ConfirmEmailDto dto) =>
        _identity.ConfirmEmailAsync(dto);

    public Task ResendConfirmationAsync(string email) =>
        _identity.ResendConfirmationAsync(email);
}