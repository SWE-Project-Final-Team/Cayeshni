using Cayeshni.API.Domain.Enums;

namespace Cayeshni.API.Application.Features.Dashboard;

public record DashboardGroupBalanceDto(
    Guid GroupId,
    string GroupName,
    Currency Currency,
    decimal YouOwe,
    decimal YouAreOwed
);

/// <summary>
/// <see cref="Kind"/> is <c>transaction</c> or <c>settlement</c>.
/// </summary>
public record DashboardActivityItemDto(
    string Kind,
    Guid Id,
    Guid GroupId,
    string GroupName,
    DateTime CreatedAt,
    Currency Currency,
    decimal Amount,
    string? Description,
    Guid? ActorUserId,
    string? ActorName,
    Guid? CounterpartyUserId,
    string? CounterpartyName,
    string? Note
);
