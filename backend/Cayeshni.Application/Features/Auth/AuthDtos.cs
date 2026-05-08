namespace Cayeshni.Application.Features.Auth;

public record RegisterDto(
    string Email,
    string Name,
    string Password
);

public record LoginDto(
    string Email,
    string Password
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    Guid   UserId,
    string Email,
    string Name
);

public record RefreshTokenDto(
    string RefreshToken
);