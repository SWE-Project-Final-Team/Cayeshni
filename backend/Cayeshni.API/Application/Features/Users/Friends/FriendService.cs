using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;
using Cayeshni.API.Infrastructure.Identity;
using Cayeshni.API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.API.Application.Features.Users.Friends;

public class FriendService
{
    private readonly AppDbContext _db;
    private readonly ILookupNormalizer _emailNormalizer;
    private readonly IFileStorageService _fileStorage;

    public FriendService(
        AppDbContext db,
        ILookupNormalizer emailNormalizer,
        IFileStorageService fileStorage)
    {
        _db = db;
        _emailNormalizer = emailNormalizer;
        _fileStorage = fileStorage;
    }

    public async Task SendRequestAsync(Guid senderId, SendFriendRequestDto dto)
    {
        var emailTrimmed = dto.TargetEmail?.Trim();
        var hasEmail = !string.IsNullOrEmpty(emailTrimmed);
        var hasUserId = dto.TargetUserId is { } tid && tid != Guid.Empty;

        if (hasEmail && hasUserId)
            throw new ValidationException("Provide either target email or target user id, not both.");

        if (!hasEmail && !hasUserId)
            throw new ValidationException("Provide the friend's email or user id.");

        Guid targetUserId;
        if (hasEmail)
        {
            var normalized = _emailNormalizer.NormalizeEmail(emailTrimmed);
            if (string.IsNullOrEmpty(normalized))
                throw new ValidationException("Invalid email address.");

            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.NormalizedEmail == normalized)
                ?? throw new NotFoundException("User", emailTrimmed!);

            targetUserId = user.Id;
        }
        else
        {
            targetUserId = dto.TargetUserId!.Value;
            var exists = await _db.Users.AnyAsync(u => u.Id == targetUserId);
            if (!exists)
                throw new NotFoundException(nameof(AppUser), targetUserId);
        }

        if (senderId == targetUserId)
            throw new ValidationException("Cannot add yourself.");

        var userA = senderId.CompareTo(targetUserId) < 0
            ? senderId
            : targetUserId;

        var userB = senderId.CompareTo(targetUserId) < 0
            ? targetUserId
            : senderId;

        var existing = await _db.Friendships.FindAsync(userA, userB);

        if (existing is not null)
            throw new ValidationException("Friendship already exists.");

        var friendship = new Friendship
        {
            UserIdA = userA,
            UserIdB = userB,
            SenderId = senderId,
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
            ?? throw new NotFoundException(nameof(Friendship), $"{userA},{userB}");

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
            ?? throw new NotFoundException(nameof(Friendship), $"{userA},{userB}");

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
            .Select(f =>
            {
                var u = users[f.SenderId];
                return new PendingFriendRequestDto(
                    u.Id,
                    u.Name,
                    u.Email!,
                    f.CreatedAt,
                    _fileStorage.GetUrl(u.ProfilePicturePath));
            })
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
            .Select(id =>
            {
                var u = users[id];
                return new FriendResponseDto(
                    u.Id,
                    u.Name,
                    u.Email!,
                    _fileStorage.GetUrl(u.ProfilePicturePath));
            })
            .ToList();
    }
}
