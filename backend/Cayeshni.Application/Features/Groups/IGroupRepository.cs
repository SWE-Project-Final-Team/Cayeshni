using Cayeshni.Domain.Entities;

namespace Cayeshni.Application.Features.Groups;

public interface IGroupRepository
{
    Task AddAsync(Group group);
    Task<Group?> GetByInviteTokenWithMembersAsync(string inviteToken);
    Task<Group?> GetByIdWithMembersAsync(Guid id);
    Task<List<Group>> GetUserGroupsAsync(Guid userId);
    Task<List<(Guid Id, string Name, string? ProfilePicturePath)>> GetUsersByIdsAsync(IEnumerable<Guid> ids);
    void RemoveGroupMember(GroupMember membership);
    void RemoveGroupMembers(IEnumerable<GroupMember> memberships);
    void RemoveGroup(Group group);
    Task<(Guid Id, string Name, string? ProfilePicturePath)?> GetUserBasicAsync(Guid id);
    Task<bool> AreFriendsAsync(Guid userA, Guid userB);
    Task AddNotificationAsync(Notification notification);
    Task<List<Notification>> GetPendingGroupInvitesAsync(Guid userId);
    Task<Notification?> GetNotificationForUserAsync(Guid notificationId, Guid userId);
    Task RemoveNotificationAsync(Notification notification);
    Task SaveChangesAsync();
}

