using Cayeshni.Application.Features.Users;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<UserProfileDto?> GetProfileAsync(Guid userId);
    Task<string?> GetPictureUrlAsync(Guid userId);
    Task UpdateNameAsync(Guid userId, string name);
    Task UpdateCurrencyAsync(Guid userId, Currency currency);
    Task UpdatePictureAsync(Guid userId, string? pictureUrl);
    Task UpdateProfileAsync(Guid userId, string name, Currency currency);
}
