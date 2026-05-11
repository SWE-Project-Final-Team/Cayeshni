using Cayeshni.Domain.Enums;

namespace Cayeshni.Application.Features.Auth;

public record RegisterDto(
    string Email,
    string Name,
    string Password,
    Currency PreferredCurrency
);

public record LoginDto(
    string Email,
    string Password
);

public record AuthResponseDto(
    string AccessToken,
    bool EmailConfirmed
);

public record TokenPairDto(
    string AccessToken,
    string RefreshToken
);

public record ResendConfirmationDto(
    string Email
);

// For password and email operations
public record ChangePasswordDto(
    string CurrentPassword,
    string NewPassword
);

public record ForgotPasswordDto(
    string Email
);

public record ResetPasswordDto(
    string Email,
    string Token,
    string NewPassword
);

public record ConfirmEmailDto(
    string UserId,
    string Token
);