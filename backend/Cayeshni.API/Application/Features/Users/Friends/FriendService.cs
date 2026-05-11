using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Cayeshni.API.Infrastructure.Persistence;

namespace Cayeshni.API.Application.Features.Users.Friends;

public class FriendService
{
    private readonly AppDbContext _db;

    public FriendService(AppDbContext db)
    {
        _db = db;
    }

    public async Task SendRequestAsync(Guid senderId, SendFriendRequestDto dto)
    {
        if (senderId == dto.TargetUserId)
            throw new Exception("Cannot add yourself.");

        var userA = senderId.CompareTo(dto.TargetUserId) < 0
            ? senderId
            : dto.TargetUserId;

        var userB = senderId.CompareTo(dto.TargetUserId) < 0
            ? dto.TargetUserId
            : senderId;

        var existing = await _db.Friendships.FindAsync(userA, userB);

        if (existing is not null)
            throw new Exception("Friendship already exists.");

        var friendship = new Friendship
        {
            UserIdA = userA,
            UserIdB = userB,
            SenderId=senderId,
            Status = FriendshipStatus.Pending
        };

        _db.Friendships.Add(friendship);
        await _db.SaveChangesAsync();
    }

    public async Task AcceptRequestAsync(Guid currentUserId, Guid requesterId)
    {
        var userA = requesterId.CompareTo(currentUserId) < 0
            ? requesterId
            : currentUserId;

        var userB = requesterId.CompareTo(currentUserId) < 0
            ? currentUserId
            : requesterId;

        var friendship = await _db.Friendships.FindAsync(userA, userB)
            ?? throw new Exception("Request not found.");

        friendship.Status = FriendshipStatus.Friends;
        friendship.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task RemoveFriendAsync(Guid currentUserId, Guid otherUserId)
    {
        var userA = currentUserId.CompareTo(otherUserId) < 0
            ? currentUserId
            : otherUserId;

        var userB = currentUserId.CompareTo(otherUserId) < 0
            ? otherUserId
            : currentUserId;

        var friendship = await _db.Friendships.FindAsync(userA, userB)
            ?? throw new Exception("Friendship not found.");

        _db.Friendships.Remove(friendship);
        await _db.SaveChangesAsync();
    }

    public async Task<List<PendingFriendRequestDto>> GetPendingRequestsAsync(Guid userId)
{
    var pending = await _db.Friendships
        .Where(f =>
            f.Status == FriendshipStatus.Pending &&
            (
                (f.SenderId == f.UserIdA && f.UserIdB == userId) ||
                (f.SenderId == f.UserIdB && f.UserIdA == userId)
            ))
        .ToListAsync();

    var requesterIds = pending
        .Select(f => f.SenderId)
        .ToList();

    var users = await _db.Users
        .Where(u => requesterIds.Contains(u.Id))
        .ToDictionaryAsync(u => u.Id);

    return pending
        .Select(f => new PendingFriendRequestDto(
            users[f.SenderId].Id,
            users[f.SenderId].Name,
            users[f.SenderId].Email!,
            f.CreatedAt
        ))
        .ToList();
}

    public async Task<List<FriendResponseDto>> GetFriendsAsync(Guid userId)
{
    var friendships = await _db.Friendships
        .Where(f =>
            f.Status == FriendshipStatus.Friends &&
            (f.UserIdA == userId || f.UserIdB == userId))
        .ToListAsync();

    var friendIds = friendships
        .Select(f => f.UserIdA == userId ? f.UserIdB : f.UserIdA)
        .ToList();

    var users = await _db.Users
        .Where(u => friendIds.Contains(u.Id))
        .ToDictionaryAsync(u => u.Id);

    return friendIds
        .Select(id => new FriendResponseDto(
            users[id].Id,
            users[id].Name,
            users[id].Email!
        ))
        .ToList();
}
}