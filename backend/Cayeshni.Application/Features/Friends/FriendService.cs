using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Domain.Entities;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Application.Features.Friends;

public class FriendService
{
    private readonly IFriendRepository _repo;
    private readonly Func<string?, string?> _emailNormalizer;
    private readonly IFileStorageService _fileStorage;

    public FriendService(
        IFriendRepository repo,
        Func<string?, string?> emailNormalizer,
        IFileStorageService fileStorage)
    {
        _repo = repo;
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
            var normalized = _emailNormalizer(emailTrimmed);
            if (string.IsNullOrEmpty(normalized))
                throw new ValidationException("Invalid email address.");

            var user = await _repo.FindUserByNormalizedEmailAsync(normalized);
            if (user == null)
                throw new NotFoundException("User", emailTrimmed!);

            targetUserId = user.Value.Id;
        }
        else
        {
            targetUserId = dto.TargetUserId!.Value;
            var exists = await _repo.UserExistsAsync(targetUserId);
            if (!exists)
                throw new NotFoundException("User", targetUserId);
        }

        if (senderId == targetUserId)
            throw new ValidationException("Cannot add yourself.");

        var userA = senderId.CompareTo(targetUserId) < 0
            ? senderId
            : targetUserId;

        var userB = senderId.CompareTo(targetUserId) < 0
            ? targetUserId
            : senderId;

        var existing = await _repo.FindFriendshipAsync(userA, userB);

        if (existing is not null)
            throw new ValidationException("Friendship already exists.");

        var friendship = new Friendship
        {
            UserIdA = userA,
            UserIdB = userB,
            SenderId = senderId,
            Status = FriendshipStatus.Pending
        };

        await _repo.AddFriendshipAsync(friendship);
        await _repo.SaveChangesAsync();
    }

    public async Task AcceptRequestAsync(Guid currentUserId, Guid requesterId)
    {
        var userA = requesterId.CompareTo(currentUserId) < 0
            ? requesterId
            : currentUserId;

        var userB = requesterId.CompareTo(currentUserId) < 0
            ? currentUserId
            : requesterId;

        var friendship = await _repo.FindFriendshipAsync(userA, userB)
            ?? throw new NotFoundException(nameof(Friendship), $"{userA},{userB}");

        friendship.Status = FriendshipStatus.Friends;
        friendship.UpdatedAt = DateTime.UtcNow;

        await _repo.SaveChangesAsync();
    }

    public async Task RemoveFriendAsync(Guid currentUserId, Guid otherUserId)
    {
        var userA = currentUserId.CompareTo(otherUserId) < 0
            ? currentUserId
            : otherUserId;

        var userB = currentUserId.CompareTo(otherUserId) < 0
            ? otherUserId
            : currentUserId;

        var friendship = await _repo.FindFriendshipAsync(userA, userB)
            ?? throw new NotFoundException(nameof(Friendship), $"{userA},{userB}");

        _repo.RemoveFriendship(friendship);
        await _repo.SaveChangesAsync();
    }

    public async Task<List<PendingFriendRequestDto>> GetPendingRequestsAsync(Guid userId)
    {
        var pending = await _repo.GetPendingFriendshipsForUserAsync(userId);

        var requesterIds = pending.Select(f => f.SenderId).ToList();
        var users = await _repo.GetUsersByIdsAsync(requesterIds);

        return pending
            .Select(f =>
            {
                var u = users[f.SenderId];
                return new PendingFriendRequestDto(
                    f.SenderId,
                    u.Name,
                    u.Email,
                    f.CreatedAt,
                    _fileStorage.GetUrl(u.ProfilePicturePath, "avatar"));
            })
            .ToList();
    }

    public async Task<List<FriendResponseDto>> GetFriendsAsync(Guid userId)
    {
        var friendships = await _repo.GetFriendsForUserAsync(userId);
        var friendIds = friendships.Select(f => f.UserIdA == userId ? f.UserIdB : f.UserIdA).ToList();
        var users = await _repo.GetUsersByIdsAsync(friendIds);

        return friendIds.Select(id =>
        {
            var u = users[id];
            return new FriendResponseDto(
                id,
                u.Name,
                u.Email,
                _fileStorage.GetUrl(u.ProfilePicturePath, "avatar"));
        }).ToList();
    }
}

