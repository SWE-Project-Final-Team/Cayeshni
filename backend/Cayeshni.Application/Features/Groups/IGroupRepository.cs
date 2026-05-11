using Cayeshni.Domain.Entities;

namespace Cayeshni.Application.Features.Groups;

public interface IGroupRepository
{
    Task AddAsync(Group group);
    Task<Group?> FindByInviteTokenAsync(string inviteToken);
    Task<Group?> FindByIdIncludeMembersAsync(Guid groupId);
    Task<List<Group>> GetUserGroupsAsync(Guid userId);
    void RemoveGroup(Group group);
    void RemoveGroupMember(GroupMember member);
    void RemoveGroupMembersRange(IEnumerable<GroupMember> members);
    Task SaveChangesAsync();
}
