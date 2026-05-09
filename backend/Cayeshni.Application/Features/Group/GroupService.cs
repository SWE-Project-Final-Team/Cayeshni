using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;

namespace Cayeshni.Application.Features.Groups;

public class GroupService
{
    private readonly IGroupService _groupService;

    public GroupService(IGroupService groupService)
    {
        _groupService = groupService;
    }

    public Task<GroupResponseDto> CreateGroupAsync(Guid userId, CreateGroupDto dto)
    {
        var name = dto.Name.Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 3)
            throw new ValidationException("Group name must be at least 3 characters.");

        return _groupService.CreateGroupAsync(userId, dto with { Name = name });
    }

    public Task JoinGroupAsync(Guid userId, JoinGroupDto dto)
        => _groupService.JoinGroupAsync(userId, dto);

    public Task ExitGroupAsync(Guid userId, Guid groupId)
        => _groupService.ExitGroupAsync(userId, groupId);
    public Task<List<GroupResponseDto>> GetUserGroupsAsync(Guid userId)
        => _groupService.GetUserGroupsAsync(userId);
    public Task DeleteGroupAsync(Guid userId, GroupResponseDto group)
        => _groupService.DeleteGroupAsync(userId, group);
}