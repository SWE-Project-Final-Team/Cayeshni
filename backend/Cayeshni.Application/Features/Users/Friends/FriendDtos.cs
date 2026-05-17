namespace Cayeshni.API.Application.Features.Users.Friends;

/// <summary>
/// Send a friend request by either the target's user id or their account email (not both).
/// </summary>
public record SendFriendRequestDto(
    Guid? TargetUserId,
    string? TargetEmail
);

public record FriendResponseDto(
    Guid UserId,
    string Name,
    string Email,
    string? ProfilePictureUrl
);

public record PendingFriendRequestDto(
    Guid UserId,
    string Name,
    string Email,
    DateTime CreatedAt,
    string? ProfilePictureUrl
);