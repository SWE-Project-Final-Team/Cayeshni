using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Groups;
using Cayeshni.Domain.Entities;
using Cayeshni.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Infrastructure.Services;

public class GroupManagementService : IGroupService
{
    private readonly AppDbContext _context;

    public GroupManagementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<GroupResponseDto> CreateGroupAsync(Guid userId, CreateGroupDto dto)
    {
        var group = new Group
        {
            Name = dto.Name,
            CreatedById = userId
        };

        group.Members.Add(new GroupMember
        {
            GroupId = group.Id,
            UserId = userId
        });

        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        return new GroupResponseDto(
            group.Id,
            group.Name,
            group.InviteToken,
            group.CreatedById
        );
    }

    public async Task DeleteGroupAsync (Guid userId, GroupResponseDto group)
    {
        var entity = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == group.Id)
            ?? throw new NotFoundException(nameof(Group), group.Id);

        if (entity.CreatedById != userId)
            throw new ValidationException("Only the group creator can delete this group.");

        // Remove all group members
        _context.GroupMembers.RemoveRange(entity.Members);
        
        _context.Groups.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task JoinGroupAsync(Guid userId, JoinGroupDto dto)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.InviteToken == dto.InviteToken)
            ?? throw new NotFoundException(nameof(Group), dto.InviteToken);

        var alreadyMember = group.Members.Any(m => m.UserId == userId);
        if (alreadyMember)
            throw new ValidationException("User already joined this group.");

        group.Members.Add(new GroupMember
        {
            GroupId = group.Id,
            UserId = userId
        });

        await _context.SaveChangesAsync();
    }

    public async Task ExitGroupAsync(Guid userId, Guid groupId)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new NotFoundException(nameof(Group), groupId);

        var membership = group.Members.FirstOrDefault(m => m.UserId == userId)
            ?? throw new Exception("Membership not found.");

        // Remove the member
        _context.GroupMembers.Remove(membership);

        // Check if this was the last member
        if (group.Members.Count == 1)
        {
            // Delete the group if it's the last member
            _context.Groups.Remove(group);
        }
        else if (group.CreatedById == userId)
        {
            // Transfer creator role to the next earliest joined member
            var nextCreator = group.Members
                .Where(m => m.UserId != userId)
                .OrderBy(m => m.JoinedAt)
                .First();
            
            group.CreatedById = nextCreator.UserId;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<GroupResponseDto>> GetUserGroupsAsync(Guid userId)
    {
        return await _context.Groups
            .Where(g => g.Members.Any(m => m.UserId == userId))
            .Select(g => new GroupResponseDto(
                g.Id,
                g.Name,
                g.InviteToken,
                g.CreatedById
            ))
            .ToListAsync();
    }

    public async Task UpdateGroupAsync(Guid userId, GroupResponseDto group)
    {
        var entity = await _context.Groups
            .FirstOrDefaultAsync(g => g.Id == group.Id)
            ?? throw new NotFoundException(nameof(Group), group.Id);

        if (entity.CreatedById != userId)
            throw new ValidationException("Only the group creator can update this group.");

        entity.Name = group.Name;
        await _context.SaveChangesAsync();
    }
}