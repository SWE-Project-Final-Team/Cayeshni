using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Domain.Entities;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Application.Features.Groups;

public class GroupService
{
    private readonly IGroupRepository _groups;
    private readonly IFileStorageService _fileStorage;

    public GroupService(IGroupRepository groups, IFileStorageService fileStorage)
    {
        _groups = groups;
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

        await _groups.AddAsync(group);
        await _groups.SaveChangesAsync();

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
        var group = await _groups.GetByInviteTokenWithMembersAsync(dto.InviteToken)
            ?? throw new NotFoundException(nameof(Group), dto.InviteToken);

        var alreadyMember = group.Members.Any(m => m.UserId == userId);
        if (alreadyMember)
            throw new ValidationException("User already joined this group.");

        group.Members.Add(new GroupMember
        {
            GroupId = group.Id,
            UserId = userId
        });

        await _groups.SaveChangesAsync();

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
        var group = await _groups.GetByIdWithMembersAsync(groupId)
            ?? throw new NotFoundException(nameof(Group), groupId);

        if (!group.Members.Any(m => m.UserId == userId))
            throw new NotFoundException(nameof(Group), groupId);

        var memberIds = group.Members.Select(m => m.UserId).Distinct().ToList();
        var userRows = await _groups.GetUsersByIdsAsync(memberIds);

        var nameByUserId = userRows.ToDictionary(x => x.Id, x => x.Name);
        var pictureUrlByUserId = userRows.ToDictionary(
            x => x.Id,
            x => _fileStorage.GetUrl(x.ProfilePicturePath, "avatar"));

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
        var group = await _groups.GetByIdWithMembersAsync(groupId)
            ?? throw new NotFoundException(nameof(Group), groupId);

        var membership = group.Members.FirstOrDefault(m => m.UserId == userId)
            ?? throw new Exception("Membership not found.");

        _groups.RemoveGroupMember(membership);

        if (group.Members.Count == 1)
        {
            _groups.RemoveGroup(group);
        }
        else if (group.CreatedById == userId)
        {
            var nextCreator = group.Members
                .Where(m => m.UserId != userId)
                .OrderBy(m => m.JoinedAt)
                .First();

            group.CreatedById = nextCreator.UserId;
        }

        await _groups.SaveChangesAsync();
    }

    public async Task<List<GroupResponseDto>> GetUserGroupsAsync(Guid userId)
    {
        var groups = await _groups.GetUserGroupsAsync(userId);
        return groups.Select(g => new GroupResponseDto(
                g.Id,
                g.Name,
                g.InviteToken,
                g.CreatedById,
                g.DefaultCurrency
            )).ToList();
    }

    public async Task DeleteGroupAsync(Guid userId, GroupResponseDto group)
    {
        var entity = await _groups.GetByIdWithMembersAsync(group.Id)
            ?? throw new NotFoundException(nameof(Group), group.Id);

        if (entity.CreatedById != userId)
            throw new ValidationException("Only the group creator can delete this group.");

        _groups.RemoveGroupMembers(entity.Members);
        _groups.RemoveGroup(entity);
        await _groups.SaveChangesAsync();
    }

    public async Task UpdateGroupAsync(Guid userId, GroupResponseDto group)
    {
        var entity = await _groups.GetByIdWithMembersAsync(group.Id)
            ?? throw new NotFoundException(nameof(Group), group.Id);

        if (entity.CreatedById != userId)
            throw new ValidationException("Only the group creator can update this group.");

        entity.Name = group.Name;
        entity.DefaultCurrency = group.DefaultCurrency;
        await _groups.SaveChangesAsync();
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

        var group = await _groups.GetByIdWithMembersAsync(groupId)
            ?? throw new NotFoundException(nameof(Group), groupId);

        if (!group.Members.Any(m => m.UserId == inviterId))
            throw new ValidationException("You are not a member of this group.");

        if (group.Members.Any(m => m.UserId == friendUserId))
            throw new ValidationException("That person is already in this group.");

        var areFriends = await _groups.AreFriendsAsync(inviterId, friendUserId);

        if (!areFriends)
            throw new ValidationException(
                "You can only send in-app invites to users who are your friends on Cayeshni.");

        var inviter = await _groups.GetUserBasicAsync(inviterId)
            ?? throw new NotFoundException("User", inviterId);

        var oldInvites = await _groups.GetPendingGroupInvitesAsync(friendUserId);
        oldInvites = oldInvites.Where(n => n.GroupId == groupId && !n.IsRead).ToList();

        if (oldInvites.Count > 0)
        {
            foreach (var o in oldInvites) await _groups.RemoveNotificationAsync(o);
        }

        await _groups.AddNotificationAsync(new Notification
        {
            Type = NotificationType.GroupInviteReceived,
            RecipientId = friendUserId,
            SenderId = inviterId,
            GroupId = group.Id,
            Text = $"{inviter.Name} invited you to join the group \"{group.Name}\"."
        });

        await _groups.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<PendingGroupInviteDto>> GetPendingGroupInvitesAsync(Guid userId)
    {
        var notifications = await _groups.GetPendingGroupInvitesAsync(userId);
        var results = new List<PendingGroupInviteDto>();

        foreach (var n in notifications)
        {
            var gid = n.GroupId!.Value;
            var g = await _groups.GetByIdWithMembersAsync(gid);

            if (g == null)
                continue;

            if (g.Members.Any(m => m.UserId == userId))
                continue;

            var inviter = await _groups.GetUserBasicAsync(n.SenderId);

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
        var n = await _groups.GetNotificationForUserAsync(notificationId, userId)
            ?? throw new NotFoundException(nameof(Notification), notificationId);

        if (n.Type != NotificationType.GroupInviteReceived)
            throw new ValidationException("This notification cannot be dismissed here.");

        await _groups.RemoveNotificationAsync(n);
        await _groups.SaveChangesAsync();
    }
}

