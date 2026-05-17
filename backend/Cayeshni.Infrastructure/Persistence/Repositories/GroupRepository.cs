using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.API.Infrastructure.Persistence.Repositories;

public class GroupRepository : IGroupRepository
{
    private readonly AppDbContext _db;

    public GroupRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task AddAsync(Group group)
    {
        await _db.Groups.AddAsync(group);
    }

    public async Task<Group?> GetByInviteTokenWithMembersAsync(string inviteToken)
    {
        return await _db.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.InviteToken == inviteToken);
    }

    public async Task<Group?> GetByIdWithMembersAsync(Guid id)
    {
        return await _db.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<List<Group>> GetUserGroupsAsync(Guid userId)
    {
        return await _db.Groups
            .Where(g => g.Members.Any(m => m.UserId == userId))
            .ToListAsync();
    }

    public async Task<List<(Guid Id, string Name, string? ProfilePicturePath)>> GetUsersByIdsAsync(IEnumerable<Guid> ids)
    {
        var result = await _db.Users
            .AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .Select(u => new { u.Id, u.Name, u.ProfilePicturePath })
            .ToListAsync();

        return result.Select(x => (x.Id, x.Name, x.ProfilePicturePath)).ToList();
    }

    public void RemoveGroupMember(GroupMember membership)
    {
        _db.GroupMembers.Remove(membership);
    }

    public void RemoveGroupMembers(IEnumerable<GroupMember> memberships)
    {
        _db.GroupMembers.RemoveRange(memberships);
    }

    public async Task AddNotificationAsync(Notification notification)
    {
        await _db.Notifications.AddAsync(notification);
    }

    public async Task<List<Notification>> GetPendingGroupInvitesAsync(Guid userId)
    {
        return await _db.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientId == userId && n.Type == NotificationType.GroupInviteReceived && n.GroupId != null)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Notification?> GetNotificationForUserAsync(Guid notificationId, Guid userId)
    {
        return await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientId == userId);
    }

    public Task RemoveNotificationAsync(Notification notification)
    {
        _db.Notifications.Remove(notification);
        return Task.CompletedTask;
    }

    public void RemoveGroup(Group group)
    {
        _db.Groups.Remove(group);
    }

    public async Task<(Guid Id, string Name, string? ProfilePicturePath)?> GetUserBasicAsync(Guid id)
    {
        var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (u == null) return null;
        return (u.Id, u.Name, u.ProfilePicturePath);
    }

    public async Task<bool> AreFriendsAsync(Guid userA, Guid userB)
    {
        return await _db.Friendships.AnyAsync(f =>
            f.Status == FriendshipStatus.Friends &&
            ((f.UserIdA == userA && f.UserIdB == userB) || (f.UserIdB == userA && f.UserIdA == userB)));
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }
}
