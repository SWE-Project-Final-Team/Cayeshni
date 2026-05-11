namespace Cayeshni.API.Application.Features.Users.Friends;

public record SendFriendRequestDto(
    Guid TargetUserId
);

public record FriendResponseDto(
    Guid UserId,
    string Name,
    string Email
);

public record PendingFriendRequestDto(
    Guid UserId,
    string Name,
    string Email,
    DateTime CreatedAt
);