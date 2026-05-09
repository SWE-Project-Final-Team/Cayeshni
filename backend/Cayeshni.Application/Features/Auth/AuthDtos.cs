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
    string AccessToken
);

public record TokenPairDto(
    string AccessToken,
    string RefreshToken
);