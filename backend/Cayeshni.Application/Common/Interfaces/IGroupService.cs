using Cayeshni.Application.Features.Groups;

namespace Cayeshni.Application.Common.Interfaces;

public interface IGroupService
{
    Task<GroupResponseDto> CreateGroupAsync(Guid userId, CreateGroupDto dto);
    Task JoinGroupAsync(Guid userId, JoinGroupDto dto);
    Task<List<GroupResponseDto>> GetUserGroupsAsync(Guid userId);
}