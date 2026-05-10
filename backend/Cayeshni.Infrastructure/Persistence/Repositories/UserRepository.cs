using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Users;
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

    public async Task<UserProfileDto?> GetProfileAsync(Guid userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new UserProfileDto(
                u.Id,
                u.Name,
                u.Email!,
                u.ProfilePictureUrl,
                u.PreferredCurrency,
                u.CreatedAt
            ))
            .FirstOrDefaultAsync();
    }

    public async Task<string?> GetPictureUrlAsync(Guid userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.ProfilePictureUrl)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateNameAsync(Guid userId, string name)
    {
        await _db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Name, name));
    }

    public async Task UpdateCurrencyAsync(Guid userId, Currency currency)
    {
        await _db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.PreferredCurrency, currency));
    }

    public async Task UpdatePictureAsync(Guid userId, string? pictureUrl)
    {
        await _db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.ProfilePictureUrl, pictureUrl));
    }

    public async Task UpdateProfileAsync(Guid userId, string name, Currency currency)
    {
        await _db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Name, name)
                .SetProperty(u => u.PreferredCurrency, currency));
    }
}