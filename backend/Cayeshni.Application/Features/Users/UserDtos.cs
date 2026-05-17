using Cayeshni.API.Domain.Enums;

namespace Cayeshni.API.Application.Features.Users;

public record UserProfileDto(
    Guid      Id,
    string    Name,
    string    Email,
    string?   ProfilePictureUrl,
    Currency  PreferredCurrency,
    DateTime  CreatedAt
);

public record UpdateProfileDto(
    string   Name,
    Currency PreferredCurrency
);

public record UploadPictureResponseDto(
    string PictureUrl
);

/// <summary>Lightweight row for profile search / friend invite picker.</summary>
public record UserProfileSearchDto(
    Guid Id,
    string Name,
    string Email,
    string? ProfilePictureUrl
);
