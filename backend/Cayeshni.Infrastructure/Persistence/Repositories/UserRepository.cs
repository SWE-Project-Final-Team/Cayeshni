using Cayeshni.Application.Features.Users;
using Cayeshni.Domain.Entities;
using Cayeshni.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByIdAsync(Guid userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new User
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email!,
                ProfilePicturePath = u.ProfilePicturePath,
                PreferredCurrency = u.PreferredCurrency,
                CreatedAt = u.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    // only profile image path (not URL)
    public async Task<string?> GetPicturePathAsync(Guid userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.ProfilePicturePath)
            .FirstOrDefaultAsync();
    }

    // update name + currency in one DB call
    public async Task UpdateProfileAsync(Guid userId, string name, Currency currency)
    {
        await _db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Name, name)
                .SetProperty(u => u.PreferredCurrency, currency));
    }

    // update profile picture path
    public async Task UpdatePictureAsync(Guid userId, string? picturePath)
    {
        await _db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.ProfilePicturePath, picturePath));
    }
}