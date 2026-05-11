using Cayeshni.Application.Features.Groups;
using Cayeshni.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Infrastructure.Persistence.Repositories;

public class GroupRepository : IGroupRepository
{
    private readonly AppDbContext _context;

    public GroupRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Group group)
    {
        await _context.Groups.AddAsync(group);
    }

    public async Task<Group?> FindByInviteTokenAsync(string inviteToken)
    {
        return await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.InviteToken == inviteToken);
    }

    public async Task<Group?> FindByIdIncludeMembersAsync(Guid groupId)
    {
        return await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId);
    }

    public async Task<List<Group>> GetUserGroupsAsync(Guid userId)
    {
        return await _context.Groups
            .Where(g => g.Members.Any(m => m.UserId == userId))
            .ToListAsync();
    }

    public void RemoveGroup(Group group)
    {
        _context.Groups.Remove(group);
    }

    public void RemoveGroupMember(GroupMember member)
    {
        _context.GroupMembers.Remove(member);
    }

    public void RemoveGroupMembersRange(IEnumerable<GroupMember> members)
    {
        _context.GroupMembers.RemoveRange(members);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
