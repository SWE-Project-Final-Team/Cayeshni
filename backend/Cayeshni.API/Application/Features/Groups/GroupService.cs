using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;
using Cayeshni.API.Infrastructure.Identity;
using Cayeshni.API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.API.Application.Features.Groups;

public class GroupService : IGroupService
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public GroupService(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    public async Task<GroupResponseDto> CreateGroupAsync(Guid userId, CreateGroupDto dto)
    {
        var name = dto.Name.Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 3)
            throw new ValidationException("Group name must be at least 3 characters.");

        var group = new Group
        {
            Name = name,
            DefaultCurrency = dto.DefaultCurrency,
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
            group.CreatedById,
            group.DefaultCurrency
        );
    }

    public async Task<GroupResponseDto> JoinGroupAsync(Guid userId, JoinGroupDto dto)
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

        return new GroupResponseDto(
            group.Id,
            group.Name,
            group.InviteToken,
            group.CreatedById,
            group.DefaultCurrency
        );
    }

    public async Task<GroupDetailDto> GetGroupDetailAsync(Guid userId, Guid groupId)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId && g.Members.Any(m => m.UserId == userId))
            ?? throw new NotFoundException(nameof(Group), groupId);

        var memberIds = group.Members.Select(m => m.UserId).Distinct().ToList();
        var userRows = await _context.Users
            .AsNoTracking()
            .Where(u => memberIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name, u.ProfilePicturePath })
            .ToListAsync();

        var nameByUserId = userRows.ToDictionary(x => x.Id, x => x.Name);
        var pictureUrlByUserId = userRows.ToDictionary(
            x => x.Id,
            x => _fileStorage.GetUrl(x.ProfilePicturePath));

        var members = group.Members
            .OrderBy(m => m.JoinedAt)
            .ThenBy(m => m.UserId)
            .Select(m => new GroupMemberSummaryDto(
                m.UserId,
                nameByUserId.GetValueOrDefault(m.UserId) ?? "Unknown",
                m.JoinedAt,
                m.UserId == group.CreatedById,
                pictureUrlByUserId.GetValueOrDefault(m.UserId)
            ))
            .ToList();

        return new GroupDetailDto(
            group.Id,
            group.Name,
            group.InviteToken,
            group.CreatedById,
            group.DefaultCurrency,
            members
        );
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
                g.CreatedById,
                g.DefaultCurrency
            ))
            .ToListAsync();
    }

    public async Task DeleteGroupAsync(Guid userId, GroupResponseDto group)
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

    public async Task UpdateGroupAsync(Guid userId, GroupResponseDto group)
    {
        var entity = await _context.Groups
            .FirstOrDefaultAsync(g => g.Id == group.Id)
            ?? throw new NotFoundException(nameof(Group), group.Id);

        if (entity.CreatedById != userId)
            throw new ValidationException("Only the group creator can update this group.");

        entity.Name = group.Name;
        entity.DefaultCurrency = group.DefaultCurrency;
        await _context.SaveChangesAsync();
    }

    public async Task SendGroupInviteToFriendAsync(
        Guid inviterId,
        Guid groupId,
        InviteFriendToGroupDto dto)
    {
        var friendUserId = dto.FriendUserId;
        if (friendUserId == Guid.Empty)
            throw new ValidationException("Friend user id is required.");

        if (inviterId == friendUserId)
            throw new ValidationException("You cannot invite yourself.");

        var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new NotFoundException(nameof(Group), groupId);

        if (!group.Members.Any(m => m.UserId == inviterId))
            throw new ValidationException("You are not a member of this group.");

        if (group.Members.Any(m => m.UserId == friendUserId))
            throw new ValidationException("That person is already in this group.");

        var areFriends = await _context.Friendships.AnyAsync(f =>
            f.Status == FriendshipStatus.Friends &&
            ((f.UserIdA == inviterId && f.UserIdB == friendUserId) ||
             (f.UserIdB == inviterId && f.UserIdA == friendUserId)));

        if (!areFriends)
            throw new ValidationException(
                "You can only send in-app invites to users who are your friends on Cayeshni.");

        var inviter = await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == inviterId)
            ?? throw new NotFoundException(nameof(AppUser), inviterId);

        var oldInvites = await _context.Notifications
            .Where(n =>
                n.RecipientId == friendUserId &&
                n.GroupId == groupId &&
                n.Type == NotificationType.GroupInviteReceived &&
                !n.IsRead)
            .ToListAsync();

        if (oldInvites.Count > 0)
            _context.Notifications.RemoveRange(oldInvites);

        _context.Notifications.Add(new Notification
        {
            Type = NotificationType.GroupInviteReceived,
            RecipientId = friendUserId,
            SenderId = inviterId,
            GroupId = group.Id,
            Text = $"{inviter.Name} invited you to join the group \"{group.Name}\"."
        });

        await _context.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<PendingGroupInviteDto>> GetPendingGroupInvitesAsync(Guid userId)
    {
        var notifications = await _context.Notifications
            .AsNoTracking()
            .Where(n =>
                n.RecipientId == userId &&
                n.Type == NotificationType.GroupInviteReceived &&
                n.GroupId != null)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        var results = new List<PendingGroupInviteDto>();

        foreach (var n in notifications)
        {
            var gid = n.GroupId!.Value;
            var g = await _context.Groups
                .Include(x => x.Members)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == gid);

            if (g == null)
                continue;

            if (g.Members.Any(m => m.UserId == userId))
                continue;

            var inviter = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == n.SenderId);

            results.Add(new PendingGroupInviteDto(
                n.Id,
                g.Id,
                g.Name,
                g.InviteToken,
                n.SenderId,
                inviter?.Name ?? "Someone",
                n.CreatedAt));
        }

        return results;
    }

    public async Task DismissGroupInviteNotificationAsync(Guid userId, Guid notificationId)
    {
        var n = await _context.Notifications
            .FirstOrDefaultAsync(x => x.Id == notificationId && x.RecipientId == userId)
            ?? throw new NotFoundException(nameof(Notification), notificationId);

        if (n.Type != NotificationType.GroupInviteReceived)
            throw new ValidationException("This notification cannot be dismissed here.");

        _context.Notifications.Remove(n);
        await _context.SaveChangesAsync();
    }
}
