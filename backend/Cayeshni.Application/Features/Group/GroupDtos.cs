namespace Cayeshni.Application.Features.Groups;

public record CreateGroupDto(string Name);

public record JoinGroupDto(string InviteToken);

public record GroupResponseDto(
    Guid Id,
    string Name,
    string InviteToken,
    Guid CreatedById
);