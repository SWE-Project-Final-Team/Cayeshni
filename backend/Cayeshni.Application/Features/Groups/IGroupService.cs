namespace Cayeshni.Application.Features.Groups;

public interface IGroupService
{
    Task<GroupResponseDto> CreateGroupAsync(Guid userId, CreateGroupDto dto);
    Task JoinGroupAsync(Guid userId, JoinGroupDto dto);
    Task ExitGroupAsync(Guid userId, Guid groupId);
    Task<List<GroupResponseDto>> GetUserGroupsAsync(Guid userId);
    Task DeleteGroupAsync(Guid userId, GroupResponseDto group);
    Task UpdateGroupAsync(Guid userId, GroupResponseDto group);
}
// Removed duplicate interface declaration.
