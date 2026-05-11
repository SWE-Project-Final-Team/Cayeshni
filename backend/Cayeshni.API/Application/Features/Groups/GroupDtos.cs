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
