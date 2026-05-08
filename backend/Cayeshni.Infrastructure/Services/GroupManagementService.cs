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
}