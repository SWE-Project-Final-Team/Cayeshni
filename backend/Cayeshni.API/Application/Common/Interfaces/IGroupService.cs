using Cayeshni.API.Application.Features.Groups;

namespace Cayeshni.API.Application.Common.Interfaces;

public interface IGroupService
{
    Task<GroupResponseDto> CreateGroupAsync(Guid userId, CreateGroupDto dto);
    Task DeleteGroupAsync(Guid userId, GroupResponseDto group);
    Task<GroupResponseDto> JoinGroupAsync(Guid userId, JoinGroupDto dto);
    Task ExitGroupAsync(Guid userId, Guid groupId);
    Task UpdateGroupAsync(Guid userId, GroupResponseDto group);
    Task<List<GroupResponseDto>> GetUserGroupsAsync(Guid userId);
    Task<GroupDetailDto> GetGroupDetailAsync(Guid userId, Guid groupId);
    Task SendGroupInviteToFriendAsync(Guid inviterId, Guid groupId, InviteFriendToGroupDto dto);
    Task<IReadOnlyList<PendingGroupInviteDto>> GetPendingGroupInvitesAsync(Guid userId);
    Task DismissGroupInviteNotificationAsync(Guid userId, Guid notificationId);
}
