using Cayeshni.API.Domain.Enums;

namespace Cayeshni.API.Application.Features.Groups;

public record CreateGroupDto(string Name, Currency DefaultCurrency = Currency.USD);

public record JoinGroupDto(string InviteToken);

public record InviteFriendToGroupDto(Guid FriendUserId);

/// <summary>In-app group invite shown to the recipient until they join or dismiss.</summary>
public record PendingGroupInviteDto(
    Guid NotificationId,
    Guid GroupId,
    string GroupName,
    string InviteToken,
    Guid InvitedByUserId,
    string InvitedByName,
    DateTime CreatedAt);

public record GroupResponseDto(
    Guid Id,
    string Name,
    string InviteToken,
    Guid CreatedById,
    Currency DefaultCurrency
);

/// <summary>Member row for a group detail response (display data from identity).</summary>
public record GroupMemberSummaryDto(
    Guid UserId,
    string DisplayName,
    DateTime JoinedAt,
    bool IsCreator,
    string? ProfilePictureUrl
);

/// <summary>Single group with members — caller must be a member.</summary>
public record GroupDetailDto(
    Guid Id,
    string Name,
    string InviteToken,
    Guid CreatedById,
    Currency DefaultCurrency,
    IReadOnlyList<GroupMemberSummaryDto> Members
);
