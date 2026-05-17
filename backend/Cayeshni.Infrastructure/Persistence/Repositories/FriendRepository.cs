using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.API.Infrastructure.Persistence.Repositories;

public class FriendRepository : IFriendRepository
{
    private readonly AppDbContext _db;

    public FriendRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(Guid Id, string Name, string? Email, string? ProfilePicturePath)?> FindUserByNormalizedEmailAsync(string normalizedEmail)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail);
        if (u == null) return null;
        return (u.Id, u.Name, u.Email, u.ProfilePicturePath);
    }

    public async Task<bool> UserExistsAsync(Guid id)
    {
        return await _db.Users.AnyAsync(u => u.Id == id);
    }

    public async Task<Friendship?> FindFriendshipAsync(Guid userA, Guid userB)
    {
        return await _db.Friendships.FindAsync(userA, userB);
    }

    public async Task AddFriendshipAsync(Friendship friendship)
    {
        await _db.Friendships.AddAsync(friendship);
    }

    public Task SaveChangesAsync()
        => _db.SaveChangesAsync();

    public async Task<List<Friendship>> GetPendingFriendshipsForUserAsync(Guid userId)
    {
        return await _db.Friendships
            .Where(f =>
                f.Status == FriendshipStatus.Pending &&
                (
                    (f.SenderId == f.UserIdA && f.UserIdB == userId) ||
                    (f.SenderId == f.UserIdB && f.UserIdA == userId)
                ))
            .ToListAsync();
    }

    public async Task<Dictionary<Guid, (string Name, string Email, string? ProfilePicturePath)>> GetUsersByIdsAsync(IEnumerable<Guid> ids)
    {
        return await _db.Users
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => (u.Name, u.Email!, u.ProfilePicturePath));
    }

    public void RemoveFriendship(Friendship friendship)
    {
        _db.Friendships.Remove(friendship);
    }

    public async Task<List<Friendship>> GetFriendsForUserAsync(Guid userId)
    {
        return await _db.Friendships
            .Where(f => f.Status == FriendshipStatus.Friends && (f.UserIdA == userId || f.UserIdB == userId))
            .ToListAsync();
    }
}
