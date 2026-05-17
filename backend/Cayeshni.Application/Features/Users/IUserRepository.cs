using Cayeshni.Domain.Enums;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Application.Features.Users;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid userId);

    Task<string?> GetPicturePathAsync(Guid userId);

    Task UpdateProfileAsync(Guid userId, string name, Currency currency);

    Task UpdatePictureAsync(Guid userId, string? picturePath);

    /// <summary>Case-insensitive substring match on display name; excludes <paramref name="excludeUserId"/>.</summary>
    Task<IReadOnlyList<User>> SearchByDisplayNameAsync(string query, Guid excludeUserId, int take);
}

