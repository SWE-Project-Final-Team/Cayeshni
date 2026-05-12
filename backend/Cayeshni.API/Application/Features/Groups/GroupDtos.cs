using Cayeshni.API.Domain.Enums;

namespace Cayeshni.API.Application.Features.Groups;

public record CreateGroupDto(string Name, Currency DefaultCurrency = Currency.USD);

public record JoinGroupDto(string InviteToken);

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
    bool IsCreator
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
