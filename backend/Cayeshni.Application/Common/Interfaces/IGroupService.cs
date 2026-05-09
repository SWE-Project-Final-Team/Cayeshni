using Cayeshni.Application.Features.Groups;

namespace Cayeshni.Application.Common.Interfaces;

public interface IGroupService
{
    Task<GroupResponseDto> CreateGroupAsync(Guid userId, CreateGroupDto dto);
    Task DeleteGroupAsync(Guid userId, GroupResponseDto group);
    Task JoinGroupAsync(Guid userId, JoinGroupDto dto);
    Task ExitGroupAsync(Guid userId, Guid groupId);
    Task<List<GroupResponseDto>> GetUserGroupsAsync(Guid userId);
}