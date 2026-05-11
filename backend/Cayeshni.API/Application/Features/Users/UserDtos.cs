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
