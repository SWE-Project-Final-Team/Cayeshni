using Cayeshni.API.Domain.Enums;
using Cayeshni.API.Domain.Entities;

namespace Cayeshni.API.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid userId);

    Task<string?> GetPicturePathAsync(Guid userId);

    Task UpdateProfileAsync(Guid userId, string name, Currency currency);

    Task UpdatePictureAsync(Guid userId, string? picturePath);

    /// <summary>Case-insensitive substring match on display name; excludes <paramref name="excludeUserId"/>.</summary>
    Task<IReadOnlyList<User>> SearchByDisplayNameAsync(string query, Guid excludeUserId, int take);
}
